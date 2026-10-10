import React, { useState } from "react";
import { Field, Upload } from "./UI";
import { uploadVideo } from "../lib/backend";
import { useMarket } from "../lib/context";
import { defaultHeroSlides } from "../lib/hero";
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
          <h4>Slide {i + 2}</h4>
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
