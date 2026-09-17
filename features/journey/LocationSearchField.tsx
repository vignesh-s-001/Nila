"use client";

import { useState, useEffect, useRef } from "react";
import { searchLocations, type GeocodeLocation } from "@/services/location/geocodingService";
import type { Place } from "@/core/types";
import toast from "react-hot-toast";

interface LocationSearchFieldProps {
  label: string;
  badge: "start" | "dest";
  value: string;
  onChange: (val: string) => void;
  onSelectLocation: (name: string, lat: number, lng: number) => void;
  placeholder?: string;
  savedPlaces?: Place[];
  onCurrentGpsClick?: () => void;
}

export function LocationSearchField({
  label,
  badge,
  value,
  onChange,
  onSelectLocation,
  placeholder = "Search station, bus stop, or place…",
  savedPlaces = [],
  onCurrentGpsClick,
}: LocationSearchFieldProps) {
  const [suggestions, setSuggestions] = useState<GeocodeLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Debounced search when value changes
  const handleInputChange = (text: string) => {
    onChange(text);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (text.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchLocations(text);
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  };

  const handleSelect = (loc: GeocodeLocation) => {
    onSelectLocation(loc.name, loc.lat, loc.lng);
    setIsOpen(false);
    toast.success(`${badge === "start" ? "Start (A)" : "Destination (B)"} placed at ${loc.name} 🎯`);
  };

  // Direct Search on Enter key or Search button
  const handleDirectSearch = async () => {
    if (!value.trim()) return;
    setLoading(true);
    try {
      const results = await searchLocations(value);
      if (results.length > 0) {
        handleSelect(results[0]);
      } else {
        toast.error("Location not found. Try typing a landmark or station name.");
      }
    } catch {
      toast.error("Failed to search location.");
    } finally {
      setLoading(false);
    }
  };

  const isStart = badge === "start";

  return (
    <div
      ref={wrapperRef}
      className="relative flex flex-col gap-1.5 p-3 rounded-xl bg-surface-container-low border border-outline-variant/50"
    >
      {/* Header with Badge & GPS / Actions */}
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-bold flex items-center gap-1.5 ${
            isStart ? "text-emerald-600 dark:text-emerald-400" : "text-primary"
          }`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${isStart ? "bg-emerald-500" : "bg-primary"}`}></span>
          {label}
        </span>

        {isStart && onCurrentGpsClick && (
          <button
            type="button"
            onClick={onCurrentGpsClick}
            className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
          >
            <span className="material-symbols-outlined text-[13px]">my_location</span>
            Current GPS
          </button>
        )}
      </div>

      {/* Input Field with Search & Action Controls */}
      <div className="relative flex items-center">
        <span className="material-symbols-outlined absolute left-3 text-secondary text-[18px] pointer-events-none">
          search
        </span>

        <input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleDirectSearch();
            }
          }}
          placeholder={placeholder}
          className="w-full h-11 pl-9 pr-20 rounded-lg text-sm bg-surface-container-lowest text-on-surface border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-secondary/60 transition-all"
        />

        <div className="absolute right-1.5 flex items-center gap-1">
          {loading && (
            <span className="material-symbols-outlined text-[16px] text-primary animate-spin">
              progress_activity
            </span>
          )}

          {value && !loading && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setSuggestions([]);
                setIsOpen(false);
              }}
              title="Clear text"
              className="p-1 rounded-md text-secondary hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDirectSearch}
            className="px-2 py-1 rounded-md bg-primary text-on-primary font-bold text-[11px] hover:opacity-90 active:scale-95 transition-all shadow-xs"
            title="Search and place on map"
          >
            Find
          </button>
        </div>
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-surface-container-lowest border border-outline-variant/80 rounded-xl shadow-xl overflow-hidden animate-fade-in max-h-60 overflow-y-auto">
          <div className="px-3 py-1.5 bg-surface-container-low text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center justify-between border-b border-outline-variant/30">
            <span>Matching Stations & Places</span>
            <span className="text-primary font-normal">Click to place marker</span>
          </div>

          <div className="divide-y divide-outline-variant/20">
            {suggestions.map((loc) => (
              <div
                key={loc.id}
                onClick={() => handleSelect(loc)}
                className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-primary/8 cursor-pointer transition-colors"
              >
                <span className="text-base flex-shrink-0 mt-0.5">{loc.icon}</span>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-on-surface truncate">
                    {loc.name}
                  </span>
                  <span className="text-[10px] text-secondary truncate mt-0.5">
                    {loc.fullName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saved Places Quick Select */}
      {savedPlaces.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 pt-1.5">
          <span className="text-[10px] font-semibold text-secondary whitespace-nowrap">Saved:</span>
          {savedPlaces.map((p) => (
            <button
              key={`${badge}-${p.id}`}
              type="button"
              onClick={() => {
                onSelectLocation(p.name, p.lat, p.lng);
                toast.success(`${isStart ? "Start" : "Destination"} set to ${p.name} 🎯`);
              }}
              className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-surface-container hover:bg-primary/15 text-on-surface whitespace-nowrap border border-outline-variant/30 transition-colors flex items-center gap-1"
            >
              <span>{p.emoji}</span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

