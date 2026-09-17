"use client";

import { useState, useEffect } from "react";
import { BottomNav } from "@/components/navigation/BottomNav";
import { DemoModeSimulator } from "@/features/demo/DemoMode";
import { useContextEngine } from "@/hooks/useContextEngine";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { TopAlertBanner } from "@/components/notifications/TopAlertBanner";
import { useAppStore } from "@/store/appStore";
import { usePlaces } from "@/hooks/usePlaces";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TaskForm } from "@/features/tasks/TaskForm";
import { updateTask } from "@/services/database/tasks";
import toast from "react-hot-toast";
import { clearSession } from "@/services/auth/authService";

export function AppShell({ children }: { children: React.ReactNode }) {
  // Initialize context engine at the root level so it runs globally
  useContextEngine();
  const pathname = usePathname();
  const router = useRouter();
  const { editingIntention, setEditingIntention, currentUser, setCurrentUser } = useAppStore();
  const { places } = usePlaces();

  const navLinks = [
    { href: "/", label: "Home", icon: "favorite" },
    { href: "/places", label: "My Places", icon: "cottage" },
    { href: "/tasks", label: "Tasks & Rituals", icon: "spa" },
    { href: "/journey", label: "Journey & Transit", icon: "explore" },
    { href: "/settings", label: "Settings", icon: "tune" },
  ];

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    router.replace("/login");
    toast("Signed out — see you soon 🌙", { icon: "👋" });
  };

  // Display name initials for avatar
  const displayName = currentUser?.name ?? "You";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const roleBadge = currentUser?.role === "admin" ? "Admin" : "Member";

  // Dynamic time and time-of-day greeting
  const [timeString, setTimeString] = useState<string>("");
  const [greetingMessage, setGreetingMessage] = useState<string>("");
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const updateTimeAndGreeting = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      );

      const hour = now.getHours();
      if (hour >= 5 && hour < 12) {
        setGreetingMessage("happy morning my love 💖");
      } else if (hour >= 12 && hour < 17) {
        setGreetingMessage("dont forget to eat dear ✨");
      } else if (hour >= 17 && hour < 21) {
        setGreetingMessage("Warm Haven darling 🌇");
      } else {
        setGreetingMessage("Gentle Moonlight dear 🌙");
      }
    };

    updateTimeAndGreeting();
    const timer = setInterval(updateTimeAndGreeting, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-72 bg-surface-container-low/70 backdrop-blur-2xl z-50 flex-col justify-between p-space-lg shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-space-xl">
          <div className="flex items-center gap-space-sm px-space-xs">
            <Image
              src="/logo.png"
              alt="Nila Logo"
              width={38}
              height={38}
              className="w-[38px] h-[38px] rounded-full object-cover shadow-sm ring-1 ring-primary/20"
              priority
            />
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-primary tracking-tight font-bold leading-tight">Nila</span>
              <span className="font-label-sm text-label-sm text-secondary font-medium">Mindful Companion</span>
            </div>
          </div>
          <nav className="flex flex-col gap-space-xs">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-space-sm px-space-md py-space-sm rounded-lg transition-all ${
                    isActive
                      ? "bg-secondary-container text-on-secondary-container font-semibold shadow-[0_8px_24px_-4px_rgba(90,39,64,0.06)]"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px]">{link.icon}</span>
                  <span className="font-label-lg text-label-lg">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User card at bottom of sidebar */}
        <div className="flex flex-col gap-2">
          <div className="bg-surface-container-lowest/80 backdrop-blur-md p-space-md rounded-lg shadow-[0_8px_24px_-4px_rgba(90,39,64,0.06)] flex items-center gap-space-sm">
            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm ring-2 ring-primary/20 flex-shrink-0 overflow-hidden">
              {currentUser?.role === "admin" ? (
                <Image
                  src="/logo.png"
                  alt="Admin"
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-label-md text-label-md text-on-surface font-semibold truncate leading-tight">{displayName}</span>
              <span className="font-label-sm text-label-sm text-secondary leading-tight">{roleBadge}</span>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:bg-error-container hover:text-on-error-container transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="md:pl-72 flex flex-col min-h-screen">
        {/* Desktop Header */}
        <header className="hidden md:flex fixed top-0 left-72 right-0 h-16 bg-surface/80 backdrop-blur-xl z-40 px-space-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <span className="flex items-center gap-1.5 font-label-md text-label-md font-semibold text-secondary">
              <span className="material-symbols-outlined text-[15px] text-primary">schedule</span>
              <span>{mounted ? timeString : "--:--"}</span>
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary-fixed-dim"></span>
            <span className="font-label-md text-label-md text-on-surface font-medium">
              {mounted ? greetingMessage : "Warm Haven darling 🌇"}
            </span>
          </div>
          <div className="flex items-center gap-space-md">
            <div className="flex items-center gap-space-xs">
              <button className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined text-[20px]">notifications</span>
              </button>
            </div>
            <div className="h-6 w-[1px] bg-outline-variant/40"></div>
            <div className="flex items-center gap-space-sm pl-space-xs">
              <div className="flex flex-col items-end">
                <span className="font-label-md text-label-md text-on-surface font-semibold leading-tight">{displayName}</span>
                <span className="font-label-sm text-label-sm text-secondary leading-tight">{roleBadge}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container ring-2 ring-secondary-container/60 shadow-[0_2px_6px_-1px_rgba(90,39,64,0.03)] font-bold text-sm hover:bg-error-container hover:text-on-error-container transition-colors overflow-hidden p-0"
              >
                {currentUser?.role === "admin" ? (
                  <Image
                    src="/logo.png"
                    alt="Admin"
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 left-0 right-0 h-16 bg-surface/80 backdrop-blur-xl z-40 px-space-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] flex items-center justify-between">
           <div className="flex items-center gap-space-xs">
              <Image
                src="/logo.png"
                alt="Nila Logo"
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover shadow-sm ring-1 ring-primary/20"
                priority
              />
              <span className="font-headline-sm text-headline-sm text-primary tracking-tight font-bold">Nila</span>
           </div>
           <div className="flex items-center gap-2">
             {currentUser?.role === "admin" && (
               <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">ADMIN</span>
             )}
             <button
               onClick={handleLogout}
               title="Sign out"
               className="w-9 h-9 rounded-full flex items-center justify-center text-secondary hover:bg-error-container hover:text-on-error-container transition-colors"
             >
               <span className="material-symbols-outlined text-[20px]">logout</span>
             </button>
           </div>
        </header>

        <main className="flex-1 w-full pt-4 md:pt-20 px-space-md md:px-space-xl pb-24 md:pb-space-xl max-w-7xl mx-auto">
          {children}
        </main>
        
        {/* Mobile Bottom Nav */}
        <div className="md:hidden">
           <BottomNav />
        </div>
      </div>
      
      <DemoModeSimulator />

      {/* Top Notification Alert Banner with 20s music, Stop, Snooze, Reschedule */}
      <TopAlertBanner />

      {/* Global Reschedule Intention Sheet */}
      <BottomSheet
        isOpen={Boolean(editingIntention)}
        onClose={() => setEditingIntention(null)}
        title="Reschedule Intention"
      >
        {editingIntention && (
          <TaskForm
            initialTask={editingIntention}
            places={places}
            defaultPlaceId={editingIntention.placeId}
            onSubmit={async (input) => {
              await updateTask(editingIntention.id, input);
              toast.success("Intention rescheduled successfully! ⏰");
              setEditingIntention(null);
            }}
            onCancel={() => setEditingIntention(null)}
          />
        )}
      </BottomSheet>
    </div>
  );
}
