/**
 * core/db/index.ts
 *
 * ⚠️  This module is kept for import compatibility only.
 * All data is now stored in Supabase — see `lib/supabase.ts`.
 * The Dexie / IndexedDB database is no longer used.
 *
 * If any legacy code still calls `getDB()`, it will throw a clear error
 * so it can be updated to use the appropriate Supabase service instead.
 */

export function getDB(): never {
  throw new Error(
    "[Nila] getDB() is deprecated. This app now uses Supabase for all data storage. " +
    "Import from `@/services/database/*` instead."
  );
}
