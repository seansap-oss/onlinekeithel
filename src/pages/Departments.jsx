import { ProductCard } from "./Marketplace";
import React, { useEffect, useState } from "react";
import { Link, useMarket } from "../lib/context";
import {
  departmentConfig,
  motorCategories,
  listingPrice,
} from "../lib/departments";
import { CategoryIcon } from "../components/CategoryIcon";
import { Photo } from "../components/UI";
import { configured, supabase, result } from "../lib/backend";
import { money } from "../lib/utils";
export function Department({ kind }) {
  const c = departmentConfig[kind],
    { categories, navigate, fixtures, path } = useMarket();
  const [query, setQuery] = useState(""),
    [location, setLocation] = useState(""),
    [choice, setChoice] = useState(""),
    [motor, setMotor] = useState("vehicles");
  useEffect(() => {
    if (kind !== "motors") return;
    const requested = new URLSearchParams(path.split("?")[1] || "").get("category");
    setMotor(motorCategories.includes(requested) ? requested : "vehicles");
  }, [kind, path]);
  const category = kind === "motors" ? motor : c.category;
  const current = categories.find((x) => x.id === category);
  const [featured, setFeatured] = useState([]),
    [feedError, setFeedError] = useState(""),
    [feedLoading, setFeedLoading] = useState(true);
  useEffect(() => {
    let live = true;
    setFeedLoading(true);
    setFeedError("");
    (async () => {
      try {
        let list = [];
        if (fixtures)
          list = fixtures.listings
            .filter(
              (x) =>
                x.category_id === category &&
                (!choice || !c.field || x.attributes?.[c.field] === choice),
            )
            .slice(0, 6);
        else if (configured) {
          let q = supabase
            .from("listings")
            .select("*,seller:sellers!inner(*)")
            .eq("category_id", category)
            .eq("status", "published")
            .order("created_at", { ascending: false })
            .limit(6);
          if (choice && c.field)
            q = q.contains("attributes", { [c.field]: choice });
          list = await result(q);
        }
        if (live) setFeatured(list);
      } catch (e) {
        if (live) setFeedError(e.message);
      } finally {
        if (live) setFeedLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [category, choice, c.field, fixtures]);
  const link = (sub = "", value = choice) =>
    "/search?" +
    new URLSearchParams({
      category,
      ...(query ? { q: query } : {}),
      ...(location ? { location } : {}),
      ...(sub ? { subcategory: sub } : {}),
      ...(value && c.field ? { attribute: c.field, value } : {}),
    });
  return (
    <div className={"page department-page department-" + kind}>
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        {c.title}
      </div>
      <section className="department-hero">
        <div>
          <span className="eyebrow">{c.title}</span>
          <h1>{c.headline}</h1>
          <p>{c.description}</p>
          <Link className="button primary" to={"/sell?category=" + category}>
            {c.action} →
          </Link>
        </div>
        {c.image ? (
          <Photo src={c.image} alt="Browse local vehicles" />
        ) : (
          <div className="department-art">
            <CategoryIcon name={c.icon} size={130} />
            <span>{c.title}</span>
          </div>
        )}
      </section>
      <div className="department-tabs" aria-label="Browse options">
        {kind === "motors" ? (
          motorCategories.map((id, i) => (
            <button
              className={motor === id ? "active" : ""}
              key={id}
              onClick={() => setMotor(id)}
            >
              {["Cars & commercial", "Bikes & scooters", "Bicycles", "Boats"][i]}
            </button>
          ))
        ) : (
          <>
            <button
              className={!choice ? "active" : ""}
              onClick={() => setChoice("")}
            >
              All
            </button>
            {c.chips.map((x) => (
              <button
                key={x}
                className={choice === x ? "active" : ""}
                onClick={() => setChoice(x)}
              >
                {x}
              </button>
            ))}
          </>
        )}
      </div>
      <form
        className="department-search"
        onSubmit={(e) => {
          e.preventDefault();
          navigate(link());
        }}
      >
        <label>
          Keywords
          <input
            placeholder={
              kind === "jobs"
                ? "Job title, skill or profession"
                : "Search " + c.title.toLowerCase()
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          Location
          <input
            placeholder="Imphal, Thoubal, Ukhrul…"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </label>
        <button className="button primary">Search →</button>
      </form>
      <section>
        <div className="section-heading">
          <h2>Browse {c.title.toLowerCase()}</h2>
          <Link to={link()}>See all listings →</Link>
        </div>
        <div className="department-grid">
          {(current?.subcategories || []).map((s) => (
            <Link key={s.id} to={link(s.id)}>
              <span>
                <CategoryIcon name={s.icon || c.icon} size={27} />
              </span>
              {s.name}
              <b>→</b>
            </Link>
          ))}
        </div>
        {!current && (
          <p>This category is awaiting the marketplace catalogue update.</p>
        )}
      </section>
      <section className="department-latest">
        <div className="section-heading">
          <h2>
            {kind === "jobs"
              ? "Latest opportunities"
              : kind === "whats-on"
                ? "Recently posted events"
                : "Latest listings"}
          </h2>
          <Link to={link()}>See all →</Link>
        </div>
        {feedLoading ? (
          <p role="status">Loading listings…</p>
        ) : feedError ? (
          <p role="alert">{feedError}</p>
        ) : featured.length ? (
          <div className="product-grid">
            {featured.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p>
            No published listings in this section yet. Be the first to post.
          </p>
        )}
      </section>
      {kind === "jobs" && (
        <aside className="department-callout">
          <div>
            <h2>Hiring local talent?</h2>
            <p>
              Your profile becomes a shareable recruiter page with your company
              details and open vacancies.
            </p>
          </div>
          <Link className="button" to="/recruiters">
            Browse recruiters →
          </Link>
          <Link className="button primary" to="/sell?category=jobs">
            Post a job
          </Link>
        </aside>
      )}
      {kind === "whats-on" && (
        <aside className="department-callout">
          <div>
            <h2>Give your event a wider audience.</h2>
            <p>
              Post your event for free. The marketplace team may choose
              community highlights for the ticker.
            </p>
          </div>
          <Link className="button" to="/help">
            Contact the team →
          </Link>
        </aside>
      )}
    </div>
  );
}
export function Recruiters({ slug }) {
  const { fixtures } = useMarket();
  const [rows, setRows] = useState([]),
    [seller, setSeller] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    (async () => {
      try {
        let s = null,
          list = [];
        if (slug) {
          s = fixtures
            ? fixtures.sellers.find((x) => x.slug === slug)
            : configured
              ? await result(
                  supabase
                    .from("sellers")
                    .select("*")
                    .eq("slug", slug)
                    .eq("suspended", false)
                    .maybeSingle(),
                )
              : null;
        }
        if (fixtures)
          list = fixtures.listings.filter(
            (x) => x.category_id === "jobs" && (!slug || x.seller_id === s?.id),
          );
        else if (configured) {
          let q = supabase
            .from("listings")
            .select("*,seller:sellers!inner(*)")
            .eq("category_id", "jobs")
            .eq("status", "published")
            .order("created_at", { ascending: false })
            .limit(100);
          if (slug)
            q = q.eq(
              "seller_id",
              s?.id || "00000000-0000-0000-0000-000000000000",
            );
          list = await result(q);
        }
        if (live) {
          setSeller(s);
          setRows(list);
        }
      } catch (e) {
        if (live) setError(e.message);
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [slug, fixtures]);
  const employers = [
    ...new Map(
      rows.filter((x) => x.seller).map((x) => [x.seller.id, x.seller]),
    ).values(),
  ];
  return (
    <div className="page department-page">
      <div className="breadcrumb">
        <Link to="/jobs">Jobs & Careers</Link>
        <span>/</span>Recruiters
      </div>
      <h1>
        {slug ? seller?.name || "Recruiter profile" : "Meet local recruiters"}
      </h1>
      <p>
        {slug
          ? seller?.description
          : "Discover employers with recently posted vacancies."}
      </p>
      {seller && (
        <>
          <p>{seller.location}</p>
          <Link to={"/shop/" + seller.slug}>Company profile →</Link>
        </>
      )}
      <Link className="button primary" to="/sell?category=jobs">
        Post a job
      </Link>
      {loading ? (
        <p role="status">Loading vacancies…</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : slug ? (
        <section className="recruiter-list">
          <h2>Open vacancies</h2>
          {rows.map((x) => (
            <Link key={x.id} to={"/listing/" + x.id}>
              <h3>{x.title}</h3>
              <p>
                {x.location} · {x.attributes?.["Employment type"]}
              </p>
              <strong>{listingPrice(x, money)}</strong>
            </Link>
          ))}
          {!rows.length && <p>No published vacancies right now.</p>}
        </section>
      ) : (
        <section className="recruiter-list">
          {employers.map((s) => (
            <Link key={s.id} to={"/recruiter/" + s.slug}>
              <h2>{s.name}</h2>
              <p>{s.location}</p>
              <span>View vacancies →</span>
            </Link>
          ))}
          {!employers.length && (
            <p>
              Recruiters will appear here when they publish their first vacancy.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
