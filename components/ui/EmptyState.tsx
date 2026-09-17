"use client";

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ emoji = "📭", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-space-xl text-center rounded-lg bg-surface-container-low/50 border border-dashed border-outline-variant/60">
      <span className="text-4xl mb-space-sm" role="img" aria-hidden="true">
        {emoji}
      </span>
      <div className="flex flex-col gap-1">
        <h3 className="font-title-md text-title-md text-on-surface">
          {title}
        </h3>
        {description && (
          <p className="font-body-sm text-body-sm text-secondary">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-space-md">{action}</div>}
    </div>
  );
}
