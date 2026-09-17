"use client";

import dynamic from "next/dynamic";
import type { RouteMapPickerLeafletProps } from "./RouteMapPickerLeaflet";

// Leaflet must only load client-side (no SSR)
export const RouteMapPicker = dynamic<RouteMapPickerLeafletProps>(
  () => import("./RouteMapPickerLeaflet").then((mod) => mod.RouteMapPickerLeaflet),
  {
    ssr: false,
    loading: () => (
      <div
        className="w-full rounded-[14px] flex flex-col items-center justify-center gap-2 border border-outline-variant/40 bg-surface-container-low text-secondary"
        style={{ height: 280 }}
      >
        <span className="material-symbols-outlined text-2xl animate-spin text-primary">
          progress_activity
        </span>
        <span className="text-xs font-medium">Loading interactive route map…</span>
      </div>
    ),
  }
);

