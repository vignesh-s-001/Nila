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
      className="block group p-3.5 sm:p-4 rounded-none bg-white/90 hover:bg-white border border-pink-100/70 shadow-[0_2px_10px_-2px_rgba(158,54,92,0.04)] hover:shadow-[0_4px_16px_-2px_rgba(158,54,92,0.08)] hover:-translate-y-0.5 transition-all duration-200"
      aria-label={`${place.emoji} ${place.name} — ${taskCount} tasks`}
    >
      <div className="flex items-center gap-3">
        {/* Emoji Box */}
        <div
          className="w-10 h-10 rounded-none overflow-hidden flex-shrink-0 relative shadow-2xs flex items-center justify-center text-xl transition-transform duration-300 group-hover:scale-105 border border-pink-100/60"
          style={{ backgroundColor: `${colorHex}18` }}
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
              <span className="inline-flex items-center gap-1 text-[11px] text-pink-700 font-semibold bg-pink-100/90 border border-pink-200/80 px-2 py-0.5 rounded-full shadow-2xs flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping"></span>
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
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-100/70 text-pink-800 text-[11px] font-medium border border-pink-200/50 shadow-2xs">
                <span>🌸</span>
                <span>{taskCount} {taskCount === 1 ? "intention" : "intentions"}</span>
              </span>
            )}
            {noteCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100/80 text-secondary text-[11px] font-medium border border-stone-200/60 shadow-2xs">
                <span>📝</span>
                <span>{noteCount} note{noteCount !== 1 ? "s" : ""}</span>
              </span>
            )}
            {taskCount === 0 && noteCount === 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-50 text-stone-500 text-[11px] font-medium border border-stone-200/50 shadow-2xs">
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
