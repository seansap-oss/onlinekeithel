import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CaretDown,
  Car,
  DeviceMobile,
  Heart,
  House,
  ShieldCheck,
  SignOut,
  SquaresFour,
  User,
  WarningCircle,
  ChatCircleDots,
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
  const [openSection, setOpenSection] = useState("messages");
  const [conversations, setConversations] = useState([]);
  const [conversationCount, setConversationCount] = useState(0);

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

  useEffect(() => {
    let current = true;
    async function loadConversations() {
      if (!configured) return;
      try {
        const rows = await result(
          supabase
            .from("direct_conversations")
            .select("id,buyer_id,created_at,listing:listings(id,title,seller:sellers(id,name,user_id))")
            .order("created_at", { ascending: false }),
        );
        const recent = rows.slice(0, 5);
        const ids = recent.map((row) => row.id);
        const peopleIds = [...new Set(recent.flatMap((row) => [row.buyer_id, row.listing?.seller?.user_id]).filter(Boolean))];
        const [messages, people] = await Promise.all([
          ids.length
            ? result(supabase.from("direct_messages").select("conversation_id,body,sender_id,created_at").in("conversation_id", ids).order("created_at", { ascending: false }))
            : Promise.resolve([]),
          peopleIds.length
            ? result(supabase.from("member_profiles").select("user_id,username").in("user_id", peopleIds))
            : Promise.resolve([]),
        ]);
        if (!current) return;
        const latest = new Map();
        for (const message of messages) if (!latest.has(message.conversation_id)) latest.set(message.conversation_id, message);
        const usernames = Object.fromEntries(people.map((person) => [person.user_id, person.username]));
        setConversationCount(rows.length);
        setConversations(recent.map((conversation) => {
          const mine = conversation.buyer_id === session.user.id;
          const otherId = mine ? conversation.listing?.seller?.user_id : conversation.buyer_id;
          return {
            ...conversation,
            partner: usernames[otherId] || (mine ? conversation.listing?.seller?.name : "Marketplace member") || "Marketplace member",
            listingTitle: conversation.listing?.title || "Marketplace listing",
            latest: latest.get(conversation.id),
          };
        }));
      } catch (e) {
        if (current) setError((old) => old || e.message);
      }
    }
    loadConversations();
    return () => { current = false; };
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
    session?.user?.user_metadata?.username ||
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
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) notice(signOutError.message);
      else navigate("/");
    } catch (e) {
      notice(e.message);
    }
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
      </section>

      <section className="member-account-sections" aria-label="Account sections">
        <div className="member-accordion">
          <Link to="/dashboard" className="member-accordion-trigger">
            <User size={23} /> <span>My seller profile</span><ArrowRight size={19} />
          </Link>
        </div>

        <section className={"member-accordion " + (openSection === "messages" ? "is-open" : "")}>
          <button className="member-accordion-trigger" aria-expanded={openSection === "messages"} onClick={() => setOpenSection(openSection === "messages" ? "" : "messages")}>
            <ChatCircleDots size={24} /> <span>Messages</span>{conversationCount > 0 && <b className="member-count">{conversationCount}</b>}<CaretDown className="member-accordion-caret" size={19} />
          </button>
          {openSection === "messages" && <div className="member-message-preview">
            {conversations.length ? conversations.map((conversation) => (
              <Link className="member-message-row" key={conversation.id} to={`/messages?conversation=${encodeURIComponent(conversation.id)}`}>
                <span className="member-message-avatar" aria-hidden="true">{conversation.partner.slice(0, 1).toUpperCase()}</span>
                <span className="member-message-copy"><strong>{conversation.partner}</strong><small>{conversation.listingTitle}</small><span>{conversation.latest?.body || "Open conversation"}</span></span>
                <span className="member-message-meta">{conversation.latest ? new Date(conversation.latest.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : ""}<ArrowRight size={17} /></span>
              </Link>
            )) : <div className="member-message-empty">No conversations yet. Messages about listings will appear here.</div>}
            {conversationCount > conversations.length && <Link className="member-all-messages" to="/messages">View all messages <ArrowRight size={17} /></Link>}
          </div>}
        </section>

        <section className={"member-accordion " + (openSection === "saved" ? "is-open" : "")}>
          <button className="member-accordion-trigger" aria-expanded={openSection === "saved"} onClick={() => setOpenSection(openSection === "saved" ? "" : "saved")}>
            <Heart size={23} /> <span>Saved items</span>{items.length > 0 && <b className="member-count subdued">{items.length}</b>}<CaretDown className="member-accordion-caret" size={19} />
          </button>
          {openSection === "saved" && <div className="member-saved-embedded">
            {error && <div className="notice-box" role="alert"><WarningCircle /> {error}</div>}
            {loading ? <div className="member-saved-state" role="status">Loading your saved finds…</div> : visibleGroups.length ? <div className="saved-category-groups">
              {visibleGroups.map(({ category, items: categoryItems }) => {
                const Icon = categoryIcon(category);
                return <section className="saved-category-group" key={category.id}>
                  <div className="saved-category-heading"><span className="saved-category-icon"><Icon size={23} /></span><h3>{category.name}</h3><span className="muted">{categoryItems.length} saved</span>{activeCategory === "all" && <button onClick={() => setActiveCategory(category.id)}>View all <ArrowRight size={16} /></button>}</div>
                  <div className="member-listing-grid">{categoryItems.map((item) => <article className="member-listing" key={item.id}>
                    <Link to={`/listing/${item.id}`} className="member-listing-photo"><Photo src={item.images?.[0]} alt={item.title} loading="lazy" /></Link>
                    <button className="member-remove-save" aria-label={`Remove ${item.title} from saved items`} onClick={() => removeSaved(item.id)}><Heart size={19} weight="fill" /></button>
                    <div className="member-listing-info"><strong>{money(item.price)}</strong><Link to={`/listing/${item.id}`}>{item.title}</Link><span>{item.location}</span></div>
                  </article>)}</div>
                </section>;
              })}
            </div> : <Empty title="Your saved list is ready">Tap the heart on any listing to keep it here.</Empty>}
            <Link className="member-all-messages" to="/saved">Open saved items <ArrowRight size={17} /></Link>
          </div>}
        </section>

        <section className={"member-accordion " + (openSection === "settings" ? "is-open" : "")}>
          <button className="member-accordion-trigger" aria-expanded={openSection === "settings"} onClick={() => setOpenSection(openSection === "settings" ? "" : "settings")}>
            <ShieldCheck size={23} /> <span>Account settings</span><CaretDown className="member-accordion-caret" size={19} />
          </button>
          {openSection === "settings" && <div className="member-settings-panel">
            <button className="member-action-link" onClick={sendPasswordLink} disabled={busy}><ShieldCheck size={20} /> {busy ? "Sending link…" : "Set or reset password"}</button>
            <button className="member-action-link" onClick={signOut}><SignOut size={20} /> Sign out</button>
          </div>}
        </section>
      </section>

    </main>
  );
}
