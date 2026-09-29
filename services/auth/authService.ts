/**
 * authService.ts
 *
 * Custom authentication backed by Supabase (users table).
 * Passwords are hashed with PBKDF2 (Web Crypto API) — no plain text ever stored.
 *
 * Default admin credentials (seeded on first run):
 *   Email : admin@nila.app
 *   Password : Nila@Admin2024
 */

import { supabase } from "@/lib/supabase";
import type { AppUser, AuthUser, UserRole } from "@/core/types";
import { v4 as uuid } from "uuid";

// ─── Crypto helpers ────────────────────────────────────────

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function hashPassword(password: string): Promise<string> {
  const saltRaw = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const salt = saltRaw.buffer as ArrayBuffer;
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS },
    keyMaterial,
    256
  );
  return `${bufToHex(saltRaw.buffer as ArrayBuffer)}:${bufToHex(derived)}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const saltRaw = hexToBuf(saltHex);
  const salt = saltRaw.buffer as ArrayBuffer;
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS },
    keyMaterial,
    256
  );
  return bufToHex(derived) === hashHex;
}

// ─── Helpers ───────────────────────────────────────────────

function rowToAppUser(row: Record<string, unknown>): AppUser {
  return {
    id:           row.id as string,
    name:         row.name as string,
    email:        row.email as string,
    passwordHash: row.password_hash as string,
    role:         row.role as UserRole,
    createdAt:    row.created_at as string,
    updatedAt:    row.updated_at as string,
  };
}

// ─── Seed admin ────────────────────────────────────────────

const ADMIN_EMAIL    = "admin@nila.app";
const ADMIN_PASSWORD = "Nila@Admin2024";
const ADMIN_NAME     = "Nila Admin";

let adminSeeded = false;

export async function ensureAdminSeeded(): Promise<void> {
  if (adminSeeded) return;

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", ADMIN_EMAIL)
    .maybeSingle();

  if (!existing) {
    const hash = await hashPassword(ADMIN_PASSWORD);
    const now = new Date().toISOString();
    const { error } = await supabase.from("users").insert({
      id:            uuid(),
      name:          ADMIN_NAME,
      email:         ADMIN_EMAIL,
      password_hash: hash,
      role:          "admin",
      created_at:    now,
      updated_at:    now,
    });
    if (error) console.error("[Auth] Failed to seed admin:", error.message);
    else console.log("[Auth] Admin user seeded.");
  }
  adminSeeded = true;
}

// ─── Auth operations ───────────────────────────────────────

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
}

export async function signUp(input: SignUpInput): Promise<AuthUser> {
  const normalizedEmail = input.email.trim().toLowerCase();

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existing) throw new Error("An account with this email already exists.");
  if (input.password.length < 6) throw new Error("Password must be at least 6 characters.");

  const hash = await hashPassword(input.password);
  const now = new Date().toISOString();
  const id = uuid();

  const { data, error } = await supabase
    .from("users")
    .insert({
      id,
      name:          input.name.trim(),
      email:         normalizedEmail,
      password_hash: hash,
      role:          "user",
      created_at:    now,
      updated_at:    now,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toAuthUser(rowToAppUser(data));
}

export async function login(email: string, password: string): Promise<AuthUser> {
  await ensureAdminSeeded();
  const normalizedEmail = email.trim().toLowerCase();

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!user) throw new Error("Invalid email or password.");

  const appUser = rowToAppUser(user);
  const valid = await verifyPassword(password, appUser.passwordHash);
  if (!valid) throw new Error("Invalid email or password.");

  return toAuthUser(appUser);
}

export async function getAllUsers(): Promise<AuthUser[]> {
  const { data, error } = await supabase.from("users").select("*");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toAuthUser(rowToAppUser(row)));
}

export async function changeUserRole(userId: string, role: UserRole): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function deleteUser(userId: string): Promise<void> {
  const { data: user, error: fetchErr } = await supabase
    .from("users")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  if (fetchErr) throw new Error(fetchErr.message);
  if (user?.email === ADMIN_EMAIL) throw new Error("Cannot delete the default admin account.");

  const { error } = await supabase.from("users").delete().eq("id", userId);
  if (error) throw new Error(error.message);
}

// ─── Session helpers ───────────────────────────────────────

const SESSION_KEY = "nila_auth_user";

export function saveSession(user: AuthUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function loadSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

// ─── Internal helpers ──────────────────────────────────────

function toAuthUser(u: AppUser): AuthUser {
  return { id: u.id, name: u.name, email: u.email, role: u.role };
}
