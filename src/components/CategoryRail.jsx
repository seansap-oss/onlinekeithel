import { categoryRoute } from "../lib/departments";
import React, { useRef, useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { Link, useMarket } from "../lib/context";
import { CategoryIcon } from "./CategoryIcon";
export function CategoryRail() {
  const { categories } = useMarket(),
    rail = useRef(null);
  const [usage, setUsage] = useState(() => {
    try {
      const data = JSON.parse(
        localStorage.getItem("ok-category-usage-v1") || "{}",
      );
      return data && typeof data === "object" ? data : {};
    } catch {
      return {};
    }
  });
  const list = categories.filter((c) => c.active !== false);
  const priority = [
    "vehicles",
    "property",
    "jobs",
    "electronics",
    "fashion",
    "construction",
    "home",
    "services",
    "happenings",
    "freebies",
  ];
  const rank = (id) => (priority.includes(id) ? priority.indexOf(id) : 100);
  const ordered = [...list].sort(
    (a, b) =>
      (Number(usage[b.id]) || 0) - (Number(usage[a.id]) || 0) ||
      rank(a.id) - rank(b.id),
  );
  const remember = (id) => {
    try {
      const parsed = JSON.parse(
        localStorage.getItem("ok-category-usage-v1") || "{}",
      );
      const counts = parsed && typeof parsed === "object" ? parsed : {};
      counts[id] = Date.now();
      localStorage.setItem("ok-category-usage-v1", JSON.stringify(counts));
      setUsage(counts);
    } catch {}
  };
  const short = {
    fashion: "Clothing",
    electronics: "Electronics",
    vehicles: "Vehicles",
    property: "Property",
    jobs: "Jobs",
    happenings: "Events",
    freebies: "Giveaways",
    motorcycles: "Motorcycles",
    home: "Home",
    retail: "Retail",
  };
  return (
    <section className="category-rail-section" aria-label="Browse categories">
      <div className="section-heading">
        <h2>Browse categories</h2>
        <Link to="/categories">See all categories →</Link>
      </div>
      <div className="category-rail-wrap">
        <button
          type="button"
          className="icon-button rail-arrow"
          aria-label="Scroll categories left"
          onClick={() =>
            rail.current.scrollBy({ left: -320, behavior: "smooth" })
          }
        >
          <CaretLeft />
        </button>
        <div className="category-rail" ref={rail}>
          {ordered.map((c) => (
            <Link
              key={c.id}
              to={categoryRoute(c.id)}
              onClick={() => remember(c.id)}
            >
              <span>
                <CategoryIcon name={c.icon} size={25} />
              </span>
              <small>{short[c.id] || c.name}</small>
            </Link>
          ))}
        </div>
        <button
          type="button"
          className="icon-button rail-arrow"
          aria-label="Scroll categories right"
          onClick={() =>
            rail.current.scrollBy({ left: 320, behavior: "smooth" })
          }
        >
          <CaretRight />
        </button>
      </div>
    </section>
  );
}
