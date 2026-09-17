"use client";

import { useState, useEffect } from "react";
import { MapPin, Navigation, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { MapPicker } from "./MapPicker";
import { PLACE_EMOJIS, PLACE_COLORS, DEFAULT_GEOFENCE_RADIUS, MIN_GEOFENCE_RADIUS, MAX_GEOFENCE_RADIUS } from "@/core/constants";
import type { Place, PlaceColor } from "@/core/types";
import type { CreatePlaceInput } from "@/services/database/places";
import toast from "react-hot-toast";

interface PlaceFormProps {
  initialValues?: Partial<Place>;
  onSubmit: (input: CreatePlaceInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  submitLabel?: string;
}

export function PlaceForm({
  initialValues,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = "Create Place",
}: PlaceFormProps) {
  const [name, setName]       = useState(initialValues?.name ?? "");
  const [emoji, setEmoji]     = useState(initialValues?.emoji ?? "📍");
  const [color, setColor]     = useState<PlaceColor>(initialValues?.color ?? "blue");
  const [lat, setLat]         = useState(initialValues?.lat ?? 13.0827);
  const [lng, setLng]         = useState(initialValues?.lng ?? 80.2707);
  const [radius, setRadius]   = useState(initialValues?.radius ?? DEFAULT_GEOFENCE_RADIUS);
  const [address, setAddress] = useState(initialValues?.address ?? "");
  const [locating, setLocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [errors, setErrors]   = useState<Record<string, string>>({});

  // Reverse geocode lat/lng to human-readable address
  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) {
          const a = data.address || {};
          const parts = [];
          if (a.road || a.pedestrian) parts.push(a.road || a.pedestrian);
          if (a.suburb || a.neighbourhood) parts.push(a.suburb || a.neighbourhood);
          if (a.city || a.town || a.village) parts.push(a.city || a.town || a.village);
          const shortAddress = parts.length > 0 ? parts.join(", ") : data.display_name.split(",").slice(0, 3).join(",");
          setAddress(shortAddress);
        }
      }
    } catch {
      // Ignore network hiccups
    }
  };

  // Search address using OpenStreetMap Nominatim
  const searchAddress = async (query: string) => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim())}&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const newLat = parseFloat(data[0].lat);
          const newLng = parseFloat(data[0].lon);
          setLat(newLat);
          setLng(newLng);
          setAddress(data[0].display_name.split(",").slice(0, 3).join(","));
          toast.success("Location found on map");
        } else {
          toast.error("Location not found. Try another search term.");
        }
      }
    } catch {
      toast.error("Could not search address");
    } finally {
      setSearching(false);
    }
  };

  // Obtain user's real location with GPS + IP fallback
  const fetchCurrentLocation = async (showToast = false) => {
    setLocating(true);
    let resolved = false;

    // 1. Try Browser Geolocation API
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 8000,
            maximumAge: 60000,
          });
        });
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setLat(userLat);
        setLng(userLng);
        resolved = true;
        reverseGeocode(userLat, userLng);
        if (showToast) toast.success("Using your current GPS location");
      } catch {
        // GPS timed out or denied on desktop, proceed to IP fallback
      }
    }

    // 2. Fallback to free IP geolocation if GPS is not permitted or unavailable
    if (!resolved) {
      try {
        const res = await fetch("https://get.geojs.io/v1/ip/geo.json");
        if (res.ok) {
          const data = await res.json();
          if (data.latitude && data.longitude) {
            const ipLat = parseFloat(data.latitude);
            const ipLng = parseFloat(data.longitude);
            setLat(ipLat);
            setLng(ipLng);
            resolved = true;
            if (data.city) {
              setAddress(`${data.city}${data.country ? `, ${data.country}` : ""}`);
            }
            if (showToast) toast.success(`Estimated location: ${data.city || "detected"}`);
          }
        }
      } catch {
        // Both failed
      }
    }

    if (!resolved && showToast) {
      toast.error("Could not determine location. Please select on the map or search address.");
    }
    setLocating(false);
  };

  // Fetch current location on mount if no initial position was passed
  useEffect(() => {
    if (!initialValues?.lat) {
      fetchCurrentLocation(false);
    }
  }, [initialValues?.lat]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Place name is required";
    if (name.trim().length > 50) errs.name = "Name must be under 50 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({ name: name.trim(), emoji, color, lat, lng, radius, address: address.trim() || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Name */}
      <Input
        id="place-name"
        label="Place name"
        placeholder="e.g. Home, Office, Gym…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        maxLength={50}
      />

      {/* Emoji picker */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Icon
        </label>
        <div className="flex flex-wrap gap-2">
          {PLACE_EMOJIS.map((e) => (
            <button
              key={e.value}
              type="button"
              onClick={() => setEmoji(e.value)}
              title={e.label}
              className={[
                "w-10 h-10 rounded-[10px] text-xl flex items-center justify-center transition-all",
                emoji === e.value
                  ? "bg-[var(--accent-light)] ring-2 ring-[var(--accent)] scale-110"
                  : "bg-[var(--bg-tertiary)] hover:bg-[var(--border-default)]",
              ].join(" ")}
              aria-label={e.label}
              aria-pressed={emoji === e.value}
            >
              {e.value}
            </button>
          ))}
        </div>
      </div>

      {/* Color picker */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Color
        </label>
        <div className="flex flex-wrap gap-2">
          {PLACE_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              title={c.label}
              className={[
                "w-8 h-8 rounded-full transition-all",
                color === c.value ? "ring-2 ring-offset-2 ring-[var(--accent)] scale-110" : "hover:scale-105",
              ].join(" ")}
              style={{ backgroundColor: c.hex }}
              aria-label={c.label}
              aria-pressed={color === c.value}
            />
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Location
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            loading={locating}
            onClick={() => fetchCurrentLocation(true)}
          >
            <Navigation size={14} />
            {locating ? "Locating…" : "Use current GPS"}
          </Button>
        </div>
        <MapPicker
          lat={lat}
          lng={lng}
          radius={radius}
          color={color}
          onChange={(newLat, newLng) => {
            setLat(newLat);
            setLng(newLng);
            reverseGeocode(newLat, newLng);
          }}
          height={220}
        />
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          Tap the map or drag the pin to set the exact location
        </p>
      </div>

      {/* Radius */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Alert radius
          </label>
          <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
            {radius}m
          </span>
        </div>
        <input
          type="range"
          min={MIN_GEOFENCE_RADIUS}
          max={MAX_GEOFENCE_RADIUS}
          step={50}
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="w-full accent-[var(--accent)]"
          aria-label={`Alert radius: ${radius} metres`}
        />
        <div className="flex justify-between text-xs" style={{ color: "var(--text-tertiary)" }}>
          <span>{MIN_GEOFENCE_RADIUS}m</span>
          <span>{MAX_GEOFENCE_RADIUS}m</span>
        </div>
      </div>

      {/* Address with Search */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Address / Search Location
        </label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              id="place-address"
              placeholder="Search city, area, or address…"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  searchAddress(address);
                }
              }}
              leftIcon={<MapPin size={14} />}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            loading={searching}
            onClick={() => searchAddress(address)}
            title="Search address on map"
            className="flex-shrink-0"
          >
            <Search size={14} />
            Search
          </Button>
        </div>
        <p className="text-xs text-secondary/70">
          Tip: Type a location and press Enter or Search to instantly move the map pin.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" fullWidth onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" fullWidth loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
