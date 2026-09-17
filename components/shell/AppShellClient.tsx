"use client";

import { usePathname } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";

const BARE_PATHS = ["/login", "/signup"];

/**
 * Renders children inside AppShell for regular routes.
 * Auth pages (login/signup) get a bare layout so they don't show the nav.
 */
export function AppShellClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (BARE_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}

