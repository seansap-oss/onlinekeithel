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

export function sharedTextFromSearch(search = "") {
  const params = new URLSearchParams(search);
  return (params.get("text") || "").trim();
}

export function sharedTitleFromSearch(search = "") {
  return (new URLSearchParams(search).get("title") || "").trim().slice(0, 160);
}

export function sharedDescriptionFromSearch(search = "") {
  const searchParams = new URLSearchParams(search);
  const text = (searchParams.get("text") || "").trim();
  const video = sharedVideoFromSearch(search);
  return text.replace(video, "").trim().slice(0, 500);
}

let consumePromise;
export function consumeSharedMedia() {
  consumePromise ||= (async () => {
  if (typeof window !== "undefined" && window.__OO_PENDING_SHARE) {
    const payload = window.__OO_PENDING_SHARE;
    delete window.__OO_PENDING_SHARE;
    if (payload.mediaData || payload.mediaFile) return payload;
  }
  if (typeof indexedDB === "undefined") return null;
  return new Promise((resolve) => {
    const request = indexedDB.open("onlinekeithel-share-target", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("shares");
    request.onerror = () => resolve(null);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("shares")) return resolve(null);
      const tx = db.transaction("shares", "readwrite");
      const store = tx.objectStore("shares");
      const get = store.get("latest");
      get.onsuccess = () => {
        const value = get.result || null;
        store.delete("latest");
        resolve(value);
      };
      get.onerror = () => resolve(null);
    };
  });
  })();
  return consumePromise;
}
