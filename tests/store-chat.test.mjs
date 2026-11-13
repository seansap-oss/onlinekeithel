import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const BUYER = "10000000-0000-4000-8000-000000000011";
const SELLER = "10000000-0000-4000-8000-000000000012";
const OTHER = "10000000-0000-4000-8000-000000000013";

test("hidden listings and store messages respect owner and participant access", async () => {
  const db = new PGlite();
  try {
    await db.exec("create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;");
    await db.exec(`insert into auth.users values ('${BUYER}'),('${SELLER}'),('${OTHER}')`);
    await db.exec(await readFile(new URL("../database/schema.sql", import.meta.url), "utf8"));
    await db.exec(await readFile(new URL("../database/migrations/007_storefront_pages.sql", import.meta.url), "utf8"));
    await db.exec(await readFile(new URL("../supabase/migrations/20261023201602_marketplace_messaging.sql", import.meta.url), "utf8"));
    await db.exec("alter table public.sellers add column whatsapp_enabled boolean not null default false");
    await db.exec(await readFile(new URL("../supabase/migrations/20261113170000_store_messages_visibility.sql", import.meta.url), "utf8"));
    await db.exec(await readFile(new URL("../supabase/migrations/20261113175500_store_reply_when_closed.sql", import.meta.url), "utf8"));
    const as = (id, role = "authenticated") => db.exec(`reset role; set role ${role}; select set_config('request.jwt.claim.sub','${id}',false)`);
    await as(SELLER);
    const sellerId = (await db.query("insert into sellers(user_id,name,slug,whatsapp) values($1,'Local Store','local-store','919876543210') returning id,whatsapp", [SELLER])).rows[0];
    assert.equal(sellerId.whatsapp, "");
    const listingId = (await db.query("insert into listings(seller_id,category_id,title,price,images,status) values($1,'fashion','Basket',100,'[\"https://example.com/a.jpg\",\"https://example.com/b.jpg\",\"https://example.com/c.jpg\",\"https://example.com/d.jpg\"]','published') returning id", [sellerId.id])).rows[0].id;
    await db.query("update listings set is_hidden=true,is_out_of_stock=true where id=$1", [listingId]);
    assert.equal((await db.query("select is_hidden,is_out_of_stock from listings where id=$1", [listingId])).rows[0].is_out_of_stock, true);
    await as(BUYER);
    assert.equal((await db.query("select id from listings where id=$1", [listingId])).rows.length, 0);
    const conversationId = (await db.query("insert into store_conversations(seller_id,buyer_id) values($1,$2) returning id", [sellerId.id, BUYER])).rows[0].id;
    await db.query("insert into store_messages(conversation_id,sender_id,body) values($1,$2,'Is the shop open?')", [conversationId, BUYER]);
    await as(OTHER);
    assert.equal((await db.query("select id from store_messages where conversation_id=$1", [conversationId])).rows.length, 0);
    await assert.rejects(() => db.query("insert into store_messages(conversation_id,sender_id,body) values($1,$2,'Intrusion')", [conversationId, OTHER]), /row-level security/i);
    await as(SELLER);
    assert.equal((await db.query("select id from store_messages where conversation_id=$1", [conversationId])).rows.length, 1);
    await db.query("update sellers set messages_enabled=false where id=$1", [sellerId.id]);
    await db.query("insert into store_messages(conversation_id,sender_id,body) values($1,$2,'I will reply from the shop.')", [conversationId, SELLER]);
    await as(BUYER);
    await assert.rejects(() => db.query("insert into store_messages(conversation_id,sender_id,body) values($1,$2,'Still there?')", [conversationId, BUYER]), /row-level security/i);
  } finally { await db.close(); }
});
