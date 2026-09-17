"use client";

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, leftIcon, rightIcon, className = "", id, ...props }, ref) => {
    const inputId = id ?? `input-${Math.random().toString(36).slice(2, 8)}`;
    return (
      <div className="flex flex-col gap-space-sm w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="font-label-sm text-label-sm text-on-surface-variant font-medium"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span
              className="absolute left-space-md flex items-center text-secondary"
            >
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              "w-full h-11 rounded-full px-space-md font-body-sm text-body-sm transition-all duration-150",
              "bg-surface-container-low text-on-surface border border-outline-variant",
              "placeholder:text-secondary/60",
              "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-container",
              error ? "border-error focus:border-error focus:ring-error-container" : "",
              leftIcon ? "pl-11" : "",
              rightIcon ? "pr-11" : "",
              className,
            ].join(" ")}
            {...props}
          />
          {rightIcon && (
            <span
              className="absolute right-space-md flex items-center text-secondary"
            >
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p className="font-label-sm text-label-sm text-error font-medium">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="font-label-sm text-label-sm text-secondary">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

// ─── Textarea ──────────────────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className = "", id, ...props }, ref) => {
    const textareaId = id ?? `textarea-${Math.random().toString(36).slice(2, 8)}`;
    return (
      <div className="flex flex-col gap-space-sm w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="font-label-sm text-label-sm text-on-surface-variant font-medium"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={[
            "w-full rounded-lg px-space-md py-space-sm font-body-sm text-body-sm transition-all duration-150 resize-none",
            "bg-surface-container-low text-on-surface border border-outline-variant",
            "placeholder:text-secondary/60",
            "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-container",
            error ? "border-error focus:border-error focus:ring-error-container" : "",
            className,
          ].join(" ")}
          {...props}
        />
        {error && (
          <p className="font-label-sm text-label-sm text-error font-medium">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="font-label-sm text-label-sm text-secondary">
            {hint}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
