import React, { useEffect, useState } from "react";
import { MagnifyingGlass, ArrowRight } from "@phosphor-icons/react";
import { Modal } from "./UI";
import { CategoryIcon } from "./CategoryIcon";
import { useMarket, Link } from "../lib/context";
import { supabase, configured, result } from "../lib/backend";
import { searchable } from "../lib/utils";
export function SearchPanel({ onClose }) {
  const { categories, fixtures, navigate } = useMarket();
  const [q, setQ] = useState(""),
    [tab, setTab] = useState("All"),
    [products, setProducts] = useState([]),
    [shops, setShops] = useState([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const term = q.trim().toLowerCase();
  const matches = categories
    .flatMap((c) => [
      { ...c, to: "/search?category=" + encodeURIComponent(c.id) },
      ...(c.subcategories || []).map((s) => ({
        ...s,
        parent: c.name,
        icon: s.icon || c.icon,
        to:
          "/search?" +
          new URLSearchParams({ category: c.id, subcategory: s.id }),
      })),
    ])
    .filter(
      (c) =>
        term && (c.name + " " + (c.parent || "")).toLowerCase().includes(term),
    )
    .slice(0, 8);
  useEffect(() => {
    let cancelled = false;
    setProducts([]);
    setShops([]);
    setError("");
    if (!term) {
      setBusy(false);
      return;
    }
    setBusy(true);
    const timer = setTimeout(async () => {
      try {
        let p = [],
          s = [];
        if (configured) {
          [p, s] = await Promise.all([
            result(
              supabase.rpc("search_listings", { p_query: q.trim() }).limit(8),
            ),
            result(
              supabase
                .from("sellers")
                .select("id,name,slug")
                .eq("suspended", false)
                .ilike("name", "%" + q.trim().replace(/[%_]/g, "") + "%")
                .limit(8),
            ),
          ]);
        } else {
          p = (fixtures?.listings || [])
            .filter((i) => searchable(i).includes(term))
            .slice(0, 8);
          s = (fixtures?.sellers || [])
            .filter((i) =>
              (i.name + " " + JSON.stringify(i.socials))
                .toLowerCase()
                .includes(term),
            )
            .slice(0, 8);
        }
        if (!cancelled) {
          setProducts(p);
          setShops(s);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q, fixtures]);
  return (
    <Modal title="Search OnlineKeithel" onClose={onClose}>
      <form
        className="search-panel"
        onSubmit={(e) => {
          e.preventDefault();
          navigate("/search?q=" + encodeURIComponent(q.trim()));
          onClose();
        }}
      >
        <div className="expanded-search">
          <MagnifyingGlass size={23} />
          <input
            autoFocus
            aria-label="Search marketplace"
            placeholder="Search products, shops, categories or social links"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button
              type="button"
              className="text-button"
              onClick={() => setQ("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
        <p className="muted">Products, shops, categories or social links</p>
        <div className="search-tabs">
          {["All", "Products", "Shops", "Categories"].map((t) => (
            <button
              type="button"
              key={t}
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        {(tab === "All" || tab === "Categories") &&
          matches.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              onClick={onClose}
              className="search-result"
            >
              <CategoryIcon name={c.icon} size={24} />
              <span>
                {c.name}
                <small>
                  {c.parent ? "Category · " + c.parent : "Category"}
                </small>
              </span>
              <ArrowRight />
            </Link>
          ))}
        {(tab === "All" || tab === "Products") &&
          products.map((p) => (
            <Link
              className="search-result"
              key={p.id}
              to={"/listing/" + p.id}
              onClick={onClose}
            >
              <MagnifyingGlass size={22} />
              <span>
                {p.title}
                <small>Product</small>
              </span>
              <ArrowRight />
            </Link>
          ))}
        {(tab === "All" || tab === "Shops") &&
          shops.map((s) => (
            <Link
              className="search-result"
              key={s.id}
              to={"/shop/" + s.slug}
              onClick={onClose}
            >
              <CategoryIcon name="Storefront" size={24} />
              <span>
                {s.name}
                <small>Shop</small>
              </span>
              <ArrowRight />
            </Link>
          ))}
        {busy && <p role="status">Searching…</p>}
        {error && <p role="alert">{error}</p>}
        {term &&
          !busy &&
          !error &&
          !(matches.length + products.length + shops.length) && (
            <p>No results. Try another word.</p>
          )}
        <button className="button primary" type="submit">
          Search {q ? "for “" + q + "”" : ""}
          <ArrowRight />
        </button>
      </form>
    </Modal>
  );
}
