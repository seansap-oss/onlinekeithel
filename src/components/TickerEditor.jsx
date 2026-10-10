import React, { useRef, useState } from "react";
import { Field } from "./UI";
import { Ticker, RichTickerText } from "./Ticker";
import {
  tickerSettings,
  tickerFonts,
  tickerIcons,
  textOf,
  editText,
  formatRange,
  replaceRange,
  runStyle,
} from "../lib/ticker";
const palette = [
  "#15352e",
  "#ffffff",
  "#ffc34d",
  "#bd4037",
  "#008a67",
  "#3365cc",
  "#833eab",
  "#000000",
];
const localDate = (v) => {
  if (!v) return "";
  const d = new Date(v);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
export function TickerEditor({ value, onChange }) {
  const t = tickerSettings(value);
  t.messages = t.messages.map((m, i) => ({
    ...m,
    link: value?.messages?.[i]?.link ?? m.link,
  }));
  const [selected, setSelected] = useState(0),
    [selection, setSelection] = useState([0, 0]),
    [style, setStyle] = useState(runStyle()),
    [history, setHistory] = useState([]),
    [future, setFuture] = useState([]);
  const input = useRef(null);
  const m = t.messages[selected];
  const commit = (next) => {
    setHistory((h) => [...h.slice(-29), t]);
    setFuture([]);
    onChange(next);
  };
  const patch = (update) =>
    commit({
      ...t,
      messages: t.messages.map((x, i) =>
        i === selected ? { ...x, ...update } : x,
      ),
    });
  const format = (change) => {
    setStyle((s) => ({ ...s, ...change }));
    patch({ runs: formatRange(m.runs, ...selection, change) });
  };
  const insert = (text) => {
    const [a, b] = selection;
    patch({ runs: replaceRange(m.runs, a, b, text, style) });
    setSelection([a + text.length, a + text.length]);
    requestAnimationFrame(() => {
      input.current?.focus();
      input.current?.setSelectionRange(a + text.length, a + text.length);
    });
  };
  const move = (step) => {
    const messages = [...t.messages];
    [messages[selected], messages[selected + step]] = [
      messages[selected + step],
      messages[selected],
    ];
    commit({ ...t, messages });
    setSelected(selected + step);
  };
  return (
    <section className="ticker-editor">
      <h2>Ticker editor</h2>
      <p>
        Select any letters or words in the text box, then choose their colour,
        font, size or emphasis. Without a selection, formatting applies to the
        whole message.
      </p>
      <div className="button-row">
        <button
          type="button"
          className="button outline small"
          disabled={!history.length}
          onClick={() => {
            const previous = history.at(-1);
            setFuture((f) => [t, ...f]);
            setHistory((h) => h.slice(0, -1));
            onChange(previous);
            setSelected(0);
          }}
        >
          Undo
        </button>
        <button
          type="button"
          className="button outline small"
          disabled={!future.length}
          onClick={() => {
            setHistory((h) => [...h, t]);
            onChange(future[0]);
            setFuture((f) => f.slice(1));
            setSelected(0);
          }}
        >
          Redo
        </button>
      </div>
      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={t.enabled}
          onChange={(e) => commit({ ...t, enabled: e.target.checked })}
        />
        Show ticker on the website
      </label>
      <div className="form-grid">
        <Field
          label="Tape background"
          type="color"
          value={t.background}
          onChange={(e) => commit({ ...t, background: e.target.value })}
        />
        <Field
          label="Scroll speed (pixels per second)"
          type="range"
          min="20"
          max="140"
          value={t.speed}
          onChange={(e) => commit({ ...t, speed: Number(e.target.value) })}
        />
      </div>
      <h3>Messages, in display order</h3>
      <div className="ticker-message-list">
        {t.messages.map((item, i) => (
          <button
            key={item.id}
            type="button"
            className={
              "button outline small " + (i === selected ? "selected" : "")
            }
            onClick={() => {
              setSelected(i);
              setSelection([0, 0]);
            }}
          >
            {i + 1}. {textOf(item.runs).slice(0, 35) || "New message"}
            {!item.enabled ? " (hidden)" : ""}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="button outline"
        onClick={() => {
          commit({
            ...t,
            messages: [
              ...t.messages,
              {
                id:
                  "message-" +
                  Date.now() +
                  "-" +
                  Math.random().toString(36).slice(2),
                enabled: true,
                icon: "none",
                separator: "•",
                runs: [{ text: "Your message", ...runStyle() }],
                link: "",
                sponsored: false,
                startsAt: "",
                endsAt: "",
              },
            ],
          });
          setSelected(t.messages.length);
          setSelection([0, 0]);
        }}
      >
        + Add message
      </button>
      {m && (
        <div className="ticker-message-editor">
          <h3>Message {selected + 1}</h3>
          <div className="button-row">
            <button
              type="button"
              className="text-button"
              disabled={!selected}
              onClick={() => move(-1)}
            >
              Move earlier
            </button>
            <button
              type="button"
              className="text-button"
              disabled={selected === t.messages.length - 1}
              onClick={() => move(1)}
            >
              Move later
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => {
                commit({
                  ...t,
                  messages: t.messages.filter((_, i) => i !== selected),
                });
                setSelected(Math.max(0, selected - 1));
              }}
            >
              Remove message
            </button>
          </div>
          <Field label="Message text — select letters or words to format">
            <textarea
              ref={input}
              rows={4}
              value={textOf(m.runs)}
              onSelect={(e) =>
                setSelection([e.target.selectionStart, e.target.selectionEnd])
              }
              onChange={(e) =>
                patch({
                  runs: editText(m.runs, e.target.value.replace(/\r?\n/g, " ")),
                })
              }
            />
          </Field>
          <div className="rich-toolbar" aria-label="Text formatting">
            <Field
              label="Text colour"
              type="color"
              value={style.color}
              onChange={(e) => format({ color: e.target.value })}
            />
            <Field label="Font">
              <select
                value={style.font}
                onChange={(e) => format({ font: e.target.value })}
              >
                {Object.keys(tickerFonts).map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Size">
              <select
                value={style.size}
                onChange={(e) => format({ size: Number(e.target.value) })}
              >
                {[12, 14, 16, 18, 20, 24, 28, 32, 36].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </Field>
            {["bold", "italic", "underline"].map((key) => (
              <button
                type="button"
                key={key}
                aria-pressed={style[key]}
                className="button outline small"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => format({ [key]: !style[key] })}
              >
                {key}
              </button>
            ))}
          </div>
          <div className="colour-palette">
            {palette.map((c) => (
              <button
                type="button"
                key={c}
                aria-label={"Text colour " + c}
                style={{ background: c }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => format({ color: c })}
              />
            ))}
          </div>
          <div className="emoji-palette" aria-label="Insert emoji">
            {Object.entries(tickerIcons)
              .filter(([key]) => key !== "none")
              .map(([key, emoji]) => (
                <button
                  key={key}
                  type="button"
                  aria-label={"Insert " + key}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insert(emoji)}
                >
                  {emoji}
                </button>
              ))}
          </div>
          <p className="muted">
            Paste any emoji, or use Windows + . on Windows / Control + Command +
            Space on Mac. Emojis can appear anywhere in your text.
          </p>
          <div
            className="formatted-preview"
            style={{ background: t.background }}
          >
            <RichTickerText runs={m.runs} />
          </div>
          <div className="form-grid">
            <Field label="Leading icon">
              <select
                value={m.icon}
                onChange={(e) => patch({ icon: e.target.value })}
              >
                {Object.entries(tickerIcons).map(([key, emoji]) => (
                  <option key={key} value={key}>
                    {emoji} {key}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Separator after message"
              value={m.separator}
              onChange={(e) => patch({ separator: e.target.value })}
            />
          </div>
          <Field
            label="Click-through link (shop, item or HTTPS URL)"
            value={m.link}
            placeholder="/shop/your-shop"
            onChange={(e) => {
              onChange({
                ...t,
                messages: t.messages.map((x, i) =>
                  i === selected ? { ...x, link: e.target.value } : x,
                ),
              });
            }}
          />
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={m.enabled}
              onChange={(e) => patch({ enabled: e.target.checked })}
            />
            Message enabled
          </label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={m.sponsored}
              onChange={(e) => patch({ sponsored: e.target.checked })}
            />
            Paid placement — show Sponsored label
          </label>
          <p className="muted">
            Paid placements are arranged and verified by you. This editor does
            not collect payment.
          </p>
          <div className="form-grid">
            <Field
              label="Starts (your local time; blank = immediately)"
              type="datetime-local"
              value={localDate(m.startsAt)}
              onChange={(e) =>
                patch({
                  startsAt: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : "",
                })
              }
            />
            <Field
              label="Ends (your local time; blank = ongoing)"
              type="datetime-local"
              value={localDate(m.endsAt)}
              onChange={(e) =>
                patch({
                  endsAt: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : "",
                })
              }
            />
          </div>
        </div>
      )}
      <h3>Design preview — includes hidden and scheduled messages</h3>
      <Ticker value={t} preview />
      <h3>Currently eligible for display</h3>
      <Ticker value={t} />
      <p className="muted">
        Save a draft or publish with the controls below. Expired and disabled
        messages are excluded from the public tape.
      </p>
    </section>
  );
}
