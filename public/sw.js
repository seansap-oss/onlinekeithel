const CACHE = "onlinekeithel-shell-v0.24.2";
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add("/offline.html")));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function saveSharedFile(record) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("onlinekeithel-share-target", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("shares");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("shares", "readwrite");
      tx.objectStore("shares").put(record, "latest");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
  });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.mode === "navigate" && request.method === "POST" && url.pathname === "/share") {
    event.respondWith(
      (async () => {
        try {
          const form = await request.formData();
          const media = form.get("media");
          const record = {
            title: String(form.get("title") || "").slice(0, 160),
            text: String(form.get("text") || "").slice(0, 2000),
            url: String(form.get("url") || "").slice(0, 2000),
            mediaFile: media instanceof File && media.size > 0 ? media : null,
            receivedAt: Date.now(),
          };
          await saveSharedFile(record);
          const destination = new URL("/share", self.location.origin);
          if (record.title) destination.searchParams.set("title", record.title);
          if (record.text) destination.searchParams.set("text", record.text);
          if (record.url) destination.searchParams.set("url", record.url);
          if (record.mediaFile) destination.searchParams.set("hasMedia", "1");
          return Response.redirect(destination.toString(), 303);
        } catch {
          return Response.redirect(new URL("/share", self.location.origin).toString(), 303);
        }
      })(),
    );
    return;
  }
  // Never cache authentication, API, private pages or user media.
  if (request.mode === "navigate" && request.method === "GET")
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
});
