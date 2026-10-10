import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { requireAdmin } from "../api/admin-users.js";
test("homepage drafts stay private; publishing is atomic and rejects stale revisions", async () => {
  const db = new PGlite();
  const admin = "00000000-0000-4000-8000-000000000001",
    user = "00000000-0000-4000-8000-000000000002";
  try {
    await db.exec(
      `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;insert into auth.users values('${admin}'),('${user}');`,
    );
    await db.exec(
      await readFile(
        new URL("../database/schema.sql", import.meta.url),
        "utf8",
      ),
    );
    // Existing installations can safely reapply the additive update.
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/20261009051356_admin_publishing.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await db.exec(`insert into admins values('${admin}');`);
    const role = (id, r = "authenticated") =>
      db.exec(
        `reset role;set role ${r};select set_config('request.jwt.claim.sub','${id}',false);`,
      );
    await role(admin);
    const baseline = (
      await db.query("select value from settings where id='marketplace'")
    ).rows[0].value;
    const draft = {
      ...baseline,
      hero_title: "Our new market",
      ticker: {
        enabled: true,
        messages: [
          {
            id: "sale",
            runs: [
              { text: "Hot 🔥", color: "#bd4037", font: "serif", size: 24 },
            ],
            sponsored: true,
          },
        ],
      },
    };
    await db.query(
      "insert into content_drafts(id,value) values('marketplace',$1)",
      [draft],
    );
    await role(user);
    assert.equal(
      (await db.query("select * from content_drafts")).rows.length,
      0,
    );
    await assert.rejects(
      () => db.query("select publish_homepage($1,$2)", [draft, baseline]),
      /Administrator access/,
    );
    await assert.rejects(
      () => db.query("insert into content_drafts values('bad','{}',now())"),
      /row-level security/,
    );
    await role(admin);
    await db.query("select publish_homepage($1,$2)", [draft, baseline]);
    assert.equal(
      (await db.query("select * from content_drafts")).rows.length,
      0,
    );
    assert.deepEqual(
      (await db.query("select value from content_revisions")).rows[0].value,
      baseline,
    );
    await assert.rejects(
      () => db.query("select publish_homepage($1,$2)", [baseline, baseline]),
      /Another administrator/,
    );
    assert.equal(
      (await db.query("select * from content_revisions")).rows.length,
      1,
    );
    await assert.rejects(
      () => db.query("update categories set color='bad' where id='fashion'"),
      /check constraint/,
    );
    await role("", "anon");
    assert.equal(
      (await db.query("select value from settings where id='marketplace'"))
        .rows[0].value.hero_title,
      "Our new market",
    );
    assert.deepEqual(
      (await db.query("select value from settings where id='marketplace'"))
        .rows[0].value.ticker,
      draft.ticker,
    );
    await assert.rejects(
      () => db.query("select * from content_drafts"),
      /permission denied/,
    );
  } finally {
    await db.close();
  }
});
test("user administration requires verified server membership, not user metadata", async () => {
  const req = { headers: { authorization: "Bearer token" } };
  const client = {
    auth: {
      getUser: async () => ({
        data: { user: { id: "ordinary", user_metadata: { admin: true } } },
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: null }) }),
      }),
    }),
  };
  await assert.rejects(() => requireAdmin(req, client), /Administrator access/);
  await assert.rejects(
    () => requireAdmin({ headers: {} }, client),
    /Sign in required/,
  );
  client.from = () => ({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: { user_id: "ordinary" } }),
      }),
    }),
  });
  assert.equal((await requireAdmin(req, client)).id, "ordinary");
});
