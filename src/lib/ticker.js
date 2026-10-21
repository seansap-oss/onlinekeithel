import { safeUrl } from "./utils.js";
export const tickerFonts = {
  sans: '"DM Sans", sans-serif',
  serif: "Lora, Georgia, serif",
  handwritten: "Caveat, cursive",
  mono: "ui-monospace, monospace",
  system: "system-ui, sans-serif",
};
export const tickerIcons = {
  none: "",
  fire: "🔥",
  trophy: "🏆",
  sale: "🏷️",
  star: "⭐",
  party: "🎉",
  shop: "🏪",
  heart: "❤️",
  tools: "🛠️",
  bell: "🔔",
  truck: "🚚",
  sparkles: "✨",
  megaphone: "📣",
};
export const textOf = (runs = []) => runs.map((r) => r.text || "").join("");
const color = (v, fallback) => (/^#[\da-f]{6}$/i.test(v || "") ? v : fallback);
export function runStyle(r = {}) {
  return {
    color: color(r.color, "#ffffff"),
    font: Object.hasOwn(tickerFonts, r.font) ? r.font : "sans",
    size: Math.min(36, Math.max(12, Number(r.size) || 16)),
    bold: !!r.bold,
    italic: !!r.italic,
    underline: !!r.underline,
  };
}
export function cleanRuns(runs = []) {
  return runs
    .filter((r) => r && typeof r.text === "string" && r.text)
    .map((r) => ({ text: r.text, ...runStyle(r) }));
}
export function sliceRuns(runs, start, end) {
  let offset = 0;
  const out = [];
  for (const r of cleanRuns(runs)) {
    const a = Math.max(0, start - offset),
      b = Math.min(r.text.length, end - offset);
    if (b > a) out.push({ ...r, text: r.text.slice(a, b) });
    offset += r.text.length;
  }
  return out;
}
export function formatRange(runs, start, end, style) {
  const length = textOf(runs).length;
  start = Math.max(0, Math.min(start, length));
  end = Math.max(start, Math.min(end, length));
  if (start === end) {
    start = 0;
    end = length;
  }
  return [
    ...sliceRuns(runs, 0, start),
    ...sliceRuns(runs, start, end).map((r) => ({
      ...r,
      ...runStyle({ ...r, ...style }),
    })),
    ...sliceRuns(runs, end, length),
  ];
}
export function replaceRange(runs, start, end, text, style = {}) {
  const inherited =
    sliceRuns(runs, Math.max(0, start - 1), start)[0] || runs[0] || {};
  return [
    ...sliceRuns(runs, 0, start),
    ...(text ? [{ text, ...runStyle({ ...inherited, ...style }) }] : []),
    ...sliceRuns(runs, end, Infinity),
  ];
}
export function editText(runs, next) {
  const old = textOf(runs);
  let a = 0,
    b = 0;
  while (a < old.length && a < next.length && old[a] === next[a]) a++;
  while (
    b < old.length - a &&
    b < next.length - a &&
    old[old.length - 1 - b] === next[next.length - 1 - b]
  )
    b++;
  return replaceRange(runs, a, old.length - b, next.slice(a, next.length - b));
}
export function destination(value = "") {
  return /^\/(?!\/)[^\s\\]*$/.test(value) ? value : safeUrl(value);
}
export const defaultTicker = {
  enabled: true,
  background: "#063c31",
  speed: 55,
  messages: [
    {
      id: "welcome",
      enabled: true,
      icon: "megaphone",
      separator: "•",
      runs: [
        {
          text: "Local updates · Discover shops near you · New arrivals this week",
          color: "#ffffff",
          font: "sans",
          size: 14,
        },
      ],
      link: "/shops",
      sponsored: false,
      startsAt: "",
      endsAt: "",
    },
  ],
};
export function tickerSettings(value) {
  const t = value && typeof value === "object" ? value : defaultTicker;
  const rawMessages = Array.isArray(t.messages) ? t.messages : [];
  const legacyDefault =
    t.background === "#fff7df" &&
    rawMessages.length === 1 &&
    rawMessages[0]?.id === "welcome" &&
    textOf(rawMessages[0]?.runs || []) ===
      "Local updates · Discover shops near you · New arrivals this week";
  return {
    enabled: t.enabled !== false,
    background: color(legacyDefault ? "#063c31" : t.background, "#063c31"),
    speed: Math.max(20, Math.min(140, Number(t.speed) || 55)),
    messages: rawMessages.map((m, i) => ({
      id: String(m.id || i),
      enabled: m.enabled !== false,
      icon: Object.hasOwn(tickerIcons, m.icon) ? m.icon : "none",
      separator: String(m.separator || "•").slice(0, 20),
      runs: cleanRuns(
        (Array.isArray(m.runs) ? m.runs : []).map((run) =>
          legacyDefault && run.color === "#15352e"
            ? { ...run, color: "#ffffff" }
            : run,
        ),
      ),
      link: destination(m.link),
      sponsored: !!m.sponsored,
      startsAt: m.startsAt || "",
      endsAt: m.endsAt || "",
    })),
  };
}
export function activeMessages(ticker, now = Date.now()) {
  return ticker.messages.filter(
    (m) =>
      m.enabled &&
      textOf(m.runs).trim() &&
      (!m.startsAt || Date.parse(m.startsAt) <= now) &&
      (!m.endsAt || Date.parse(m.endsAt) > now),
  );
}
export function validateTicker(value) {
  const t = tickerSettings(value);
  for (const m of value?.messages || []) {
    if (m.link && !destination(m.link))
      throw Error("Ticker links must be a local page path or an HTTPS URL.");
    if (m.enabled !== false && !textOf(m.runs).trim())
      throw Error("Each active ticker message needs text.");
    if (
      (m.startsAt && !Number.isFinite(Date.parse(m.startsAt))) ||
      (m.endsAt && !Number.isFinite(Date.parse(m.endsAt)))
    )
      throw Error("Enter valid ticker dates.");
    if (
      m.startsAt &&
      m.endsAt &&
      Date.parse(m.endsAt) <= Date.parse(m.startsAt)
    )
      throw Error("Ticker end must be after its start.");
  }
  return t;
}
