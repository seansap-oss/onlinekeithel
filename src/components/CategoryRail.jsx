import React, { useRef, useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { Link, useMarket } from "../lib/context";
import { isConstructionCategory } from "../lib/categories";
import { CategoryIcon } from "./CategoryIcon";
export function CategoryRail() {
  const { categories } = useMarket(),
    rail = useRef(null);
  const [usage] = useState(() => {
    try {
      const data = JSON.parse(
        localStorage.getItem("ok-category-usage-v1") || "{}",
      );
      return data && typeof data === "object" ? data : {};
    } catch {
      return {};
    }
  });
  const list = categories.filter((c) => !isConstructionCategory(c));
  if (categories.some(isConstructionCategory))
    list.splice(4, 0, {
      id: "construction",
      name: "Construction",
      icon: "HardHat",
      department: true,
    });
  const ordered = [...list].sort(
    (a, b) => (Number(usage[b.id]) || 0) - (Number(usage[a.id]) || 0),
  );
  const remember = (id) => {
    try {
      const parsed = JSON.parse(
        localStorage.getItem("ok-category-usage-v1") || "{}",
      );
      const counts = parsed && typeof parsed === "object" ? parsed : {};
      counts[id] = (Number(counts[id]) || 0) + 1;
      localStorage.setItem("ok-category-usage-v1", JSON.stringify(counts));
    } catch {}
  };
  const short = {
    fashion: "Clothing",
    mobiles: "Mobiles",
    electronics: "Electronics",
    vehicles: "Cars",
    motorcycles: "Motorcycles",
    home: "Home",
    retail: "Retail",
  };
  return (
    <section className="category-rail-section" aria-label="Browse categories">
      <div className="section-heading">
        <h2>Categories</h2>
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
              to={
                "/search?" +
                (c.department ? "department" : "category") +
                "=" +
                c.id
              }
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
