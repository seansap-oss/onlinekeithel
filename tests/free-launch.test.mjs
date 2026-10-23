import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import createOrder from "../api/create-order.js";
import { paidPackagesAreEnabled } from "../api/_lib/server.js";

test("paid package checkout requires the admin-controlled marketplace switch", async () => {
  assert.equal(paidPackagesAreEnabled(undefined), false);
  assert.equal(paidPackagesAreEnabled({}), false);
  assert.equal(paidPackagesAreEnabled({ payments_enabled: false }), false);
  assert.equal(paidPackagesAreEnabled({ payments_enabled: true }), true);

  const response = { statusCode: 0, headers: {}, setHeader(k,v){this.headers[k]=v;}, status(n){this.statusCode=n;return this;}, json(body){this.body=body;return this;} };
  await createOrder({ method: "POST", body: { planId: "quick" } }, response);
  assert.equal(response.statusCode, 503);
  assert.match(response.body.error, /not configured/i);
});

test("free launch keeps old ads public, protects seller edits, and caps active ads", async () => {
  const db = new PGlite();
  const user = "00000000-0000-4000-8000-000000000091";
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to anon,authenticated,service_role;
      grant execute on function auth.uid() to anon,authenticated,service_role;
      insert into auth.users values('${user}');`);
    for (const file of ["database/schema.sql", "database/migrations/013_listing_packages.sql", "database/migrations/014_photo_count.sql", "database/migrations/015_free_launch.sql"])
      await db.exec(await readFile(new URL(`../${file}`, import.meta.url), "utf8"));
    await db.exec(await readFile(new URL("../database/migrations/015_free_launch.sql", import.meta.url), "utf8"));
    const plans = (await db.query("select id,active,listing_limit from plans where id in ('free','quick') order by id")).rows;
    assert.deepEqual(plans, [
      { id: "free", active: true, listing_limit: 100 },
      { id: "quick", active: false, listing_limit: 5 },
    ]);
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${user}',false);`);
    const seller = (await db.query("insert into sellers(user_id,name,slug,whatsapp) values($1,'Seller','seller-free','919876543210') returning id", [user])).rows[0].id;
    const add = (title) => db.query("insert into listings(seller_id,category_id,title,price,images,status) values($1,'fashion',$2,100,'[\"https://example.com/photo.jpg\"]','published') returning id", [seller,title]);
    const old = (await add("Older listing")).rows[0].id;
    await db.exec("reset role");
    await db.query("update listings set published_at=now()-interval '90 days' where id=$1", [old]);
    await db.exec("set role anon; select set_config('request.jwt.claim.sub','',false);");
    assert.equal((await db.query("select count(*)::integer as n from listings")).rows[0].n, 1);
    await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub','${user}',false);`);
    for (let i = 1; i < 100; i++) await add(`Item ${i}`);
    await assert.rejects(() => add("Over cap"), /Free launch active listing limit/);
    await db.query("update listings set status='paused' where id=$1", [old]);
    await add("Replacement");
  } finally { await db.close(); }
});
