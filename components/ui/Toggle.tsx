"use client";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

export function Toggle({ checked, onChange, label, description, disabled, id }: ToggleProps) {
  const toggleId = id ?? `toggle-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className="flex items-center justify-between gap-space-md">
      {(label || description) && (
        <div className="flex flex-col gap-1">
          {label && (
            <label
              htmlFor={toggleId}
              className="font-title-md text-title-md text-on-surface cursor-pointer"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="font-body-sm text-body-sm text-secondary">
              {description}
            </p>
          )}
        </div>
      )}
      <button
        id={toggleId}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full",
          "border-2 border-transparent transition-colors duration-200 ease-in-out",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-container",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          checked ? "bg-primary" : "bg-outline-variant",
        ].join(" ")}
      >
        <span
          className={[
            "pointer-events-none inline-block h-6 w-6 transform rounded-full",
            "bg-on-primary shadow-sm ring-0 transition duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </button>
    </div>
  );
}
