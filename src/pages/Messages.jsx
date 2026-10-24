import React, { useCallback, useEffect, useState } from "react";
import {
  ChatCircleDots,
  Flag,
  PaperPlaneRight,
  Storefront,
} from "@phosphor-icons/react";
import { Link, useMarket } from "../lib/context";
import { configured, result, supabase } from "../lib/backend";
import { Empty, Field } from "../components/UI";

export function Messages() {
  const { session, path, notice, navigate } = useMarket();
  const requested = new URLSearchParams(path.split("?")[1] || "").get("conversation");
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(requested || "");
  const [messages, setMessages] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [reportId, setReportId] = useState("");
  const [reportReason, setReportReason] = useState("");

  const loadConversations = useCallback(async () => {
    if (!configured || !session) return;
    try {
      const rows = await result(
        supabase
          .from("direct_conversations")
          .select("*,listing:listings(id,title,seller:sellers(id,name,slug,user_id))")
          .order("created_at", { ascending: false }),
      );
      setConversations(rows);
      const ids = [...new Set(rows.flatMap((c) => [c.buyer_id, c.listing?.seller?.user_id]).filter(Boolean))];
      if (ids.length) {
        const people = await result(supabase.from("member_profiles").select("user_id,username").in("user_id", ids));
        setProfiles(Object.fromEntries(people.map((person) => [person.user_id, person.username])));
      }
      if (!active && rows[0]) setActive(rows[0].id);
    } catch (e) {
      notice(e.message);
    }
  }, [session?.user?.id, active, notice]);

  const loadMessages = useCallback(async () => {
    if (!active || !session) return;
    try {
      setMessages(
        await result(
          supabase
            .from("direct_messages")
            .select("*")
            .eq("conversation_id", active)
            .order("created_at", { ascending: true }),
        ),
      );
    } catch (e) {
      notice(e.message);
    }
  }, [active, session?.user?.id, notice]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);
  useEffect(() => {
    if (!configured || !session) return;
    const channel = supabase
      .channel("direct-conversations-" + session.user.id)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_conversations",
        },
        loadConversations,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, loadConversations]);
  useEffect(() => {
    loadMessages();
    if (!active) return;
    const channel = supabase
      .channel("direct-messages-" + active)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "direct_messages",
          filter: "conversation_id=eq." + active,
        },
        loadMessages,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [active, loadMessages]);

  const current = conversations.find((c) => c.id === active);
  const isSeller = current?.listing?.seller?.user_id === session?.user?.id;

  async function send(e) {
    e.preventDefault();
    const text = body.trim();
    if (!text || !active || busy) return;
    setBusy(true);
    try {
      await result(
        supabase.from("direct_messages").insert({
          conversation_id: active,
          sender_id: session.user.id,
          body: text,
        }),
      );
      setBody("");
      await loadMessages();
    } catch (e) {
      notice(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function reportMessage(e) {
    e.preventDefault();
    try {
      await result(
        supabase.rpc("report_listing_message", {
          p_question_id: null,
          p_message_id: reportId,
          p_reason: reportReason.trim(),
        }),
      );
      setReportId("");
      setReportReason("");
      notice("Message sent to the admin team for review.");
    } catch (e) {
      notice(e.message);
    }
  }

  if (!session)
    return (
      <div className="page">
        <Empty title="Sign in to view messages">
          <Link className="button primary" to="/login?returnTo=%2Fmessages">
            Sign in
          </Link>
        </Empty>
      </div>
    );
  if (!configured)
    return (
      <div className="page">
        <Empty title="Messages need the marketplace account service">
          Connect the marketplace Supabase project before sending or receiving messages.
        </Empty>
      </div>
    );

  return (
    <div className="page messages-page">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">BUYER & SELLER MESSAGES</span>
          <h1>Your conversations</h1>
          <p>Private messages about marketplace listings.</p>
        </div>
        <ChatCircleDots size={42} weight="light" />
      </div>
      <div className="messages-layout">
        <aside className="conversation-list" aria-label="Conversations">
          {!conversations.length ? (
            <p className="muted">No private conversations yet.</p>
          ) : (
            conversations.map((conversation) => {
              const listing = conversation.listing;
              const mine = conversation.buyer_id === session.user.id;
              const title = listing?.title || "Marketplace listing";
              const partner = mine
                ? profiles[listing?.seller?.user_id] || listing?.seller?.name || "Seller"
                : profiles[conversation.buyer_id] || "Marketplace member";
              return (
                <button
                  key={conversation.id}
                  className={active === conversation.id ? "active" : ""}
                  onClick={() => {
                    setActive(conversation.id);
                    navigate("/messages?conversation=" + conversation.id);
                  }}
                >
                  <span className="conversation-avatar">
                    <Storefront size={20} />
                  </span>
                  <span>
                    <strong>{partner}</strong>
                    <small>{title}</small>
                  </span>
                </button>
              );
            })
          )}
        </aside>
        <section className="message-thread">
          {current ? (
            <>
              <header className="message-thread-heading">
                <div>
                  <strong>
                    {current.buyer_id === session.user.id
                      ? profiles[current.listing?.seller?.user_id] || current.listing?.seller?.name || "Marketplace seller"
                      : profiles[current.buyer_id] || "Marketplace member"}
                  </strong>
                  <small>{current.listing?.title || "Listing conversation"}</small>
                </div>
                {current.listing?.id && (
                  <Link to={"/listing/" + current.listing.id}>View listing</Link>
                )}
              </header>
              <div className="message-history" aria-live="polite">
                {messages.map((message) => (
                  <article
                    className={
                      "chat-bubble " +
                      (message.sender_id === session.user.id ? "mine" : "")
                    }
                    key={message.id}
                  >
                    <strong className="chat-username">@{profiles[message.sender_id] || (message.sender_id === session.user.id ? session.user.user_metadata?.username : null) || "member"}</strong>
                    <p>{message.body}</p>
                    <small>{new Date(message.created_at).toLocaleString()}</small>
                    {isSeller && message.sender_id !== session.user.id && (
                      <button
                        className="text-button muted"
                        onClick={() => setReportId(message.id)}
                      >
                        <Flag size={14} /> Report to admin
                      </button>
                    )}
                  </article>
                ))}
                {!messages.length && (
                  <p className="muted">Start the conversation with a message.</p>
                )}
              </div>
              {reportId ? (
                <form className="message-report-form" onSubmit={reportMessage}>
                  <Field label="Why should the admin review this message?">
                    <textarea
                      minLength={5}
                      maxLength={500}
                      required
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                    />
                  </Field>
                  <div className="button-row">
                    <button className="button primary">Send report</button>
                    <button
                      type="button"
                      className="button outline"
                      onClick={() => setReportId("")}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <form className="message-compose" onSubmit={send}>
                  <textarea
                    aria-label="Write a private message"
                    placeholder="Write a message…"
                    rows={2}
                    maxLength={4000}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                  <button
                    className="button primary"
                    disabled={!body.trim() || busy}
                    aria-label="Send message"
                  >
                    <PaperPlaneRight size={18} /> Send
                  </button>
                </form>
              )}
            </>
          ) : (
            <Empty title="Choose a conversation">
              Start a private message from any listing page.
            </Empty>
          )}
        </section>
      </div>
    </div>
  );
}
