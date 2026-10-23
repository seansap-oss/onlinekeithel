import test from "node:test";
import assert from "node:assert/strict";
import { authEmailUrl } from "../src/lib/auth-url.js";

test("account email uses the canonical public domain even when opened locally", () => {
  assert.equal(
    authEmailUrl("/reset-password", "https://onlinekeithel.vercel.app/", "http://localhost:5173"),
    "https://onlinekeithel.vercel.app/reset-password",
  );
});

test("confirmation can retain an internal seller destination", () => {
  assert.equal(authEmailUrl("/dashboard?template=fashion", "https://market.example"),
    "https://market.example/dashboard?template=fashion");
});

test("development can use localhost explicitly, but not an external redirect", () => {
  assert.equal(authEmailUrl("/reset-password", "", "http://localhost:5173"),
    "http://localhost:5173/reset-password");
  assert.throws(() => authEmailUrl("//other.example", "https://market.example"));
  assert.throws(() => authEmailUrl("/login", "http://market.example"));
});
