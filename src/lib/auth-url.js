// Auth email destinations must use the canonical public site, even when an
// administrator requests a reset while viewing a local build or preview.
export function authEmailUrl(path, siteUrl, currentOrigin) {
  const base = (siteUrl || currentOrigin || "").trim();
  if (!base) throw Error("Set VITE_PUBLIC_SITE_URL before sending account emails.");
  const origin = new URL(base);
  if (origin.protocol !== "https:" &&
      !(origin.protocol === "http:" && ["localhost", "127.0.0.1"].includes(origin.hostname))) {
    throw Error("Account email links need an HTTPS website URL.");
  }
  if (!path.startsWith("/") || path.startsWith("//"))
    throw Error("Invalid account email destination.");
  return new URL(path, origin.origin).href;
}

export function accountEmailUrl(path) {
  return authEmailUrl(
    path,
    import.meta.env.VITE_PUBLIC_SITE_URL,
    typeof location === "undefined" ? "" : location.origin,
  );
}
