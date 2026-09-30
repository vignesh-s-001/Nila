import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/shell/AppShell";
import { Providers } from "@/components/shell/Providers";
import { AuthGuard } from "@/components/shell/AuthGuard";

export const metadata: Metadata = {
  title: "Nila — Mindful Companion",
  description:
    "Remember the right things at the right place. Nila shows you what matters based on where you are.",
  keywords: ["reminders", "location", "geofence", "tasks", "personal assistant", "mindful companion", "nila"],
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nila",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff8f6" },
    { media: "(prefers-color-scheme: dark)",  color: "#fff8f6" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("nila_theme");if(t==="dark"){document.documentElement.classList.add("dark");document.documentElement.classList.remove("light");}else{document.documentElement.classList.add("light");document.documentElement.classList.remove("dark");}}catch(e){}})();`,
          }}
        />
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Epilogue:wght@500;600&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block" rel="stylesheet" />
      </head>
      <body>
        <Providers>
          {/*
            AuthGuard checks session and redirects to /login when unauthenticated.
            AppShell (nav, header) only wraps authenticated routes — login/signup
            render standalone without the shell.
          */}
          <AuthGuard>
            <AppShellWrapper>{children}</AppShellWrapper>
          </AuthGuard>
        </Providers>
      </body>
    </html>
  );
}

/**
 * AppShellWrapper is a Server Component that conditionally renders AppShell.
 * Login and signup pages get a bare layout (no nav / header).
 * All other pages get the full AppShell.
 *
 * We rely on the AuthGuard (client component) to handle routing — this wrapper
 * simply avoids rendering the shell chrome on auth pages.
 */
function AppShellWrapper({ children }: { children: React.ReactNode }) {
  // We cannot use usePathname in a Server Component, so we use a client wrapper below.
  return <AppShellClient>{children}</AppShellClient>;
}

// Inline client component so we can read the pathname
// (avoids creating a new file for a 10-line wrapper)
import { AppShellClient } from "@/components/shell/AppShellClient";
