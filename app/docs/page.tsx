"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type DocTab = "guide" | "architecture" | "pitch" | "faq";

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<DocTab>("guide");
  const [searchQuery, setSearchQuery] = useState("");

  const tabs = [
    { id: "guide" as DocTab, label: "User & Client Guide", icon: "menu_book", emoji: "🌸" },
    { id: "pitch" as DocTab, label: "Client Pitch & Use Cases", icon: "campaign", emoji: "💡" },
    { id: "architecture" as DocTab, label: "System & Architecture", icon: "account_tree", emoji: "🛠️" },
    { id: "faq" as DocTab, label: "FAQ & Privacy", icon: "help_outline", emoji: "❓" },
  ];

  return (
    <div className="flex flex-col w-full gap-space-xl pb-space-3xl animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg mt-space-md md:mt-0">
        <div className="flex flex-col gap-space-2xs">
          <div className="inline-flex items-center gap-space-xs text-primary">
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              auto_stories
            </span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold text-primary">
              Documentation & Knowledge Base
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
            Nila Guide & Docs
          </h1>
          <p className="font-body-md text-body-md text-secondary">
            Everything you and your clients need to understand, use, and master Nila.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/places"
            className="px-4 py-2 text-xs font-bold text-primary bg-pink-50/80 hover:bg-pink-100/70 border border-pink-200/60 rounded-none shadow-2xs transition-all flex items-center gap-1.5"
          >
            <span>🏡</span>
            <span>Explore Places</span>
          </Link>
          <Link
            href="/tasks"
            className="px-4 py-2 text-xs font-bold text-on-primary bg-primary hover:bg-primary-container rounded-none shadow-2xs transition-all flex items-center gap-1.5"
          >
            <span>✨</span>
            <span>View Tasks</span>
          </Link>
        </div>
      </div>

      {/* Search & Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-pink-100/80 pb-3">
        {/* Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 sm:pb-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all rounded-none border-b-2 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "border-primary text-primary bg-white/80 shadow-2xs font-semibold"
                    : "border-transparent text-secondary hover:text-on-surface hover:bg-white/40"
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative flex items-center min-w-[220px]">
          <span className="material-symbols-outlined absolute left-3 text-secondary/60 text-[18px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Search guides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white/90 border border-pink-100/80 rounded-none focus:outline-none focus:border-primary text-on-surface placeholder:text-secondary/50 shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 text-secondary/60 hover:text-on-surface text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="w-full">
        {activeTab === "guide" && <UserGuideSection searchQuery={searchQuery} />}
        {activeTab === "pitch" && <ClientPitchSection searchQuery={searchQuery} />}
        {activeTab === "architecture" && <ArchitectureSection searchQuery={searchQuery} />}
        {activeTab === "faq" && <FAQSection searchQuery={searchQuery} />}
      </div>
    </div>
  );
}

// ─── 1. User & Client Guide Section ──────────────────────────────────────────

function UserGuideSection({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Quick Overview Hero */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-pink-50/80 via-white/80 to-rose-50/60 border border-pink-100/80 rounded-none shadow-2xs flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌸</span>
          <h2 className="text-base sm:text-lg font-bold text-on-surface">
            What is Nila in Simple Words?
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-secondary leading-relaxed">
          Most task managers buzz with stressful clock alarms throughout the day when you're busy somewhere else.
          <strong> Nila works by location context:</strong> you link your intentions to physical spaces (called <em>Sanctuaries</em>). When you step into Home, work tasks disappear and your evening rituals appear. When you enter the Office, home chores stay quiet so you can focus.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-pink-100/70 border border-pink-200/50 text-pink-800 text-xs font-semibold rounded-none w-fit">
          <span>💡 Core Rule:</span>
          <span>You only see what matters where your feet are standing right now.</span>
        </div>
      </div>

      {/* 4 Steps Quickstart */}
      <div className="p-5 sm:p-6 bg-white/80 border border-pink-100/80 rounded-none shadow-2xs flex flex-col gap-4">
        <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">rocket_launch</span>
          5-Minute Quickstart (Try it in 4 steps)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-pink-50/30 border border-pink-100/60 rounded-none flex flex-col gap-1.5">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[11px]">1</span>
              Create a Sanctuary
            </span>
            <p className="text-xs text-secondary leading-relaxed">
              Go to <strong>My Places</strong>, click <strong>Create Sanctuary</strong>, name it (e.g. <em>Home</em> or <em>Office</em>), pick an emoji (🏡), and save.
            </p>
          </div>

          <div className="p-4 bg-pink-50/30 border border-pink-100/60 rounded-none flex flex-col gap-1.5">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[11px]">2</span>
              Add an Intention
            </span>
            <p className="text-xs text-secondary leading-relaxed">
              Go to <strong>Tasks & Rituals</strong>, click <strong>Add Intention</strong>, write something (e.g. <em>Water the plants</em>), and set trigger to <strong>When I arrive</strong>.
            </p>
          </div>

          <div className="p-4 bg-pink-50/30 border border-pink-100/60 rounded-none flex flex-col gap-1.5">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[11px]">3</span>
              Open Location Simulator
            </span>
            <p className="text-xs text-secondary leading-relaxed">
              Look at the bottom-right corner, toggle the <strong>Location Simulator</strong> ON, and select your newly created Sanctuary.
            </p>
          </div>

          <div className="p-4 bg-pink-50/30 border border-pink-100/60 rounded-none flex flex-col gap-1.5">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[11px]">4</span>
              Experience the Live Flow
            </span>
            <p className="text-xs text-secondary leading-relaxed">
              Listen to the gentle 20-second arrival chime and see your intention pop up automatically inside your <strong>Active Flow</strong>!
            </p>
          </div>
        </div>
      </div>

      {/* Feature Deep Dive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Sanctuaries Details */}
        <div className="p-5 bg-white/80 border border-pink-100/80 rounded-none shadow-2xs flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-pink-100/50 pb-2">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="text-base">🏡</span>
              Understanding Sanctuaries
            </h3>
            <span className="text-[11px] font-semibold text-primary bg-pink-50 px-2 py-0.5 border border-pink-100">
              Spaces
            </span>
          </div>
          <p className="text-xs text-secondary leading-relaxed">
            Sanctuaries are your sacred anchors: Home, Studio, Gym, Café, or Market. Inside each Sanctuary detail page (<code className="text-[11px] bg-pink-50 px-1">/places/[id]</code>), you can manage:
          </p>
          <ul className="text-xs text-secondary space-y-1.5 pl-4 list-disc">
            <li><strong>Contextual Intentions</strong>: Reminders tied strictly to this space.</li>
            <li><strong>Sacred Notes</strong>: Wi-Fi passwords, gate codes, parking bay numbers.</li>
            <li><strong>Reusable Checklists</strong>: Packing lists or leaving house checklists you can check off and reset anytime with one click.</li>
          </ul>
        </div>

        {/* Intentions Details */}
        <div className="p-5 bg-white/80 border border-pink-100/80 rounded-none shadow-2xs flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-pink-100/50 pb-2">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="text-base">✨</span>
              Intentions & Rituals
            </h3>
            <span className="text-[11px] font-semibold text-primary bg-pink-50 px-2 py-0.5 border border-pink-100">
              Actions
            </span>
          </div>
          <p className="text-xs text-secondary leading-relaxed">
            Instead of demanding tasks, intentions honor your energy and focus:
          </p>
          <ul className="text-xs text-secondary space-y-1.5 pl-4 list-disc">
            <li><strong>When I arrive (ENTER)</strong>: Alerts you upon entering the perimeter.</li>
            <li><strong>When I leave (EXIT)</strong>: Reminds you when departing (e.g. umbrella, keys).</li>
            <li><strong>Time Windows</strong>: Only trigger if arriving within a specific time bracket (e.g. between 9 AM and 11 AM).</li>
            <li><strong>Visual Priorities</strong>: Pastel badges for High (✦), Medium, and Low.</li>
          </ul>
        </div>

        {/* Dashboard Rhythm */}
        <div className="p-5 bg-white/80 border border-pink-100/80 rounded-none shadow-2xs flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-pink-100/50 pb-2">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="text-base">🕒</span>
              Live Rhythm & Tabs
            </h3>
            <span className="text-[11px] font-semibold text-primary bg-pink-50 px-2 py-0.5 border border-pink-100">
              Home
            </span>
          </div>
          <p className="text-xs text-secondary leading-relaxed">
            The top header displays a live real-time clock and compassionate greetings:
          </p>
          <div className="text-[11px] space-y-1 bg-pink-50/40 p-2.5 border border-pink-100/60 font-medium text-secondary">
            <div>🌅 <strong>Morning (5 AM – 12 PM):</strong> <em>happy morning my love 💖</em></div>
            <div>☀️ <strong>Afternoon (12 PM – 5 PM):</strong> <em>dont forget to eat dear ✨</em></div>
            <div>🌇 <strong>Evening (5 PM – 9 PM):</strong> <em>Warm Haven darling 🌇</em></div>
            <div>🌙 <strong>Night (9 PM – 5 AM):</strong> <em>Gentle Moonlight dear 🌙</em></div>
          </div>
          <p className="text-xs text-secondary">
            The Home dashboard uses tabs (<strong>Active Flow</strong>, <strong>Upcoming</strong>, and <strong>Sanctuaries</strong>) so you only see one clean, focused section at a time.
          </p>
        </div>

        {/* Ambient Alerts & Simulator */}
        <div className="p-5 bg-white/80 border border-pink-100/80 rounded-none shadow-2xs flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-pink-100/50 pb-2">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="text-base">🔔</span>
              Alerts & Simulator
            </h3>
            <span className="text-[11px] font-semibold text-primary bg-pink-50 px-2 py-0.5 border border-pink-100">
              Notification
            </span>
          </div>
          <p className="text-xs text-secondary leading-relaxed">
            Arrivals play a peaceful 20-second ambient chime synthesized natively in your browser:
          </p>
          <ul className="text-xs text-secondary space-y-1.5 pl-4 list-disc">
            <li><strong>Stop</strong>: Silences chime and acknowledges reminder for this visit.</li>
            <li><strong>Snooze</strong>: Reminds you again in 5 minutes.</li>
            <li><strong>Hide (✕)</strong>: Dismisses now; checks back in 5 min only if still at place.</li>
            <li><strong>Reschedule</strong>: Opens quick sheet to pick another time or place.</li>
            <li><strong>Location Simulator</strong>: Bottom-right widget to test any arrival without leaving your desk!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── 2. Client Pitch & Presentation Section ──────────────────────────────────

function ClientPitchSection({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="p-5 sm:p-6 bg-white/80 border border-pink-100/80 rounded-none shadow-2xs flex flex-col gap-3">
        <div className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined text-[22px]">campaign</span>
          <h2 className="text-base sm:text-lg font-bold text-on-surface">
            How to Explain Sanctuaries & Nila to Clients
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-secondary leading-relaxed">
          Use this exact elevator pitch and talking points when presenting Nila to clients, stakeholders, or prospects:
        </p>
      </div>

      {/* The 30-Second Elevator Pitch */}
      <div className="p-5 bg-gradient-to-r from-pink-100/60 to-rose-100/40 border-l-4 border-primary rounded-none shadow-2xs flex flex-col gap-2">
        <span className="text-xs font-bold text-primary tracking-wider uppercase">
          30-Second Elevator Pitch
        </span>
        <blockquote className="text-xs sm:text-sm font-medium text-on-surface italic leading-relaxed">
          "Most productivity apps bombard you with arbitrary time alarms that disrupt your day. In Nila, a <strong>Sanctuary</strong> turns physical locations—like your Home, Office, Gym, or Favorite Café—into intelligent, calm spaces. When you physically arrive, Nila surfaces only the intentions, notes, and rituals for that space, keeping your mind clear everywhere else."
        </blockquote>
      </div>

      {/* The Problem vs Solution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-rose-50/40 border border-rose-200/50 rounded-none flex flex-col gap-2">
          <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
            <span>⚠️</span> The Problem With Traditional Apps
          </span>
          <p className="text-xs text-secondary leading-relaxed">
            Standard to-do lists display 30+ mixed items from work, home, and personal life all at once. Seeing home chores while working causes distraction; seeing work tasks while relaxing causes burnout.
          </p>
        </div>

        <div className="p-5 bg-pink-50/50 border border-pink-200/60 rounded-none flex flex-col gap-2">
          <span className="text-xs font-bold text-primary flex items-center gap-1.5">
            <span>✨</span> The Nila Solution
          </span>
          <p className="text-xs text-secondary leading-relaxed">
            <strong>Contextual Separation</strong>: Your brain doesn't need to hold everything at once. Sanctuaries create physical and mental boundaries so you can be 100% present in the room you are standing in.
          </p>
        </div>
      </div>

      {/* Client Pitch Points Table */}
      <div className="p-5 bg-white/80 border border-pink-100/80 rounded-none shadow-2xs flex flex-col gap-3">
        <h3 className="text-sm font-bold text-on-surface">Key Value Points for Clients</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-pink-100 text-primary font-bold">
                <th className="py-2.5 px-3">Pitch Point</th>
                <th className="py-2.5 px-3">What to Say to the Client</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-100/60 text-secondary">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-on-surface">"Spaces, not just timers"</td>
                <td className="py-2.5 px-3">Life happens in real places, not on a sterile calendar grid.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-on-surface">"Zero cloud location tracking"</td>
                <td className="py-2.5 px-3">Enterprise-grade privacy: coordinates never leave the user's browser memory.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-on-surface">"Cognitive peace"</td>
                <td className="py-2.5 px-3">Home stays sacred; work stays at work; errands happen automatically.</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-on-surface">"Gentle sound design"</td>
                <td className="py-2.5 px-3">Synthesized ambient chimes replace harsh phone alarms.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── 3. System & Architecture Section ─────────────────────────────────────────

function ArchitectureSection({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="p-5 sm:p-6 bg-white/80 border border-pink-100/80 rounded-none shadow-2xs flex flex-col gap-3">
        <h2 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
          <span>🛠️</span>
          Technical Architecture & Local-First Design
        </h2>
        <p className="text-xs sm:text-sm text-secondary leading-relaxed">
          Nila is engineered as a <strong>Local-First Web Application</strong> built on modern web standards:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white/90 border border-pink-100/80 rounded-none flex flex-col gap-2">
          <span className="text-xs font-bold text-primary">📦 Client Database (Dexie / IndexedDB)</span>
          <p className="text-xs text-secondary leading-relaxed">
            All places, intentions, checklists, and notes are persisted locally on the client device via IndexedDB. Nila needs zero external databases to run.
          </p>
        </div>

        <div className="p-4 bg-white/90 border border-pink-100/80 rounded-none flex flex-col gap-2">
          <span className="text-xs font-bold text-primary">🔐 Security (Web Crypto API)</span>
          <p className="text-xs text-secondary leading-relaxed">
            User authentication uses native Web Crypto PBKDF2 with SHA-256 password hashing. Passwords are never transmitted or stored in plain text.
          </p>
        </div>

        <div className="p-4 bg-white/90 border border-pink-100/80 rounded-none flex flex-col gap-2">
          <span className="text-xs font-bold text-primary">⚡ Next.js 16 & Turbopack</span>
          <p className="text-xs text-secondary leading-relaxed">
            Built using Next.js App Router with React 19, Tailwind CSS v4, and Zustand for instantaneous reactive UI state.
          </p>
        </div>

        <div className="p-4 bg-white/90 border border-pink-100/80 rounded-none flex flex-col gap-2">
          <span className="text-xs font-bold text-primary">🎵 Native Web Audio Synthesizer</span>
          <p className="text-xs text-secondary leading-relaxed">
            Arrival chimes are generated programmatically via Web Audio API oscillators. No external MP3 audio files need to be fetched over the network.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── 4. FAQ & Privacy Section ────────────────────────────────────────────────

function FAQSection({ searchQuery }: { searchQuery: string }) {
  const faqs = [
    {
      q: "Does Nila track my location on a central server?",
      a: "No! Absolutely not. Nila is built with Zero-Knowledge Privacy. Your GPS coordinates are processed exclusively in your device's browser memory. No server ever logs, monitors, or saves your coordinates.",
    },
    {
      q: "Does Nila work when I am offline?",
      a: "Yes! All sanctuaries, notes, checklists, and tasks are stored in your device's local IndexedDB database. You can read, check off, and create items with zero internet connection.",
    },
    {
      q: "Can I use Nila on my phone or tablet?",
      a: "Yes! Nila is 100% responsive. On mobile, it automatically switches to an ergonomic bottom navigation bar with full touch support.",
    },
    {
      q: "How do I configure AI Quick Add?",
      a: "Go to Settings → Nila AI. You can enter your Google Gemini or OpenAI API key directly. Once set, you can type natural sentences like 'Buy apples at Supermarket' with the 🌙 moon button.",
    },
    {
      q: "How can I deploy Nila for my organization or clients?",
      a: "Nila is fully deployment-ready for Vercel. Simply push the code to your GitHub repository, import into Vercel, and click Deploy. It builds in under 1 minute with 0 server configuration required.",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="p-5 sm:p-6 bg-white/80 border border-pink-100/80 rounded-none shadow-2xs flex flex-col gap-2">
        <h2 className="text-base sm:text-lg font-bold text-on-surface flex items-center gap-2">
          <span>❓</span>
          Frequently Asked Questions
        </h2>
        <p className="text-xs sm:text-sm text-secondary">
          Answers to the most common questions from clients, users, and administrators.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {faqs.map((faq, idx) => (
          <div
            key={idx}
            className="p-4 bg-white/90 border border-pink-100/70 rounded-none shadow-2xs flex flex-col gap-1.5"
          >
            <span className="text-xs sm:text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="text-primary font-bold">Q:</span>
              {faq.q}
            </span>
            <p className="text-xs text-secondary pl-5 leading-relaxed">
              {faq.a}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
