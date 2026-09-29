"use client";

import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPlace } from "@/services/database/places";
import { useTasks } from "@/hooks/useTasks";
import { useNotes } from "@/hooks/useNotes";
import { usePlaces } from "@/hooks/usePlaces";
import { TaskItem } from "@/features/tasks/TaskItem";
import { TaskForm } from "@/features/tasks/TaskForm";
import { NoteCard } from "@/features/notes/NoteCard";
import { ChecklistCard } from "@/features/checklists/ChecklistCard";
import { useChecklists } from "@/hooks/useChecklists";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Textarea } from "@/components/ui/Input";
import { getPlaceColorHex } from "@/core/constants";
import type { Note, Task } from "@/core/types";
import toast from "react-hot-toast";

type Tab = "tasks" | "notes" | "checklists";

export default function PlaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router  = useRouter();

  const [place, setPlace] = useState<Awaited<ReturnType<typeof getPlace>>>(undefined);
  useEffect(() => {
    getPlace(id).then(setPlace);
  }, [id]);
  const { tasks, toggleTask, removeTask, addTask, editTask } = useTasks(id);
  const { notes, addNote, editNote, removeNote }   = useNotes(id);
  const { checklists, allItems, addList, addItem, toggleItem, removeItem, resetList, removeList } = useChecklists(id);
  const { removePlace }                            = usePlaces();

  const [tab, setTab]             = useState<Tab>("tasks");
  const [showAddTask, setShowAddTask]   = useState(false);
  const [editingTask, setEditingTask]   = useState<Task | null>(null);
  const [addingTask, setAddingTask]     = useState(false);
  const [showAddNote, setShowAddNote]   = useState(false);
  const [addingNote, setAddingNote]     = useState(false);
  const [noteTitle, setNoteTitle]       = useState("");
  const [noteContent, setNoteContent]   = useState("");
  const [showAddChecklist, setShowAddChecklist] = useState(false);
  const [newChecklistName, setNewChecklistName] = useState("");
  const [addingChecklist, setAddingChecklist]   = useState(false);
  const [showDelete, setShowDelete]     = useState(false);
  const [showLocationCard, setShowLocationCard] = useState(true);

  if (!place) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-body-md text-secondary">Loading sanctuary…</p>
      </div>
    );
  }

  const colorHex      = getPlaceColorHex(place.color);
  const incompleteTasks = tasks.filter((t) => !t.completed);
  const completedTasks  = tasks.filter((t) => t.completed);

  const handleDelete = async () => {
    await removePlace(place.id, place.name);
    router.push("/places");
  };

  const handleAddNote = async () => {
    if (!noteTitle.trim()) { toast.error("Title is required"); return; }
    setAddingNote(true);
    await addNote({ title: noteTitle.trim(), content: noteContent.trim(), placeId: id });
    setAddingNote(false);
    setNoteTitle("");
    setNoteContent("");
    setShowAddNote(false);
  };

  const handleAddChecklist = async () => {
    if (!newChecklistName.trim()) { toast.error("Name is required"); return; }
    setAddingChecklist(true);
    await addList(newChecklistName.trim(), id);
    setAddingChecklist(false);
    setNewChecklistName("");
    setShowAddChecklist(false);
  };

  return (
    <>
      <div className="flex flex-col w-full gap-space-xl pb-space-3xl animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-space-md mt-space-md md:mt-0">
          <div className="flex items-center gap-space-sm">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-secondary hover:text-on-surface"
              aria-label="Go back"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="flex items-center gap-space-sm">
              <span className="text-3xl bg-surface-container/50 w-12 h-12 rounded-full flex items-center justify-center">{place.emoji}</span>
              <h1 className="font-headline-sm text-headline-sm text-on-surface font-semibold tracking-tight">
                {place.name}
              </h1>
            </div>
          </div>
          <button
            onClick={() => setShowDelete(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-error-container text-secondary hover:text-error transition-colors"
            aria-label="Delete place"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>

        {/* Hero bar */}
        {showLocationCard && (
        <div
          className="relative rounded-2xl p-space-lg flex flex-col sm:flex-row sm:items-center justify-between gap-space-md shadow-sm"
          style={{ background: `${colorHex}15`, borderLeft: `6px solid ${colorHex}` }}
        >
          {/* Close button */}
          <button
            onClick={() => setShowLocationCard(false)}
            className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full text-secondary hover:bg-black/10 transition-colors"
            title="Dismiss"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>

          <div className="flex flex-col gap-1">
            <p className="font-label-sm text-label-sm uppercase tracking-wider font-semibold" style={{ color: colorHex }}>
              Location Details
            </p>
            <p className="font-title-md text-title-md text-on-surface font-medium">
              {place.address || `${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}`}
            </p>
            <p className="font-body-sm text-body-sm text-secondary">
              {place.radius}m radius • {incompleteTasks.length} pending intention{incompleteTasks.length !== 1 ? "s" : ""}
            </p>
          </div>

          <button
            id="btn-test-arrival"
            type="button"
            onClick={async () => {
              if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
                await Notification.requestPermission();
              }

              // Set demo mode ON and simulate being outside first, then entering the place
              // This guarantees an ENTER event even if the user is already "here" in the context engine
              const { useAppStore: appStore } = await import("@/store/appStore");
              const state = appStore.getState();

              // Enable demo mode so cooldown is bypassed
              state.setDemoMode(true, "Outside", { lat: place.lat + 0.05, lng: place.lng + 0.05, accuracy: 5 });

              toast("Testing arrival alert…", { icon: "🔔" });

              // After a short moment, simulate arriving at this place — fires ENTER event
              setTimeout(async () => {
                appStore.getState().setDemoMode(true, place.name, { lat: place.lat, lng: place.lng, accuracy: 5 });

                // Also directly fire the notification engine to guarantee the alert fires
                // even if the context engine dedup skips the event
                setTimeout(async () => {
                  const { processContextEvent } = await import("@/services/notifications/notificationEngine");
                  await processContextEvent({
                    currentPlace: place,
                    event: "ENTER",
                    nearbyPlaces: [],
                    coords: { lat: place.lat, lng: place.lng, accuracy: 5 },
                    timestamp: new Date().toISOString(),
                  });
                }, 350);
              }, 300);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold self-start sm:self-center transition-all shadow-sm hover:opacity-90 active:scale-[0.98] text-white"
            style={{ background: colorHex }}
            title="Test your arrival alert and intentions for this place"
          >
            <span className="material-symbols-outlined text-[16px]">notifications_active</span>
            Test Arrival Alert
          </button>
        </div>
        )}

        {/* Tabs */}
        <div className="flex bg-surface-container-low rounded-full p-1 gap-1 mx-1">
          {(["tasks", "notes", "checklists"] as Tab[]).map((t) => (
            <button
              key={t}
              id={`tab-${t}`}
              onClick={() => setTab(t)}
              className={[
                "flex-1 h-10 rounded-full font-label-md text-label-md font-semibold capitalize transition-all",
                tab === t
                  ? "bg-surface-container-lowest text-on-surface shadow-sm"
                  : "text-secondary hover:bg-surface-container hover:text-on-surface",
              ].join(" ")}
            >
              {t === "tasks" ? "Intentions" : t}
              {t === "tasks" && incompleteTasks.length > 0 && (
                <span
                  className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-primary text-on-primary"
                >
                  {incompleteTasks.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-space-md">
          {/* Tasks tab */}
          {tab === "tasks" && (
            <>
              <Button
                id="btn-add-task"
                variant="secondary"
                fullWidth
                onClick={() => setShowAddTask(true)}
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add Intention
              </Button>

              {incompleteTasks.length === 0 && completedTasks.length === 0 ? (
                <EmptyState
                  emoji="✨"
                  title="No intentions yet"
                  description="Add tasks to remember when you're here"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  {incompleteTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggle={toggleTask}
                      onDelete={removeTask}
                      onEdit={(t) => setEditingTask(t)}
                    />
                  ))}
                  {completedTasks.length > 0 && (
                    <div className="col-span-full mt-space-sm flex flex-col gap-space-sm opacity-80">
                      <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
                        Completed
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                        {completedTasks.map((task) => (
                          <TaskItem
                            key={task.id}
                            task={task}
                            onToggle={toggleTask}
                            onDelete={removeTask}
                            onEdit={(t) => setEditingTask(t)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Notes tab */}
          {tab === "notes" && (
            <>
              <Button
                id="btn-add-note"
                variant="secondary"
                fullWidth
                onClick={() => setShowAddNote(true)}
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add Note
              </Button>
              {notes.length === 0 ? (
                <EmptyState emoji="📝" title="No notes yet" description="Keep important info for this place" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                  {notes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onDelete={removeNote}
                      onEdit={(noteId, updates) => editNote(noteId, updates as Partial<Omit<Note, "id" | "createdAt">>)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Checklists tab */}
          {tab === "checklists" && (
            <>
              <Button
                id="btn-add-checklist"
                variant="secondary"
                fullWidth
                onClick={() => setShowAddChecklist(true)}
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add Checklist
              </Button>
              {checklists.length === 0 ? (
                <EmptyState emoji="📋" title="No checklists" description="Create a packing list or routine" />
              ) : (
                <div className="grid grid-cols-1 gap-space-md">
                  {checklists.map((list) => {
                    const listItems = allItems.filter(i => i.checklistId === list.id);
                    return (
                      <ChecklistCard
                        key={list.id}
                        checklist={list}
                        items={listItems}
                        onToggleItem={toggleItem}
                        onAddItem={(text) => addItem(list.id, text, listItems.length)}
                        onDeleteItem={removeItem}
                        onReset={() => resetList(list.id)}
                        onDeleteList={() => removeList(list.id)}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Task sheet */}
      <BottomSheet isOpen={showAddTask} onClose={() => setShowAddTask(false)} title="Add Intention">
        <TaskForm
          defaultPlaceId={id}
          onSubmit={async (input) => {
            setAddingTask(true);
            await addTask(input);
            setAddingTask(false);
            setShowAddTask(false);
            // If user is physically at this place right now, fire alert immediately
            const { triggerPresenceCheckForPlace } = await import(
              "@/services/notifications/notificationEngine"
            );
            triggerPresenceCheckForPlace(id).catch(console.error);
          }}
          onCancel={() => setShowAddTask(false)}
          loading={addingTask}
        />
      </BottomSheet>

      {/* Edit Intention sheet */}
      <BottomSheet isOpen={Boolean(editingTask)} onClose={() => setEditingTask(null)} title="Edit Intention">
        {editingTask && (
          <TaskForm
            defaultPlaceId={id}
            initialTask={editingTask}
            onSubmit={async (input) => {
              setAddingTask(true);
              await editTask(editingTask.id, input);
              setAddingTask(false);
              setEditingTask(null);
            }}
            onCancel={() => setEditingTask(null)}
            loading={addingTask}
          />
        )}
      </BottomSheet>

      {/* Add Note sheet */}
      <BottomSheet isOpen={showAddNote} onClose={() => setShowAddNote(false)} title="Add Note">
        <div className="flex flex-col gap-space-md">
          <Input
            id="new-note-title"
            label="Title"
            placeholder="Note title…"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            autoFocus
          />
          <Textarea
            id="new-note-content"
            label="Content"
            rows={5}
            placeholder="Write something…"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
          />
          <div className="flex gap-space-sm mt-space-sm">
            <Button variant="secondary" fullWidth onClick={() => setShowAddNote(false)}>
              Cancel
            </Button>
            <Button fullWidth loading={addingNote} onClick={handleAddNote}>
              Save Note
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Add Checklist sheet */}
      <BottomSheet isOpen={showAddChecklist} onClose={() => setShowAddChecklist(false)} title="New Checklist">
        <div className="flex flex-col gap-space-md">
          <Input
            id="new-checklist-name"
            label="Checklist Name"
            placeholder="e.g. Morning Routine, Packing List..."
            value={newChecklistName}
            onChange={(e) => setNewChecklistName(e.target.value)}
            autoFocus
          />
          <div className="flex gap-space-sm mt-space-sm">
            <Button variant="secondary" fullWidth onClick={() => setShowAddChecklist(false)}>
              Cancel
            </Button>
            <Button fullWidth loading={addingChecklist} onClick={handleAddChecklist}>
              Create
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Delete confirmation sheet */}
      <BottomSheet isOpen={showDelete} onClose={() => setShowDelete(false)} title="Delete Sanctuary">
        <div className="flex flex-col gap-space-md">
          <p className="font-body-md text-secondary">
            Are you sure you want to delete <strong>{place.name}</strong>? All intentions,
            notes, and checklists for this place will also be deleted.
          </p>
          <div className="flex gap-space-sm mt-space-sm">
            <Button variant="secondary" fullWidth onClick={() => setShowDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" fullWidth onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
