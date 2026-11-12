export function filterShopListings(items, { attributes = {}, condition = "", maxPrice = "", maxKilometres = "" } = {}) {
  const maximumPrice = Number(maxPrice);
  const maximumKilometres = Number(maxKilometres);
  return items.filter((item) => {
    if (condition && item.condition !== condition) return false;
    if (maxPrice !== "" && (Number.isNaN(maximumPrice) || Number(item.price) > maximumPrice)) return false;
    if (maxKilometres !== "") {
      const km = Number(item.attributes?.Kilometres);
      if (!Number.isFinite(maximumKilometres) || !Number.isFinite(km) || item.attributes?.Kilometres === "" || item.attributes?.Kilometres == null || km > maximumKilometres) return false;
    }
    return Object.entries(attributes).every(([field, value]) =>
      !value || String(item.attributes?.[field] ?? "").toLocaleLowerCase().includes(String(value).toLocaleLowerCase().trim()),
    );
  });
}
