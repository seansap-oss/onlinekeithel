import { CategoryRail } from "../components/CategoryRail";
import {
  defaultHeroSlides,
  heroDisplaySettings,
  heroItemPlacement,
  heroLayouts,
  isHeroItemActive,
  orderHeroItems,
} from "../lib/hero";
import { ProductVideos as HeroVideo } from "../components/ProductMedia";
import {
  isClassified,
  listingPrice,
  motorCategories,
} from "../lib/departments";
import { ClassifiedContact } from "../components/ClassifiedContact";
import { PurchasePanel } from "../components/PurchasePanel";
import { ProductVideos } from "../components/ProductMedia";
import { outOfStock } from "../lib/commerce";
import {
  categoryName,
  subcategoryName,
  subcategoriesFor,
  constructionCategories,
} from "../lib/categories";
import React, { useState, useEffect, useRef } from "react";
import {
  Heart,
  Pause,
  Play,
  MapPin,
  Storefront,
  ArrowRight,
  ArrowLeft,
  CaretLeft,
  CaretRight,
  SlidersHorizontal,
  WhatsappLogo,
  ShareNetwork,
  LinkSimple,
  Flag,
  CheckCircle,
  MagnifyingGlass,
  ChatCircleDots,
  PaperPlaneRight,
} from "@phosphor-icons/react";
import { useMarket, Link } from "../lib/context";
import { CategoryOptions } from "../components/CategoryOptions";
import { supabase, configured, result } from "../lib/backend";
import {
  money,
  whatsappUrl,
  searchable,
  mediaUrl,
  safeUrl,
} from "../lib/utils";
import {
  Photo,
  Modal,
  Field,
  Empty,
  SocialLinks,
  Video,
} from "../components/UI";
import { templates } from "../lib/templates";
import { defaultShowcase } from "../lib/showcase";
import {
  storefrontColors,
  storefrontFonts,
  storefrontSettings,
  shopPath,
  sellerRouteKey,
  isSellerId,
} from "../lib/storefront";
import { icons } from "../components/Layout";
export function ProductCard({ item }) {
  const { session, navigate, notice } = useMarket();
  const [saved, setSaved] = useState(false),
    [flipped, setFlipped] = useState(false);
  return (
    <article className="product-card">
      <div className="product-photo">
        <Link
          to={"/listing/" + item.id}
          data-hovered={flipped}
          onPointerEnter={(e) =>
            setFlipped(e.pointerType === "mouse" || e.pointerType === "pen")
          }
          onPointerLeave={() => setFlipped(false)}
          className={
            item.category_id === "fashion" && item.images?.[1]
              ? "photo-swap"
              : ""
          }
        >
          <Photo
            src={item.images?.[0]}
            alt={
              item.title + (item.category_id === "fashion" ? " · front" : "")
            }
            loading="lazy"
          />
          {item.category_id === "fashion" && item.images?.[1] && (
            <Photo
              className="back-photo"
              src={item.images[1]}
              alt={item.title + " · back"}
              loading="lazy"
            />
          )}
        </Link>
        <span
          className={"condition " + (item.condition === "Used" ? "used" : "")}
        >
          {isClassified(item.category_id)
            ? item.attributes?.[
                item.category_id === "jobs"
                  ? "Employment type"
                  : item.category_id === "property"
                    ? "Listing purpose"
                    : "Entry type"
              ] || "Listing"
            : item.category_id === "freebies"
              ? item.attributes?.["Listing type"] ||
                (Number(item.price) === 0 ? "Giveaway" : "Community listing")
              : outOfStock(item)
                ? "Out of stock"
                : item.condition}
        </span>
        <button
          className={"save-button " + (saved ? "saved" : "")}
          aria-label={`Save ${item.title}`}
          aria-pressed={saved}
          onClick={async () => {
            if (item.sample)
              return notice(
                "Saving is available after account services are connected.",
              );
            if (!session) return navigate("/login");
            try {
              if (saved)
                await result(
                  supabase
                    .from("saved_listings")
                    .delete()
                    .eq("user_id", session.user.id)
                    .eq("listing_id", item.id),
                );
              else
                await result(
                  supabase
                    .from("saved_listings")
                    .upsert({ user_id: session.user.id, listing_id: item.id }),
                );
              setSaved(!saved);
              notice(
                saved ? "Removed from saved items" : "Saved to your account",
              );
            } catch (e) {
              notice(e.message);
            }
          }}
        >
          <Heart size={20} weight={saved ? "fill" : "regular"} />
        </button>
      </div>
      <div className="product-content">
        <Link to={"/listing/" + item.id} className="product-title">
          {item.title}
        </Link>
        <strong className="price">{listingPrice(item, money)}</strong>
        <Link to={shopPath(item.seller)} className="seller-line">
          <span className="seller-initial" aria-hidden="true">
            {(item.seller?.name || "Local seller").trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()}
          </span>
          {item.seller?.name || "Local seller"}
        </Link>
        <span className="location-line">
          <MapPin size={14} />
          {item.location}
        </span>
        <Link
          className="contact-button"
          to={"/listing/" + item.id + "?enquire=1"}
        >
          <WhatsappLogo size={17} />{" "}
          {item.sample ? "View details" : "Contact seller"}
        </Link>
      </div>
    </article>
  );
}
export function ShopCard({ seller }) {
  return (
    <Link className="shop-card" to={shopPath(seller)}>
      <Photo src={seller.cover} alt={seller.name} loading="lazy" />
      <div>
        <span className="shop-avatar">
          {seller.logo ? (
            <Photo src={seller.logo} alt="" />
          ) : (
            <Storefront size={22} />
          )}
        </span>
        <div>
          <strong>{seller.name}</strong>
          <small>{templates[seller.theme]?.category || seller.theme}</small>
          <small>
            <MapPin size={12} />
            {seller.location}
          </small>
        </div>
        <ArrowRight size={18} />
      </div>
    </Link>
  );
}
function CampaignCard({ campaign }) {
  const [video, setVideo] = useState(null);
  const raw = campaign.destination || "/search";
  const local = raw.startsWith("/") && !raw.startsWith("//");
  const href = local ? raw : safeUrl(raw) || "/search";
  const content = (
    <>
      <div className="campaign-photo">
        <Photo src={campaign.image} alt={campaign.title} loading="lazy" />
        <span className="campaign-label">Sponsored</span>
        {(campaign.video_url || campaign.social_url) && (
          <button
            type="button"
            className="campaign-play"
            aria-label={`Play ${campaign.title}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setVideo(campaign.social_url || campaign.video_url);
            }}
          >
            <Play size={20} weight="fill" />
          </button>
        )}
      </div>
      <div className="campaign-copy">
        <strong>{campaign.title}</strong>
        <span>{campaign.description || "Explore this local spotlight"}</span>
        <small>{campaign.seller?.name || campaign.location || "Manipur"}</small>
        <span className="first-local-link">
          Visit offer <ArrowRight size={15} />
        </span>
      </div>
    </>
  );
  return (
    <article className="campaign-card">
      {local ? (
        <Link to={href}>{content}</Link>
      ) : (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      )}
      {video && (
        <Modal
          title={campaign.title || "Promotion video"}
          onClose={() => setVideo(null)}
        >
          <HeroVideo videos={[{ url: video, title: campaign.title }]} />
        </Modal>
      )}
    </article>
  );
}
function FeaturedPromotions({ campaigns, settings }) {
  const display = heroDisplaySettings(settings.hero_display);
  const managed = (settings.hero_slides || defaultHeroSlides)
    .filter((x) => heroItemPlacement(x) !== "hero" && isHeroItemActive(x))
    .map((x) => ({ ...x, id: `managed-${x.id}`, paid: false }));
  const ads = campaigns.filter((x) =>
    ["featured", "both"].includes(x.placement || "featured"),
  );
  const items = orderHeroItems([...ads, ...managed], display.order);
  const option =
      heroLayouts.find((x) => x.id === display.layout) || heroLayouts[0],
    count = option.count;
  const pageCount =
    display.layout === "swipe"
      ? 1
      : Math.max(1, Math.ceil(items.length / count));
  const [page, setPage] = useState(0),
    [interacting, setInteracting] = useState(false);
  useEffect(() => setPage(0), [items.length, display.layout]);
  useEffect(() => {
    if (pageCount < 2 || interacting) return;
    const timer = setInterval(
      () => setPage((x) => (x + 1) % pageCount),
      display.rotation_seconds * 1000,
    );
    return () => clearInterval(timer);
  }, [pageCount, interacting, display.rotation_seconds]);
  if (!items.length) return null;
  const shown =
    display.layout === "swipe"
      ? items
      : items.slice(page * count, (page + 1) * count);
  return (
    <section
      className="section featured-section"
      aria-label="Featured local promotions"
      onMouseEnter={() => display.pause_on_interaction && setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() =>
        display.pause_on_interaction && setInteracting(true)
      }
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setInteracting(false);
      }}
      onTouchStart={() => display.pause_on_interaction && setInteracting(true)}
      onTouchEnd={() => setInteracting(false)}
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">LOCAL SPOTLIGHT</span>
          <h2>Featured around you</h2>
        </div>
        <div className="promotion-controls">
          <Link to="/dashboard?tab=promotions">
            Advertise here <ArrowRight size={18} />
          </Link>
          {pageCount > 1 && (
            <>
              <span>
                {page + 1}/{pageCount}
              </span>
              <button
                className="icon-button"
                aria-label="Previous ads"
                onClick={() => setPage((x) => (x + pageCount - 1) % pageCount)}
              >
                <CaretLeft />
              </button>
              <button
                className="icon-button"
                aria-label="Next ads"
                onClick={() => setPage((x) => (x + 1) % pageCount)}
              >
                <CaretRight />
              </button>
            </>
          )}
        </div>
      </div>
      <div className={`campaign-grid layout-${display.layout}`}>
        {shown.map((x) => (
          <CampaignCard key={x.id} campaign={x} />
        ))}
      </div>
    </section>
  );
}
export function Hero({ settingsOverride, featuredItem, editor = false } = {}) {
  const { settings: liveSettings, navigate } = useMarket();
  const settings = settingsOverride || liveSettings,
    display = heroDisplaySettings(settings.hero_display);
  const legacyWelcome = /^(your neighbourhood\. every shop\.|something to sell\?)$/i.test((settings.hero_title || "").trim());
  const [campaigns, setCampaigns] = useState([]),
    [index, setIndex] = useState(0),
    [video, setVideo] = useState(null),
    [paused, setPaused] = useState(false),
    [interaction, setInteraction] = useState(false),
    [hidden, setHidden] = useState(document.hidden);
  const start = useRef(null),
    slides = [
      {
        id: "welcome",
        title: legacyWelcome ? "Good offers. Right around the corner." : (settings.hero_title || "Good offers. Right around the corner."),
        description: legacyWelcome ? "Find products, services and local shops around Manipur." : (settings.hero_description || "Find products, services and local shops around Manipur."),
        image: legacyWelcome || settings.hero_image === "/images/hero-handloom.webp" ? "/images/shop.jpg" : (settings.hero_image || "/images/shop.jpg"),
        destination: "/search",
        button: "Browse offers",
        display_seconds: 5,
      },
      ...(featuredItem ? [{
        id: "featured-listing",
        title: "Featured local offer",
        description: featuredItem.title,
        image: featuredItem.images?.[0] || "/images/shop.jpg",
        destination: "/listing/" + featuredItem.id,
        button: "View offer",
        display_seconds: 5,
      }] : [defaultHeroSlides[0]]),
      ...(settings.hero_slides || []).filter(
        (x) =>
          !/^(something to sell\?|your own little corner\.)$/i.test((x.title || "").trim()) &&
          heroItemPlacement(x) !== "featured" &&
          (editor ? x.enabled !== false : isHeroItemActive(x)),
      ),
      ...campaigns
        .filter((x) => ["hero", "both"].includes(x.placement || "featured"))
        .map((x) => ({
          ...x,
          id: `campaign-${x.id}`,
          sponsored: true,
          paid: true,
        })),
    ];
  useEffect(() => {
    const vis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
  }, []);
  useEffect(() => {
    if (configured && !editor) {
      const now = new Date().toISOString();
      result(
        supabase
          .from("campaigns")
          .select("*")
          .eq("status", "approved")
          .eq("paid", true)
          .lte("starts_at", now)
          .gt("ends_at", now)
          .order("priority", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(24),
      )
        .then(setCampaigns)
        .catch(() => {});
    }
  }, [editor]);
  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [index, slides.length]);
  const slide = slides[index] || slides[0],
    total = slides.length,
    seconds = Math.max(
      3,
      Math.min(60, Number(slide?.display_seconds) || display.rotation_seconds),
    );
  useEffect(() => {
    if (
      total < 2 ||
      paused ||
      interaction ||
      video ||
      hidden ||
      editor ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const t = setTimeout(
      () => setIndex((i) => (i + 1) % total),
      seconds * 1000,
    );
    return () => clearTimeout(t);
  }, [index, total, seconds, paused, interaction, video, hidden, editor]);
  const go = (n) => setIndex((n + total) % total);
  const destination = () => {
    const href = slide?.destination || "/search";
    if (href.startsWith("/") && !href.startsWith("//")) navigate(href);
    else if (safeUrl(href))
      window.open(safeUrl(href), "_blank", "noopener,noreferrer");
  };
  return (
    <section
      className="hero"
      onMouseEnter={() => display.pause_on_interaction && setInteraction(true)}
      onMouseLeave={() => setInteraction(false)}
      onFocusCapture={() =>
        display.pause_on_interaction && setInteraction(true)
      }
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setInteraction(false);
      }}
      onTouchStart={(e) => {
        start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        if (display.pause_on_interaction) setInteraction(true);
      }}
      onTouchEnd={(e) => {
        if (start.current) {
          const dx = e.changedTouches[0].clientX - start.current.x,
            dy = e.changedTouches[0].clientY - start.current.y;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy))
            go(index + (dx < 0 ? 1 : -1));
        }
        start.current = null;
        setInteraction(false);
      }}
      aria-roledescription="carousel"
      aria-label="Featured marketplace stories"
    >
      <Photo
        key={index}
        className="hero-image"
        src={slide?.image || settings.hero_image}
        alt={slide?.title || "Marketplace promotion"}
      />
      <div className="hero-panel" key={`copy-${index}`}>
        <span className="eyebrow">
          {slide?.sponsored
            ? "SPONSORED · LOCAL SPOTLIGHT"
            : "YOUR LOCAL MARKETPLACE"}
        </span>
        <h1>{slide?.title || settings.hero_title}</h1>
        <p>{slide?.description || settings.hero_description}</p>
        <div className="button-row">
          {slide?.video_url || slide?.social_url ? (
            <button
              className="button primary"
              onClick={() => setVideo(slide.social_url || slide.video_url)}
            >
              Watch feature <Play size={17} />
            </button>
          ) : (
            <button className="button primary" onClick={destination}>
              {slide?.button || "Explore nearby"} <ArrowRight size={18} />
            </button>
          )}
          <Link className="button outline hero-post-ad" to="/sell">
            Post an ad
          </Link>
        </div>
        <small className="hero-caption">
          <MapPin size={14} /> From Manipur, with love.
        </small>
      </div>
      {(slide?.video_url || slide?.social_url) && (
        <button
          className="hero-play"
          type="button"
          aria-label="Play promotion"
          onClick={() => setVideo(slide.social_url || slide.video_url)}
        >
          <Play size={20} weight="fill" />
        </button>
      )}
      <div className="hero-controls">
        <div className="dots">
          {slides.map((x, i) => (
            <button
              key={x.id || i}
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === index}
              onClick={() => go(i)}
            />
          ))}
        </div>
        <div>
          <button
            type="button"
            aria-label={paused ? "Resume hero rotation" : "Pause hero rotation"}
            aria-pressed={paused}
            onClick={() => setPaused(!paused)}
          >
            {paused ? <Play size={18} /> : <Pause size={18} />}
          </button>
          <button aria-label="Previous promotion" onClick={() => go(index - 1)}>
            <CaretLeft size={20} />
          </button>
          <button aria-label="Next promotion" onClick={() => go(index + 1)}>
            <CaretRight size={20} />
          </button>
        </div>
      </div>
      {video && (
        <Modal
          title={slide?.title || "Promotion"}
          onClose={() => setVideo(null)}
        >
          <HeroVideo videos={[{ url: video, title: slide?.title }]} />
        </Modal>
      )}
    </section>
  );
}
export function Home() {
  const { fixtures, categories, dataReady, notice, settings } = useMarket();
  const [items, setItems] = useState([]),
    [shops, setShops] = useState([]),
    [campaigns, setCampaigns] = useState([]),
    [loading, setLoading] = useState(configured),
    [visibleCount, setVisibleCount] = useState(8),
    [hasMore, setHasMore] = useState(false),
    [moreBusy, setMoreBusy] = useState(false);
  useEffect(() => {
    if (fixtures) {
      setItems(fixtures.listings);
      setShops(fixtures.sellers);
    }
    if (configured)
      Promise.all([
        result(
          supabase
            .from("listings")
            .select("*,seller:sellers(*)")
            .eq("status", "published")
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .range(0, 23),
        ),
        result(
          supabase
            .from("sellers")
            .select("*")
            .eq("type", "shop")
            .eq("suspended", false)
            .limit(4),
        ),
      ])
        .then(([a, b]) => {
          setItems(a);
          setHasMore(a.length === 24);
          setShops(b);
        })
        .catch((e) => notice(e.message))
        .finally(() => setLoading(false));
  }, [fixtures]);
  const showMore = async () => {
    if (visibleCount < items.length) {
      setVisibleCount((n) => n + 8);
      return;
    }
    if (!hasMore || moreBusy || !configured) return;
    setMoreBusy(true);
    try {
      const next = await result(
        supabase
          .from("listings")
          .select("*,seller:sellers(*)")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .range(items.length, items.length + 23),
      );
      setItems((current) => [...current, ...next]);
      setHasMore(next.length === 24);
      setVisibleCount((n) => n + 8);
    } catch (e) {
      notice(e.message);
    } finally {
      setMoreBusy(false);
    }
  };
  useEffect(() => {
    if (!configured) return;
    const now = new Date().toISOString();
    result(
      supabase
        .from("campaigns")
        .select("*,seller:sellers(name,slug,location)")
        .eq("status", "approved")
        .eq("paid", true)
        .lte("starts_at", now)
        .gt("ends_at", now)
        .order("created_at", { ascending: false })
        .limit(24),
    )
      .then(setCampaigns)
      .catch(() => {});
  }, []);
  return (
    <div className="page home">
      <Hero featuredItem={items[0]} />
      <CategoryRail />
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">OO · ONLINE OFFER</span>
            <h2>Featured local offers</h2>
            <p>New things from people and businesses around Manipur.</p>
          </div>
          <Link to="/search">
            See all products <ArrowRight size={18} />
          </Link>
        </div>
        {loading || !dataReady ? (
          <p role="status">Loading local finds…</p>
        ) : items.length ? (
          <div className="product-grid">
            {items.slice(0, visibleCount).map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <Empty title="Your neighbourhood starts here">
            Be the first to share a listing with your neighbourhood.{" "}
            <Link to="/sell">Post an ad</Link>
          </Empty>
        )}
        {(visibleCount < items.length || hasMore) && (
          <button
            type="button"
            className="button outline"
            onClick={showMore}
            disabled={moreBusy}
          >
            {moreBusy ? "Loading listings…" : "Show more listings"}
          </button>
        )}
      </section>
      <section className="section oo-showcase">
        <div className="section-heading">
          <div>
            <span className="eyebrow">EXPLORE ONLINE OFFER</span>
            <h2>Find more around you</h2>
            <p>Explore the kinds of listings local people and businesses can share.</p>
          </div>
          <Link to="/categories">Browse all categories <ArrowRight size={18} /></Link>
        </div>
        <div className="oo-showcase-grid">
          {(Array.isArray(settings.showcase_ads) ? settings.showcase_ads : defaultShowcase).filter((ad) => ad.title && ad.image).map((ad) => (
            <Link className="oo-showcase-card" key={ad.id} to={ad.destination?.startsWith("/") ? ad.destination : "/search?category=" + encodeURIComponent(ad.category || "")}>
              <Photo src={ad.image} alt="" loading="lazy" />
              <span className="oo-showcase-copy"><strong>{ad.title}</strong><small>{ad.description}</small><span>Explore <ArrowRight size={15} /></span></span>
            </Link>
          ))}
        </div>
      </section>
      <FeaturedPromotions campaigns={campaigns} settings={settings} />
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE PEOPLE BEHIND THE PRODUCTS</span>
            <h2>Meet your local shops</h2>
          </div>
          <Link to="/shops">
            Explore all shops <ArrowRight size={18} />
          </Link>
        </div>
        <div className="shop-grid">
          {shops.map((s) => (
            <ShopCard key={s.id} seller={s} />
          ))}
        </div>
      </section>
      {fixtures && (
        <section className="template-invite">
          <div>
            <span className="eyebrow">ONE MARKETPLACE. YOUR OWN LOOK.</span>
            <h2>A storefront that fits what you sell.</h2>
            <p>
              Explore clothing, electronics, car, motorcycle and retail
              templates.
            </p>
          </div>
          <Link className="button primary" to="/templates">
            Explore shop templates <ArrowRight />
          </Link>
        </section>
      )}
      <section className="seller-invite">
        <Storefront size={54} weight="light" />
        <div>
          <span className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
          <h2>A little idea. Your very own shop.</h2>
          <p>
            Give your products a home online. Create your shop and post for free.
          </p>
        </div>
        <Link to="/sell" className="button primary">
          Post ad <ArrowRight size={18} />
        </Link>
      </section>
    </div>
  );
}
export function Search({ saved = false }) {
  const { path, fixtures, categories, session, navigate, notice } = useMarket();
  const params = new URLSearchParams(path.split("?")[1]);
  const q = params.get("q") || "",
    cat = params.get("category") || "",
    department = params.get("department") || "",
    sub = params.get("subcategory") || "",
    loc = params.get("location") || "",
    attribute = params.get("attribute") || "",
    attributeValue = params.get("value") || "";
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true),
    [sort, setSort] = useState("newest"),
    [condition, setCondition] = useState(""),
    [type, setType] = useState(""),
    [min, setMin] = useState(""),
    [max, setMax] = useState(""),
    [page, setPage] = useState(0),
    [more, setMore] = useState(false),
    [filters, setFilters] = useState(false);
  useEffect(
    () => setPage(0),
    [q, cat, department, sub, loc, sort, condition, type, min, max],
  );
  useEffect(() => {
    let live = true;
    async function run() {
      setLoading(true);
      try {
        let list = [];
        if (saved && !session) {
          list = [];
        } else if (fixtures) {
          list = saved
            ? []
            : fixtures.listings.filter(
                (x) =>
                  (!q || searchable(x).includes(q.toLowerCase())) &&
                  (!cat || x.category_id === cat) &&
                  (department !== "construction" ||
                    constructionCategories(categories).some(
                      (c) => c.id === x.category_id,
                    )) &&
                  (!attribute ||
                    !attributeValue ||
                    x.attributes?.[attribute] === attributeValue) &&
                  (department !== "motors" ||
                    motorCategories.includes(x.category_id)) &&
                  (!sub || x.subcategory_id === sub) &&
                  (!loc ||
                    x.location.toLowerCase().includes(loc.toLowerCase())) &&
                  (!condition || x.condition === condition) &&
                  (!type || x.seller.type === type) &&
                  (min === "" || x.price >= Number(min)) &&
                  (max === "" || x.price <= Number(max)),
              );
          if (sort === "low") list.sort((a, b) => a.price - b.price);
          if (sort === "high") list.sort((a, b) => b.price - a.price);
        } else if (configured) {
          let query = supabase
            .rpc("search_listings", { p_query: q })
            .select("*,seller:sellers!inner(*)");
          if (cat) query = query.eq("category_id", cat);
          else if (department === "construction") {
            const ids = constructionCategories(categories).map((c) => c.id);
            query = query.in(
              "category_id",
              ids.length ? ids : ["construction"],
            );
          }
          if (department === "motors")
            query = query.in("category_id", motorCategories);
          if (attribute && attributeValue)
            query = query.contains("attributes", {
              [attribute]: attributeValue,
            });
          if (sub) query = query.eq("subcategory_id", sub);
          if (loc)
            query = query.ilike(
              "location",
              "%" + loc.replace(/[%_]/g, "") + "%",
            );
          if (condition) query = query.eq("condition", condition);
          if (type) query = query.eq("seller.type", type);
          if (min !== "") query = query.gte("price", Number(min));
          if (max !== "") query = query.lte("price", Number(max));
          if (saved) {
            const rows = await result(
              supabase
                .from("saved_listings")
                .select("listing_id")
                .eq("user_id", session.user.id),
            );
            query = query.in(
              "id",
              rows.map((x) => x.listing_id),
            );
          }
          query = query
            .order(sort === "newest" ? "created_at" : "price", {
              ascending: sort === "low",
            })
            .order("id")
            .range(page * 24, page * 24 + 24);
          list = await result(query);
        }
        if (live) {
          setMore(list.length > 24);
          setItems(list.slice(0, 24));
        }
      } catch (e) {
        if (live) notice(e.message);
      } finally {
        if (live) setLoading(false);
      }
    }
    run();
    return () => {
      live = false;
    };
  }, [
    path,
    fixtures,
    categories,
    sort,
    condition,
    type,
    min,
    max,
    page,
    session?.user?.id,
    saved,
  ]);
  return (
    <div className="page">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        {saved ? "Saved items" : "Explore the marketplace"}
      </div>
      <div className="section-heading">
        <div>
          <span className="eyebrow">FIND YOUR NEXT GOOD THING</span>
          <h1>
            {saved
              ? "Your saved finds"
              : q
                ? `Results for “${q}”`
                : department === "construction" && !cat
                  ? "Construction"
                  : cat
                    ? subcategoryName(categories, cat, sub) ||
                      categoryName(categories, cat)
                    : "Explore the marketplace"}
          </h1>
          <p>Listings from people and businesses across Manipur.</p>
          {attribute && attributeValue && (
            <p>
              Filter: {attribute} — {attributeValue}{" "}
              <Link
                to={
                  "/search?" +
                  new URLSearchParams({
                    category: cat,
                    q,
                    location: loc,
                    subcategory: sub,
                  })
                }
              >
                Clear
              </Link>
            </p>
          )}
        </div>
        <button
          className="button outline filter-toggle"
          onClick={() => setFilters(!filters)}
        >
          <SlidersHorizontal /> Filters
        </button>
      </div>
      <div className="search-layout">
        <aside className={"filters " + (filters ? "show" : "")}>
          <h3>
            <SlidersHorizontal size={20} /> Refine your search
          </h3>
          <Field label="Category">
            <select
              value={cat}
              onChange={(e) =>
                navigate(
                  "/search?" +
                    new URLSearchParams({
                      q,
                      category: e.target.value,
                      department: e.target.value ? "" : department,
                      location: loc,
                    }),
                )
              }
            >
              <option value="">
                {department === "construction"
                  ? "All construction"
                  : "All categories"}
              </option>
              <CategoryOptions categories={categories} />
            </select>
          </Field>
          {cat && (
            <Field label="Subcategory">
              <select
                value={sub}
                onChange={(e) =>
                  navigate(
                    "/search?" +
                      new URLSearchParams({
                        q,
                        category: cat,
                        subcategory: e.target.value,
                        location: loc,
                      }),
                  )
                }
              >
                <option value="">All subcategories</option>
                {subcategoriesFor(categories, cat).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {!isClassified(cat) && (
            <Field label="Condition">
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              >
                <option value="">Any condition</option>
                {["New", "Used", "Refurbished"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Posted by">
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Everyone</option>
              <option value="shop">Shops</option>
              <option value="individual">Individuals</option>
            </select>
          </Field>
          <div className="form-grid">
            <Field
              label="Min ₹"
              type="number"
              min="0"
              value={min}
              onChange={(e) => setMin(e.target.value)}
            />
            <Field
              label="Max ₹"
              type="number"
              min="0"
              value={max}
              onChange={(e) => setMax(e.target.value)}
            />
          </div>
          <Field label="Location">
            <select
              value={loc}
              onChange={(e) =>
                navigate(
                  "/search?" +
                    new URLSearchParams({
                      q,
                      category: cat,
                      location: e.target.value,
                    }),
                )
              }
            >
              <option value="">All Manipur</option>
              {[
                "Imphal",
                "Thoubal",
                "Bishnupur",
                "Ukhrul",
                "Churachandpur",
                "Senapati",
                "Kakching",
              ].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
          <button
            className="text-button"
            onClick={() => {
              setCondition("");
              setType("");
              setMin("");
              setMax("");
              navigate("/search");
            }}
          >
            Clear all filters
          </button>
        </aside>
        <section>
          <div className="results-bar">
            <span>
              {loading
                ? "Finding local products…"
                : `${items.length}${more ? "+" : ""} products on this page`}
            </span>
            <select
              aria-label="Sort products"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
            </select>
          </div>
          {items.length ? (
            <div className="product-grid results-grid">
              {items.map((i) => (
                <ProductCard key={i.id} item={i} />
              ))}
            </div>
          ) : (
            !loading && (
              <Empty
                title={
                  saved && !session
                    ? "Sign in to see your saved finds"
                    : "No products found"
                }
              >
                {saved && !session ? (
                  <Link to="/login">Sign in</Link>
                ) : (
                  "Try a different keyword or clear a filter."
                )}
              </Empty>
            )
          )}
          <div className="pagination">
            <button disabled={page === 0} onClick={() => setPage(page - 1)}>
              <ArrowLeft /> Previous
            </button>
            <span>Page {page + 1}</span>
            <button disabled={!more} onClick={() => setPage(page + 1)}>
              Next <ArrowRight />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
export function Shops() {
  const { fixtures, notice } = useMarket();
  const [shops, setShops] = useState([]),
    [q, setQ] = useState(""),
    [page, setPage] = useState(0),
    [more, setMore] = useState(false);
  useEffect(() => {
    if (fixtures)
      setShops(
        fixtures.sellers.filter((s) =>
          s.name.toLowerCase().includes(q.toLowerCase()),
        ),
      );
    else if (configured) {
      let query = supabase
        .from("sellers")
        .select("*")
        .eq("suspended", false)
        .ilike("name", "%" + q.replace(/[%_]/g, "") + "%")
        .order("created_at", { ascending: false })
        .range(page * 24, page * 24 + 24);
      result(query)
        .then((s) => {
          setMore(s.length > 24);
          setShops(s.slice(0, 24));
        })
        .catch((e) => notice(e.message));
    }
  }, [fixtures, q, page]);
  return (
    <div className="page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">OUR PEOPLE. THEIR PASSION.</span>
          <h1>Meet your local sellers</h1>
          <p>
            Independent shops and everyday people. All in one neighbourhood.
          </p>
        </div>
      </div>
      <Field
        label="Find a shop or seller"
        placeholder="Search by name"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPage(0);
        }}
      />
      <div className="shop-grid shop-directory">
        {shops.map((s) => (
          <ShopCard key={s.id} seller={s} />
        ))}
      </div>
      {!shops.length && (
        <Empty title="No sellers found">Try a different name.</Empty>
      )}
      <div className="pagination">
        <button disabled={!page} onClick={() => setPage(page - 1)}>
          Previous
        </button>
        <span>Page {page + 1}</span>
        <button disabled={!more} onClick={() => setPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
export function SellerPage({ slug }) {
  const { fixtures, notice, categories } = useMarket();
  const [shopCategory, setShopCategory] = useState(""),
    [shopQuery, setShopQuery] = useState("");
  const [seller, setSeller] = useState(null),
    [sellerLoading, setSellerLoading] = useState(true),
    [sellerError, setSellerError] = useState(""),
    [sellerAttempt, setSellerAttempt] = useState(0),
    [items, setItems] = useState([]),
    [collections, setCollections] = useState([]),
    [collection, setCollection] = useState(""),
    [tab, setTab] = useState("products"),
    [page, setPage] = useState(0),
    [more, setMore] = useState(false);
  useEffect(() => {
    let live = true;
    const routeKey = sellerRouteKey(slug);
    async function run() {
      setSellerLoading(true);
      setSellerError("");
      try {
        let s = fixtures
          ? fixtures.sellers.find(
              (seller) =>
                seller.slug?.toLowerCase() === routeKey.toLowerCase() ||
                seller.id?.toLowerCase() === routeKey.toLowerCase(),
            )
          : null;
        if (!fixtures && configured) {
          s = await result(
            supabase
              .from("sellers")
              .select("*")
              .eq("slug", routeKey)
              .eq("suspended", false)
              .maybeSingle(),
          );
          // Older seller links used the seller UUID in place of a slug.
          if (!s && isSellerId(routeKey)) {
            s = await result(
              supabase
                .from("sellers")
                .select("*")
                .eq("id", routeKey)
                .eq("suspended", false)
                .maybeSingle(),
            );
          }
        }
        if (!live) return;
        setSeller(s);
        if (s) {
          let query = configured
            ? supabase
                .from("listings")
                .select("*,seller:sellers(*)")
                .eq("seller_id", s.id)
                .eq("status", "published")
            : null;
          if (collection && query)
            query = query.eq("collection_id", collection);
          if (shopCategory && query)
            query = query.eq("category_id", shopCategory);
          if (shopQuery.trim() && query)
            query = query.ilike(
              "title",
              "%" + shopQuery.trim().replace(/[%_]/g, "") + "%",
            );
          let rows = fixtures
            ? fixtures.listings.filter(
                (i) =>
                  i.seller_id === s.id &&
                  (!collection || i.collection_id === collection) &&
                  (!shopCategory || i.category_id === shopCategory) &&
                  (!shopQuery.trim() ||
                    i.title
                      .toLowerCase()
                      .includes(shopQuery.toLowerCase().trim())),
              )
            : query
              ? await result(
                  query
                    .order("created_at", { ascending: false })
                    .range(page * 24, page * 24 + 24),
                )
              : [];
          if (live) {
            setMore(rows.length > 24);
            setItems(rows.slice(0, 24));
          }
          if (fixtures) {
            setCollections(
              fixtures.collections.filter((c) => c.seller_id === s.id),
            );
          } else if (configured) {
            const c = await result(
              supabase
                .from("collections")
                .select("*")
                .eq("seller_id", s.id)
                .order("position"),
            );
            if (live) setCollections(c);
          }
        } else {
          setItems([]);
          setCollections([]);
          setSellerError(
            configured
              ? "not-found"
              : "Seller pages are unavailable until the marketplace database is connected.",
          );
        }
      } catch (e) {
        if (live) {
          setSellerError(e.message);
          notice(e.message);
        }
      } finally {
        if (live) setSellerLoading(false);
      }
    }
    run();
    return () => {
      live = false;
    };
  }, [fixtures, slug, collection, page, shopCategory, shopQuery, sellerAttempt]);
  useEffect(() => {
    if (seller) document.title = `${seller.name} | OnlineKeithel`;
  }, [seller]);
  if (!seller && sellerLoading)
    return (
      <div className="page">
        <p role="status">Loading seller page…</p>
      </div>
    );
  if (!seller)
    return (
      <div className="page">
        <Empty title={sellerError === "not-found" ? "Seller page not found" : "Couldn’t load seller page"}>
          {sellerError === "not-found"
            ? "This seller page is not available. Check the link or return to the marketplace."
            : sellerError || "Check your connection, then try again."}
          {sellerError !== "not-found" && (
            <button
              className="button outline"
              type="button"
              onClick={() => setSellerAttempt((attempt) => attempt + 1)}
            >
              Try again
            </button>
          )}
          <Link to="/">Return to the marketplace</Link>
        </Empty>
      </div>
    );
  const display = storefrontSettings(seller);
  return (
    <div
      className={"page storefront theme-" + seller.theme}
      style={{
        "--shop-accent": storefrontColors[display.color].value,
        "--shop-font": storefrontFonts[display.font].value,
      }}
    >
      <div className="shop-cover shop-hero">
        <Photo src={seller.cover} alt={seller.name} />
        <div className="shop-hero-content">
          <span>{display.tagline}</span>
          <h1>{display.headline}</h1>
          <a href="#shop-products" className="button primary">
            Explore products <ArrowRight size={17} />
          </a>
        </div>
      </div>
      <div className="store-identity">
        <span className="store-logo">
          {seller.logo ? (
            <Photo src={seller.logo} alt="Shop logo" />
          ) : (
            <Storefront size={40} />
          )}
        </span>
        <div>
          <span className="eyebrow">
            {seller.type === "shop"
              ? "INDEPENDENT LOCAL SHOP"
              : "INDIVIDUAL SELLER"}
          </span>
          <h1>{seller.name}</h1>
          <p>
            <MapPin size={16} /> {seller.location}
          </p>
        </div>
        <SocialLinks values={seller.socials} />
        {seller.whatsapp_enabled && whatsappUrl(
          seller.whatsapp,
          "Hello, I found your shop on OnlineKeithel.",
        ) && (
          <a
            className="button primary"
            href={whatsappUrl(
              seller.whatsapp,
              "Hello, I found your shop on OnlineKeithel.",
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            <WhatsappLogo /> WhatsApp shop
          </a>
        )}
      </div>
      {display.sections.map((section) => (
        <React.Fragment key={section}>
          {section === "about" && display.showAbout && display.introduction && (
            <section className="store-template-intro">
              <span className="eyebrow">
                {templates[seller.theme]?.name || "Neighbourhood"} ·{" "}
                {templates[seller.theme]?.category}
              </span>
              <h2>Welcome to {seller.name}</h2>
              <p>{display.introduction}</p>
              {seller.theme === "electronics" && (
                <div className="template-features">
                  <span>Device specifications</span>
                  <span>Phones & accessories</span>
                  <span>Compare your options</span>
                </div>
              )}
              {["vehicles", "motorcycles"].includes(seller.theme) && (
                <div className="template-features">
                  <span>Year & mileage</span>
                  <span>
                    {seller.theme === "motorcycles"
                      ? "Engine capacity"
                      : "Fuel & model"}
                  </span>
                  <span>Enquire before viewing</span>
                </div>
              )}
            </section>
          )}
          {section === "gallery" &&
            display.showGallery &&
            display.gallery.length > 0 && (
              <section className="shop-gallery">
                <div>
                  <span className="eyebrow">INSIDE OUR SHOP</span>
                  <h2>Photo gallery</h2>
                </div>
                <div className="shop-gallery-grid">
                  {display.gallery.map((photo, index) => (
                    <Photo
                      key={photo + index}
                      src={photo}
                      alt={`${seller.name} gallery photo ${index + 1}`}
                      loading="lazy"
                    />
                  ))}
                </div>
              </section>
            )}
          {section === "video" && display.showVideo && display.videoUrl && (
            <section className="shop-featured-video">
              <div>
                <span className="eyebrow">A CLOSER LOOK</span>
                <h2>From {seller.name}</h2>
                <p>Get to know the people and products behind this shop.</p>
              </div>
              <Video url={display.videoUrl} />
            </section>
          )}
        </React.Fragment>
      ))}
      <div className="tabs" id="shop-products">
        {[
          "products",
          ...(display.showAbout ? ["about"] : []),
          ...(display.showVideo ? ["videos"] : []),
        ].map((t) => (
          <button
            key={t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "products" ? (
        <>
          <div className="form-grid shop-product-filters">
            <Field
              label="Search this shop"
              type="search"
              value={shopQuery}
              onChange={(e) => {
                setShopQuery(e.target.value);
                setPage(0);
              }}
            />
            <Field label="Shop category">
              <select
                value={shopCategory}
                onChange={(e) => {
                  setShopCategory(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">All categories</option>
                <CategoryOptions categories={categories} />
              </select>
            </Field>
          </div>
          <div className="chips">
            <button
              className={!collection ? "active" : ""}
              onClick={() => {
                setCollection("");
                setPage(0);
              }}
            >
              All products
            </button>
            {collections.map((c) => (
              <button
                key={c.id}
                className={collection === c.id ? "active" : ""}
                onClick={() => {
                  setCollection(c.id);
                  setPage(0);
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="product-grid">
            {items.map((i) => (
              <ProductCard key={i.id} item={i} />
            ))}
          </div>
          {!items.length && (
            <Empty title="More good things are coming">
              This collection has no published products yet.
            </Empty>
          )}
          <div className="pagination">
            <button disabled={!page} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <span>Page {page + 1}</span>
            <button disabled={!more} onClick={() => setPage(page + 1)}>
              Next
            </button>
          </div>
        </>
      ) : tab === "about" ? (
        <div className="prose">
          <h2>A little about {seller.name}</h2>
          <p>{seller.description}</p>
          <SocialLinks values={seller.socials} />
        </div>
      ) : (
        <div className="prose">
          <h2>From the shop</h2>
          {Object.values(seller.socials || {})
            .filter(
              (u) =>
                typeof u === "string" &&
                (u.includes("youtube") ||
                  u.includes("reel") ||
                  u.includes("youtu.be")),
            )
            .map((u) => (
              <Video key={u} url={u} />
            ))}
          <p>Explore the seller’s social pages for more updates.</p>
          <SocialLinks values={seller.socials} />
        </div>
      )}
    </div>
  );
}
export function ProductPage({ id }) {
  const { fixtures, notice, session, path, categories } = useMarket();
  const [item, setItem] = useState(null),
    [loading, setLoading] = useState(true),
    [image, setImage] = useState(0),
    [hoverBack, setHoverBack] = useState(false),
    [social, setSocial] = useState(false),
    [report, setReport] = useState(false),
    [reason, setReason] = useState("");
  useEffect(() => {
    if (fixtures) {
      setItem(fixtures.listings.find((i) => i.id === id));
      setLoading(false);
    } else if (configured)
      result(
        supabase
          .from("listings")
          .select("*,seller:sellers(*)")
          .eq("id", id)
          .maybeSingle(),
      )
        .then(setItem)
        .catch((e) => notice(e.message))
        .finally(() => setLoading(false));
    else setLoading(false);
  }, [id, fixtures]);
  if (!item)
    return (
      <div className="page">
        <Empty title={loading ? "Loading product…" : "Listing unavailable"}>
          It may have been sold or removed.
        </Empty>
      </div>
    );
  return (
    <div className="page">
      <div className="breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to={"/search?category=" + item.category_id}>
          {categoryName(categories, item.category_id)}
        </Link>
        <span>/</span>
        {item.title}
      </div>
      <div className="product-detail">
        <section>
          <div
            className={
              "detail-photo " +
              (item.category_id === "fashion" && image === 0 && item.images?.[1]
                ? "photo-swap"
                : "")
            }
            tabIndex={0}
            data-hovered={hoverBack}
            onPointerEnter={(e) =>
              setHoverBack(e.pointerType === "mouse" || e.pointerType === "pen")
            }
            onPointerLeave={() => setHoverBack(false)}
          >
            <Photo
              src={item.images?.[image]}
              alt={item.title + ` · photo ${image + 1}`}
            />
            {item.category_id === "fashion" &&
              image === 0 &&
              item.images?.[1] && (
                <Photo
                  className="back-photo"
                  src={item.images[1]}
                  alt={item.title + " · back"}
                />
              )}
          </div>
          <div className="thumbnails">
            {item.images?.map((p, i) => (
              <button
                key={p + i}
                onClick={() => setImage(i)}
                aria-label={`View photo ${i + 1}`}
                className={image === i ? "active" : ""}
              >
                <Photo src={p} alt="" />
                <span>
                  {item.category_id === "fashion"
                    ? ["Front", "Back", "Left", "Right"][i] || "Detail"
                    : `Photo ${i + 1}`}
                </span>
              </button>
            ))}
          </div>
          <ProductVideos
            videos={[
              ...(item.videos || []),
              ...Object.entries(item.socials || {})
                .filter(
                  ([, url]) =>
                    url && !(item.videos || []).some((v) => v.url === url),
                )
                .map(([title, url]) => ({ title, url })),
            ]}
          />
        </section>
        <section className="detail-info">
          <span className="eyebrow">
            {item.condition} · {categoryName(categories, item.category_id)}{" "}
            {item.subcategory_id &&
              " · " +
                subcategoryName(
                  categories,
                  item.category_id,
                  item.subcategory_id,
                )}
          </span>
          <h1>{item.title}</h1>
          <strong className="detail-price">{listingPrice(item, money)}</strong>
          <p className="muted">
            <MapPin size={17} /> {item.location}
          </p>
          <p>{item.description}</p>
          <dl className="attributes">
            {Object.entries(item.attributes || {})
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{String(v)}</dd>
                </div>
              ))}
          </dl>
          <div className="detail-seller">
            <Storefront size={30} />
            <div>
              <Link to={shopPath(item.seller)}>
                <strong>{item.seller?.name}</strong>
              </Link>
              <small>
                {item.seller?.type === "shop"
                  ? "Local shop"
                  : "Individual seller"}{" "}
                · View all products
              </small>
            </div>
            <ArrowRight />
          </div>
          {isClassified(item.category_id) ? (
            <ClassifiedContact item={item} />
          ) : (
            <PurchasePanel item={item} />
          )}
          <div className="button-row">
            <button className="button outline" onClick={() => setSocial(true)}>
              <LinkSimple /> Social & video
            </button>
            <button
              className="button outline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    location.origin + "/listing/" + item.id,
                  );
                  notice("Product link copied");
                } catch {
                  notice("Copy the product URL from your browser address bar.");
                }
              }}
            >
              <ShareNetwork /> Share
            </button>
          </div>
          <small className="contact-note">
            You arrange payment and collection directly with the seller.
          </small>
          <button className="text-button muted" onClick={() => setReport(true)}>
            <Flag size={16} /> Report this listing
          </button>
        </section>
      </div>
      <ListingQuestions item={item} />
      {social && (
        <Modal title="Social & video" side onClose={() => setSocial(false)}>
          <SocialLinks values={item.seller?.socials} />
          {Object.entries(item.socials || {}).map(([k, u]) => (
            <div key={k}>
              <h3>{k}</h3>
              <Video url={u} />
            </div>
          ))}
          {!Object.keys(item.socials || {}).length && (
            <p>No product-specific social links have been added.</p>
          )}
        </Modal>
      )}
      {report && (
        <Modal title="Report listing" onClose={() => setReport(false)}>
          {session ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await result(
                    supabase.from("reports").insert({
                      listing_id: id,
                      user_id: session.user.id,
                      reason,
                    }),
                  );
                  setReport(false);
                  notice("Report submitted for review");
                } catch (e) {
                  notice(e.message);
                }
              }}
            >
              <Field label="What should we review?">
                <textarea
                  required
                  minLength={5}
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </Field>
              <button className="button primary">Submit report</button>
            </form>
          ) : (
            <p>
              <Link to="/login">Sign in</Link> to report this listing.
            </p>
          )}
        </Modal>
      )}
    </div>
  );
}

function ListingQuestions({ item }) {
  const { session, navigate, notice } = useMarket();
  const [questions, setQuestions] = useState([]);
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState({});
  const [reporting, setReporting] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const seller = item.seller?.user_id === session?.user?.id;

  const load = async () => {
    if (!configured || item.sample) return;
    try {
      setQuestions(
        await result(
          supabase
            .from("listing_questions")
            .select("*")
            .eq("listing_id", item.id)
            .order("created_at", { ascending: true }),
        ),
      );
    } catch (e) {
      notice(e.message);
    }
  };
  useEffect(() => {
    load();
    if (!configured || item.sample) return;
    const channel = supabase
      .channel("listing-questions-" + item.id)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "listing_questions",
          filter: "listing_id=eq." + item.id,
        },
        load,
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [item.id, item.sample, session?.user?.id]);

  async function ask(e) {
    e.preventDefault();
    const text = question.trim();
    if (!text || !session || busy) return;
    setBusy(true);
    try {
      await result(
        supabase.from("listing_questions").insert({
          listing_id: item.id,
          author_id: session.user.id,
          body: text,
        }),
      );
      setQuestion("");
      await load();
      notice("Your question is now visible on this listing.");
    } catch (e) {
      notice(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function startPrivateMessage() {
    if (!session) {
      navigate("/login?returnTo=" + encodeURIComponent("/listing/" + item.id));
      return;
    }
    if (seller) {
      navigate("/messages");
      return;
    }
    setBusy(true);
    try {
      const existing = await result(
        supabase
          .from("direct_conversations")
          .select("id")
          .eq("listing_id", item.id)
          .eq("buyer_id", session.user.id)
          .maybeSingle(),
      );
      let conversation = existing;
      if (!conversation)
        conversation = await result(
          supabase
            .from("direct_conversations")
            .insert({ listing_id: item.id, buyer_id: session.user.id })
            .select("id")
            .single(),
        );
      navigate("/messages?conversation=" + conversation.id);
    } catch (e) {
      notice(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveReply(questionId) {
    try {
      await result(
        supabase
          .from("listing_questions")
          .update({ seller_reply: reply[questionId]?.trim() || null })
          .eq("id", questionId),
      );
      setReply((old) => ({ ...old, [questionId]: undefined }));
      await load();
      notice("Your public reply has been posted.");
    } catch (e) {
      notice(e.message);
    }
  }

  async function reportQuestion(e) {
    e.preventDefault();
    try {
      await result(
        supabase.rpc("report_listing_message", {
          p_question_id: reporting,
          p_message_id: null,
          p_reason: reason.trim(),
        }),
      );
      setReporting("");
      setReason("");
      notice("Message sent to the admin team for review.");
    } catch (e) {
      notice(e.message);
    }
  }

  return (
    <section className="listing-questions" aria-labelledby="questions-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">BUYER & SELLER MESSAGES</span>
          <h2 id="questions-title">Questions about this listing</h2>
          <p>Questions and seller replies are visible to everyone.</p>
        </div>
        <div className="button-row">
          <button
            className="button primary"
            disabled={item.sample || !configured}
            onClick={() => {
              if (!session) {
                navigate("/login?returnTo=" + encodeURIComponent("/listing/" + item.id));
                return;
              }
              document.querySelector(".question-compose textarea")?.focus();
            }}
          >
            Ask publicly
          </button>
          <button
            className="button outline"
            disabled={busy || item.sample || !configured}
            onClick={startPrivateMessage}
          >
            <ChatCircleDots size={19} /> Message privately
          </button>
        </div>
      </div>
      {item.sample ? (
        <p className="notice-box">Public questions and private messaging are available on live listings.</p>
      ) : !configured ? (
        <p className="notice-box">Connect the marketplace Supabase project to post or read live questions.</p>
      ) : (
        <>
          {session ? (
            <form className="question-compose" onSubmit={ask}>
              <textarea
                aria-label="Ask the seller a public question"
                placeholder="Ask the seller a question…"
                rows={3}
                minLength={1}
                maxLength={2000}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
              <button
                className="button primary"
                disabled={!question.trim() || busy}
              >
                <PaperPlaneRight size={18} /> Post question
              </button>
            </form>
          ) : (
            <p className="notice-box">
              <Link to={"/login?returnTo=" + encodeURIComponent("/listing/" + item.id)}>
                Sign in
              </Link>{" "}
              to ask a public question or message this seller.
            </p>
          )}
          <div className="question-list">
            {!questions.length ? (
              <p className="muted">No questions yet. Start the conversation.</p>
            ) : (
              questions.map((entry) => (
                <article className="listing-question" key={entry.id}>
                  <div className="question-heading">
                    <strong>Marketplace member</strong>
                    <small>{new Date(entry.created_at).toLocaleString()}</small>
                  </div>
                  <p>{entry.body}</p>
                  {entry.seller_reply && (
                    <div className="seller-answer">
                      <strong>{item.seller?.name || "Seller"} replied</strong>
                      <p>{entry.seller_reply}</p>
                      {entry.seller_replied_at && (
                        <small>{new Date(entry.seller_replied_at).toLocaleString()}</small>
                      )}
                    </div>
                  )}
                  {seller && (
                    <div className="question-actions">
                      {reporting === entry.id ? (
                        <form className="message-report-form" onSubmit={reportQuestion}>
                          <Field label="Why should the admin review this message?">
                            <textarea
                              required
                              minLength={5}
                              maxLength={500}
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                            />
                          </Field>
                          <div className="button-row">
                            <button className="button primary">Send report</button>
                            <button type="button" className="button outline" onClick={() => setReporting("")}>Cancel</button>
                          </div>
                        </form>
                      ) : (
                        <>
                          {reply[entry.id] !== undefined ? (
                            <div className="reply-editor">
                              <textarea
                                aria-label="Write a public seller reply"
                                rows={2}
                                maxLength={2000}
                                value={reply[entry.id]}
                                onChange={(e) => setReply((old) => ({ ...old, [entry.id]: e.target.value }))}
                              />
                              <button className="button primary" disabled={!reply[entry.id]?.trim()} onClick={() => saveReply(entry.id)}>Post reply</button>
                            </div>
                          ) : (
                            <button
                              className="text-button muted"
                              onClick={() => setReply((old) => ({ ...old, [entry.id]: entry.seller_reply || "" }))}
                            >
                              {entry.seller_reply ? "Edit your reply" : "Reply publicly"}
                            </button>
                          )}
                          <button className="text-button muted" onClick={() => setReporting(entry.id)}>
                            <Flag size={15} /> Report to admin
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}
