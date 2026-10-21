export function normalizePhoneNumber(value) {
  const compact = String(value || "").trim().replace(/[\s()-]/g, "");
  if (/^[6-9]\d{9}$/.test(compact)) return "+91" + compact;
  if (/^0[6-9]\d{9}$/.test(compact)) return "+91" + compact.slice(1);
  if (/^91[6-9]\d{9}$/.test(compact)) return "+" + compact;
  if (/^\+[1-9]\d{7,14}$/.test(compact)) return compact;
  throw Error("Enter a valid phone number with its country code.");
}
