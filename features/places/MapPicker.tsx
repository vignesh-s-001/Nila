"use client";

import dynamic from "next/dynamic";

// Leaflet must only load client-side (no SSR)
export const MapPicker = dynamic(
  () => import("./MapPickerLeaflet").then((mod) => mod.MapPickerLeaflet),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full rounded-[12px] flex items-center justify-center"
        style={{
          height: 220,
          background: "var(--bg-tertiary)",
          border: "1px solid var(--border-default)",
          color: "var(--text-tertiary)",
          fontSize: 14,
        }}
      >
        Loading map…
      </div>
    ),
  }
);
