import React, { useRef, useState } from "react";
import { Photo, Video } from "./UI";

export function ListingMediaGallery({ listing, videos = [] }) {
  const slides = [
    ...videos.filter((video) => video?.url).map((video) => ({ type: "video", ...video })),
    ...(listing.images || []).map((src, index) => ({ type: "photo", src, index })),
  ];
  const track = useRef(null);
  const [active, setActive] = useState(0);
  if (!slides.length) return null;
  const photoCount = slides.filter((slide) => slide.type === "photo").length;
  const videoCount = slides.filter((slide) => slide.type === "video").length;
  return (
    <div className="listing-media-gallery">
      <div
        className="listing-media-track"
        ref={track}
        onScroll={(event) => {
          const node = event.currentTarget;
          setActive(Math.round(node.scrollLeft / node.clientWidth));
        }}
        aria-label="Listing video and photos; swipe to view more"
      >
        {slides.map((slide, index) => (
          <div className="listing-media-slide" key={`${slide.type}-${slide.url || slide.src}-${index}`}>
            {slide.type === "video" ? (
              <Video
                url={slide.url}
                title={listing.title}
                poster={listing.images?.[0] || ""}
                posterFit="contain"
                sellerName={listing.seller?.name}
                listingHref={`/listing/${listing.id}`}
                compact
                theater
              />
            ) : (
              <Photo src={slide.src} alt={`${listing.title} · photo ${slide.index + 1}`} />
            )}
            <span className="listing-media-label">
              {slide.type === "video" ? "Video · tap to play" : `Photo ${slide.index + 1}`}
            </span>
          </div>
        ))}
      </div>
      {slides.length > 1 && <div className="listing-media-footer">
        <span>{active + 1} / {slides.length} · {videoCount > 0 && `${videoCount} video${videoCount === 1 ? "" : "s"} · `}{photoCount} photo{photoCount === 1 ? "" : "s"}</span>
        <span className="listing-media-swipe-hint">Swipe to see photos →</span>
        <div className="listing-media-dots" aria-label={`Media item ${active + 1} of ${slides.length}`}>
          {slides.map((slide, index) => <button
            key={`${slide.type}-${index}`}
            type="button"
            className={index === active ? "active" : ""}
            aria-label={`Show ${slide.type} ${slide.type === "photo" ? slide.index + 1 : index + 1}`}
            onClick={() => track.current?.children[index]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" })}
          />)}
        </div>
      </div>}
    </div>
  );
}
