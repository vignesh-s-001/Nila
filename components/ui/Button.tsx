"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<Variant, string> = {
  primary:   "bg-primary text-on-primary hover:bg-primary-container active:scale-[0.98] shadow-sm",
  secondary: "bg-surface-container-low text-secondary hover:bg-secondary-container",
  ghost:     "bg-transparent text-secondary hover:bg-secondary-container/50",
  danger:    "bg-error text-on-error hover:opacity-90 active:scale-[0.98]",
  outline:   "bg-transparent border border-outline-variant text-on-surface hover:bg-surface-container",
};

const SIZE_STYLES: Record<Size, string> = {
  sm: "h-8 px-space-md text-label-sm rounded-full gap-1.5",
  md: "h-10 px-space-lg text-label-md rounded-full gap-2",
  lg: "h-12 px-space-xl text-label-lg rounded-full gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          "inline-flex items-center justify-center font-semibold",
          "transition-all duration-150 cursor-pointer select-none",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          VARIANT_STYLES[variant],
          SIZE_STYLES[size],
          fullWidth ? "w-full" : "",
          className,
        ].join(" ")}
        {...props}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";
