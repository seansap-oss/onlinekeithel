import { categoryCatalog } from "./categories.js";
import { fieldOptions, productFields } from "./commerce.js";

// Seller pages use the admin-managed catalogue. This copy only supplies a
// starting headline and the most useful shop filters; it never grants sellers
// permission to create marketplace categories.
const headlines = {
  fashion: "Clothing and handloom, chosen for you.",
  mobiles: "Phones, accessories and local expertise.",
  electronics: "Find the right tech for everyday life.",
  vehicles: "Your next drive starts here.",
  motorcycles: "Find your next ride.",
  home: "Make yourself at home.",
  construction: "The materials for your next build.",
  architecture: "Thoughtful spaces start here.",
  contractors: "Good people for the work ahead.",
  warehouse: "Keep your site moving.",
  tools: "Tools and hardware for every job.",
  electrical: "Light, power and practical solutions.",
  plumbing: "Everything for water and bathrooms.",
  finishes: "The finishing touches matter.",
  machinery: "The equipment to get it done.",
  safety: "Safer spaces start with the right gear.",
  property: "Places to live, land to grow, space to work.",
  logistics: "Local transport that gets things moving.",
  bicycles: "Find your next ride on two wheels.",
  appliances: "Everyday appliances for your home.",
  food: "Local flavours, made and shared here.",
  agriculture: "Grow something good.",
  beauty: "Care made for everyday life.",
  sports: "Get out there and keep moving.",
  kids: "Little things for growing days.",
  pets: "A little more for your companions.",
  education: "Books and learning close to home.",
  events: "Make the occasion yours.",
  business: "Local expertise for your next step.",
  services: "Help for home and everyday life.",
  retail: "Good finds from your local shop.",
  jobs: "Good work starts close to home.",
  happenings: "See what's happening nearby.",
  freebies: "Share, swap and find something useful.",
  boats: "Find your next trip on the water.",
  music: "Make more music, closer to home.",
};

const facets = {
  vehicles: ["Make", "Model", "Transmission", "Fuel", "Kilometres"],
  motorcycles: ["Make", "Model", "Engine", "Kilometres"],
  property: ["Listing purpose", "Property type", "Bedrooms", "Area"],
  jobs: ["Employment type", "Employer sector", "Work arrangement"],
  food: ["Food type", "Cuisine", "Serving size"],
  electronics: ["Brand", "Model", "Condition"],
  mobiles: ["Brand", "Model", "Condition"],
};

export function shopCategory(categoryId, categories = categoryCatalog) {
  return categories.find((category) => category.id === categoryId && category.active !== false) || null;
}

export function shopCategoryProfile(categoryId, categories = categoryCatalog) {
  const category = shopCategory(categoryId, categories);
  if (!category) return null;
  const fields = productFields(category);
  const useful = facets[category.id] || fields.slice(0, 4);
  return {
    ...category,
    headline: headlines[category.id] || `Discover ${category.name.toLowerCase()} nearby.`,
    // One source of truth for a seller's section starters and the admin's taxonomy.
    starters: (category.subcategories || []).slice(0, 8),
    filters: useful.filter((field) => fields.includes(field)),
    options: fieldOptions,
    layout: ["vehicles", "motorcycles", "bicycles", "boats", "property"].includes(category.id)
      ? "showroom"
      : ["jobs", "architecture", "contractors", "business", "services"].includes(category.id)
        ? "portfolio"
        : "catalogue",
  };
}

export function shopCategoryId(seller, categories = categoryCatalog) {
  const requested = seller?.storefront?.categoryId;
  if (shopCategory(requested, categories)) return requested;
  const legacy = { fashion: "fashion", electronics: "electronics", vehicles: "vehicles", motorcycles: "motorcycles" }[seller?.theme];
  return shopCategory(legacy, categories)?.id || "";
}

export function shopListingLabel(categoryId) {
  return { vehicles: "vehicle", motorcycles: "motorcycle", property: "property", jobs: "vacancy", food: "menu item" }[categoryId] || "listing";
}
