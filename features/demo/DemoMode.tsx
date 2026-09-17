"use client";

import { useAppStore } from "@/store/appStore";
import { DEMO_LOCATIONS } from "@/core/constants";
import { usePlaces } from "@/hooks/usePlaces";
import { MapPin, NavigationOff, Bug } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

export function DemoModeSimulator() {
  const { demoMode, demoLocationName, setDemoMode } = useAppStore();
  const { places } = usePlaces();
  const [isMinimized, setIsMinimized] = useState(false);

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-24 right-4 w-11 h-11 bg-surface-container-lowest border-2 border-primary/30 rounded-full flex items-center justify-center text-primary shadow-xl hover:scale-105 z-50 transition-all"
        title="Open Location Simulator"
        aria-label="Open Location Simulator"
      >
        <Bug size={20} />
        {demoMode && (
          <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white"></span>
        )}
      </button>
    );
  }

  const handleSimulateArrival = (name: string, lat: number, lng: number) => {
    toast(`Simulating arrival at ${name}...`, { icon: "🚗" });
    // Step outside briefly so context engine always registers a fresh transition
    const outsideCoords = { lat: lat + 0.05, lng: lng + 0.05, accuracy: 5 };
    setDemoMode(true, "Outside", outsideCoords);
    setTimeout(() => {
      setDemoMode(true, name, { lat, lng, accuracy: 5 });
    }, 300);
  };

  const handleSimulateExit = () => {
    toast("Simulating moving away...", { icon: "🚶" });
    // Set coordinates far outside any place to trigger EXIT
    const outsideCoords = { lat: 0, lng: 0, accuracy: 5 };
    setDemoMode(true, "Outside Any Place", outsideCoords);
  };

  return (
    <div className="fixed bottom-24 right-4 w-72 bg-surface-container-lowest border border-outline-variant/60 rounded-[16px] shadow-2xl z-50 overflow-hidden animate-slide-up">
      <div className="flex items-center justify-between px-3 py-2 border-b border-outline-variant/40 bg-surface-container-low">
        <div className="flex items-center gap-2">
          <Bug size={14} className="text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
            Location Simulator
          </span>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="text-xs font-semibold px-2 py-1 rounded hover:bg-surface-container-high text-secondary hover:text-on-surface transition-colors"
        >
          Hide
        </button>
      </div>

      <div className="p-3 flex flex-col gap-3 max-h-[70vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-on-surface">
            Enable Simulator
          </span>
          <input
            type="checkbox"
            className="ctx-checkbox scale-75"
            checked={demoMode}
            onChange={(e) => {
              const checked = e.target.checked;
              if (checked) {
                // If checking, set to current place or moving
                setDemoMode(true, demoLocationName, null);
              } else {
                setDemoMode(false, "", null);
              }
            }}
          />
        </div>

        {demoMode && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-secondary">
              Select Location to Simulate Arrival
            </span>

            {/* User Custom Places */}
            {places.length > 0 && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Your Places ({places.length})
                </span>
                {places.map((place) => (
                  <button
                    key={place.id}
                    onClick={() => handleSimulateArrival(place.name, place.lat, place.lng)}
                    className={[
                      "flex items-center gap-2 px-2.5 py-2 rounded-[8px] text-sm text-left transition-colors border",
                      demoLocationName === place.name
                        ? "bg-primary/10 border-primary text-primary font-semibold"
                        : "hover:bg-surface-container-low border-transparent text-secondary",
                    ].join(" ")}
                  >
                    <span>{place.emoji}</span>
                    <span className="font-medium flex-1 truncate">{place.name}</span>
                    {demoLocationName === place.name && <MapPin size={14} className="text-primary flex-shrink-0" />}
                  </button>
                ))}
              </div>
            )}

            {/* Presets */}
            <div className="flex flex-col gap-1 mt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                Preset Locations
              </span>
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-1">
                {DEMO_LOCATIONS.map((loc) => (
                  <button
                    key={loc.name}
                    onClick={() => handleSimulateArrival(loc.name, loc.lat, loc.lng)}
                    className={[
                      "flex items-center gap-2 px-2 py-1.5 rounded-[8px] text-xs text-left transition-colors",
                      demoLocationName === loc.name
                        ? "bg-primary/10 text-primary font-semibold"
                        : "hover:bg-surface-container-low text-secondary",
                    ].join(" ")}
                  >
                    <span>{loc.emoji}</span>
                    <span className="font-medium flex-1 truncate">{loc.name}</span>
                    {demoLocationName === loc.name && <MapPin size={12} className="text-primary" />}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSimulateExit}
              className={[
                "flex items-center gap-2 px-2.5 py-2 rounded-[8px] text-xs text-left transition-colors mt-1 border",
                demoLocationName === "Outside Any Place" || demoLocationName === "Outside"
                  ? "bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-400 font-semibold"
                  : "hover:bg-surface-container-low border-transparent text-secondary",
              ].join(" ")}
            >
              <NavigationOff size={14} />
              <span className="font-medium">Moving Away (Outside Any Place)</span>
            </button>

            {/* Direct Music & Top Alert Banner Test */}
            <div className="pt-2 mt-1 border-t border-outline-variant/40 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Music & Banner Alert Test
              </span>
              <button
                onClick={async () => {
                  const { startAlarmAudio } = await import("@/services/notifications/soundService");
                  startAlarmAudio(20);
                  const samplePlace = places[0] || { id: "demo-place", name: "Home", emoji: "🏠" };
                  const sampleTasks = await import("@/services/database/tasks").then((m) => m.getTasks());
                  const firstTask = sampleTasks[0] || {
                    id: "demo-task-1",
                    title: "Take shoes off and drink warm water",
                    priority: "medium",
                    placeId: samplePlace.id,
                    completed: false,
                    triggerType: "ENTER",
                    timeStart: "09:00",
                    timeEnd: "18:00",
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  };

                  useAppStore.getState().setActiveAlert({
                    id: `alert-${Date.now()}`,
                    title: `${samplePlace.emoji} Arrived at ${samplePlace.name}`,
                    body: `• ${firstTask.title} (09:00 - 18:00)\nYou have 1 intention here.`,
                    placeId: samplePlace.id,
                    placeName: samplePlace.name,
                    placeEmoji: samplePlace.emoji,
                    tasks: [firstTask],
                  });

                  toast("Playing 20s chime & displaying top notification banner!", { icon: "🔔" });
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-container text-on-primary transition-all shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">music_note</span>
                <span>Test 20s Music & Top Banner</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
