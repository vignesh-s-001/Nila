"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAppStore } from "@/store/appStore";
import { signUp, saveSession, ensureAdminSeeded } from "@/services/auth/authService";

export default function SignupPage() {
  const router = useRouter();
  const { setCurrentUser } = useAppStore();

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await ensureAdminSeeded();
      const user = await signUp({ name, email, password });
      saveSession(user);
      setCurrentUser(user);
      router.replace("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
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
            <h2 className="text-xl font-bold text-on-surface">Create account</h2>
            <p className="text-sm text-secondary mt-0.5">Start your mindful journey</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-error-container text-on-error-container text-sm">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-on-surface">Full Name</label>
              <input
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="h-11 rounded-xl px-3 bg-surface-container-low border border-outline-variant text-on-surface text-sm placeholder:text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

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
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
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

            {/* Confirm Password */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-on-surface">Confirm Password</label>
              <input
                type={showPass ? "text" : "password"}
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                className="h-11 rounded-xl px-3 bg-surface-container-low border border-outline-variant text-on-surface text-sm placeholder:text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-11 rounded-xl bg-primary text-on-primary font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="text-sm text-center text-secondary">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

