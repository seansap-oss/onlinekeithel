import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const BUYER = "10000000-0000-4000-8000-000000000001";
const SELLER = "10000000-0000-4000-8000-000000000002";
const OTHER = "10000000-0000-4000-8000-000000000003";
const ADMIN = "10000000-0000-4000-8000-000000000004";

test("listing Q&A, private conversations and seller moderation obey RLS", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      "create role anon; create role authenticated; create role service_role bypassrls; " +
        "create schema auth; create table auth.users(id uuid primary key); " +
        "create function auth.uid() returns uuid language sql stable as $$ " +
        "select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; " +
        "grant usage on schema auth to anon,authenticated,service_role; " +
        "grant execute on function auth.uid() to anon,authenticated,service_role; " +
        "insert into auth.users values ('" + BUYER + "'),('" + SELLER + "'),('" + OTHER + "'),('" + ADMIN + "');",
    );
    await db.exec(
      await readFile(new URL("../database/schema.sql", import.meta.url), "utf8"),
    );
    await db.exec(
      await readFile(
        new URL("../database/migrations/007_storefront_pages.sql", import.meta.url),
        "utf8",
      ),
    );
    await db.exec(
      await readFile(
        new URL("../supabase/migrations/20261023201602_marketplace_messaging.sql", import.meta.url),
        "utf8",
      ),
    );
    await db.exec("insert into public.admins(user_id) values ('" + ADMIN + "');");

    const role = async (id, name = "authenticated") =>
      db.exec(
        "reset role; set role " +
          name +
          "; select set_config('request.jwt.claim.sub','" +
          id +
          "',false);",
      );

    await role(SELLER);
    const sellerId = (
      await db.query(
        "insert into public.sellers(user_id,name,slug,whatsapp) " +
          "values ($1,'Seller Shop','seller-shop','919876543210') returning id",
        [SELLER],
      )
    ).rows[0].id;
    const listingId = (
      await db.query(
        "insert into public.listings(seller_id,category_id,title,price,images,status) " +
          "values ($1,'fashion','Test listing',100,'[\"https://example.com/a.jpg\",\"https://example.com/b.jpg\",\"https://example.com/c.jpg\",\"https://example.com/d.jpg\"]','published') returning id",
        [sellerId],
      )
    ).rows[0].id;

    await role(BUYER);
    await assert.rejects(
      () =>
        db.query(
          "insert into public.listing_questions(listing_id,author_id,body,seller_reply) " +
            "values ($1,$2,'Question','spoofed seller answer')",
          [listingId, BUYER],
        ),
      /permission denied/i,
    );
    const questionId = (
      await db.query(
        "insert into public.listing_questions(listing_id,author_id,body) " +
          "values ($1,$2,'Is this still available?') returning id",
        [listingId, BUYER],
      )
    ).rows[0].id;
    assert.equal(
      (
        await db.query("select body from listing_questions where id=$1", [questionId])
      ).rows[0].body,
      "Is this still available?",
    );
    assert.equal(
      (
        await db.query(
          "update listing_questions set seller_reply='No' where id=$1 returning id",
          [questionId],
        )
      ).rows.length,
      0,
    );

    const conversationId = (
      await db.query(
        "insert into public.direct_conversations(listing_id,buyer_id) " +
          "values ($1,$2) returning id",
        [listingId, BUYER],
      )
    ).rows[0].id;
    const firstMessageId = (
      await db.query(
        "insert into public.direct_messages(conversation_id,sender_id,body) " +
          "values ($1,$2,'Could I see it tomorrow?') returning id",
        [conversationId, BUYER],
      )
    ).rows[0].id;

    await role(OTHER);
    assert.equal(
      (await db.query("select * from direct_messages where id=$1", [firstMessageId])).rows.length,
      0,
    );
    await assert.rejects(
      () =>
        db.query(
          "insert into direct_messages(conversation_id,sender_id,body) values($1,$2,'Intrusion')",
          [conversationId, OTHER],
        ),
      /row-level security/i,
    );

    await role(SELLER);
    await db.query(
      "update listing_questions set seller_reply='Yes, it is available.' where id=$1",
      [questionId],
    );
    assert.match(
      (
        await db.query("select seller_reply from listing_questions where id=$1", [questionId])
      ).rows[0].seller_reply,
      /available/,
    );
    const sellerMessageId = (
      await db.query(
        "insert into direct_messages(conversation_id,sender_id,body) " +
          "values($1,$2,'Yes, come by at 3.') returning id",
        [conversationId, SELLER],
      )
    ).rows[0].id;
    assert.equal(
      (
        await db.query(
          "select private.can_report_direct_message($1) as allowed",
          [firstMessageId],
        )
      ).rows[0].allowed,
      true,
    );
    assert.equal(
      (
        await db.query(
          "select auth.uid()=$1::uuid as uid_ok, " +
            "($2::uuid is not null and private.can_report_direct_message($2::uuid)) as target_ok",
          [SELLER, firstMessageId],
        )
      ).rows[0].uid_ok,
      true,
    );
    const reportId = (
      await db.query(
        "select public.report_listing_message(null,$1,'Inappropriate message') as id",
        [firstMessageId],
      )
    ).rows[0].id;
    assert.ok(reportId);
    const questionReportId = (
      await db.query(
        "select public.report_listing_message($1,null,'Inappropriate public question') as id",
        [questionId],
      )
    ).rows[0].id;
    assert.ok(questionReportId);
    await assert.rejects(
      () =>
        db.query(
          "select public.report_listing_message(null,$1,'Misuse of reports')",
          [sellerMessageId],
        ),
      /Only the listing seller/i,
    );

    await role(ADMIN);
    assert.equal((await db.query("select * from listing_message_reports")).rows.length, 2);
    await db.query("delete from direct_messages where id=$1", [firstMessageId]);
    assert.equal((await db.query("select * from listing_message_reports")).rows.length, 1);
    await db.query("delete from listing_questions where id=$1", [questionId]);
    assert.equal((await db.query("select * from listing_questions")).rows.length, 0);
  } finally {
    await db.close();
  }
});
