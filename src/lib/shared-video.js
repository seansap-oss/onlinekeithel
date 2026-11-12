import { embedUrl, socialUrl } from "./utils.js";

export function sharedVideoFromSearch(search = "") {
  const params = new URLSearchParams(search);
  for (const value of [params.get("url"), params.get("text"), params.get("title")]) {
    if (!value) continue;
    const candidate = value.match(/https:\/\/[^\s<>"']+/i)?.[0]?.replace(/[),.;]+$/, "");
    if (candidate && socialUrl(candidate) && embedUrl(candidate)) return socialUrl(candidate);
  }
  return "";
}
