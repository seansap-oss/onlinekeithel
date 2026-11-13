import { result, supabase } from "./backend";

const cache = new Map();
export async function savedIds(userId) {
  if (!userId) return new Set();
  if (!cache.has(userId)) {
    const pending = result(supabase.from("saved_listings").select("listing_id").eq("user_id", userId))
      .then((rows) => new Set(rows.map((row) => row.listing_id)))
      .catch((error) => { cache.delete(userId); throw error; });
    cache.set(userId, pending);
  }
  return cache.get(userId);
}
export async function setSavedId(userId, listingId, value) {
  const ids = await savedIds(userId);
  if (value) ids.add(listingId);
  else ids.delete(listingId);
  window.dispatchEvent(new CustomEvent("onlinekeithel:saved-change", { detail: { userId, listingId, value } }));
}
