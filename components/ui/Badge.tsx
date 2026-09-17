"use client";

type Variant = "default" | "success" | "warning" | "danger" | "accent" | "priority-high" | "priority-medium" | "priority-low";

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

const VARIANT_STYLES: Record<Variant, string> = {
  default:          "bg-surface-container text-secondary",
  success:          "bg-tertiary-fixed text-on-tertiary-fixed",
  warning:          "bg-secondary-container text-on-secondary-container",
  danger:           "bg-error-container text-on-error-container",
  accent:           "bg-primary-container text-on-primary-container",
  "priority-high":   "bg-primary-fixed text-on-primary-fixed font-semibold",
  "priority-medium": "bg-secondary-fixed text-on-secondary-fixed font-semibold",
  "priority-low":    "bg-surface-container-high text-on-surface-variant",
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-space-xs px-space-sm py-0.5 rounded-full",
        "font-label-sm text-label-sm",
        VARIANT_STYLES[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
