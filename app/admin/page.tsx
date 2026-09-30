"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAppStore } from "@/store/appStore";
import {
  getAdminUserList,
  getGlobalStats,
  adminDeleteUser,
  adminResetUserAI,
  adminChangeRole,
  formatBytes,
  type AdminUserRow,
  type GlobalStats,
} from "@/services/admin/adminService";
import { AI_PROMPT_LIMIT } from "@/services/ai/chatService";
import toast from "react-hot-toast";

const ADMIN_EMAIL = "admin@nila.app";

// ─── Stat Card ────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  color = "primary",
}: {
  icon: string;
  label: string;
  value: number | string;
  color?: "primary" | "secondary" | "tertiary" | "error";
}) {
  const colorMap = {
    primary: "bg-primary/8 text-primary border-primary/15",
    secondary: "bg-secondary-container/50 text-on-secondary-container border-secondary-container/40",
    tertiary: "bg-tertiary-container/50 text-on-tertiary-container border-tertiary-container/40",
    error: "bg-error-container/50 text-on-error-container border-error-container/40",
  };

  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl border ${colorMap[color]} shadow-sm`}>
      <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
        {icon}
      </span>
      <div className="flex flex-col">
        <span className="font-bold text-lg leading-tight">{value}</span>
        <span className="text-xs opacity-70 font-medium">{label}</span>
      </div>
    </div>
  );
}

// ─── Storage Bar ──────────────────────────────────────────
function StorageBar({ used, max }: { used: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (used / max) * 100) : 0;
  const color =
    pct >= 90 ? "bg-error" : pct >= 60 ? "bg-tertiary" : "bg-primary";

  return (
    <div className="w-full h-1.5 bg-outline-variant/30 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function AdminPage() {
  const { currentUser } = useAppStore();
  const router = useRouter();

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Guard — redirect non-admins
  useEffect(() => {
    if (currentUser && currentUser.role !== "admin") {
      router.replace("/");
    }
  }, [currentUser, router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [userList, stats] = await Promise.all([
        getAdminUserList(),
        getGlobalStats(),
      ]);
      setUsers(userList);
      setGlobalStats(stats);
    } catch (err) {
      toast.error("Failed to load admin data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role === "admin") {
      loadData();
    }
  }, [currentUser, loadData]);

  const handleDelete = async (user: AdminUserRow) => {
    if (!confirm(`Delete "${user.name}" (${user.email})? This cannot be undone.`)) return;
    setActionLoading(user.id + "-delete");
    try {
      await adminDeleteUser(user.id);
      toast.success(`${user.name} deleted`);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetAI = async (user: AdminUserRow) => {
    if (!confirm(`Reset all AI chat history and usage for "${user.name}"?`)) return;
    setActionLoading(user.id + "-ai");
    try {
      await adminResetUserAI(user.id);
      toast.success(`AI data reset for ${user.name}`);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (user: AdminUserRow, role: "admin" | "special" | "user") => {
    setActionLoading(user.id + "-role");
    try {
      await adminChangeRole(user.id, role);
      const label = role === "special" ? "⭐ Special User" : role === "admin" ? "Admin" : "User";
      toast.success(`${user.name} is now a ${label}`);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Role change failed");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalAiStorage = users.reduce((sum, u) => sum + u.storage.aiStorageBytes, 0);

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="material-symbols-outlined text-secondary text-3xl">lock</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2 md:mt-0">
        <div className="flex flex-col gap-1">
          <div className="inline-flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              admin_panel_settings
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Admin Only</span>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
              {users.length} users
            </span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-secondary">Manage users, monitor storage, and oversee Nila 🌙</p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-all disabled:opacity-60 self-start md:self-auto"
        >
          <span className={`material-symbols-outlined text-[16px] ${loading ? "animate-spin" : ""}`}>
            refresh
          </span>
          Refresh
        </button>
      </div>

      {/* ── Global Stats Grid ── */}
      {globalStats && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">bar_chart</span>
            Platform Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard icon="cottage" label="Places" value={globalStats.totalPlaces} color="primary" />
            <StatCard icon="spa" label="Tasks" value={globalStats.totalTasks} color="secondary" />
            <StatCard icon="sticky_note_2" label="Notes" value={globalStats.totalNotes} color="tertiary" />
            <StatCard icon="checklist" label="Checklists" value={globalStats.totalChecklists} color="secondary" />
            <StatCard icon="explore" label="Journeys" value={globalStats.totalJourneys} color="primary" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard icon="person" label="Total Users" value={globalStats.totalUsers} color="primary" />
            <StatCard icon="auto_awesome" label="AI Messages" value={globalStats.totalAiMessages} color="tertiary" />
            <StatCard icon="database" label="AI Storage" value={formatBytes(totalAiStorage)} color="secondary" />
          </div>
        </section>
      )}

      {/* ── User List ── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xs font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">group</span>
            Registered Users
          </h2>
          {/* Search */}
          <div className="relative">
            <span className="material-symbols-outlined text-[16px] text-secondary absolute left-2.5 top-1/2 -translate-y-1/2">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              className="h-9 pl-8 pr-3 rounded-xl bg-surface-container border border-outline-variant text-sm text-on-surface placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40 gap-2 text-secondary">
            <div className="w-5 h-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <span className="text-sm">Loading users…</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredUsers.map((user) => {
              const isExpanded = expandedUser === user.id;
              const isCurrentUser = user.id === currentUser.id;
              const isDefaultAdmin = user.email === ADMIN_EMAIL;
              const promptPct = (user.storage.aiPromptsUsed / AI_PROMPT_LIMIT) * 100;
              const joinedDate = new Date(user.createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              });
              const initials = user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

              return (
                <div
                  key={user.id}
                  className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden"
                >
                  {/* ── Row ── */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-secondary-container flex-shrink-0 flex items-center justify-center overflow-hidden ring-2 ring-secondary-container/50">
                      {isDefaultAdmin ? (
                        <Image src="/logo.png" alt="Admin" width={40} height={40} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-sm text-on-secondary-container">{initials}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-on-surface truncate">{user.name}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold">You</span>
                        )}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${
                          user.role === "admin"
                            ? "bg-primary/10 text-primary border-primary/20"
                            : user.role === "special"
                            ? "bg-tertiary-container text-on-tertiary-container border-tertiary-container/40"
                            : "bg-secondary-container text-on-secondary-container border-secondary-container/40"
                        }`}>
                          {user.role === "admin" ? "ADMIN" : user.role === "special" ? "⭐ SPECIAL" : "USER"}
                        </span>
                      </div>
                      <span className="text-xs text-secondary truncate">{user.email}</span>
                      <span className="text-[10px] text-secondary/60 mt-0.5">Joined {joinedDate}</span>
                    </div>

                    {/* AI usage pill */}
                    <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[11px] font-bold ${promptPct >= 100 ? "text-error" : promptPct >= 60 ? "text-tertiary" : "text-secondary"}`}>
                        {user.storage.aiPromptsUsed}/{AI_PROMPT_LIMIT} AI
                      </span>
                      <div className="w-16">
                        <StorageBar used={user.storage.aiPromptsUsed} max={AI_PROMPT_LIMIT} />
                      </div>
                    </div>

                    {/* Storage badge */}
                    <div className="hidden md:flex flex-col items-end flex-shrink-0 w-20">
                      <span className="text-xs font-bold text-on-surface">
                        {formatBytes(user.storage.aiStorageBytes)}
                      </span>
                      <span className="text-[10px] text-secondary">AI storage</span>
                    </div>

                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpandedUser(isExpanded ? null : user.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container transition-colors flex-shrink-0"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isExpanded ? "expand_less" : "expand_more"}
                      </span>
                    </button>
                  </div>

                  {/* ── Expanded Detail ── */}
                  {isExpanded && (
                    <div className="border-t border-outline-variant/20 px-4 py-4 flex flex-col gap-4 bg-surface-container/30">
                      
                      {/* Storage breakdown */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="flex flex-col p-3 rounded-xl bg-primary/6 border border-primary/10">
                          <span className="text-lg font-bold text-primary">{user.storage.aiMessages}</span>
                          <span className="text-[11px] text-secondary">AI messages</span>
                        </div>
                        <div className="flex flex-col p-3 rounded-xl bg-secondary-container/40 border border-secondary-container/30">
                          <span className="text-lg font-bold text-on-secondary-container">{user.storage.aiPromptsUsed}</span>
                          <span className="text-[11px] text-secondary">Prompts used</span>
                        </div>
                        <div className="flex flex-col p-3 rounded-xl bg-tertiary-container/40 border border-tertiary-container/30">
                          <span className="text-lg font-bold text-on-tertiary-container">
                            {AI_PROMPT_LIMIT - user.storage.aiPromptsUsed >= 0
                              ? AI_PROMPT_LIMIT - user.storage.aiPromptsUsed
                              : 0}
                          </span>
                          <span className="text-[11px] text-secondary">Prompts left</span>
                        </div>
                        <div className="flex flex-col p-3 rounded-xl bg-surface-container border border-outline-variant/30">
                          <span className="text-lg font-bold text-on-surface">
                            {formatBytes(user.storage.aiStorageBytes)}
                          </span>
                          <span className="text-[11px] text-secondary">AI storage used</span>
                        </div>
                      </div>

                      {/* AI prompt usage bar */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-secondary font-medium">AI Prompt Usage</span>
                          <span className={`font-bold ${promptPct >= 100 ? "text-error" : "text-on-surface"}`}>
                            {promptPct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-outline-variant/30 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              promptPct >= 100 ? "bg-error" : promptPct >= 60 ? "bg-tertiary" : "bg-primary"
                            }`}
                            style={{ width: `${Math.min(100, promptPct)}%` }}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-1 border-t border-outline-variant/20">
                        {/* Role selector */}
                        {!isDefaultAdmin && (
                          <select
                            value={user.role}
                            disabled={actionLoading === user.id + "-role"}
                            onChange={(e) => handleRoleChange(user, e.target.value as "admin" | "special" | "user")}
                            className="h-9 px-3 rounded-xl bg-surface-container border border-outline-variant text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                          >
                            <option value="user">User</option>
                            <option value="special">⭐ Special User</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}

                        {/* Reset AI */}
                        <button
                          onClick={() => handleResetAI(user)}
                          disabled={!!actionLoading || user.storage.aiMessages === 0}
                          className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-tertiary-container/60 text-on-tertiary-container text-xs font-semibold hover:opacity-80 transition-all disabled:opacity-40 border border-tertiary-container/40"
                        >
                          {actionLoading === user.id + "-ai" ? (
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                          ) : (
                            <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                          )}
                          Reset AI History
                        </button>

                        {/* Delete user */}
                        {!isDefaultAdmin && !isCurrentUser && (
                          <button
                            onClick={() => handleDelete(user)}
                            disabled={!!actionLoading}
                            className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-error-container/60 text-on-error-container text-xs font-semibold hover:opacity-80 transition-all disabled:opacity-40 border border-error-container/40 ml-auto"
                          >
                            {actionLoading === user.id + "-delete" ? (
                              <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                            ) : (
                              <span className="material-symbols-outlined text-[14px]">person_remove</span>
                            )}
                            Delete User
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-secondary gap-2">
                <span className="material-symbols-outlined text-3xl">search_off</span>
                <span className="text-sm">No users match your search</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Footer note ── */}
      <p className="text-xs text-secondary/50 text-center pb-4">
        Storage figures show estimated AI chat data. Shared data (places, tasks, notes) is counted globally.
      </p>
    </div>
  );
}
