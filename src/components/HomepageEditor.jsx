import { TickerEditor } from "./TickerEditor";
import { HeroSlidesEditor } from "./HeroSlidesEditor";
import { validateTicker, destination } from "../lib/ticker";
import { directVideoUrl } from "../lib/commerce";
import { embedUrl, mediaUrl, socialUrl } from "../lib/utils";
import { heroDisplaySettings, heroLayouts } from "../lib/hero";
import React, { useEffect, useState } from "react";
import { useMarket } from "../lib/context";
import { result, supabase } from "../lib/backend";
import { Field, Upload } from "./UI";
import { Hero } from "../pages/Marketplace";
export function HomepageEditor({
  visual = false,
  mode = "homepage",
  onDirtyChange,
}) {
  const { settings, refresh, notice } = useMarket();
  const [draft, setDraft] = useState(settings),
    [baseline, setBaseline] = useState(settings);
  const [busy, setBusy] = useState(false),
    [status, setStatus] = useState("Unpublished edits"),
    [revisions, setRevisions] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [width, setWidth] = useState("100%");
  const display = heroDisplaySettings(draft.hero_display);
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
  useEffect(() => {
    const dirty = status === "Unsaved changes" || status === "Not saved";
    onDirtyChange?.(dirty);
    const warn = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [status, onDirtyChange]);
  const save = async (publish) => {
    setBusy(true);
    try {
      if (visual)
        throw Error("Connect an administrator account to save or publish.");
      const value = {
        ...draft,
        name: "OnlineKeithel",
        ticker: validateTicker(draft.ticker),
        hero_display: display,
      };
      for (const slide of value.hero_slides || []) {
        if (slide.enabled !== false && !slide.title?.trim())
          throw Error("Every enabled hero slide needs a headline.");
        if (slide.destination && !destination(slide.destination))
          throw Error("Hero links must be a local path or HTTPS URL.");
        if (slide.image && !mediaUrl(slide.image))
          throw Error("Use a supported hero image URL.");
        if (
          slide.video_url &&
          !directVideoUrl(slide.video_url) &&
          !embedUrl(slide.video_url)
        )
          throw Error("Use a supported video or embed URL.");
        if (slide.social_url && !socialUrl(slide.social_url))
          throw Error("Use a supported Instagram, Facebook or YouTube URL.");
        if (
          slide.starts_at &&
          slide.ends_at &&
          Date.parse(slide.ends_at) <= Date.parse(slide.starts_at)
        )
          throw Error("Promotion end time must be after its start time.");
      }
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
      notice(publish ? "Website content published" : "Draft saved");
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
      {mode === "ticker" ? (
        <TickerEditor
          value={draft.ticker}
          onChange={(v) => change("ticker", v)}
        />
      ) : (
        <>
          <h2>Your homepage</h2>
          <p>Edit, preview, save a draft, then publish when ready.</p>
          <Field label="Marketplace name" value="OnlineKeithel" readOnly />
          {[
            ["tagline", "Brand tagline"],
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
          <section className="hero-display-editor">
            <h3>Hero and premium display</h3>
            <p>
              Select how promotions display on the homepage. Layouts adjust for
              phone, tablet and desktop.
            </p>
            <div className="hero-layout-options">
              {heroLayouts.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={
                    display.layout === item.id
                      ? "hero-layout-option selected"
                      : "hero-layout-option"
                  }
                  aria-pressed={display.layout === item.id}
                  onClick={() =>
                    change("hero_display", { ...display, layout: item.id })
                  }
                >
                  <strong>{item.label}</strong>
                  <small>{item.count} at a time</small>
                </button>
              ))}
            </div>
            <div className="form-grid">
              <Field
                label="Rotation interval (seconds)"
                type="number"
                min="3"
                max="60"
                value={display.rotation_seconds}
                onChange={(e) =>
                  change("hero_display", {
                    ...display,
                    rotation_seconds: Number(e.target.value),
                  })
                }
              />
              <Field label="Promotion order">
                <select
                  value={display.order}
                  onChange={(e) =>
                    change("hero_display", {
                      ...display,
                      order: e.target.value,
                    })
                  }
                >
                  <option value="priority">Paid priority, then newest</option>
                  <option value="newest">Newest first</option>
                  <option value="manual">Manual order</option>
                </select>
              </Field>
            </div>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={display.pause_on_interaction}
                onChange={(e) =>
                  change("hero_display", {
                    ...display,
                    pause_on_interaction: e.target.checked,
                  })
                }
              />{" "}
              Pause while visitors interact
            </label>
          </section>
          <HeroSlidesEditor
            value={draft.hero_slides}
            onChange={(v) => change("hero_slides", v)}
            onBusyChange={setUploading}
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
        </>
      )}
      <p role="status" className="editor-state">
        {status}
      </p>
      <div className="button-row">
        <button
          type="button"
          className="button outline"
          disabled={busy || uploading}
          onClick={() => save(false)}
        >
          Save draft
        </button>
        <button
          type="submit"
          className="button primary"
          disabled={busy || uploading}
        >
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
      <h3>Previous published website versions</h3>
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
