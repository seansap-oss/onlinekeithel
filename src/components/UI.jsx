import React, { useEffect, useRef, useState } from "react";
import {
  X,
  ImageSquare,
  UploadSimple,
  InstagramLogo,
  FacebookLogo,
  YoutubeLogo,
  ArrowSquareOut,
  Play,
  SpeakerHigh,
  SpeakerSlash,
  ArrowsOut,
  ArrowsIn,
} from "@phosphor-icons/react";
import { mediaUrl, socialUrl, embedUrl, safeUrl } from "../lib/utils";
import { uploadImage } from "../lib/backend";
import { useMarket } from "../lib/context";
export function Modal({ title, onClose, children, side = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const before = document.activeElement;
    ref.current.showModal();
    const close = () => onClose();
    ref.current.addEventListener("cancel", close);
    return () => {
      before?.focus();
    };
  }, []);
  return (
    <dialog
      className={side ? "dialog side" : "dialog"}
      ref={ref}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <header>
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={22} />
        </button>
      </header>
      <div className="dialog-body">{children}</div>
    </dialog>
  );
}
export function Photo({ src, alt = "", ...props }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return src && mediaUrl(src) && !failed ? (
    <img
      src={mediaUrl(src)}
      alt={alt}
      onError={() => setFailed(true)}
      {...props}
    />
  ) : (
    <div className="photo-fallback" role="img" aria-label={alt || "No photo"}>
      <ImageSquare size={32} />
      <span>Photo unavailable</span>
    </div>
  );
}
export function Field({ label, children, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children || <input {...props} />}
    </label>
  );
}
export function Empty({ title, children }) {
  return (
    <div className="empty">
      <ImageSquare size={36} weight="light" />
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}
export function Upload({
  value,
  onChange,
  multiple = false,
  labels = [],
  onBusyChange,
  maxItems = Infinity,
}) {
  const { session } = useMarket();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [url, setUrl] = useState("");
  const items = multiple ? value || [] : value ? [value] : [];
  return (
    <div className="upload-widget">
      <div className="photo-strip">
        {items.map((p, i) => (
          <div key={p + i}>
            <Photo src={p} alt={labels[i] || `Uploaded photo ${i + 1}`} />
            <span className="photo-position">
              {labels[i] || `Photo ${i + 1}`}
            </span>
            {multiple && i > 0 && (
              <button
                className="photo-move"
                type="button"
                disabled={busy}
                aria-label={`Move photo ${i + 1} earlier`}
                onClick={() => {
                  const next = [...items];
                  [next[i - 1], next[i]] = [next[i], next[i - 1]];
                  onChange(next);
                }}
              >
                ←
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              aria-label={`Remove photo ${i + 1}`}
              onClick={() =>
                onChange(multiple ? items.filter((_, n) => n !== i) : "")
              }
            >
              <X />
            </button>
          </div>
        ))}
      </div>
      <label className="upload-button">
        <UploadSimple size={20} />
        {busy ? "Uploading…" : "Upload photos"}
        <input
          type="file"
          accept="image/*,.heic,.heif"
          multiple={multiple}
          disabled={busy}
          onChange={async (e) => {
            setError("");
            setBusy(true);
            onBusyChange?.(true);
            try {
              if (!session) throw Error("Sign in to upload photos");
              const files = Array.from(e.target.files);
              if (Number.isFinite(maxItems) && files.length + items.length > maxItems && multiple)
                throw Error(`Up to ${maxItems} photos`);
              const uploaded = [];
              for (const file of files)
                uploaded.push(await uploadImage(file, session.user.id));
              onChange(multiple ? [...items, ...uploaded] : uploaded[0]);
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
              onBusyChange?.(false);
              e.target.value = "";
            }
          }}
        />
      </label>
      <small>One photo is enough to post. Clear photos from more angles can help buyers choose.</small>
      <div className="media-url-row">
        <input
          aria-label="Photo URL"
          type="url"
          placeholder="Or paste an HTTPS photo URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          className="button outline"
          type="button"
          disabled={busy}
          onClick={() => {
            const safe = safeUrl(url);
            if (!safe) return setError("Enter an HTTPS photo URL");
            if (multiple && Number.isFinite(maxItems) && items.length >= maxItems)
              return setError(`Up to ${maxItems} photos`);
            onChange(multiple ? [...items, safe] : safe);
            setUrl("");
            setError("");
          }}
        >
          Add URL
        </button>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
const brands = {
  instagram: InstagramLogo,
  facebook: FacebookLogo,
  youtube: YoutubeLogo,
};
export function SocialLinks({ values = {} }) {
  return (
    <div className="social-icons">
      {Object.entries(values)
        .filter(([, url]) => socialUrl(url))
        .map(([name, url]) => {
          const Icon = brands[name] || ArrowSquareOut;
          return (
            <a
              key={name}
              href={socialUrl(url)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${name}`}
            >
              <Icon size={23} />
            </a>
          );
        })}
    </div>
  );
}
export function Video({ url, poster = "", title = "", compact = false, theater = false, sellerName = "", priceLabel = "", listingHref = "" }) {
  const [load, setLoad] = useState(false);
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const [frameReady, setFrameReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const dialogRef = useRef(null);
  const stageRef = useRef(null);
  const frameRef = useRef(null);
  const nativeRef = useRef(null);
  const src = embedUrl(url);
  const direct = safeUrl(url) && /\.(mp4|webm)$/i.test(new URL(safeUrl(url)).pathname) ? safeUrl(url) : "";
  const host = socialUrl(url) ? new URL(socialUrl(url)).hostname : "";
  const platform = host.includes("instagram") ? "Instagram" : host.includes("youtube") || host === "youtu.be" ? "YouTube" : host.includes("facebook") || host === "fb.watch" ? "Facebook" : "Video";
  const useTheater = theater || compact;
  const canPlay = Boolean(src || direct);
  const youtube = platform === "YouTube";
  const original = socialUrl(url) || direct;
  const theaterSrc = youtube ? `${src}&autoplay=1&mute=1&enablejsapi=1&origin=${encodeURIComponent(typeof window === "undefined" ? "" : window.location.origin)}` : src;
  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, [open]);
  useEffect(() => {
    const sync = () => setExpanded(document.fullscreenElement === stageRef.current);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  const closeViewer = () => {
    if (document.fullscreenElement === stageRef.current) document.exitFullscreen();
    setExpanded(false);
    setOpen(false);
  };
  const toggleFullscreen = async () => {
    if (document.fullscreenElement === stageRef.current) return document.exitFullscreen();
    if (expanded) return setExpanded(false);
    try {
      if (stageRef.current?.requestFullscreen) return await stageRef.current.requestFullscreen();
    } catch { /* The in-app full-viewport stage remains available on restricted browsers. */ }
    setExpanded(true);
  };
  const toggleMute = () => {
    const next = !muted;
    if (direct && nativeRef.current) nativeRef.current.muted = next;
    if (youtube && frameRef.current?.contentWindow) {
      frameRef.current.contentWindow.postMessage(JSON.stringify({ event: "command", func: next ? "mute" : "unMute", args: [] }), "https://www.youtube-nocookie.com");
    }
    setMuted(next);
  };
  return (
    <div className={compact ? "video-player video-player-card" : "video-player"}>
      {!useTheater && load && (src || direct) ? (direct ? <video src={direct} controls playsInline /> :
        <iframe
          src={src.includes("youtube-nocookie.com") ? src + "&autoplay=1" : src}
          title="Seller video"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          className="video-poster"
          onClick={() => useTheater ? setOpen(true) : setLoad(true)}
          disabled={!canPlay}
          aria-label={"Play " + (title || platform) + " video"}
        >
          {poster && mediaUrl(poster) && <img className="video-poster-image" src={mediaUrl(poster)} alt="" loading="lazy" onError={(e) => { e.currentTarget.hidden = true; }} />}
          <span className="video-poster-content">
            <span className="video-poster-platform">{platform} video</span>
            <span className="video-poster-play"><Play size={compact ? 27 : 35} weight="fill" /></span>
            <span className="video-poster-title">{title || "Watch this seller's video"}</span>
          </span>
        </button>
      )}
      {useTheater && open && <dialog
        ref={dialogRef}
        className="video-theater"
        aria-label={`${title || platform} video viewer`}
        onCancel={(event) => { event.preventDefault(); closeViewer(); }}
        onClose={() => setOpen(false)}
        onClick={(event) => { if (event.target === event.currentTarget) closeViewer(); }}
      >
        <div className="video-theater-shell">
          <header className="video-theater-header">
            <span className="video-theater-brand" aria-label="OO Online Offer">OO <small>ONLINE OFFER</small></span>
            <span className="video-theater-heading"><strong>{title || "Seller video"}</strong>{sellerName && <small>{sellerName}</small>}</span>
            <button type="button" className="video-theater-close" aria-label="Close video" onClick={closeViewer}><X size={26}/></button>
          </header>
          <div ref={stageRef} className={"video-theater-stage" + (expanded ? " video-theater-stage-expanded" : "")}>
            {direct ? <video ref={nativeRef} src={direct} poster={mediaUrl(poster)} autoPlay muted controls playsInline /> :
              <iframe ref={frameRef} src={theaterSrc} title={`${platform} video: ${title || "Seller video"}`} allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" onLoad={() => setFrameReady(true)} />}
            <button type="button" className="video-theater-expand" onClick={toggleFullscreen} aria-label={expanded ? "Exit fullscreen" : "Watch fullscreen"}>{expanded ? <ArrowsIn size={22}/> : <ArrowsOut size={22}/>}</button>
          </div>
          <div className="video-theater-details">
            <div className="video-theater-listing"><strong>{title || "Seller video"}{priceLabel && ` · ${priceLabel}`}</strong>{sellerName && <small>{sellerName}</small>}</div>
            {(direct || youtube) && <button type="button" className="video-theater-sound" onClick={toggleMute} disabled={youtube && !frameReady} aria-label={muted ? "Unmute video" : "Mute video"}>{muted ? <SpeakerSlash size={22}/> : <SpeakerHigh size={22}/>}<span>{muted ? "Unmute" : "Mute"}</span></button>}
            {!direct && !youtube && <small className="video-theater-hint">Use the video player's sound control or your phone's volume buttons.</small>}
            {listingHref && <a className="video-theater-message" href={`${listingHref}?enquire=1`}>Message seller</a>}
            {original && <a className="video-theater-original" href={original} target="_blank" rel="noopener noreferrer">Open original on {platform} <ArrowSquareOut size={18}/></a>}
          </div>
        </div>
      </dialog>}
      {!useTheater && <a href={original} target="_blank" rel="noopener noreferrer">
        Open original post <ArrowSquareOut />
      </a>}
      {!useTheater && <small>Playback depends on the original post's availability.</small>}
    </div>
  );
}
