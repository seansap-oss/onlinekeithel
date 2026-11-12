// Store navigation is derived from the admin catalogue. Owners can add their
// own collections without changing marketplace taxonomy.
const groupNames = {
  fashion: ["Clothing", "Footwear & accessories", "Handloom & other"],
  vehicles: ["Cars & passenger", "Commercial & rentals", "Parts & services"],
  motorcycles: ["Motorcycles & scooters", "Parts & services"],
  property: ["Buy", "Rent", "Stay & commercial"],
  jobs: ["Professional roles", "Trades & local work", "Other vacancies"],
  electronics: ["Computers & devices", "Audio, video & gaming", "Equipment"],
  mobiles: ["Phones & tablets", "Accessories & repairs"],
  construction: ["Materials", "Structures & finishes"],
  architecture: ["Design", "Engineering & planning"],
  services: ["Repairs", "Home services"],
  events: ["Event services", "Venues & supplies"],
  tools: ["Tools", "Hardware & workshop"],
  plumbing: ["Pipes & fittings", "Bathrooms & water"],
  bicycles: ["Bicycles", "Parts & repair"],
};

export function shopDepartments(category) {
  if (!category) return [];
  const entries = (category.subcategories || []).filter((entry) => entry.active !== false);
  if (!entries.length) return [];
  const labels = groupNames[category.id] || (entries.length > 8 ? [category.name, "More " + category.name.toLowerCase()] : [category.name]);
  const size = Math.ceil(entries.length / labels.length);
  return labels.map((name, index) => ({ name, entries: entries.slice(index * size, (index + 1) * size) })).filter((group) => group.entries.length);
}

export function shopStarterCollections(category) {
  if (!category) return [];
  if (category.id === "fashion") return ["T-shirts", "Shirts", "Pants", "Dresses", "Shoes", "Socks", "Accessories"];
  return (category.subcategories || []).filter((entry) => entry.active !== false).slice(0, 12).map((entry) => entry.name);
}
