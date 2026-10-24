import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Car,
  DeviceMobile,
  Heart,
  House,
  SignOut,
  SquaresFour,
  Storefront,
  User,
  WarningCircle,
} from "@phosphor-icons/react";
import { useMarket, Link } from "../lib/context";
import { configured, requireBackend, result, supabase } from "../lib/backend";
import { accountEmailUrl } from "../lib/auth-url";
import { Empty, Photo } from "../components/UI";
import { money } from "../lib/utils";

const categoryIcons = {
  "home-living": House,
  furniture: House,
  vehicles: Car,
  cars: Car,
  electronics: DeviceMobile,
  mobiles: DeviceMobile,
};

function categoryIcon(category) {
  const key = (category?.id || "").toLowerCase();
  return categoryIcons[key] || SquaresFour;
}

export function MemberAccount() {
  const { session, categories, notice, navigate } = useMarket();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        if (!configured) {
          setItems([]);
          return;
        }
        const rows = await result(
          supabase
            .from("saved_listings")
            .select("listing:listings!saved_listings_listing_id_fkey(id,title,price,location,images,category_id,status)")
            .eq("user_id", session.user.id),
        );
        if (current)
          setItems(rows.map((row) => row.listing).filter(Boolean));
      } catch (e) {
        if (current) setError(e.message);
      } finally {
        if (current) setLoading(false);
      }
    }
    load();
    return () => {
      current = false;
    };
  }, [session?.user?.id]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const item of items) {
      const id = item.category_id || "other";
      if (!map.has(id)) map.set(id, []);
      map.get(id).push(item);
    }
    const known = categories
      .filter((category) => map.has(category.id))
      .map((category) => ({ category, items: map.get(category.id) }));
    for (const [id, list] of map) {
      if (!known.some((entry) => entry.category.id === id))
        known.push({ category: { id, name: "Other finds" }, items: list });
    }
    return known;
  }, [categories, items]);

  const visibleGroups = activeCategory === "all"
    ? grouped
    : grouped.filter((group) => group.category.id === activeCategory);
  const displayName =
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    session?.user?.email?.split("@")[0] ||
    "Marketplace member";

  async function removeSaved(listingId) {
    try {
      await result(
        supabase
          .from("saved_listings")
          .delete()
          .eq("user_id", session.user.id)
          .eq("listing_id", listingId),
      );
      setItems((current) => current.filter((item) => item.id !== listingId));
      notice("Removed from saved items");
    } catch (e) {
      notice(e.message);
    }
  }

  async function sendPasswordLink() {
    setBusy(true);
    try {
      requireBackend();
      await result(
        supabase.auth.resetPasswordForEmail(session.user.email, {
          redirectTo: accountEmailUrl("/reset-password"),
        }),
      );
      notice("Password setup link sent to " + session.user.email);
    } catch (e) {
      notice(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) notice(signOutError.message);
    else navigate("/");
  }

  return (
    <main className="page member-account">
      <section className="member-account-banner" aria-label="Your account">
        <div className="member-account-person">
          <span className="member-avatar" aria-hidden="true">
            {displayName.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <span className="muted">Good to see you again,</span>
            <h1>{displayName}</h1>
            <p>{session.user.email}</p>
          </div>
        </div>
        <div className="member-account-actions">
          <Link to="/dashboard" className="member-action-link">
            <User size={20} /> My seller profile
          </Link>
          <button className="member-action-link" onClick={sendPasswordLink} disabled={busy}>
            <Storefront size={20} /> {busy ? "Sending link…" : "Set or reset password"}
          </button>
          <button className="button outline member-signout" onClick={signOut}>
            <SignOut size={19} /> Sign out
          </button>
        </div>
      </section>

      <section className="member-saved" aria-labelledby="member-saved-title">
        <span className="eyebrow">YOUR PERSONAL COLLECTION</span>
        <h2 id="member-saved-title">Saved things</h2>
        <p className="member-saved-intro">Your favourite finds, organised by category.</p>

        <nav className="saved-category-tabs" aria-label="Saved categories">
          <button className={activeCategory === "all" ? "active" : ""} onClick={() => setActiveCategory("all")}>
            All saved <span>{items.length}</span>
          </button>
          {grouped.map(({ category, items: categoryItems }) => (
            <button key={category.id} className={activeCategory === category.id ? "active" : ""} onClick={() => setActiveCategory(category.id)}>
              {category.name} <span>{categoryItems.length}</span>
            </button>
          ))}
        </nav>

        {error && <div className="notice-box" role="alert"><WarningCircle /> {error}</div>}
        {loading ? (
          <div className="member-saved-state" role="status">Loading your saved finds…</div>
        ) : visibleGroups.length ? (
          <div className="saved-category-groups">
            {visibleGroups.map(({ category, items: categoryItems }) => {
              const Icon = categoryIcon(category);
              return (
                <section className="saved-category-group" key={category.id}>
                  <div className="saved-category-heading">
                    <span className="saved-category-icon"><Icon size={23} /></span>
                    <h3>{category.name}</h3>
                    <span className="muted">{categoryItems.length} saved {categoryItems.length === 1 ? "item" : "items"}</span>
                    {activeCategory === "all" && <button onClick={() => setActiveCategory(category.id)}>View all <ArrowRight size={16} /></button>}
                  </div>
                  <div className="member-listing-grid">
                    {categoryItems.map((item) => (
                      <article className="member-listing" key={item.id}>
                        <Link to={`/listing/${item.id}`} className="member-listing-photo">
                          <Photo src={item.images?.[0]} alt={item.title} loading="lazy" />
                        </Link>
                        <button className="member-remove-save" aria-label={`Remove ${item.title} from saved items`} onClick={() => removeSaved(item.id)}>
                          <Heart size={19} weight="fill" />
                        </button>
                        <div className="member-listing-info">
                          <strong>{money(item.price)}</strong>
                          <Link to={`/listing/${item.id}`}>{item.title}</Link>
                          <span>{item.location}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <Empty title={activeCategory === "all" ? "Your saved list is ready" : "No saved finds in this category"}>
            {activeCategory === "all" ? "Tap the heart on any listing to keep it here. Your saved items will be grouped automatically by category." : "Save a listing in this category and it will appear here."}
          </Empty>
        )}
      </section>
    </main>
  );
}
