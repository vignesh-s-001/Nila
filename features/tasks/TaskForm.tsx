"use client";

import { useState, useEffect, useRef } from "react";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { CreateTaskInput } from "@/services/database/tasks";
import type { Place, Task, TaskPriority, TriggerType, RepeatType, AlertSound } from "@/core/types";
import { TRIGGER_LABELS } from "@/core/constants";
import { ALERT_SOUNDS } from "@/core/types";
import { previewAlertSound, stopAlarmAudio } from "@/services/notifications/soundService";
import {
  getCustomSounds,
  saveCustomAudioFile,
  deleteCustomAudioSound,
  type CustomAudioSound,
} from "@/services/audio/customSoundService";
import toast from "react-hot-toast";

interface TaskFormProps {
  places?: Place[];
  defaultPlaceId?: string;
  initialTask?: Task;
  onSubmit: (input: CreateTaskInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: "low",    label: "Low",    color: "#71717A" },
  { value: "medium", label: "Medium", color: "#D97706" },
  { value: "high",   label: "High",   color: "#EF4444" },
];

const TRIGGERS: { value: TriggerType; label: string }[] = [
  { value: "NONE",     label: "No location trigger" },
  { value: "ENTER",    label: "When I arrive" },
  { value: "EXIT",     label: "When I leave" },
  { value: "APPROACH", label: "When I approach" },
];

export function TaskForm({
  places = [],
  defaultPlaceId,
  initialTask,
  onSubmit,
  onCancel,
  loading = false,
}: TaskFormProps) {
  const [title, setTitle]           = useState(initialTask?.title ?? "");
  const [description, setDescription] = useState(initialTask?.description ?? "");
  const [placeId, setPlaceId]       = useState(initialTask?.placeId ?? defaultPlaceId ?? "");
  const [priority, setPriority]     = useState<TaskPriority>(initialTask?.priority ?? "medium");
  const [dueDate, setDueDate]       = useState(initialTask?.dueDate ?? "");
  const [dueTime, setDueTime]       = useState(initialTask?.dueTime ?? "");
  const [triggerType, setTriggerType] = useState<TriggerType>(
    initialTask?.triggerType ?? (defaultPlaceId ? "ENTER" : "NONE")
  );

  // Time range settings for arrival/departure
  const hasRange = Boolean(initialTask?.timeStart || initialTask?.timeEnd);
  const [timingMode, setTimingMode] = useState<"anytime" | "range">(hasRange ? "range" : "anytime");
  const [timeStart, setTimeStart]   = useState(initialTask?.timeStart ?? "09:00");
  const [timeEnd, setTimeEnd]       = useState(initialTask?.timeEnd ?? "18:00");

  // Alert Sound Selection (for mindful 20s arrival music)
  const [alertSound, setAlertSound] = useState<AlertSound>(initialTask?.alertSound ?? "chime");
  const [previewingSound, setPreviewingSound] = useState<AlertSound | null>(null);

  // Custom user-uploaded audio files
  const [customSounds, setCustomSounds] = useState<CustomAudioSound[]>([]);
  const [uploadingSound, setUploadingSound] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCustomSounds().then(setCustomSounds).catch(console.error);
  }, []);

  // Clean up any preview audio when component unmounts
  useEffect(() => {
    return () => {
      stopAlarmAudio();
    };
  }, []);

  const handleTogglePreview = (soundId: AlertSound) => {
    if (previewingSound === soundId) {
      stopAlarmAudio();
      setPreviewingSound(null);
    } else {
      setPreviewingSound(soundId);
      previewAlertSound(soundId, 3.5);
      setTimeout(() => {
        setPreviewingSound((cur) => (cur === soundId ? null : cur));
      }, 3500);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSound(true);
    try {
      const newSound = await saveCustomAudioFile(file);
      setCustomSounds((prev) => [...prev, newSound]);
      setAlertSound(newSound.id);
      toast.success(`Uploaded "${newSound.name}"! 🎵`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload audio file.");
    } finally {
      setUploadingSound(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteCustomSound = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    stopAlarmAudio();
    if (previewingSound === id) setPreviewingSound(null);
    await deleteCustomAudioSound(id);
    setCustomSounds((prev) => prev.filter((s) => s.id !== id));
    if (alertSound === id) setAlertSound("chime");
    toast("Custom audio removed", { icon: "🗑️" });
  };

  const [errors, setErrors]         = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Task title is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    stopAlarmAudio();
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      placeId: placeId || undefined,
      priority,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      timeStart: triggerType !== "NONE" && timingMode === "range" ? timeStart : undefined,
      timeEnd: triggerType !== "NONE" && timingMode === "range" ? timeEnd : undefined,
      triggerType,
      alertSound,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        id="task-title"
        label="Task"
        placeholder="What do you need to do?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
        autoFocus
      />

      <Textarea
        id="task-description"
        label="Description (optional)"
        placeholder="Add more details…"
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {/* Priority */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Priority
        </label>
        <div className="flex gap-2">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(p.value)}
              className={[
                "flex-1 h-9 rounded-[9px] text-xs font-semibold border transition-all",
                priority === p.value
                  ? "ring-2 ring-offset-1"
                  : "bg-[var(--bg-tertiary)] border-[var(--border-default)]",
              ].join(" ")}
              style={priority === p.value
                ? { background: `${p.color}20`, color: p.color, borderColor: p.color }
                : { color: "var(--text-secondary)", borderColor: "var(--border-default)" }
              }
              aria-pressed={priority === p.value}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Place */}
      {places.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Place (optional)
          </label>
          <select
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
            className="w-full h-11 rounded-[10px] px-3 text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-default)] focus:outline-none focus:border-[var(--accent)]"
            aria-label="Select place"
          >
            <option value="">No specific place</option>
            {places.map((p) => (
              <option key={p.id} value={p.id}>
                {p.emoji} {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Location trigger */}
      {placeId && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Remind me
          </label>
          <div className="flex flex-col gap-1.5">
            {TRIGGERS.map((t) => (
              <label
                key={t.value}
                className="flex items-center gap-3 p-3 rounded-[10px] cursor-pointer border transition-all"
                style={{
                  background: triggerType === t.value ? "var(--accent-light)" : "var(--bg-tertiary)",
                  borderColor: triggerType === t.value ? "var(--accent)" : "var(--border-default)",
                }}
              >
                <input
                  type="radio"
                  name="triggerType"
                  value={t.value}
                  checked={triggerType === t.value}
                  onChange={() => setTriggerType(t.value)}
                  className="accent-[var(--accent)]"
                />
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {t.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Intention Timing Range */}
      {placeId && triggerType !== "NONE" && (
        <div className="flex flex-col gap-2 p-3 bg-surface-container-low rounded-xl border border-outline-variant/50">
          <label className="text-xs font-semibold uppercase tracking-wider text-secondary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">schedule</span>
            Timing & Active Hours
          </label>
          <div className="grid grid-cols-2 gap-2 mt-0.5">
            <button
              type="button"
              onClick={() => setTimingMode("anytime")}
              className={[
                "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all",
                timingMode === "anytime"
                  ? "bg-primary/10 border-primary text-primary font-semibold shadow-sm"
                  : "bg-surface-container-lowest border-outline-variant/40 text-secondary hover:bg-surface-container",
              ].join(" ")}
            >
              <span className="text-xs font-bold flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">all_inclusive</span>
                Any Time
              </span>
              <span className="text-[11px] opacity-75 mt-1 font-normal text-center leading-tight">
                Whenever I come, no specific hours
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTimingMode("range")}
              className={[
                "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all",
                timingMode === "range"
                  ? "bg-primary/10 border-primary text-primary font-semibold shadow-sm"
                  : "bg-surface-container-lowest border-outline-variant/40 text-secondary hover:bg-surface-container",
              ].join(" ")}
            >
              <span className="text-xs font-bold flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">timer</span>
                Time Range
              </span>
              <span className="text-[11px] opacity-75 mt-1 font-normal text-center leading-tight">
                Only alert during start & end time
              </span>
            </button>
          </div>

          {timingMode === "range" && (
            <div className="flex gap-3 pt-2 mt-1 border-t border-outline-variant/30">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-secondary mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={timeStart}
                  onChange={(e) => setTimeStart(e.target.value)}
                  className="w-full h-10 px-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none"
                  required={timingMode === "range"}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-secondary mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={timeEnd}
                  onChange={(e) => setTimeEnd(e.target.value)}
                  className="w-full h-10 px-2.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:ring-2 focus:ring-primary/40 focus:outline-none"
                  required={timingMode === "range"}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alert Sound & Music Selection (first 20s of notification) */}
      <div className="flex flex-col gap-2 p-3 bg-surface-container-low rounded-xl border border-outline-variant/50">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-secondary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">music_note</span>
            Alert Sound & Music (20s)
          </label>
          <span className="text-[11px] text-secondary">
            Plays on alert
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
          {/* Preset Mindful Melodies */}
          {ALERT_SOUNDS.map((sound) => {
            const isSelected = alertSound === sound.id;
            const isPreviewing = previewingSound === sound.id;
            return (
              <div
                key={sound.id}
                onClick={() => setAlertSound(sound.id)}
                className={[
                  "flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all",
                  isSelected
                    ? "bg-primary/10 border-primary shadow-sm"
                    : "bg-surface-container-lowest border-outline-variant/40 hover:bg-surface-container",
                ].join(" ")}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-lg flex-shrink-0">{sound.emoji}</span>
                  <div className="flex flex-col min-w-0">
                    <span className={`text-xs font-semibold leading-tight ${isSelected ? "text-primary" : "text-on-surface"}`}>
                      {sound.name}
                    </span>
                    <span className="text-[10px] text-secondary truncate mt-0.5">
                      {sound.description}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTogglePreview(sound.id);
                  }}
                  title={isPreviewing ? "Stop Preview" : "Preview Sound"}
                  className={`p-1.5 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ml-1.5 ${
                    isPreviewing
                      ? "bg-primary text-on-primary animate-pulse"
                      : isSelected
                      ? "text-primary hover:bg-primary/20"
                      : "text-secondary hover:bg-surface-container hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isPreviewing ? "stop" : "play_arrow"}
                  </span>
                </button>
              </div>
            );
          })}

          {/* User-Uploaded Custom Audio Tracks */}
          {customSounds.map((sound) => {
            const isSelected = alertSound === sound.id;
            const isPreviewing = previewingSound === sound.id;
            return (
              <div
                key={sound.id}
                onClick={() => setAlertSound(sound.id)}
                className={[
                  "flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all",
                  isSelected
                    ? "bg-primary/10 border-primary shadow-sm"
                    : "bg-surface-container-lowest border-outline-variant/40 hover:bg-surface-container",
                ].join(" ")}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-lg flex-shrink-0">🎵</span>
                  <div className="flex flex-col min-w-0">
                    <span className={`text-xs font-semibold leading-tight truncate ${isSelected ? "text-primary" : "text-on-surface"}`}>
                      {sound.name}
                    </span>
                    <span className="text-[10px] text-secondary truncate mt-0.5">
                      Uploaded track
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0 ml-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePreview(sound.id);
                    }}
                    title={isPreviewing ? "Stop Preview" : "Preview Sound"}
                    className={`p-1.5 rounded-full flex items-center justify-center transition-colors ${
                      isPreviewing
                        ? "bg-primary text-on-primary animate-pulse"
                        : isSelected
                        ? "text-primary hover:bg-primary/20"
                        : "text-secondary hover:bg-surface-container hover:text-on-surface"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isPreviewing ? "stop" : "play_arrow"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteCustomSound(sound.id, e)}
                    title="Remove custom audio"
                    className="p-1 rounded-full text-secondary hover:text-error hover:bg-error-container/40 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Upload Custom Audio Button */}
        <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
            onChange={handleFileUpload}
            className="hidden"
          />

          <span className="text-[11px] text-secondary">
            Have your own music? Upload any MP3 or WAV.
          </span>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingSound}
            className="h-8 px-3 rounded-lg bg-surface-container border border-outline-variant text-on-surface font-semibold text-xs flex items-center gap-1.5 hover:bg-surface-container-high transition-colors active:scale-95 disabled:opacity-50 flex-shrink-0"
          >
            {uploadingSound ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-[14px] text-primary">upload_file</span>
            )}
            <span>{uploadingSound ? "Uploading…" : "Upload Audio File"}</span>
          </button>
        </div>
      </div>

      {/* Due date/time */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            id="task-due-date"
            label="Due date (optional)"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Input
            id="task-due-time"
            label="Due time (optional)"
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" fullWidth onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" fullWidth loading={loading}>
          {initialTask ? "Save Changes" : "Add Intention"}
        </Button>
      </div>
    </form>
  );
}
