"use client";

import { useState, useEffect } from "react";
import { useJourneys } from "@/hooks/useJourneys";
import { usePlaces } from "@/hooks/usePlaces";
import { useLocation } from "@/hooks/useLocation";
import { JourneyCard } from "@/features/journey/JourneyCard";
import { RouteMapPicker } from "@/features/journey/RouteMapPicker";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Input } from "@/components/ui/Input";
import { LocationSearchField } from "@/features/journey/LocationSearchField";
import toast from "react-hot-toast";

const DEFAULT_START_LAT = 13.0827; // Chennai Central default
const DEFAULT_START_LNG = 80.2707;
const DEFAULT_DEST_LAT = 12.9796;  // Chennai Airport default
const DEFAULT_DEST_LNG = 80.1637;

export default function JourneyPage() {
  const { journeys, activeJourney, progress, addJourney, setStatus, removeJourney } = useJourneys();
  const { places } = usePlaces();
  const { coords } = useLocation();

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [startName, setStartName] = useState("Central Station");
  const [startLat, setStartLat] = useState(DEFAULT_START_LAT);
  const [startLng, setStartLng] = useState(DEFAULT_START_LNG);

  const [destName, setDestName] = useState("Airport Terminal");
  const [destLat, setDestLat] = useState(DEFAULT_DEST_LAT);
  const [destLng, setDestLng] = useState(DEFAULT_DEST_LNG);

  const [alertDistance, setAlertDistance] = useState(1500); // 1.5 km default

  // Synchronize initial start with GPS if available and dialog opens
  useEffect(() => {
    if (showAdd && coords && startLat === DEFAULT_START_LAT && startLng === DEFAULT_START_LNG) {
      setStartLat(coords.lat);
      setStartLng(coords.lng);
      setStartName("Current Location");
    }
  }, [showAdd, coords, startLat, startLng]);

  // Reverse geocoding helper
  const reverseGeocode = async (lat: number, lng: number, setter: (val: string) => void) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) {
          const a = data.address || {};
          const parts = [];
          if (a.suburb || a.neighbourhood || a.road) parts.push(a.road || a.neighbourhood || a.suburb);
          if (a.city || a.town || a.village) parts.push(a.city || a.town || a.village);
          const formatted = parts.length > 0 ? parts.join(", ") : data.display_name.split(",").slice(0, 2).join(",");
          setter(formatted);
          return;
        }
      }
    } catch {
      // ignore
    }
    setter(`Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`);
  };

  const handleStartMapChange = (lat: number, lng: number) => {
    setStartLat(lat);
    setStartLng(lng);
    reverseGeocode(lat, lng, setStartName);
  };

  const handleDestMapChange = (lat: number, lng: number) => {
    setDestLat(lat);
    setDestLng(lng);
    reverseGeocode(lat, lng, setDestName);
  };

  const handleCreate = async () => {
    const finalName = name.trim() || `${startName} → ${destName}`;
    if (!startName || !destName) {
      toast.error("Please ensure Start and Destination locations are selected");
      return;
    }

    await addJourney({
      name: finalName,
      startName,
      startLat,
      startLng,
      destName,
      destLat,
      destLng,
      alertDistance,
    });

    toast.success("Trip created with map route!");
    setShowAdd(false);
    setName("");
  };

  return (
    <>
      <div className="flex flex-col w-full gap-space-xl pb-space-3xl animate-fade-in">
        {/* Top Greeting & Header Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg mt-space-md md:mt-0">
          <div className="flex flex-col gap-space-2xs">
            <div className="inline-flex items-center gap-space-xs text-primary">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                explore
              </span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold text-primary">
                Transit Mode
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
              Journey & Transit
            </h1>
            <p className="font-body-md text-body-md text-secondary">
              Stay grounded on the move. Nila monitors your path and chimes before your stop.
            </p>
          </div>

          {/* Action */}
          {!activeJourney && (
            <div className="flex items-center gap-space-md flex-shrink-0">
              <button
                className="group flex items-center gap-space-xs px-space-lg py-space-sm bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg rounded-full shadow-[0_12px_28px_-6px_rgba(158,54,92,0.3)] hover:shadow-[0_16px_32px_-4px_rgba(158,54,92,0.4)] transition-all duration-300 transform active:scale-95"
                onClick={() => setShowAdd(true)}
              >
                <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:rotate-90">
                  add
                </span>
                <span>New Trip</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-space-xl">
          {journeys.length === 0 ? (
            <EmptyState
              emoji="🚇"
              title="No active trips"
              description="Track your metro or bus rides and relax. You'll be alerted when approaching your stop."
            />
          ) : (
            <div className="flex flex-col gap-space-lg">
              {activeJourney && (
                <div className="flex flex-col gap-space-sm">
                  <h2 className="font-label-md text-label-md uppercase tracking-wider text-primary font-bold flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-[16px]">sensors</span>
                    Live Tracking
                  </h2>
                  <JourneyCard
                    journey={activeJourney}
                    progress={progress}
                    onStart={() => {}}
                    onComplete={() => setStatus(activeJourney.id, "completed")}
                    onCancel={() => setStatus(activeJourney.id, "cancelled")}
                    onDelete={() => removeJourney(activeJourney.id)}
                  />
                </div>
              )}

              {journeys.filter((j) => j.status !== "active").length > 0 && (
                <div className="flex flex-col gap-space-sm">
                  <h2 className="font-label-md text-label-md uppercase tracking-wider text-secondary font-bold flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-[16px]">history</span>
                    Saved & Past Trips
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                    {journeys
                      .filter((j) => j.status !== "active")
                      .map((journey) => (
                        <JourneyCard
                          key={journey.id}
                          journey={journey}
                          onStart={() => setStatus(journey.id, "active")}
                          onComplete={() => setStatus(journey.id, "completed")}
                          onCancel={() => removeJourney(journey.id)}
                          onDelete={() => removeJourney(journey.id)}
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Transit Trip BottomSheet */}
      <BottomSheet isOpen={showAdd} onClose={() => setShowAdd(false)} title="New Transit Trip">
        <div className="flex flex-col gap-space-md max-h-[80vh] overflow-y-auto pr-1">
          {/* Trip Name */}
          <Input
            label="Trip Name"
            placeholder="e.g. Daily Commute, Airport Express"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* Interactive Map Picker for BOTH Start and Destination */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">map</span>
              Select Start & Destination on Map
            </label>
            <p className="text-[11px] text-secondary">
              Toggle between Start (A) and Destination (B) to position both points on the map.
            </p>

            <RouteMapPicker
              startLat={startLat}
              startLng={startLng}
              destLat={destLat}
              destLng={destLng}
              onStartChange={handleStartMapChange}
              onDestChange={handleDestMapChange}
              height={260}
            />
          </div>

          {/* Location Names & Interactive Place/Station Search */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
            {/* Start Location (A) Search */}
            <LocationSearchField
              label="Start Location (A)"
              badge="start"
              value={startName}
              onChange={setStartName}
              onSelectLocation={(selectedName, lat, lng) => {
                setStartName(selectedName);
                setStartLat(lat);
                setStartLng(lng);
              }}
              placeholder="Search station, bus stop, or origin…"
              savedPlaces={places}
              onCurrentGpsClick={
                coords
                  ? () => {
                      setStartLat(coords.lat);
                      setStartLng(coords.lng);
                      reverseGeocode(coords.lat, coords.lng, setStartName);
                      toast("Start set to current GPS location", { icon: "📍" });
                    }
                  : undefined
              }
            />

            {/* Destination Location (B) Search */}
            <LocationSearchField
              label="Destination Location (B)"
              badge="dest"
              value={destName}
              onChange={setDestName}
              onSelectLocation={(selectedName, lat, lng) => {
                setDestName(selectedName);
                setDestLat(lat);
                setDestLng(lng);
              }}
              placeholder="Search station, bus stop, or landmark…"
              savedPlaces={places}
            />
          </div>

          {/* Alert Distance Selection */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-surface-container-low border border-outline-variant/50">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-primary">notifications_active</span>
                Alert Distance Before Stop
              </label>
              <span className="text-xs font-bold text-primary">
                {alertDistance >= 1000 ? `${(alertDistance / 1000).toFixed(1)} km` : `${alertDistance} m`}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 mt-1">
              {[500, 1000, 1500, 2000].map((dist) => (
                <button
                  key={dist}
                  type="button"
                  onClick={() => setAlertDistance(dist)}
                  className={[
                    "py-1.5 rounded-lg text-xs font-semibold border transition-all text-center",
                    alertDistance === dist
                      ? "bg-primary text-on-primary border-primary shadow-sm"
                      : "bg-surface-container-lowest border-outline-variant/40 text-secondary hover:bg-surface-container",
                  ].join(" ")}
                >
                  {dist >= 1000 ? `${dist / 1000} km` : `${dist} m`}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-space-sm pt-2">
            <Button variant="secondary" fullWidth onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button fullWidth onClick={handleCreate}>
              Save Trip
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
