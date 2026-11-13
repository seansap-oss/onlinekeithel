import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/improve-description.js";
import { cleanDescriptionInput, descriptionPrompt, redactContactInfo } from "../api/_lib/description.js";

test("description helper strips contact details and bounds its prompt inputs", () => {
  assert.equal(redactContactInfo("Call +91 98765 43210 or mail seller@example.com"), "Call [phone removed] or mail [email removed]");
  assert.equal(cleanDescriptionInput("  A\n  simple   service\u0000  "), "A simple service");
  const prompt = descriptionPrompt({ title: "Electrician", category: "Services", description: "Wiring and repairs" });
  assert.match(prompt, /Use only facts supplied/);
  assert.match(prompt, /Wiring and repairs/);
});

test("description endpoint rejects unsupported methods without calling Google", async () => {
  const response = {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  await handler({ method: "GET" }, response);
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.Allow, "POST");
});

