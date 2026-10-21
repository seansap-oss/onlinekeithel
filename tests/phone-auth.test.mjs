import test from "node:test";
import assert from "node:assert/strict";
import { normalizePhoneNumber } from "../src/lib/phone-auth.js";

test("phone sign-in accepts local Indian, prefixed Indian and international E.164 numbers", () => {
  assert.equal(normalizePhoneNumber("98765 43210"), "+919876543210");
  assert.equal(normalizePhoneNumber("09876543210"), "+919876543210");
  assert.equal(normalizePhoneNumber("91-98765-43210"), "+919876543210");
  assert.equal(normalizePhoneNumber("+1 (415) 555-0132"), "+14155550132");
});

test("phone sign-in rejects malformed or ambiguous numbers before requesting SMS", () => {
  for (const value of ["", "12345", "+999", "hello"]) {
    assert.throws(() => normalizePhoneNumber(value), /valid phone number/);
  }
});
