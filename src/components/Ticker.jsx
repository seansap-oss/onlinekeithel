import React, { useEffect, useRef, useState } from "react";
import { Pause, Play } from "@phosphor-icons/react";
import {
  tickerFonts,
  tickerIcons,
  tickerSettings,
  activeMessages,
} from "../lib/ticker";
export function RichTickerText({ runs }) {
  return runs.map((r, i) => (
    <span
      key={i}
      style={{
        color: r.color,
        fontFamily: tickerFonts[r.font],
        fontSize: r.size,
        fontWeight: r.bold ? 700 : 400,
        fontStyle: r.italic ? "italic" : "normal",
        textDecoration: r.underline ? "underline" : "none",
      }}
    >
      {r.text}
    </span>
  ));
}
export function Ticker({ value, preview = false }) {
  const t = tickerSettings(value),
    [paused, setPaused] = useState(false),
    [now, setNow] = useState(Date.now()),
    [duration, setDuration] = useState(30);
  const group = useRef(null);
  const messages = preview
    ? t.messages.filter((m) => m.runs.length)
    : activeMessages(t, now);
  const signature = JSON.stringify(messages);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!group.current) return;
    const measure = () =>
      setDuration(Math.max(5, group.current.scrollWidth / t.speed));
    const observer = new ResizeObserver(measure);
    observer.observe(group.current);
    measure();
    return () => observer.disconnect();
  }, [signature, t.speed]);
  if ((!t.enabled && !preview) || !messages.length) return null;
  const content = (copy = false) => (
    <div
      className="ticker-group"
      ref={copy ? null : group}
      aria-hidden={copy || undefined}
    >
      {messages.map((m) => (
        <React.Fragment key={m.id}>
          <a
            className="ticker-message"
            href={m.link || undefined}
            tabIndex={copy ? -1 : undefined}
            target={m.link.startsWith("https:") ? "_blank" : undefined}
            rel="noopener noreferrer"
          >
            {m.sponsored && <span className="ticker-sponsored">Sponsored</span>}
            <span aria-hidden="true">{tickerIcons[m.icon]}</span>
            <RichTickerText runs={m.runs} />
          </a>
          <span className="ticker-separator" aria-hidden="true">
            {m.separator}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
  return (
    <section
      className={"ticker " + (paused ? "is-paused" : "")}
      aria-label="Marketplace updates"
      style={{
        background: t.background,
        "--ticker-duration": duration + "s",
        "--ticker-ink":
          parseInt(t.background.slice(1, 3), 16) * 0.299 +
            parseInt(t.background.slice(3, 5), 16) * 0.587 +
            parseInt(t.background.slice(5, 7), 16) * 0.114 >
          145
            ? "#15352e"
            : "#ffffff",
      }}
    >
      <div className="ticker-window">
        <div className="ticker-track">
          {content()}
          {content(true)}
        </div>
      </div>
      <button
        type="button"
        className="icon-button ticker-pause"
        aria-label={paused ? "Resume ticker" : "Pause ticker"}
        aria-pressed={paused}
        onClick={() => setPaused(!paused)}
      >
        {paused ? <Play size={16} /> : <Pause size={16} />}
      </button>
    </section>
  );
}
