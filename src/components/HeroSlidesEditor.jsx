import React, { useState } from "react";
import { Field, Upload } from "./UI";
import { uploadVideo } from "../lib/backend";
import { useMarket } from "../lib/context";
import { defaultHeroSlides } from "../lib/hero";
const localDate = (value) =>
  value
    ? new Date(
        new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, 16)
    : "";
const isoDate = (value) => (value ? new Date(value).toISOString() : "");
export function HeroSlidesEditor({ value, onChange, onBusyChange }) {
  const slides = value || defaultHeroSlides;
  const { session, notice } = useMarket();
  const [uploading, setUploading] = useState(false);
  const update = (i, patch) =>
    onChange(slides.map((s, n) => (n === i ? { ...s, ...patch } : s)));
  return (
    <section>
      <h3>Rotating hero slides</h3>
      <p>
        Your welcome image appears first. These slides and approved paid adverts
        follow every five seconds. Videos play on request and pause rotation.
      </p>
      {slides.map((slide, i) => (
        <div className="child-category" key={slide.id}>
          <h4>Promotion {i + 1}</h4>
          <Field label="Placement">
            <select
              value={slide.placement || "hero"}
              onChange={(e) => update(i, { placement: e.target.value })}
            >
              <option value="hero">Main hero</option>
              <option value="featured">Featured ads</option>
              <option value="both">Hero and featured ads</option>
            </select>
          </Field>
          {["title", "description", "button", "destination"].map((key) => (
            <Field
              key={key}
              label={
                {
                  title: "Headline",
                  description: "Description",
                  button: "Button label",
                  destination: "Button link",
                }[key]
              }
              value={slide[key] || ""}
              onChange={(e) => update(i, { [key]: e.target.value })}
            />
          ))}
          <Upload
            value={slide.image || ""}
            onChange={(image) => update(i, { image })}
          />
          <Field
            label="Video URL (YouTube, Facebook, Instagram, MP4 or WebM)"
            value={slide.video_url || ""}
            onChange={(e) => update(i, { video_url: e.target.value })}
          />
          <Field
            label="Social post URL (Instagram, Facebook or YouTube)"
            type="url"
            value={slide.social_url || ""}
            onChange={(e) => update(i, { social_url: e.target.value })}
          />
          <div className="form-grid">
            <Field
              label="Display duration (seconds)"
              type="number"
              min="3"
              max="60"
              value={slide.display_seconds ?? 6}
              onChange={(e) =>
                update(i, { display_seconds: Number(e.target.value) })
              }
            />
            <Field
              label="Priority"
              type="number"
              min="0"
              max="999"
              value={slide.priority ?? 0}
              onChange={(e) => update(i, { priority: Number(e.target.value) })}
            />
          </div>
          <div className="form-grid">
            <Field label="Show from">
              <input
                type="datetime-local"
                value={localDate(slide.starts_at)}
                onChange={(e) =>
                  update(i, { starts_at: isoDate(e.target.value) })
                }
              />
            </Field>
            <Field label="Show until">
              <input
                type="datetime-local"
                value={localDate(slide.ends_at)}
                onChange={(e) =>
                  update(i, { ends_at: isoDate(e.target.value) })
                }
              />
            </Field>
          </div>
          <label className="upload-button">
            {uploading ? "Uploading…" : "Upload video (up to 6 MB)"}
            <input
              type="file"
              accept="video/mp4,video/webm"
              disabled={uploading}
              onChange={async (e) => {
                const el = e.currentTarget,
                  file = el.files?.[0];
                if (!file) return;
                setUploading(true);
                onBusyChange?.(true);
                try {
                  if (!session) throw Error("Sign in to upload video");
                  update(i, {
                    video_url: await uploadVideo(file, session.user.id),
                  });
                } catch (error) {
                  notice(error.message);
                } finally {
                  el.value = "";
                  setUploading(false);
                  onBusyChange?.(false);
                }
              }}
            />
          </label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={slide.enabled !== false}
              onChange={(e) => update(i, { enabled: e.target.checked })}
            />
            Show slide
          </label>
          <div className="button-row">
            <button
              className="text-button"
              type="button"
              disabled={!i}
              onClick={() => {
                const next = [...slides];
                [next[i - 1], next[i]] = [next[i], next[i - 1]];
                onChange(next);
              }}
            >
              Move earlier
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => onChange(slides.filter((_, n) => n !== i))}
            >
              Remove slide
            </button>
          </div>
        </div>
      ))}
      <button
        className="button outline"
        type="button"
        onClick={() =>
          onChange([
            ...slides,
            {
              id: "hero-" + Date.now(),
              title: "",
              description: "",
              image: "",
              video_url: "",
              button: "Learn more",
              destination: "/shops",
              placement: "hero",
              display_seconds: 6,
              priority: 0,
              enabled: true,
            },
          ])
        }
      >
        + Add hero slide
      </button>
    </section>
  );
}
