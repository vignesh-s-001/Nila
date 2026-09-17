/**
 * authService.ts
 *
 * Client-side authentication using IndexedDB (Dexie).
 * Passwords are hashed with PBKDF2 (Web Crypto API) — no plain text ever stored.
 *
 * Default admin credentials (seeded on first run):
 *   Email : admin@nila.app
 *   Password : Nila@Admin2024
 */

import { getDB } from "@/core/db";
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
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: PBKDF2_ITERATIONS,
    },
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
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: PBKDF2_ITERATIONS,
    },
    keyMaterial,
    256
  );
  return bufToHex(derived) === hashHex;
}

// ─── Seed admin ────────────────────────────────────────────

const ADMIN_EMAIL    = "admin@nila.app";
const ADMIN_PASSWORD = "Nila@Admin2024";
const ADMIN_NAME     = "Nila Admin";

let adminSeeded = false;

export async function ensureAdminSeeded(): Promise<void> {
  if (adminSeeded) return;
  const db = getDB();
  const existing = await db.users.where("email").equals(ADMIN_EMAIL).first();
  if (!existing) {
    const hash = await hashPassword(ADMIN_PASSWORD);
    const now = new Date().toISOString();
    await db.users.add({
      id: uuid(),
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash: hash,
      role: "admin",
      createdAt: now,
      updatedAt: now,
    });
    console.log("[Auth] Admin user seeded.");
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
  const db = getDB();
  const normalizedEmail = input.email.trim().toLowerCase();

  const existing = await db.users.where("email").equals(normalizedEmail).first();
  if (existing) {
    throw new Error("An account with this email already exists.");
  }

  if (input.password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const hash = await hashPassword(input.password);
  const now = new Date().toISOString();

  const newUser: AppUser = {
    id: uuid(),
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash: hash,
    role: "user",
    createdAt: now,
    updatedAt: now,
  };

  await db.users.add(newUser);

  return toAuthUser(newUser);
}

export async function login(email: string, password: string): Promise<AuthUser> {
  await ensureAdminSeeded();
  const db = getDB();
  const normalizedEmail = email.trim().toLowerCase();

  const user = await db.users.where("email").equals(normalizedEmail).first();
  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new Error("Invalid email or password.");
  }

  return toAuthUser(user);
}

export async function getAllUsers(): Promise<AuthUser[]> {
  const db = getDB();
  const users = await db.users.toArray();
  return users.map(toAuthUser);
}

export async function changeUserRole(userId: string, role: UserRole): Promise<void> {
  const db = getDB();
  await db.users.update(userId, { role, updatedAt: new Date().toISOString() });
}

export async function deleteUser(userId: string): Promise<void> {
  const db = getDB();
  // Cannot delete the admin
  const user = await db.users.get(userId);
  if (user?.email === ADMIN_EMAIL) {
    throw new Error("Cannot delete the default admin account.");
  }
  await db.users.delete(userId);
}

// ─── Session helpers ───────────────────────────────────────

const SESSION_KEY = "nila_auth_user";

export function saveSession(user: AuthUser): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function loadSession(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

// ─── Internal helpers ──────────────────────────────────────

function toAuthUser(u: AppUser): AuthUser {
  return { id: u.id, name: u.name, email: u.email, role: u.role };
}
