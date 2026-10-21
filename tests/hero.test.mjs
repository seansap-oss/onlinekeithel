import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import {
  heroDisplaySettings,
  isHeroItemActive,
  heroItemPlacement,
  orderHeroItems,
} from "../src/lib/hero.js";

test("hero settings clamp time and keep only supported layouts", () => {
  assert.equal(
    heroDisplaySettings({ layout: "grid8", rotation_seconds: 99 })
      .rotation_seconds,
    60,
  );
  assert.equal(
    heroDisplaySettings({ layout: "bad", rotation_seconds: 1 }).layout,
    "swipe",
  );
  assert.equal(
    heroDisplaySettings({ rotation_seconds: 1 }).rotation_seconds,
    3,
  );
});
test("placement windows filter ads and priority sorts paid inventory", () => {
  const now = Date.parse("2026-10-21T12:00:00Z");
  assert.equal(
    isHeroItemActive(
      { starts_at: "2026-10-21T11:00:00Z", ends_at: "2026-10-21T13:00:00Z" },
      now,
    ),
    true,
  );
  assert.equal(isHeroItemActive({ enabled: false }, now), false);
  assert.equal(heroItemPlacement({ placement: "both" }), "both");
  assert.deepEqual(
    orderHeroItems([
      { id: "free" },
      { id: "paid-low", paid: true, priority: 1 },
      { id: "paid-high", paid: true, priority: 8 },
    ]).map((x) => x.id),
    ["paid-high", "paid-low", "free"],
  );
});
test("placement migration is repeatable and adds social/embed controls", async () => {
  const db = new PGlite();
  await db.exec(
    "create schema private; create table public.campaigns(placement text); insert into public.campaigns values('featured');",
  );
  const sql = readFileSync(
    "database/migrations/011_hero_placements.sql",
    "utf8",
  );
  await db.exec(sql);
  await db.exec(sql);
  const { rows } = await db.query(
    "select social_url,placement,priority,display_seconds from public.campaigns",
  );
  assert.deepEqual(rows, [
    { social_url: "", placement: "featured", priority: 0, display_seconds: 6 },
  ]);
  await assert.rejects(db.exec("update public.campaigns set placement='bad'"));
  await db.close();
});
