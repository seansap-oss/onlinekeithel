export const defaultHeroSlides = [
  {
    id: "post",
    title: "Featured local offers",
    description: "Discover something good close to home.",
    image: "/images/shop.jpg",
    destination: "/search",
    button: "View offers",
    enabled: true,
  },
  {
    id: "shops",
    title: "Your own little corner.",
    description: "Discover independent shops and local makers across Manipur.",
    image: "/images/phanek.webp",
    destination: "/shops",
    button: "Discover shops",
    enabled: true,
  },
];

export const heroLayouts = [
  { id: "swipe", label: "Swipe carousel", count: 2 },
  { id: "feature", label: "One large feature", count: 1 },
  { id: "split", label: "Two cards", count: 2 },
  { id: "grid4", label: "Four card grid", count: 4 },
  { id: "grid8", label: "Eight card grid", count: 8 },
  { id: "list", label: "Compact list", count: 4 },
];

export function heroDisplaySettings(value) {
  const v = value && typeof value === "object" ? value : {};
  return {
    layout: heroLayouts.some((x) => x.id === v.layout) ? v.layout : "swipe",
    rotation_seconds: Math.max(
      3,
      Math.min(60, Math.round(Number(v.rotation_seconds) || 6)),
    ),
    order: ["priority", "newest", "manual"].includes(v.order)
      ? v.order
      : "priority",
    pause_on_interaction: v.pause_on_interaction !== false,
  };
}

export function heroItemPlacement(item) {
  return ["hero", "featured", "both"].includes(item?.placement)
    ? item.placement
    : "hero";
}

export function isHeroItemActive(item, now = Date.now()) {
  if (item?.enabled === false) return false;
  const start = item?.starts_at || item?.startsAt || "";
  const end = item?.ends_at || item?.endsAt || "";
  return (
    (!start || Date.parse(start) <= now) && (!end || Date.parse(end) > now)
  );
}

export function orderHeroItems(items, mode = "priority") {
  const list = [...items];
  if (mode === "manual")
    return list.sort(
      (a, b) => Number(a.position || 0) - Number(b.position || 0),
    );
  if (mode === "newest")
    return list.sort(
      (a, b) => Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0),
    );
  return list.sort(
    (a, b) =>
      Number(!!b.paid) - Number(!!a.paid) ||
      Number(b.priority || 0) - Number(a.priority || 0) ||
      Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0),
  );
}
