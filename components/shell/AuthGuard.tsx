"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { loadSession, ensureAdminSeeded } from "@/services/auth/authService";

const PUBLIC_PATHS = ["/login", "/signup"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, setCurrentUser } = useAppStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Ensure admin account always exists
    ensureAdminSeeded().catch(console.error);

    // Restore session from sessionStorage on mount
    if (!currentUser) {
      const session = loadSession();
      if (session) {
        setCurrentUser(session);
        setChecked(true);
        return;
      }
    } else {
      setChecked(true);
      return;
    }

    // No session — redirect to login unless already on a public path
    if (!PUBLIC_PATHS.includes(pathname)) {
      router.replace("/login");
    } else {
      setChecked(true);
    }
  }, [currentUser, pathname, router, setCurrentUser]);

  // While checking auth, show a simple centered spinner
  if (!checked && !PUBLIC_PATHS.includes(pathname)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  // On public pages (login/signup) always render
  if (PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  // Private pages — only render when authenticated
  if (!currentUser) return null;

  return <>{children}</>;
}

