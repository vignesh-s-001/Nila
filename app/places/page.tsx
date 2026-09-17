"use client";

import { useState } from "react";
import { usePlaces } from "@/hooks/usePlaces";
import { useTasks } from "@/hooks/useTasks";
import { PlaceCard } from "@/features/places/PlaceCard";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { PlaceForm } from "@/features/places/PlaceForm";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAppStore } from "@/store/appStore";

export default function PlacesPage() {
  const { places, loading, addPlace } = usePlaces();
  const { tasks } = useTasks();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating]     = useState(false);
  const userContext = useAppStore((s) => s.userContext);

  const taskCountByPlace = (placeId: string) =>
    tasks.filter((t) => t.placeId === placeId && !t.completed).length;

  return (
    <>
      <div className="flex flex-col w-full gap-space-xl pb-space-3xl animate-fade-in">
        
        {/* Top Greeting & Header Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg mt-space-md md:mt-0">
          <div className="flex flex-col gap-space-2xs">
            <div className="inline-flex items-center gap-space-xs text-primary">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>cottage</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold text-primary">Sacred Spaces</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">My Places</h1>
            <p className="font-body-md text-body-md text-secondary">Sanctuaries where life happens. Let Nila hold the details.</p>
          </div>
          
          {/* Action */}
          <div className="flex items-center gap-space-md flex-shrink-0">
            <button 
              id="btn-add-place"
              className="group flex items-center gap-space-xs px-space-lg py-space-sm bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg rounded-full shadow-[0_12px_28px_-6px_rgba(158,54,92,0.3)] hover:shadow-[0_16px_32px_-4px_rgba(158,54,92,0.4)] transition-all duration-300 transform active:scale-95"
              onClick={() => setShowCreate(true)}
            >
              <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:rotate-90">add_location_alt</span>
              <span>Create Sanctuary</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-space-lg">
          {places.length === 0 && !loading ? (
            <EmptyState
              emoji="📍"
              title="No places yet"
              description="Create your first sanctuary to get location-aware reminders."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-md">
              {places.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  taskCount={taskCountByPlace(place.id)}
                  isActive={userContext?.currentPlace?.id === place.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create place sheet */}
      <BottomSheet
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Sanctuary"
      >
        <PlaceForm
          onSubmit={async (input) => {
            setCreating(true);
            await addPlace(input);
            setCreating(false);
            setShowCreate(false);
          }}
          onCancel={() => setShowCreate(false)}
          loading={creating}
        />
      </BottomSheet>
    </>
  );
}
