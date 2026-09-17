"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Map, Marker, Polyline } from "leaflet";
import { getDistance } from "@/services/location/geofenceService";

// Fix Leaflet default icon if needed
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require("leaflet");
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

export interface RouteMapPickerLeafletProps {
  startLat: number;
  startLng: number;
  destLat: number;
  destLng: number;
  onStartChange: (lat: number, lng: number) => void;
  onDestChange: (lat: number, lng: number) => void;
  height?: number;
}

type MapStyle = "google" | "satellite" | "osm";

const TILE_CONFIG: Record<MapStyle, { url: string; subdomains: string; maxZoom: number; attribution: string }> = {
  google: {
    // Real Google Maps Roadmap with clear bus stops, railway stations, metro lines, arterial roads
    url: "https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    subdomains: "0123",
    maxZoom: 20,
    attribution: "&copy; Google Maps",
  },
  satellite: {
    // Real Google Satellite + Streets / Stations Hybrid
    url: "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    subdomains: "0123",
    maxZoom: 20,
    attribution: "&copy; Google Maps",
  },
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    subdomains: "abc",
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  },
};

export function RouteMapPickerLeaflet({
  startLat,
  startLng,
  destLat,
  destLng,
  onStartChange,
  onDestChange,
  height = 290,
}: RouteMapPickerLeafletProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const startMarkerRef = useRef<Marker | null>(null);
  const destMarkerRef = useRef<Marker | null>(null);
  const polylineRef = useRef<Polyline | null>(null);
  const tileLayerRef = useRef<any>(null);
  const isFirstMount = useRef(true);

  const [activeTarget, setActiveTarget] = useState<"start" | "dest">("start");
  const activeTargetRef = useRef<"start" | "dest">("start");
  activeTargetRef.current = activeTarget;

  const [mapStyle, setMapStyle] = useState<MapStyle>("google");

  const distanceMeters = getDistance(startLat, startLng, destLat, destLng);
  const distanceKm = (distanceMeters / 1000).toFixed(2);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet");

    const startIcon = L.divIcon({
      className: "custom-route-marker-a",
      html: `<div style="background-color: #10B981; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 14px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 15px; font-family: system-ui, sans-serif;">A</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    const destIcon = L.divIcon({
      className: "custom-route-marker-b",
      html: `<div style="background-color: #9E365C; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 14px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 15px; font-family: system-ui, sans-serif;">B</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    const map: Map = L.map(mapRef.current, {
      center: [(startLat + destLat) / 2, (startLng + destLng) / 2],
      zoom: 13,
      zoomControl: true,
      attributionControl: false,
    });

    // Default: Google Maps Roadmap with transit, railway stations & bus stops
    const initialCfg = TILE_CONFIG.google;
    const initialOptions: Record<string, any> = {
      maxZoom: initialCfg.maxZoom || 19,
      attribution: initialCfg.attribution || "",
    };
    if (initialCfg.subdomains) {
      initialOptions.subdomains = initialCfg.subdomains;
    }
    const initialTile = L.tileLayer(initialCfg.url, initialOptions).addTo(map);
    tileLayerRef.current = initialTile;

    // Start marker (A)
    const startMarker: Marker = L.marker([startLat, startLng], {
      icon: startIcon,
      draggable: true,
      title: "Start Location (A)",
    }).addTo(map);

    startMarker.bindPopup("<b>Start Location (A)</b><br>Drag to reposition");
    startMarker.on("dragend", () => {
      const pos = startMarker.getLatLng();
      onStartChange(pos.lat, pos.lng);
    });

    // Destination marker (B)
    const destMarker: Marker = L.marker([destLat, destLng], {
      icon: destIcon,
      draggable: true,
      title: "Destination (B)",
    }).addTo(map);

    destMarker.bindPopup("<b>Destination (B)</b><br>Drag to reposition");
    destMarker.on("dragend", () => {
      const pos = destMarker.getLatLng();
      onDestChange(pos.lat, pos.lng);
    });

    // Route polyline connecting A and B
    const polyline: Polyline = L.polyline(
      [
        [startLat, startLng],
        [destLat, destLng],
      ],
      {
        color: "#9E365C",
        weight: 5,
        opacity: 0.9,
        dashArray: "8, 8",
      }
    ).addTo(map);

    // Map click placing current target
    map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
      if (activeTargetRef.current === "start") {
        startMarker.setLatLng(e.latlng);
        onStartChange(e.latlng.lat, e.latlng.lng);
      } else {
        destMarker.setLatLng(e.latlng);
        onDestChange(e.latlng.lat, e.latlng.lng);
      }
    });

    mapInstanceRef.current = map;
    startMarkerRef.current = startMarker;
    destMarkerRef.current = destMarker;
    polylineRef.current = polyline;

    // Auto fit bounds
    try {
      const bounds = L.latLngBounds([
        [startLat, startLng],
        [destLat, destLng],
      ]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } catch {
      // Ignore
    }

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
      startMarkerRef.current = null;
      destMarkerRef.current = null;
      polylineRef.current = null;
      tileLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch tile layer when mapStyle changes
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (!mapInstanceRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet");

    if (tileLayerRef.current) {
      try {
        mapInstanceRef.current.removeLayer(tileLayerRef.current);
      } catch {
        // Ignore if already removed
      }
    }

    const cfg = TILE_CONFIG[mapStyle] || TILE_CONFIG.google;
    const layerOptions: Record<string, any> = {
      maxZoom: cfg.maxZoom || 19,
      attribution: cfg.attribution || "",
    };
    if (cfg.subdomains) {
      layerOptions.subdomains = cfg.subdomains;
    }

    const newTile = L.tileLayer(cfg.url, layerOptions).addTo(mapInstanceRef.current);
    tileLayerRef.current = newTile;
  }, [mapStyle]);

  // Update markers, polyline and pan map when coordinates change (e.g. from input search)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    let changed = false;

    if (startMarkerRef.current) {
      const cur = startMarkerRef.current.getLatLng();
      if (Math.abs(cur.lat - startLat) > 0.0001 || Math.abs(cur.lng - startLng) > 0.0001) {
        startMarkerRef.current.setLatLng([startLat, startLng]);
        changed = true;
      }
    }

    if (destMarkerRef.current) {
      const cur = destMarkerRef.current.getLatLng();
      if (Math.abs(cur.lat - destLat) > 0.0001 || Math.abs(cur.lng - destLng) > 0.0001) {
        destMarkerRef.current.setLatLng([destLat, destLng]);
        changed = true;
      }
    }

    if (polylineRef.current) {
      polylineRef.current.setLatLngs([
        [startLat, startLng],
        [destLat, destLng],
      ]);
    }

    if (changed) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const L = require("leaflet");
        const bounds = L.latLngBounds([
          [startLat, startLng],
          [destLat, destLng],
        ]);
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      } catch {
        // Ignore
      }
    }
  }, [startLat, startLng, destLat, destLng]);

  const handleFitRoute = () => {
    if (!mapInstanceRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet");
    const bounds = L.latLngBounds([
      [startLat, startLng],
      [destLat, destLng],
    ]);
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Target Selector & Map Style Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        {/* Point A vs B Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-container-low rounded-xl border border-outline-variant/40">
          <button
            type="button"
            onClick={() => setActiveTarget("start")}
            className={[
              "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all",
              activeTarget === "start"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-secondary hover:text-on-surface",
            ].join(" ")}
          >
            <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
            <span>1. Set Start (A)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTarget("dest")}
            className={[
              "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all",
              activeTarget === "dest"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-secondary hover:text-on-surface",
            ].join(" ")}
          >
            <span className="w-2 h-2 rounded-full bg-white inline-block"></span>
            <span>2. Set Dest (B)</span>
          </button>
        </div>

        {/* Map Layers (Google Roadmap, Satellite, OSM) & Distance */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 bg-surface-container-low rounded-lg border border-outline-variant/40 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setMapStyle("google")}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                mapStyle === "google"
                  ? "bg-surface-container-lowest text-primary shadow-xs font-bold"
                  : "text-secondary hover:text-on-surface"
              }`}
              title="Google Maps with bus stops & railway stations"
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => setMapStyle("satellite")}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                mapStyle === "satellite"
                  ? "bg-surface-container-lowest text-primary shadow-xs font-bold"
                  : "text-secondary hover:text-on-surface"
              }`}
              title="Google Satellite Hybrid"
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setMapStyle("osm")}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                mapStyle === "osm"
                  ? "bg-surface-container-lowest text-primary shadow-xs font-bold"
                  : "text-secondary hover:text-on-surface"
              }`}
              title="OpenStreetMap"
            >
              OSM
            </button>
          </div>

          <span className="text-[11px] font-bold text-secondary px-2 py-1 rounded-md bg-surface-container-low border border-outline-variant/30 whitespace-nowrap">
            ~{distanceKm} km
          </span>

          <button
            type="button"
            onClick={handleFitRoute}
            className="text-[11px] font-bold text-primary hover:underline px-1 py-0.5"
            title="Center both markers"
          >
            Fit
          </button>
        </div>
      </div>

      <div className="text-[11px] text-secondary flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-[13px] text-primary">touch_app</span>
          <span>
            Click map or drag marker to place{" "}
            <strong className="text-on-surface">
              {activeTarget === "start" ? "Start (A)" : "Destination (B)"}
            </strong>
          </span>
        </div>
        <span className="text-[10px] text-secondary/70">
          Showing real bus stops, railway & metro stations
        </span>
      </div>

      {/* Map Container */}
      <div
        ref={mapRef}
        style={{ height, width: "100%", borderRadius: 14 }}
        className="border border-outline-variant/60 shadow-inner overflow-hidden"
        aria-label="Route Map — select Start and Destination on Google Maps"
      />
    </div>
  );
}
