"use client";

import { useState } from "react";
import { Plus, Trash2, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import type { Checklist, ChecklistItem } from "@/core/types";

interface ChecklistCardProps {
  checklist: Checklist;
  items: ChecklistItem[];
  onToggleItem: (id: string) => void;
  onAddItem: (text: string) => void;
  onDeleteItem: (id: string) => void;
  onReset: () => void;
  onDeleteList: () => void;
}

export function ChecklistCard({
  checklist,
  items,
  onToggleItem,
  onAddItem,
  onDeleteItem,
  onReset,
  onDeleteList,
}: ChecklistCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [newItemText, setNewItemText] = useState("");

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const progress = totalCount === 0 ? 0 : (completedCount / totalCount) * 100;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    onAddItem(newItemText.trim());
    setNewItemText("");
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-sm flex flex-col overflow-hidden transition-all duration-200">
      {/* Header */}
      <div
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-surface-container transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <h3 className="text-sm font-bold truncate text-on-surface">
            {checklist.name}
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-outline-variant/40 rounded-full overflow-hidden max-w-[120px]">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-medium text-secondary">
              {completedCount}/{totalCount}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 ml-2">
          {expanded
            ? <ChevronUp size={18} className="text-secondary" />
            : <ChevronDown size={18} className="text-secondary" />}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-outline-variant/30 p-3 flex flex-col gap-3 bg-surface-container/40">

          {/* Actions */}
          <div className="flex justify-end gap-2 mb-1">
            <button
              onClick={onReset}
              className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-surface-container transition-colors text-secondary"
            >
              <RotateCcw size={12} /> Uncheck all
            </button>
            <button
              onClick={onDeleteList}
              className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-error-container/30 transition-colors text-error"
            >
              <Trash2 size={12} /> Delete List
            </button>
          </div>

          {/* Items */}
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-start gap-3 group">
                <input
                  type="checkbox"
                  className="ctx-checkbox mt-0.5"
                  checked={item.completed}
                  onChange={() => onToggleItem(item.id)}
                  id={`item-${item.id}`}
                />
                <label
                  htmlFor={`item-${item.id}`}
                  className={[
                    "flex-1 text-sm cursor-pointer leading-snug transition-colors text-on-surface",
                    item.completed ? "line-through opacity-60" : "",
                  ].join(" ")}
                >
                  {item.text}
                </label>
                <button
                  onClick={() => onDeleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-error-container/30 transition-all text-error"
                  aria-label="Delete item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Add Item Form */}
          <form onSubmit={handleAdd} className="mt-2 flex items-center gap-2 relative">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              placeholder="Add an item..."
              className="flex-1 h-9 rounded-xl pl-3 pr-9 text-sm bg-surface-container border border-outline-variant text-on-surface placeholder:text-secondary/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
            />
            <button
              type="submit"
              disabled={!newItemText.trim()}
              className="absolute right-1 w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-on-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
