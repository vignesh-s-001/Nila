"use client";

import { useAppStore } from "@/store/appStore";
import { usePlaces } from "@/hooks/usePlaces";
import { useTasks } from "@/hooks/useTasks";
import { useAI } from "@/hooks/useAI";
import { PlaceCard } from "@/features/places/PlaceCard";
import { TaskItem } from "@/features/tasks/TaskItem";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";
import { getPlaceColorHex } from "@/core/constants";
import { useState } from "react";
import { Moon } from "lucide-react";

//all-pages
export default function HomePage() {
  const { userContext, settings, currentUser } = useAppStore();
  const { places } = usePlaces();
  const { tasks, toggleTask, removeTask } = useTasks();
  const { parseAndAdd, parsing } = useAI();
  const [aiText, setAiText] = useState("");
  const [activeTab, setActiveTab] = useState<"flow" | "upcoming" | "sanctuaries">("flow");

  const incompleteTasks = tasks.filter((t) => !t.completed);
  
  // Basic greeting based on time
  const hour = new Date().getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 17) greeting = "Good afternoon";

  const displayName = currentUser?.name?.trim();
  const greetingText = displayName ? `${greeting}, ${displayName}` : greeting;

  const currentPlace = userContext?.currentPlace;
  const colorHex = currentPlace ? getPlaceColorHex(currentPlace.color) : "var(--accent)";

  return (
    <>
      <div className="flex flex-col w-full gap-space-xl pb-space-3xl animate-fade-in">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-md mt-space-md md:mt-0">
          <div className="flex flex-col gap-space-2xs">
            <div className="inline-flex items-center gap-space-xs text-primary">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold text-primary">Daily Flow</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
              {greetingText}
            </h1>
          </div>

          {currentPlace ? (
            <div className="flex items-center gap-space-sm bg-surface-container-lowest/90 backdrop-blur-md px-space-md py-2 rounded-none border border-outline-variant/30 shadow-xs self-start sm:self-auto">
              <span className="font-body-md text-body-md text-secondary">
                You're currently at
              </span>
              <div 
                className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-none bg-surface-container-low shadow-sm"
              >
                <span className="text-[16px]">{currentPlace.emoji}</span>
                <span className="font-label-md text-label-md text-primary font-bold">
                  {currentPlace.name}
                </span>
              </div>
            </div>
          ) : (
            <p className="font-body-md text-body-md text-secondary italic self-start sm:self-auto">
              Holding space for your day, wherever you go.
            </p>
          )}
        </div>

        {/* AI Quick Add */}
        {settings.aiEnabled && (
          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await parseAndAdd(aiText);
              if (ok) setAiText("");
            }} 
            className="relative flex items-center w-full shadow-[0_4px_20px_-4px_rgba(158,54,92,0.06)] rounded-none bg-white/90 border border-pink-200/60 focus-within:border-primary/50 focus-within:shadow-[0_6px_24px_-4px_rgba(158,54,92,0.12)] transition-all"
          >
            <Moon className="absolute left-4 text-primary w-4.5 h-4.5 pointer-events-none fill-primary/15" />
            <input
              type="text"
              className="w-full h-12 rounded-none pl-12 pr-24 font-body-md text-body-md bg-transparent border-none focus:outline-none text-on-surface placeholder:text-secondary/60"
              placeholder="e.g. Remind me to buy milk at Supermarket"
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              disabled={parsing}
            />
            <button
              type="submit"
              disabled={!aiText.trim() || parsing}
              className="absolute right-1.5 h-9 px-5 rounded-none font-label-md text-label-md bg-primary text-on-primary shadow-xs hover:bg-primary-container hover:shadow-sm transition-all disabled:opacity-50"
            >
              {parsing ? "Wait" : "Add 🌙"}
            </button>
          </form>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-b border-pink-100/80 pb-px overflow-x-auto w-full">
          <button
            type="button"
            onClick={() => setActiveTab("flow")}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs sm:text-sm transition-all rounded-none border-b-2 cursor-pointer ${
              activeTab === "flow"
                ? "border-primary text-primary bg-white/80 shadow-2xs"
                : "border-transparent text-secondary hover:text-on-surface hover:bg-white/40"
            }`}
          >
            <span>🌸</span>
            <span>Active Flow</span>
            {currentPlace && (
              <span className="inline-flex items-center gap-1 text-[10px] text-pink-700 font-bold bg-pink-100/90 px-1.5 py-0.2 rounded-full ml-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></span>
                Live
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("upcoming")}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs sm:text-sm transition-all rounded-none border-b-2 cursor-pointer ${
              activeTab === "upcoming"
                ? "border-primary text-primary bg-white/80 shadow-2xs"
                : "border-transparent text-secondary hover:text-on-surface hover:bg-white/40"
            }`}
          >
            <span>✨</span>
            <span>Upcoming</span>
            <span className={`px-2 py-0.5 text-[11px] rounded-full font-medium ${
              activeTab === "upcoming"
                ? "bg-primary text-white"
                : "bg-pink-100/70 text-pink-700"
            }`}>
              {incompleteTasks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sanctuaries")}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs sm:text-sm transition-all rounded-none border-b-2 cursor-pointer ${
              activeTab === "sanctuaries"
                ? "border-primary text-primary bg-white/80 shadow-2xs"
                : "border-transparent text-secondary hover:text-on-surface hover:bg-white/40"
            }`}
          >
            <span>🏡</span>
            <span>Sanctuaries</span>
            <span className={`px-2 py-0.5 text-[11px] rounded-full font-medium ${
              activeTab === "sanctuaries"
                ? "bg-primary text-white"
                : "bg-pink-100/70 text-pink-700"
            }`}>
              {places.length}
            </span>
          </button>
        </div>

        {/* Selected Tab Content Container */}
        <div className="w-full">
          {activeTab === "flow" && (
            <div className="flex flex-col gap-3.5 p-5 sm:p-6 rounded-none bg-white/75 backdrop-blur-md border border-pink-100/80 shadow-[0_4px_20px_-6px_rgba(158,54,92,0.05)]">
              <div className="flex items-center justify-between pb-2 border-b border-pink-100/50">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-pink-100/80 flex items-center justify-center text-primary text-sm shadow-2xs">
                    🌸
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-on-surface leading-tight">
                      Active Flow
                    </span>
                    <span className="text-[11px] text-secondary font-medium">
                      {currentPlace ? `At ${currentPlace.name}` : "Free flowing"}
                    </span>
                  </div>
                </div>
                {currentPlace && (
                  <Link href={`/places/${currentPlace.id}`}>
                    <span className="text-[11px] font-semibold text-primary hover:text-primary-container bg-pink-50/70 hover:bg-pink-100/60 px-2.5 py-0.5 rounded-full border border-pink-200/50 transition-colors">
                      Details →
                    </span>
                  </Link>
                )}
              </div>

              {currentPlace ? (
                <div className="flex flex-col gap-3">
                  {/* Place Hero Banner */}
                  <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-none bg-gradient-to-r from-pink-50/80 to-rose-50/50 border border-pink-100/60">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xl p-1 bg-white rounded-none shadow-2xs flex-shrink-0">
                        {currentPlace.emoji}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-on-surface truncate">
                          {currentPlace.name} Context
                        </span>
                        {currentPlace.address && (
                          <span className="text-[11px] text-secondary truncate">
                            {currentPlace.address}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-pink-700 bg-pink-100/90 px-2 py-0.5 rounded-full flex-shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></span>
                      Live
                    </span>
                  </div>

                  {/* Show tasks for current place */}
                  {(() => {
                    const placeTasks = incompleteTasks.filter(t => t.placeId === currentPlace.id);
                    if (placeTasks.length === 0) {
                      return (
                        <div className="p-4 rounded-none bg-pink-50/30 border border-dashed border-pink-200/60 text-center flex flex-col items-center gap-1 my-1">
                          <span className="text-lg">🌿</span>
                          <span className="text-xs font-medium text-secondary">
                            No pending intentions here!
                          </span>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {placeTasks.map(task => (
                          <TaskItem 
                            key={task.id} 
                            task={task} 
                            onToggle={toggleTask} 
                            onDelete={removeTask} 
                          />
                        ))}
                      </div>
                    );
                  })()}

                  {/* Quick Actions Button */}
                  <Link href={`/places/${currentPlace.id}`} className="mt-0.5">
                    <button className="w-full py-2.5 px-3.5 rounded-none bg-gradient-to-r from-pink-100/80 to-rose-100/70 hover:from-pink-200/80 hover:to-rose-200/70 text-primary font-bold text-xs shadow-2xs border border-pink-200/60 transition-all flex items-center justify-center gap-1.5">
                      <span>Explore Place Details</span>
                      <span className="text-xs">→</span>
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="p-6 rounded-none bg-pink-50/20 border border-dashed border-pink-200/60 flex flex-col items-center justify-center text-center gap-1.5 my-auto min-h-[180px]">
                  <span className="text-2xl">🌱</span>
                  <span className="text-xs font-semibold text-on-surface">Peaceful & Free</span>
                  <p className="text-[11px] text-secondary leading-relaxed max-w-sm">
                    No active sanctuary right now. Move into a saved sanctuary or use the simulator to trigger place rituals.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "upcoming" && (
            <div className="flex flex-col gap-3.5 p-5 sm:p-6 rounded-none bg-white/75 backdrop-blur-md border border-pink-100/80 shadow-[0_4px_20px_-6px_rgba(158,54,92,0.05)]">
              <div className="flex items-center justify-between pb-2 border-b border-pink-100/50">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-purple-100/80 flex items-center justify-center text-purple-700 text-sm shadow-2xs">
                    ✨
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-on-surface leading-tight">
                      Upcoming
                    </span>
                    <span className="text-[11px] text-secondary font-medium">
                      {incompleteTasks.length} {incompleteTasks.length === 1 ? "intention" : "intentions"} left
                    </span>
                  </div>
                </div>
                <Link href="/tasks">
                  <span className="text-[11px] font-semibold text-primary hover:text-primary-container bg-pink-50/70 hover:bg-pink-100/60 px-2.5 py-0.5 rounded-full border border-pink-200/50 transition-colors">
                    See all →
                  </span>
                </Link>
              </div>

              {incompleteTasks.length === 0 ? (
                <div className="p-6 rounded-none bg-pink-50/20 border border-dashed border-pink-200/60 flex flex-col items-center justify-center text-center gap-1.5 my-auto min-h-[180px]">
                  <span className="text-2xl">✨</span>
                  <span className="text-xs font-semibold text-on-surface">All caught up</span>
                  <p className="text-[11px] text-secondary leading-relaxed">
                    You have space to breathe and rest.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {incompleteTasks.map(task => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      place={places.find(p => p.id === task.placeId)}
                      onToggle={toggleTask} 
                      onDelete={removeTask} 
                      showPlace 
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "sanctuaries" && (
            <div className="flex flex-col gap-3.5 p-5 sm:p-6 rounded-none bg-white/75 backdrop-blur-md border border-pink-100/80 shadow-[0_4px_20px_-6px_rgba(158,54,92,0.05)]">
              <div className="flex items-center justify-between pb-2 border-b border-pink-100/50">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-rose-100/80 flex items-center justify-center text-rose-700 text-sm shadow-2xs">
                    🏡
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-on-surface leading-tight">
                      Sanctuaries
                    </span>
                    <span className="text-[11px] text-secondary font-medium">
                      {places.length} {places.length === 1 ? "space" : "spaces"} saved
                    </span>
                  </div>
                </div>
                <Link href="/places">
                  <span className="text-[11px] font-semibold text-primary hover:text-primary-container bg-pink-50/70 hover:bg-pink-100/60 px-2.5 py-0.5 rounded-full border border-pink-200/50 transition-colors">
                    Manage →
                  </span>
                </Link>
              </div>
              
              {places.length === 0 ? (
                <Link href="/places" className="my-auto">
                  <div className="p-6 rounded-none border-2 border-dashed border-pink-200/70 flex flex-col items-center justify-center gap-1.5 text-center hover:bg-pink-50/40 transition-colors min-h-[180px]">
                    <span className="text-2xl">📍</span>
                    <span className="text-xs font-semibold text-primary">
                      Create first sanctuary
                    </span>
                    <p className="text-[11px] text-secondary">
                      Add home, work, or your favorite cafe.
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {places.map(place => {
                    const taskCount = incompleteTasks.filter(t => t.placeId === place.id).length;
                    return (
                      <PlaceCard 
                        key={place.id} 
                        place={place} 
                        taskCount={taskCount} 
                        isActive={currentPlace?.id === place.id} 
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
