"use client";

import Link from "next/link";
import type { Place } from "@/core/types";
import { getPlaceColorHex } from "@/core/constants";

interface PlaceCardProps {
  place: Place;
  taskCount?: number;
  noteCount?: number;
  isActive?: boolean;
}

export function PlaceCard({ place, taskCount = 0, noteCount = 0, isActive = false }: PlaceCardProps) {
  const colorHex = getPlaceColorHex(place.color);

  return (
    <Link
      href={`/places/${place.id}`}
      id={`place-card-${place.id}`}
      className="block group p-3.5 sm:p-4 rounded-none bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
      aria-label={`${place.emoji} ${place.name} — ${taskCount} tasks`}
    >
      <div className="flex items-center gap-3">
        {/* Emoji Box */}
        <div
          className="w-10 h-10 rounded-none overflow-hidden flex-shrink-0 relative flex items-center justify-center text-xl transition-transform duration-300 group-hover:scale-105 border border-outline-variant/30"
          style={{ backgroundColor: `${colorHex}22` }}
        >
          {place.emoji}
        </div>

        {/* Info */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-sm font-semibold text-on-surface truncate">
              {place.name}
            </span>
            {isActive && (
              <span className="inline-flex items-center gap-1 text-[11px] text-primary font-semibold bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                Current
              </span>
            )}
          </div>
          
          {place.address && (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-secondary/60 text-[12px]">pin_drop</span>
              <span className="text-xs text-secondary truncate">
                {place.address}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {taskCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/8 text-primary text-[11px] font-medium border border-primary/15">
                <span>🌸</span>
                <span>{taskCount} {taskCount === 1 ? "intention" : "intentions"}</span>
              </span>
            )}
            {noteCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container text-[11px] font-medium border border-secondary-container/30">
                <span>📝</span>
                <span>{noteCount} note{noteCount !== 1 ? "s" : ""}</span>
              </span>
            )}
            {taskCount === 0 && noteCount === 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-secondary text-[11px] font-medium border border-outline-variant/40">
                <span>🌿</span>
                <span>Quiet space</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
