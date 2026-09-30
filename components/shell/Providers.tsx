"use client";

import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { useAppStore } from "@/store/appStore";
import { getSettings } from "@/services/database/settings";

export function Providers({ children }: { children: React.ReactNode }) {
  const { settings, setSettings } = useAppStore();

  // Load settings from DB on mount
  useEffect(() => {
    const cachedTheme = localStorage.getItem("nila_theme") as "light" | "dark" | "system" | null;
    if (cachedTheme) {
      setSettings({ theme: cachedTheme });
    }

    getSettings()
      .then((s) => {
        setSettings(s);
        if (s.theme) {
          localStorage.setItem("nila_theme", s.theme);
        }
      })
      .catch(console.error);
  }, [setSettings]);

  // Apply theme class to html element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    if (settings.theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.add("light");
    }
    if (settings.theme) {
      localStorage.setItem("nila_theme", settings.theme);
    }
  }, [settings.theme]);

  return (
    <>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "var(--bg-elevated)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-default)",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: "500",
            boxShadow: "var(--shadow-lg)",
            fontFamily: "Inter, sans-serif",
          },
        }}
      />
    </>
  );
}
