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
    <div className="card flex flex-col overflow-hidden transition-all duration-200">
      {/* Header */}
      <div 
        className="p-3 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <h3 className="text-sm font-bold truncate" style={{ color: "var(--text-primary)" }}>
            {checklist.name}
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[var(--border-default)] rounded-full overflow-hidden max-w-[120px]">
              <div 
                className="h-full bg-[var(--accent)] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
              {completedCount}/{totalCount}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1 ml-2">
          {expanded ? <ChevronUp size={18} style={{ color: "var(--text-tertiary)" }} /> : <ChevronDown size={18} style={{ color: "var(--text-tertiary)" }} />}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-[var(--border-default)] p-3 flex flex-col gap-3 bg-[var(--bg-secondary)]">
          
          {/* Actions */}
          <div className="flex justify-end gap-2 mb-1">
            <button
              onClick={onReset}
              className="text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              <RotateCcw size={12} /> Uncheck all
            </button>
            <button
              onClick={onDeleteList}
              className="text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-[var(--danger-light)] transition-colors"
              style={{ color: "var(--danger)" }}
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
                    "flex-1 text-sm cursor-pointer leading-snug transition-colors",
                    item.completed ? "line-through opacity-60" : ""
                  ].join(" ")}
                  style={{ color: "var(--text-primary)" }}
                >
                  {item.text}
                </label>
                <button
                  onClick={() => onDeleteItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--danger-light)] transition-all"
                  style={{ color: "var(--danger)" }}
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
              className="flex-1 h-9 rounded-[8px] pl-3 pr-9 text-sm bg-[var(--bg-tertiary)] border border-[var(--border-default)] focus:outline-none focus:border-[var(--accent)]"
              style={{ color: "var(--text-primary)" }}
            />
            <button
              type="submit"
              disabled={!newItemText.trim()}
              className="absolute right-1 w-7 h-7 flex items-center justify-center rounded-[6px] bg-[var(--accent)] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
