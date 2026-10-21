export const motorCategories = ["vehicles", "motorcycles", "bicycles", "boats"];
export const categoryRoute = (id) =>
  ({
    property: "/homes",
    jobs: "/jobs",
    happenings: "/whats-on",
    vehicles: "/motors?category=vehicles",
    motorcycles: "/motors?category=motorcycles",
    bicycles: "/motors?category=bicycles",
    boats: "/motors?category=boats",
  })[id] || "/search?category=" + id;
export const isClassified = (id) =>
  ["property", "jobs", "happenings"].includes(id);
export const departmentConfig = {
  homes: {
    category: "property",
    title: "Homes & Stays",
    headline: "Find your next home in Manipur.",
    description: "Buy, rent or stay. Discover a space that fits your life.",
    icon: "House",
    action: "List a property",
    chips: ["For sale", "For rent", "Short stay"],
    field: "Listing purpose",
    quick: [
      "homes-for-sale",
      "homes-flats-for-rent",
      "residential-land",
      "pg-paying-guest",
      "hotels",
      "resorts",
      "warehouses-godowns",
      "property-agents",
    ],
  },
  jobs: {
    category: "jobs",
    title: "Jobs & Careers",
    headline: "Find local jobs. Build your career.",
    description:
      "Opportunities across Manipur, from daily work to your next career move.",
    icon: "Briefcase",
    action: "Post a job",
    chips: [
      "Full-time",
      "Part-time",
      "Contract",
      "Daily wage",
      "Internship",
      "Apprenticeship",
    ],
    field: "Employment type",
    quick: [
      "government-public",
      "labour-helpers",
      "construction-trades",
      "education-training",
      "hospitality",
      "technology",
    ],
  },
  motors: {
    category: "",
    title: "Motors",
    headline: "Find your next ride in Manipur.",
    description: "Cars, motorcycles, scooters and more from local sellers.",
    icon: "Car",
    action: "Post a vehicle",
    image: "/images/car.jpg",
    chips: [],
    quick: [],
  },
  "whats-on": {
    category: "happenings",
    title: "What’s On",
    headline: "What’s on in Manipur.",
    description:
      "Local events, food markets, festivals and community activities.",
    icon: "CalendarDots",
    action: "Post an event",
    chips: ["Free", "Paid", "Registration required"],
    field: "Entry type",
    quick: [
      "food-markets",
      "arts-exhibitions",
      "restaurant-offers",
      "culture-festivals",
      "workshops-classes",
      "community-meetups",
    ],
  },
};
export function listingPrice(item, money) {
  const a = item.attributes || {};
  if (item.category_id === "freebies") {
    const kind = String(a["Listing type"] || "").toLowerCase();
    if (kind.includes("wanted") || item.subcategory_id === "wanted-ads")
      return "Wanted";
    if (kind.includes("swap") || item.subcategory_id === "swap-trade")
      return "Swap or trade";
    if (kind.includes("free") || item.subcategory_id === "free-items")
      return "Free";
    return Number(item.price) > 0 ? money(item.price) : "Contact seller";
  }
  if (item.category_id === "jobs")
    return Number(item.price) > 0
      ? money(item.price) +
          (a["Salary basis"] ? " / " + a["Salary basis"].toLowerCase() : "")
      : "Salary not disclosed";
  if (item.category_id === "happenings")
    return a["Entry type"] === "Free"
      ? "Free entry"
      : Number(item.price) > 0
        ? money(item.price) + " entry"
        : "Contact organiser";
  return (
    money(item.price) +
    (item.category_id === "property" && a["Price basis"]
      ? " / " + a["Price basis"].toLowerCase()
      : "")
  );
}
export const indiaTime = (value) =>
  Date.parse(
    value && !/(Z|[+-]\d{2}:\d{2})$/.test(value) ? value + "+05:30" : value,
  );
export function validateClassified(item) {
  if (item.status !== "published" || !isClassified(item.category_id)) return;
  const a = item.attributes || {};
  const required =
    item.category_id === "jobs"
      ? ["Employment type", "Employer sector", "Salary basis"]
      : item.category_id === "property"
        ? ["Listing purpose", "Property type", "Price basis"]
        : ["Event starts", "Event ends", "Venue", "Entry type"];
  for (const key of required)
    if (!String(a[key] || "").trim())
      throw Error("Complete " + key + " before publishing.");
  for (const key of ["Application URL", "Official notice URL", "Booking URL"])
    if (a[key]) {
      let u;
      try {
        u = new URL(a[key]);
      } catch {
        throw Error(key + " must be an HTTPS URL.");
      }
      if (u.protocol !== "https:") throw Error(key + " must be an HTTPS URL.");
    }
  if (item.category_id === "happenings") {
    if (
      !Number.isFinite(indiaTime(a["Event starts"])) ||
      !Number.isFinite(indiaTime(a["Event ends"])) ||
      indiaTime(a["Event ends"]) <= indiaTime(a["Event starts"])
    )
      throw Error("Event end must be after its start.");
    if (a["Entry type"] === "Free" && Number(item.price) !== 0)
      throw Error("Free events must have an entry price of ₹0.");
  }
  if (
    item.category_id === "jobs" &&
    a["Employer sector"] === "Government" &&
    !a["Official notice URL"]
  )
    throw Error("Government vacancies need an official notice URL.");
}
