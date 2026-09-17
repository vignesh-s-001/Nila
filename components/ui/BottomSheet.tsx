"use client";

import { useEffect, useRef } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 overflow-y-auto">
      {/* Overlay Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Centered Panel */}
      <div
        ref={panelRef}
        className="relative z-10 w-full md:max-w-xl bg-surface-container-lowest rounded-t-[28px] md:rounded-[28px] p-6 md:p-8 max-h-[92dvh] md:max-h-[85vh] overflow-y-auto shadow-2xl my-auto"
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Dialog"}
      >
        <div className="w-10 h-1 bg-outline-variant/60 rounded-full mx-auto mb-5 md:hidden" />
        {title && (
          <div className="flex items-center justify-between mb-space-md">
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-surface-container text-secondary"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
