"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAppStore } from "@/store/appStore";
import { login, saveSession, loadSession, ensureAdminSeeded } from "@/services/auth/authService";

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser } = useAppStore();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  // If already logged in, go home
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setCurrentUser(session);
      router.replace("/");
    }
    // Ensure admin exists on first visit
    ensureAdminSeeded().catch(console.error);
  }, [router, setCurrentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      saveSession(user);
      setCurrentUser(user);
      router.replace("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 ring-2 ring-primary/20 flex items-center justify-center overflow-hidden shadow-md">
            <Image src="/logo.png" alt="Nila" width={64} height={64} className="w-full h-full object-cover" />
          </div>
          <div className="text-center">
            <h1 className="font-bold text-2xl text-primary tracking-tight">Nila</h1>
            <p className="text-sm text-secondary">Mindful Companion</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-lg p-6 flex flex-col gap-5 border border-outline-variant/30">
          <div>
            <h2 className="text-xl font-bold text-on-surface">Welcome back</h2>
            <p className="text-sm text-secondary mt-0.5">Sign in to continue</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-error-container text-on-error-container text-sm">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-on-surface">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11 rounded-xl px-3 bg-surface-container-low border border-outline-variant text-on-surface text-sm placeholder:text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-on-surface">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-xl px-3 pr-10 bg-surface-container-low border border-outline-variant text-on-surface text-sm placeholder:text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPass ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-11 rounded-xl bg-primary text-on-primary font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="text-sm text-center text-secondary">
            New to Nila?{" "}
            <Link href="/signup" className="text-primary font-semibold hover:underline">
              Create account
            </Link>
          </p>
        </div>

        {/* Admin hint */}
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-secondary-container/50 text-on-secondary-container text-xs border border-secondary-container">
          <span className="material-symbols-outlined text-[14px] mt-0.5 flex-shrink-0">info</span>
          <span>Default admin: <strong>admin@nila.app</strong> — see README for password.</span>
        </div>
      </div>
    </div>
  );
}

