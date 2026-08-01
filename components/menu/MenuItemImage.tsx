"use client";

import { useState } from "react";

interface Props {
  src: string | null;
  alt: string;
}

// Small Client Component, deliberately separated from the otherwise-
// Server Component menu list page — onError handling requires client-side
// interactivity, but there's no reason to convert the whole list to a
// Client Component just for this.
//
// Plain <img>, not next/image: photo_url/photo_thumbnail_url are
// Supabase Storage public URLs on a domain not known in advance to
// next.config.js, and next/image requires allow-listing specific domains
// for optimization — not worth the friction for URLs we already generate
// pre-optimized (thumbnails are already resized/compressed server-side).
export function MenuItemImage({ src, alt }: Props) {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !src || failed;

  if (showPlaceholder) {
    return (
      <div
        className="w-20 h-20 rounded-md bg-card border border-border flex items-center justify-center shrink-0"
        role="img"
        aria-label="No image available"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-text-secondary"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src as string}
      alt={alt}
      onError={() => setFailed(true)}
      className="w-20 h-20 rounded-md object-cover border border-border shrink-0"
      loading="lazy"
    />
  );
}
