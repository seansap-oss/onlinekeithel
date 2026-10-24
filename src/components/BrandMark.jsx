import React from "react";

export function BrandMark({ size = 40 }) {
  return (
    <svg className="brand-mark oo-mark" width={size} height={size} viewBox="0 0 72 40" aria-hidden="true">
      <circle cx="24" cy="20" r="14" fill="none" stroke="#087447" strokeWidth="8" />
      <circle cx="48" cy="20" r="14" fill="none" stroke="#f47716" strokeWidth="8" />
    </svg>
  );
}
