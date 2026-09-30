"use client";

import { useState } from "react";
import type { Task, Place } from "@/core/types";
import { PRIORITY_CONFIG, TRIGGER_LABELS } from "@/core/constants";
import { format } from "date-fns";

interface TaskItemProps {
  task: Task;
  place?: Place;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
  onEdit?: (task: Task) => void;
  showPlace?: boolean;
}

export function TaskItem({
  task,
  place,
  onToggle,
  onDelete,
  onEdit,
  showPlace = false,
}: TaskItemProps) {
  const [expanded, setExpanded] = useState(false);
  const priorityCfg = PRIORITY_CONFIG[task.priority];

  return (
    <div
      id={`task-${task.id}`}
      className={[
        "group flex flex-col rounded-none p-3.5 sm:p-4 transition-all duration-200 border",
        task.completed
          ? "opacity-60 bg-surface-container-lowest/60 border-outline-variant/30"
          : "bg-surface-container-lowest hover:bg-surface-container border-outline-variant/50 shadow-sm hover:shadow-md hover:-translate-y-0.5",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          className="ctx-checkbox mt-0.5"
          checked={task.completed}
          onChange={() => onToggle(task)}
          aria-label={`Mark "${task.title}" as ${task.completed ? "incomplete" : "complete"}`}
          id={`checkbox-${task.id}`}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <label
            htmlFor={`checkbox-${task.id}`}
            className={[
              "block text-sm font-medium cursor-pointer leading-tight truncate",
              task.completed ? "line-through text-on-surface-variant" : "text-on-surface",
            ].join(" ")}
          >
            {task.title}
          </label>

          {/* Meta badges */}
          <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
            {/* Priority Badge */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold leading-tight ${
              task.priority === "high"
                ? "bg-error-container/60 text-on-error-container border border-error-container/40"
                : task.priority === "medium"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-surface-container text-secondary border border-outline-variant/40"
            }`}>
              <span className="text-[9px]">✦</span>
              {priorityCfg.label}
            </span>

            {showPlace && place && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium leading-tight bg-tertiary-container/40 text-on-tertiary-container border border-tertiary-container/30">
                <span>{place.emoji}</span>
                <span>{place.name}</span>
              </span>
            )}

            {task.triggerType !== "NONE" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium leading-tight bg-secondary-container/40 text-on-secondary-container border border-secondary-container/30">
                <span className="material-symbols-outlined text-[12px]">
                  {task.triggerType === "ENTER" ? "near_me" : "logout"}
                </span>
                {TRIGGER_LABELS[task.triggerType]}
              </span>
            )}

            {/* Timing badges */}
            {task.triggerType !== "NONE" && task.timeStart && task.timeEnd && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium leading-tight bg-primary/8 text-primary border border-primary/20">
                <span className="material-symbols-outlined text-[12px]">schedule</span>
                {task.timeStart} – {task.timeEnd}
              </span>
            )}

            {task.triggerType !== "NONE" && !task.timeStart && !task.timeEnd && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium leading-tight bg-surface-container text-secondary border border-outline-variant/40">
                <span className="material-symbols-outlined text-[12px]">all_inclusive</span>
                Any time
              </span>
            )}

            {task.dueDate && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium leading-tight bg-surface-container text-secondary border border-outline-variant/40">
                <span className="material-symbols-outlined text-[12px]">event</span>
                {format(new Date(task.dueDate), "MMM d")}
                {task.dueTime ? ` ${task.dueTime}` : ""}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-primary/10 hover:text-primary transition-all text-secondary/70"
              aria-label={`Edit "${task.title}"`}
              title="Edit Intention"
            >
              <span className="material-symbols-outlined text-[15px]">edit</span>
            </button>
          )}
          {task.description && (
            <button
              onClick={() => setExpanded((prev) => !prev)}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-primary/10 hover:text-primary transition-all text-secondary/70"
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              <span className="material-symbols-outlined text-[15px]">
                {expanded ? "expand_less" : "expand_more"}
              </span>
            </button>
          )}
          <button
            onClick={() => onDelete(task.id)}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-error-container hover:text-on-error-container transition-all text-secondary/70"
            aria-label={`Delete "${task.title}"`}
          >
            <span className="material-symbols-outlined text-[15px]">delete</span>
          </button>
        </div>
      </div>

      {/* Description */}
      {expanded && task.description && (
        <p className="mt-2 ml-7 text-xs text-secondary leading-relaxed bg-surface-container p-2 rounded border border-outline-variant/30">
          {task.description}
        </p>
      )}
    </div>
  );
}
