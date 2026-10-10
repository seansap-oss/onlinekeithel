import test from "node:test";
import assert from "node:assert/strict";
import {
  formatRange,
  editText,
  replaceRange,
  textOf,
  tickerSettings,
  activeMessages,
  validateTicker,
  destination,
} from "../src/lib/ticker.js";
test("letter formatting and subsequent text edits preserve surrounding styles", () => {
  let runs = [
    { text: "Hot sale today", color: "#15352e", font: "sans", size: 16 },
  ];
  runs = formatRange(runs, 0, 3, { color: "#bd4037", bold: true });
  assert.equal(runs[0].text, "Hot");
  assert.equal(runs[0].color, "#bd4037");
  assert.equal(runs[1].color, "#15352e");
  runs = editText(runs, "Hot sale tomorrow");
  assert.equal(textOf(runs), "Hot sale tomorrow");
  assert.equal(runs[0].bold, true);
  runs = replaceRange(runs, 3, 3, " 🔥");
  assert.equal(textOf(runs), "Hot 🔥 sale tomorrow");
  const all = formatRange(runs, 0, 0, { font: "serif", size: 24 });
  assert.ok(all.every((r) => r.font === "serif" && r.size === 24));
  assert.equal(textOf(editText(all, "")), "");
});
test("scheduling excludes disabled, expired, future and empty ticker messages", () => {
  const message = { enabled: true, runs: [{ text: "Sale" }] };
  const t = tickerSettings({
    messages: [
      { ...message, id: "live" },
      { ...message, id: "hidden", enabled: false },
      { ...message, id: "future", startsAt: "2030-01-01T00:00:00Z" },
      { ...message, id: "expired", endsAt: "2020-01-01T00:00:00Z" },
      { ...message, id: "invalid", startsAt: "nonsense" },
      { ...message, id: "empty", runs: [] },
    ],
  });
  assert.deepEqual(
    activeMessages(t, Date.parse("2026-10-10")).map((m) => m.id),
    ["live"],
  );
  assert.throws(
    () =>
      validateTicker({
        messages: [
          { ...message, startsAt: "2026-10-11", endsAt: "2026-10-10" },
        ],
      }),
    /end must be after/,
  );
});
test("rich ticker data cannot inject CSS or executable links", () => {
  const t = tickerSettings({
    background: "url(javascript:x)",
    messages: [
      {
        runs: [
          {
            text: "<script>alert(1)</script>",
            font: "malicious",
            size: 10000,
            color: "red;position:fixed",
          },
        ],
        link: "javascript:alert(1)",
      },
    ],
  });
  assert.equal(t.background, "#fff7df");
  assert.equal(t.messages[0].runs[0].font, "sans");
  assert.equal(t.messages[0].runs[0].size, 36);
  assert.equal(t.messages[0].runs[0].color, "#15352e");
  assert.equal(t.messages[0].link, "");
  assert.equal(destination("//evil.example"), "");
  assert.equal(destination("/\\evil.example"), "");
  assert.equal(destination("/shop/local"), "/shop/local");
  assert.throws(
    () =>
      validateTicker({
        messages: [{ runs: [{ text: "bad" }], link: "javascript:alert(1)" }],
      }),
    /HTTPS/,
  );
});
