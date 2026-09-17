"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { Map, Marker, Circle } from "leaflet";
import { DEFAULT_GEOFENCE_RADIUS, getPlaceColorHex } from "@/core/constants";
import type { PlaceColor } from "@/core/types";

// Fix Leaflet default icon
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

interface MapPickerLeafletProps {
  lat: number;
  lng: number;
  radius: number;
  color?: PlaceColor;
  onChange: (lat: number, lng: number) => void;
  onRadiusChange?: (radius: number) => void;
  height?: number;
}

export function MapPickerLeaflet({
  lat,
  lng,
  radius,
  color = "blue",
  onChange,
  height = 220,
}: MapPickerLeafletProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const circleRef = useRef<Circle | null>(null);

  const colorHex = getPlaceColorHex(color);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet");

    const map: Map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: 16,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
      subdomains: "0123",
      attribution: "&copy; Google Maps",
      maxZoom: 20,
    }).addTo(map);

    const marker: Marker = L.marker([lat, lng], { draggable: true }).addTo(map);
    const circle: Circle = L.circle([lat, lng], {
      radius,
      color: colorHex,
      fillColor: colorHex,
      fillOpacity: 0.15,
      weight: 2,
    }).addTo(map);

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      circle.setLatLng(pos);
      onChange(pos.lat, pos.lng);
    });

    map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
      marker.setLatLng(e.latlng);
      circle.setLatLng(e.latlng);
      onChange(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;
    circleRef.current = circle;

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update circle when radius or color changes
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radius);
      circleRef.current.setStyle({ color: colorHex, fillColor: colorHex });
    }
  }, [radius, colorHex]);

  // Sync map center, marker, and circle when lat/lng change from outside (GPS, address search, etc.)
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current || !circleRef.current) return;
    const currentMarkerPos = markerRef.current.getLatLng();
    // Only update if difference is meaningful to avoid feedback loops
    if (
      Math.abs(currentMarkerPos.lat - lat) > 0.00001 ||
      Math.abs(currentMarkerPos.lng - lng) > 0.00001
    ) {
      const newPos: [number, number] = [lat, lng];
      mapInstanceRef.current.setView(newPos, mapInstanceRef.current.getZoom());
      markerRef.current.setLatLng(newPos);
      circleRef.current.setLatLng(newPos);
    }
  }, [lat, lng]);

  return (
    <div
      ref={mapRef}
      style={{ height, width: "100%", borderRadius: 12 }}
      aria-label="Map picker — click or drag marker to set location"
    />
  );
}
