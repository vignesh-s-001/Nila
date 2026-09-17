"use client";

import { Train, Navigation, CheckCircle2 } from "lucide-react";
import type { Journey, JourneyProgress } from "@/core/types";
import { Button } from "@/components/ui/Button";

interface JourneyCardProps {
  journey: Journey;
  progress?: JourneyProgress | null;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export function JourneyCard({ journey, progress, onStart, onComplete, onCancel, onDelete }: JourneyCardProps) {
  const isActive = journey.status === "active";
  const isCompleted = journey.status === "completed";
  const handleDelete = onDelete ?? onCancel;

  return (
    <div className="card overflow-hidden transition-all duration-300">
      {/* Header */}
      <div 
        className="p-4 border-b border-[var(--border-muted)]"
        style={{ 
          background: isActive ? "var(--accent-light)" : "var(--bg-tertiary)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
              style={{ background: isActive ? "var(--accent)" : "var(--bg-elevated)", color: isActive ? "white" : "var(--text-tertiary)" }}
            >
              <Train size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: isActive ? "var(--accent)" : "var(--text-primary)" }}>
                {journey.name}
              </h3>
              <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                {journey.status}
              </p>
            </div>
          </div>

          {/* Delete icon button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-error-container hover:text-on-error-container transition-colors text-secondary"
            title="Delete trip"
            aria-label={`Delete ${journey.name}`}
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-4">
        {/* Route visualization */}
        <div className="flex items-center gap-3 px-2">
          <div className="flex flex-col items-center gap-1">
            <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: "var(--accent)" }} />
            <div className="w-0.5 h-8 bg-dashed" style={{ backgroundImage: "linear-gradient(to bottom, var(--border-default) 50%, transparent 50%)", backgroundSize: "100% 4px" }} />
            <div className="w-3 h-3 rounded-full" style={{ background: "var(--danger)" }} />
          </div>
          <div className="flex flex-col justify-between py-0.5 h-14">
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{journey.startName}</p>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{journey.destName}</p>
          </div>
        </div>

        {/* Live Progress */}
        {isActive && progress && (
          <div className="bg-[var(--bg-tertiary)] rounded-[12px] p-3 flex flex-col gap-2 mt-2">
            <div className="flex items-center justify-between text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              <span>Distance remaining</span>
              <span style={{ color: progress.approachingDestination ? "var(--danger)" : "var(--accent)" }}>
                {(progress.distanceToDestination / 1000).toFixed(1)} km
              </span>
            </div>
            <div className="h-2 w-full bg-[var(--border-default)] rounded-full overflow-hidden">
               {/* Just a mockup progress bar */}
               <div className="h-full bg-[var(--accent)] w-[60%]" />
            </div>
            {progress.approachingDestination && (
              <p className="text-xs font-bold text-center mt-1" style={{ color: "var(--danger)" }}>
                Approaching Destination! Get ready.
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-2">
          {journey.status === "planned" && (
            <>
              <Button size="sm" fullWidth onClick={onStart}>
                <Navigation size={14} /> Start
              </Button>
              <Button size="sm" fullWidth variant="danger" onClick={handleDelete}>
                <span className="material-symbols-outlined text-[16px]">delete</span> Delete
              </Button>
            </>
          )}
          {journey.status === "active" && (
            <>
              <Button size="sm" fullWidth variant="primary" onClick={onComplete}>
                <CheckCircle2 size={14} /> Finish
              </Button>
              <Button size="sm" fullWidth variant="secondary" onClick={onCancel}>
                Stop
              </Button>
            </>
          )}
          {(journey.status === "completed" || journey.status === "cancelled") && (
            <>
              <Button size="sm" fullWidth variant="secondary" onClick={onStart}>
                <Navigation size={14} /> Restart
              </Button>
              <Button size="sm" fullWidth variant="danger" onClick={handleDelete}>
                <span className="material-symbols-outlined text-[16px]">delete</span> Delete
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
