import React, { useEffect, useState } from "react";
import { useMarket } from "../lib/context";
import { result, supabase } from "../lib/backend";
import { Field, Upload } from "./UI";
import { Hero } from "../pages/Marketplace";
export function HomepageEditor({ visual = false }) {
  const { settings, refresh, notice } = useMarket();
  const [draft, setDraft] = useState(settings),
    [baseline, setBaseline] = useState(settings);
  const [busy, setBusy] = useState(false),
    [status, setStatus] = useState("Unpublished edits"),
    [revisions, setRevisions] = useState([]);
  const [width, setWidth] = useState("100%");
  const load = async () => {
    if (visual) return;
    try {
      const [saved, history, current] = await Promise.all([
        result(
          supabase
            .from("content_drafts")
            .select("*")
            .eq("id", "marketplace")
            .maybeSingle(),
        ),
        result(
          supabase
            .from("content_revisions")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(20),
        ),
        result(
          supabase
            .from("settings")
            .select("value")
            .eq("id", "marketplace")
            .single(),
        ),
      ]);
      setBaseline(current.value);
      setRevisions(history);
      setDraft(saved?.value || current.value);
      setStatus(saved ? "Saved draft restored" : "Published version");
    } catch (e) {
      notice(e.message);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const change = (key, value) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setStatus("Unsaved changes");
  };
  const save = async (publish) => {
    setBusy(true);
    try {
      if (visual)
        throw Error("Connect an administrator account to save or publish.");
      const value = { ...draft, name: "OnlineKeithel" };
      if (publish) {
        await result(
          supabase.rpc("publish_homepage", {
            p_value: value,
            p_expected: baseline,
          }),
        );
        await refresh();
        await load();
      } else {
        await result(
          supabase
            .from("content_drafts")
            .upsert({
              id: "marketplace",
              value,
              updated_at: new Date().toISOString(),
            })
            .select()
            .single(),
        );
      }
      setStatus(
        publish
          ? "Published to the marketplace"
          : "Draft saved — public site unchanged",
      );
      notice(publish ? "Homepage published" : "Draft saved");
    } catch (e) {
      setStatus("Not saved");
      notice(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form
      className="editor-form"
      onSubmit={(e) => {
        e.preventDefault();
        save(true);
      }}
    >
      <h2>Your homepage</h2>
      <p>Edit, preview, save a draft, then publish when ready.</p>
      <Field label="Marketplace name" value="OnlineKeithel" readOnly />
      {[
        ["tagline", "Brand tagline"],
        ["announcement", "Announcement bar"],
        ["hero_title", "Hero headline"],
        ["hero_description", "Hero description"],
        ["support_email", "Support email"],
        ["support_whatsapp", "Support WhatsApp number"],
        ["ads_price_note", "Featured placement pricing note"],
      ].map(([key, label]) => (
        <Field
          key={key}
          label={label}
          required={key === "hero_title"}
          value={draft[key] || ""}
          onChange={(e) => change(key, e.target.value)}
        />
      ))}
      <h3>Hero photograph</h3>
      <Upload
        value={draft.hero_image}
        onChange={(v) => change("hero_image", v)}
      />
      <h3>Live hero preview</h3>
      <div className="button-row">
        {[
          ["100%", "Desktop"],
          ["768px", "Tablet"],
          ["390px", "Phone"],
        ].map(([size, label]) => (
          <button
            className="button outline small"
            type="button"
            key={size}
            aria-pressed={width === size}
            onClick={() => setWidth(size)}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        className="editor-preview"
        style={{ width, maxWidth: "100%" }}
        inert={true}
      >
        <Hero settingsOverride={draft} editor />
      </div>
      <p role="status" className="editor-state">
        {status}
      </p>
      <div className="button-row">
        <button
          type="button"
          className="button outline"
          disabled={busy}
          onClick={() => save(false)}
        >
          Save draft
        </button>
        <button type="submit" className="button primary" disabled={busy}>
          {busy ? "Saving…" : "Save & publish"}
        </button>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            setDraft(baseline);
            setStatus("Published version restored in editor");
          }}
        >
          Undo edits
        </button>
      </div>
      <h3>Previous published versions</h3>
      <p>Restore a version into the editor, review it, then publish.</p>
      {revisions.map((r) => (
        <div className="admin-row" key={r.id}>
          <span>{new Date(r.created_at).toLocaleString()}</span>
          <button
            type="button"
            className="button outline small"
            onClick={() => {
              setDraft(r.value);
              setStatus("Earlier version restored — not published");
            }}
          >
            Restore into draft
          </button>
        </div>
      ))}
      {!revisions.length && (
        <p className="muted">History appears after the first publish.</p>
      )}
    </form>
  );
}
