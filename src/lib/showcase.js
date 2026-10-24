// Editorial category cards: illustrated examples, not seller listings.
// Admins can replace or remove these through the homepage editor.
export const defaultShowcase = [
  ["Scooters & motorcycles", "Find a ride close to home", "motorcycles", "oo-scooter.webp"],
  ["Homes & rentals", "Discover spaces around Manipur", "property", "oo-apartment.webp"],
  ["Kids & toys", "Browse toys, books and more", "kids", "oo-toys.webp"],
  ["Bike repair", "Find a local repair service", "services", "oo-bike-repair.webp"],
  ["Mobile shops", "Explore local phones and accessories", "mobiles", "oo-mobile-shop.webp"],
  ["Clothing & handloom", "Discover clothing and local makers", "fashion", "oo-clothing-shop.webp"],
  ["Construction services", "Find builders and steel workers", "contractors", "oo-construction.webp"],
  ["Hardware & tools", "Browse tools and supplies", "tools", "oo-hardware.webp"],
  ["Farming & garden", "Explore plants and agricultural supplies", "agriculture", "oo-agriculture.webp"],
].map(([title, description, category, image], index) => ({
  id: `showcase-${index}`,
  title,
  description,
  category,
  image: "/images/" + image,
  destination: "/search?category=" + encodeURIComponent(category),
}));
