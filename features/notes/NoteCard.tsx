"use client";

import { useState } from "react";
import { Trash2, FileText } from "lucide-react";
import type { Note } from "@/core/types";
import { format } from "date-fns";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface NoteCardProps {
  note: Note;
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: Partial<Note>) => Promise<boolean>;
}

export function NoteCard({ note, onDelete, onEdit }: NoteCardProps) {
  const [editing, setEditing]   = useState(false);
  const [title, setTitle]       = useState(note.title);
  const [content, setContent]   = useState(note.content);
  const [saving, setSaving]     = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const ok = await onEdit(note.id, { title: title.trim(), content: content.trim() });
    setSaving(false);
    if (ok) setEditing(false);
  };

  return (
    <>
      <div
        id={`note-${note.id}`}
        className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-4 cursor-pointer hover:bg-surface-container hover:shadow-md transition-all"
        onClick={() => setEditing(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setEditing(true)}
        aria-label={`Note: ${note.title}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <FileText size={16} className="mt-0.5 flex-shrink-0 text-secondary" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold truncate text-on-surface">
                {note.title}
              </h4>
              {note.content && (
                <p className="text-xs mt-1 line-clamp-2 leading-relaxed text-secondary">
                  {note.content}
                </p>
              )}
              <p className="text-xs mt-2 text-secondary/60">
                {format(new Date(note.updatedAt), "MMM d, h:mm a")}
              </p>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-error-container/40 hover:text-on-error-container transition-colors text-secondary flex-shrink-0"
            aria-label={`Delete note "${note.title}"`}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Edit sheet */}
      <BottomSheet isOpen={editing} onClose={() => setEditing(false)} title="Edit Note">
        <div className="flex flex-col gap-4">
          <Input
            id="edit-note-title"
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <Textarea
            id="edit-note-content"
            label="Content"
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note…"
          />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button fullWidth loading={saving} onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
