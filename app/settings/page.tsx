"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Toggle } from "@/components/ui/Toggle";
import { useAppStore } from "@/store/appStore";
import { setSetting } from "@/services/database/settings";
import { getAllUsers, changeUserRole, deleteUser } from "@/services/auth/authService";
import type { AuthUser, UserRole, AlertSound } from "@/core/types";
import { ALERT_SOUNDS } from "@/core/types";
import { previewAlertSound, stopAlarmAudio } from "@/services/notifications/soundService";
import {
  getCustomSounds,
  saveCustomAudioFile,
  deleteCustomAudioSound,
  type CustomAudioSound,
} from "@/services/audio/customSoundService";
import toast from "react-hot-toast";

// AI key from .env (NEXT_PUBLIC_ prefix makes it available in the browser)
const ENV_AI_KEY = process.env.NEXT_PUBLIC_AI_API_KEY ?? "";

export default function SettingsPage() {
  const { settings, setSettings, currentUser } = useAppStore();
  const isAdmin = currentUser?.role === "admin";

  const [users, setUsers]               = useState<AuthUser[]>([]);
  const [loadingUsers, setLoadingUsers]  = useState(false);

  // Local draft for API key (not saved until user clicks Save)
  const [apiKeyDraft, setApiKeyDraft]   = useState(settings.aiApiKey ?? "");
  const [savingKey, setSavingKey]       = useState(false);
  const [showKey, setShowKey]           = useState(false);

  // Local draft for provider
  const [providerDraft, setProviderDraft] = useState(settings.aiProvider ?? "openai");
  const [savingProvider, setSavingProvider] = useState(false);

  // Preview sound state in settings
  const [previewingSound, setPreviewingSound] = useState<AlertSound | null>(null);

  // Custom user-uploaded audio files
  const [customSounds, setCustomSounds] = useState<CustomAudioSound[]>([]);
  const [uploadingSound, setUploadingSound] = useState(false);
  const soundFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCustomSounds().then(setCustomSounds).catch(console.error);
  }, []);

  const handleToggleTheme = async () => {
    const newTheme = settings.theme === "dark" ? "light" : "dark";
    setSettings({ theme: newTheme });
    await setSetting("theme", newTheme);
  };

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const all = await getAllUsers();
      setUsers(all);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadUsers();
  }, [isAdmin, loadUsers]);

  // Clean up any preview audio on unmount
  useEffect(() => {
    return () => {
      stopAlarmAudio();
    };
  }, []);

  // Auto-enable AI if env key is present and AI is currently disabled
  useEffect(() => {
    if (ENV_AI_KEY && !settings.aiEnabled) {
      setSettings({ aiEnabled: true, aiApiKey: ENV_AI_KEY });
    }
  }, [settings.aiEnabled, setSettings]);

  // Sync draft when settings load from DB
  useEffect(() => {
    setApiKeyDraft(settings.aiApiKey ?? "");
    setProviderDraft(settings.aiProvider ?? "openai");
  }, [settings.aiApiKey, settings.aiProvider]);

  const handleToggleAi = async (enabled: boolean) => {
    setSettings({ aiEnabled: enabled });
    await setSetting("aiEnabled", enabled);
    toast(enabled ? "AI suggestions enabled ✨" : "AI suggestions disabled");
  };

  const handleSaveApiKey = async () => {
    setSavingKey(true);
    try {
      const trimmed = apiKeyDraft.trim();
      setSettings({ aiApiKey: trimmed });
      await setSetting("aiApiKey", trimmed);
      toast.success("API key saved successfully! 🔑");
    } catch {
      toast.error("Failed to save API key");
    } finally {
      setSavingKey(false);
    }
  };

  const handleClearApiKey = async () => {
    setApiKeyDraft("");
    setSettings({ aiApiKey: "" });
    await setSetting("aiApiKey", "");
    toast("API key cleared", { icon: "🗑️" });
  };

  const handleSaveProvider = async (value: string) => {
    const provider = value as "openai" | "gemini";
    setProviderDraft(provider);
    setSavingProvider(true);
    try {
      setSettings({ aiProvider: provider });
      await setSetting("aiProvider", provider);
      toast.success(`Provider set to ${provider === "openai" ? "OpenAI" : "Google Gemini"}`);
    } catch {
      toast.error("Failed to save provider");
    } finally {
      setSavingProvider(false);
    }
  };

  const handleSelectDefaultSound = async (soundId: AlertSound) => {
    setSettings({ alertSound: soundId });
    await setSetting("alertSound", soundId);
    toast.success(`Default alert sound updated to ${ALERT_SOUNDS.find((s) => s.id === soundId)?.name ?? soundId}`);
  };

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
      handleSelectDefaultSound(newSound.id);
      toast.success(`Uploaded "${newSound.name}" and set as default! 🎵`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to upload audio file.");
    } finally {
      setUploadingSound(false);
      if (soundFileInputRef.current) soundFileInputRef.current.value = "";
    }
  };

  const handleDeleteCustomSound = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    stopAlarmAudio();
    if (previewingSound === id) setPreviewingSound(null);
    await deleteCustomAudioSound(id);
    setCustomSounds((prev) => prev.filter((s) => s.id !== id));
    if (settings.alertSound === id) {
      handleSelectDefaultSound("chime");
    }
    toast("Custom audio removed", { icon: "🗑️" });
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    try {
      await changeUserRole(userId, role);
      toast.success("Role updated");
      await loadUsers();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    try {
      await deleteUser(userId);
      toast.success("User deleted");
      await loadUsers();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <>
      <div className="flex flex-col w-full gap-space-xl pb-space-3xl animate-fade-in">
        
        {/* Top Greeting & Header Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg mt-space-md md:mt-0">
          <div className="flex flex-col gap-space-2xs">
            <div className="inline-flex items-center gap-space-xs text-primary">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>tune</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold text-primary">Preferences</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">Settings</h1>
            <p className="font-body-md text-body-md text-secondary">Tune Nila to perfectly match your rhythm and boundaries.</p>
          </div>
        </div>

        <div className="flex flex-col gap-space-xl">
          
          {/* Documentation & Knowledge Base Banner */}
          <Link href="/docs">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-pink-50/90 via-white to-rose-50/70 border border-pink-200/70 rounded-none shadow-2xs hover:shadow-xs hover:border-primary/50 transition-all flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-none bg-white flex items-center justify-center text-xl shadow-2xs border border-pink-100 flex-shrink-0">
                  📖
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                    Nila Guide & Documentation
                  </span>
                  <span className="text-xs text-secondary">
                    Explore Sanctuaries, Intentions, arrival chimes, and client presentation guides.
                  </span>
                </div>
              </div>
              <span className="text-primary font-bold text-xs sm:text-sm group-hover:translate-x-1 transition-transform flex-shrink-0 ml-2">
                Open Guide →
              </span>
            </div>
          </Link>

          {/* Appearance Section */}
          <section className="flex flex-col gap-space-sm">
            <h2 className="font-label-md text-label-md uppercase tracking-wider text-secondary font-bold flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[16px]">palette</span>
              Appearance
            </h2>
            <div className="p-space-lg bg-surface-container-lowest rounded-lg shadow-sm flex flex-col gap-space-md">
              <Toggle
                label="Dark Mode"
                description="Switch between light and dark theme"
                checked={settings.theme === "dark"}
                onChange={handleToggleTheme}
              />
            </div>
          </section>

          {/* Sound & Notifications Section */}
          <section className="flex flex-col gap-space-sm">
            <h2 className="font-label-md text-label-md uppercase tracking-wider text-secondary font-bold flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[16px]">music_note</span>
              Alert Sound & Music
            </h2>
            <div className="p-space-lg bg-surface-container-lowest rounded-lg shadow-sm flex flex-col gap-space-md">
              <div className="flex flex-col gap-1">
                <span className="font-title-sm text-title-sm text-on-surface font-semibold">Default Alert Melodies</span>
                <span className="font-body-sm text-body-sm text-secondary">
                  Choose the soothing music played for 20 seconds when arriving at an intention. Individual intentions can also override this sound.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {/* Preset Mindful Melodies */}
                {ALERT_SOUNDS.map((sound) => {
                  const currentDefault = settings.alertSound ?? "chime";
                  const isSelected = currentDefault === sound.id;
                  const isPreviewing = previewingSound === sound.id;

                  return (
                    <div
                      key={sound.id}
                      onClick={() => handleSelectDefaultSound(sound.id)}
                      className={[
                        "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all",
                        isSelected
                          ? "bg-primary/10 border-primary ring-1 ring-primary/40 shadow-sm"
                          : "bg-surface-container-low border-outline-variant/40 hover:bg-surface-container",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl flex-shrink-0">{sound.emoji}</span>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold leading-tight ${isSelected ? "text-primary" : "text-on-surface"}`}>
                              {sound.name}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-on-primary">
                                Default
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-secondary truncate mt-0.5">
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
                        className={`p-2 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ml-2 ${
                          isPreviewing
                            ? "bg-primary text-on-primary animate-pulse"
                            : isSelected
                            ? "text-primary hover:bg-primary/20"
                            : "text-secondary hover:bg-surface-container-high hover:text-on-surface"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isPreviewing ? "stop" : "play_arrow"}
                        </span>
                      </button>
                    </div>
                  );
                })}

                {/* Custom User-Uploaded Audio Tracks */}
                {customSounds.map((sound) => {
                  const currentDefault = settings.alertSound ?? "chime";
                  const isSelected = currentDefault === sound.id;
                  const isPreviewing = previewingSound === sound.id;

                  return (
                    <div
                      key={sound.id}
                      onClick={() => handleSelectDefaultSound(sound.id)}
                      className={[
                        "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all",
                        isSelected
                          ? "bg-primary/10 border-primary ring-1 ring-primary/40 shadow-sm"
                          : "bg-surface-container-low border-outline-variant/40 hover:bg-surface-container",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl flex-shrink-0">🎵</span>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold leading-tight truncate ${isSelected ? "text-primary" : "text-on-surface"}`}>
                              {sound.name}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-on-primary">
                                Default
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-secondary truncate mt-0.5">
                            Uploaded audio file
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePreview(sound.id);
                          }}
                          title={isPreviewing ? "Stop Preview" : "Preview Sound"}
                          className={`p-2 rounded-full flex items-center justify-center transition-colors ${
                            isPreviewing
                              ? "bg-primary text-on-primary animate-pulse"
                              : isSelected
                              ? "text-primary hover:bg-primary/20"
                              : "text-secondary hover:bg-surface-container-high hover:text-on-surface"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {isPreviewing ? "stop" : "play_arrow"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteCustomSound(sound.id, e)}
                          title="Remove custom audio"
                          className="p-1.5 rounded-full text-secondary hover:text-error hover:bg-error-container/40 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Upload Custom Audio Bar */}
              <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-between">
                <input
                  ref={soundFileInputRef}
                  type="file"
                  accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <span className="text-xs text-secondary">
                  Have personal mindful tracks or music? Upload any MP3, WAV, or OGG file.
                </span>

                <button
                  type="button"
                  onClick={() => soundFileInputRef.current?.click()}
                  disabled={uploadingSound}
                  className="h-9 px-4 rounded-xl bg-surface-container border border-outline-variant text-on-surface font-semibold text-xs flex items-center gap-1.5 hover:bg-surface-container-high transition-colors active:scale-95 disabled:opacity-50 flex-shrink-0"
                >
                  {uploadingSound ? (
                    <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-[16px] text-primary">upload_file</span>
                  )}
                  <span>{uploadingSound ? "Uploading…" : "Upload Audio File"}</span>
                </button>
              </div>
            </div>
          </section>

          {/* AI Assistant Section */}
          <section className="flex flex-col gap-space-sm">
            <h2 className="font-label-md text-label-md uppercase tracking-wider text-secondary font-bold flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[16px]">psychology</span>
              Nila AI
            </h2>
            <div className="p-space-lg bg-surface-container-lowest rounded-lg shadow-sm flex flex-col gap-space-lg">
              {ENV_AI_KEY ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/8 text-primary text-xs font-semibold border border-primary/20">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  AI features enabled via environment key (.env.local)
                </div>
              ) : (
                <Toggle
                  label="Enable Intuitive Suggestions"
                  description="Let Nila naturally extract intentions and places from what you write."
                  checked={settings.aiEnabled}
                  onChange={handleToggleAi}
                />
              )}

              {settings.aiEnabled && !ENV_AI_KEY && (
                <div className="flex flex-col gap-space-md pt-space-md border-t border-outline-variant/40">
                  {/* Provider Selection */}
                  <div className="flex flex-col gap-space-2xs">
                    <label className="font-label-md text-label-md text-on-surface font-semibold">
                      AI Provider
                    </label>
                    <select
                      className="w-full h-12 rounded-lg px-space-md font-body-md text-body-md bg-surface-container-low border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary-container text-on-surface"
                      value={providerDraft}
                      onChange={(e) => handleSaveProvider(e.target.value)}
                    >
                      <option value="openai">OpenAI (ChatGPT)</option>
                      <option value="gemini">Google Gemini</option>
                    </select>
                  </div>

                  {/* API Key Input & Save Button */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="font-label-md text-label-md text-on-surface font-semibold">
                        API Key
                      </label>
                      {settings.aiApiKey ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <span className="material-symbols-outlined text-[14px]">verified</span>
                          Saved on device
                        </span>
                      ) : (
                        <span className="text-[11px] text-secondary">
                          Not saved yet
                        </span>
                      )}
                    </div>

                    <div className="relative flex items-center">
                      <input
                        type={showKey ? "text" : "password"}
                        className="w-full h-12 rounded-lg pl-space-md pr-24 font-body-md text-body-md bg-surface-container-low border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary-container text-on-surface placeholder:text-secondary/60"
                        placeholder="sk-... or AIzaSy..."
                        value={apiKeyDraft}
                        onChange={(e) => setApiKeyDraft(e.target.value)}
                      />

                      <div className="absolute right-2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowKey(!showKey)}
                          title={showKey ? "Hide key" : "Show key"}
                          className="p-1.5 rounded-md text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {showKey ? "visibility_off" : "visibility"}
                          </span>
                        </button>

                        {apiKeyDraft && (
                          <button
                            type="button"
                            onClick={handleClearApiKey}
                            title="Clear key"
                            className="p-1.5 rounded-md text-secondary hover:text-error hover:bg-error-container/40 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                      <p className="font-label-sm text-label-sm text-secondary">
                        Your key is kept safe and local on your device. Or set <code className="font-mono bg-surface-container px-1 rounded text-xs">NEXT_PUBLIC_AI_API_KEY</code> in <code className="font-mono bg-surface-container px-1 rounded text-xs">.env.local</code>.
                      </p>

                      <button
                        type="button"
                        onClick={handleSaveApiKey}
                        disabled={savingKey}
                        className="h-10 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all shadow-sm flex-shrink-0 disabled:opacity-60"
                      >
                        {savingKey ? (
                          <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                        ) : (
                          <span className="material-symbols-outlined text-[16px]">save</span>
                        )}
                        <span>{savingKey ? "Saving…" : "Save API Key"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ─── Admin Panel (admin only) ─────────────────────── */}
          {isAdmin && (
            <section className="flex flex-col gap-space-sm">
              <h2 className="font-label-md text-label-md uppercase tracking-wider text-secondary font-bold flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                Admin Panel
                <span className="ml-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">ADMIN ONLY</span>
              </h2>
              <div className="bg-surface-container-lowest rounded-lg shadow-sm border border-primary/10 overflow-hidden">
                <div className="px-space-lg py-space-md border-b border-outline-variant/30 flex items-center justify-between">
                  <span className="font-title-sm text-title-sm text-on-surface font-semibold">Registered Users</span>
                  <button
                    onClick={loadUsers}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[13px]">refresh</span>
                    Refresh
                  </button>
                </div>

                {loadingUsers ? (
                  <div className="px-space-lg py-space-xl flex items-center justify-center text-secondary gap-2">
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    Loading…
                  </div>
                ) : (
                  <div className="divide-y divide-outline-variant/20">
                    {users.map((u) => (
                      <div key={u.id} className="px-space-lg py-space-md flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-sm flex-shrink-0">
                          {u.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-label-md text-label-md text-on-surface font-semibold truncate">{u.name}</span>
                          <span className="font-label-sm text-label-sm text-secondary truncate">{u.email}</span>
                        </div>

                        {/* Role select */}
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          disabled={u.email === "admin@nila.app"}
                          className="h-8 rounded-lg px-2 text-xs bg-surface-container-low border border-outline-variant text-on-surface focus:outline-none disabled:opacity-60"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(u.id)}
                          disabled={u.email === "admin@nila.app" || u.id === currentUser?.id}
                          title="Delete user"
                          className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:bg-error-container hover:text-on-error-container transition-colors disabled:opacity-40"
                        >
                          <span className="material-symbols-outlined text-[16px]">person_remove</span>
                        </button>
                      </div>
                    ))}
                    {users.length === 0 && (
                      <div className="px-space-lg py-space-xl text-center text-secondary text-sm">
                        No users found.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Coming soon settings */}
          <section className="flex flex-col gap-space-sm opacity-60">
            <h2 className="font-label-md text-label-md uppercase tracking-wider text-secondary font-bold flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[16px]">hourglass_empty</span>
              Coming Soon
            </h2>
            <div className="p-space-lg bg-surface-container-lowest rounded-lg border-2 border-dashed border-outline-variant flex flex-col gap-space-md">
              <div className="flex flex-col gap-1">
                <span className="font-title-md text-title-md text-on-surface font-semibold">Gentle Reminders</span>
                <span className="font-body-sm text-body-sm text-secondary">Configure location accuracy vs battery drain.</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-title-md text-title-md text-on-surface font-semibold">Privacy & Space</span>
                <span className="font-body-sm text-body-sm text-secondary">Manage your local journal and history.</span>
              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
