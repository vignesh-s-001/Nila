# Nila — Mindful Companion

> A location-aware mindful companion that reminds you of the right things at the right place.  
> Built with **Next.js 16**, **IndexedDB (Dexie)**, **Zustand**, **Leaflet**, and **Web Crypto**.

📖 **[Read the Full Documentation & Client Guide (DOCS.md)](./DOCS.md)**

---

## Features

- 🏡 **Sanctuaries (Sacred Spaces)** — intelligent places with geo-fenced arrival & departure triggers (`ENTER` / `EXIT`)
- 🌸 **Tabbed Dashboard Flow** — single-focus tabs for Active Flow, Upcoming Intentions, and Sanctuaries
- 🕒 **Live Clock & Dynamic Daily Greetings** — real-time time-of-day companion messages (Morning, Afternoon, Evening, Night)
- 🌙 **AI Quick Add** — natural language intention parsing powered by Gemini or OpenAI with signature moon icon
- 🔔 **Smart Ambient Notifications** — top banner with Stop / Snooze / Reschedule actions
- 🎵 **Mindful Alert Music** — 20-second harmonic Web Audio arrival chime (no jarring buzzers)
- 🗺️ **Journey & Transit** — map-based transit reflection and route planning
- 🧪 **Interactive Location Simulator** — test geofence transitions without leaving your desk
- 🔐 **Privacy-First Authentication** — 100% client-side PBKDF2 hashing, zero cloud location tracking

---

## Getting Started

### Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later

### 1. Clone and install

```bash
git clone <repo-url>
cd context-app
npm install
```

### 2. Configure environment

Copy the env template and fill in your values:

```bash
cp .env.local .env.local
```

Edit `.env.local`:

```env
# Optional — enables AI features automatically
NEXT_PUBLIC_AI_API_KEY=sk-...your-openai-key...

# "openai" or "gemini"
NEXT_PUBLIC_AI_PROVIDER=openai
```

> **AI key is optional.** If left blank, you can still enter it manually from  
> **Settings → Nila AI → API Key**.

### 3. Run development server

```bash
npm run dev
```

App will be available at **http://localhost:3000**

> If port 3000 is taken, Next.js will try 3001, 3002, etc.

### 4. Build for production

```bash
npm run build
npm start
```

---

## Authentication

### Default Admin Account

A default admin account is automatically seeded on first launch:

| Field    | Value              |
|----------|--------------------|
| Email    | `*****`
| Password | `*****`
| Role     | `*****`            |

> ⚠️ **Change the admin password** after first login via the Settings page (coming soon) or by deleting and re-creating the IndexedDB database.

### Roles

| Role    | Capabilities                                           |
|---------|--------------------------------------------------------|
| `user`  | Full access to all personal features                   |
| `admin` | All user capabilities + **Admin Panel** in Settings    |

### Admin Panel (Settings → Admin Panel)

- View all registered users
- Change user roles (user ↔ admin)
- Delete user accounts (cannot delete the default admin)

### How Auth Works

Authentication is **100% client-side** using IndexedDB:

- Passwords are hashed with **PBKDF2 + SHA-256** (Web Crypto API) — never stored in plain text
- Sessions are kept in **`sessionStorage`** — clearing the tab/browser logs out
- No backend server or JWT tokens needed

---

## Project Structure

```
context-app/
├── app/                    # Next.js App Router pages
│   ├── login/              # Login page
│   ├── signup/             # Signup page
│   ├── places/             # Places list + detail
│   ├── tasks/              # Tasks & intentions
│   ├── journey/            # Journey & transit
│   └── settings/           # Settings + Admin Panel
│
├── components/
│   ├── shell/
│   │   ├── AppShell.tsx    # Main layout (nav, header, user info)
│   │   ├── AppShellClient.tsx  # Conditionally renders AppShell
│   │   ├── AuthGuard.tsx   # Route protection & session restore
│   │   └── Providers.tsx   # Theme + settings loader
│   ├── notifications/
│   │   └── TopAlertBanner.tsx  # Alert banner with Stop/Snooze/Reschedule
│   └── ui/                 # Reusable UI components
│
├── core/
│   ├── db/index.ts         # Dexie (IndexedDB) schema
│   ├── types/index.ts      # All TypeScript types
│   └── context/            # Context & rules engine
│
├── features/
│   ├── demo/               # Location simulator (DemoMode)
│   ├── tasks/              # TaskForm, TaskItem components
│   └── journey/            # Route map picker
│
├── hooks/                  # useLocation, useContextEngine, usePlaces, etc.
│
├── services/
│   ├── auth/
│   │   └── authService.ts  # Login, signup, session, PBKDF2 hashing
│   ├── database/           # CRUD for places, tasks, settings
│   ├── location/           # Geofence service
│   └── notifications/      # Notification engine, sound service
│
├── store/
│   └── appStore.ts         # Zustand global state (auth, location, alerts)
│
├── public/
│   └── logo.png            # App logo
│
└── .env.local              # Environment variables (gitignored)
```

---

## Environment Variables

| Variable                    | Required | Description                                      |
|-----------------------------|----------|--------------------------------------------------|
| `NEXT_PUBLIC_AI_API_KEY`    | No       | OpenAI / Gemini API key — enables AI features    |
| `NEXT_PUBLIC_AI_PROVIDER`   | No       | `"openai"` or `"gemini"` (default: `"openai"`)  |

---

## Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Framework      | Next.js 16 (App Router, Turbopack)  |
| UI             | Tailwind CSS v4, Material Symbols   |
| State          | Zustand                             |
| Database       | Dexie (IndexedDB)                   |
| Auth           | Web Crypto API (PBKDF2)             |
| Maps           | Leaflet + OpenStreetMap             |
| Notifications  | Web Notifications API               |
| Audio          | Web Audio API                       |
| Language       | TypeScript                          |

---

## Notification Behavior

| Action       | Result                                                              |
|--------------|---------------------------------------------------------------------|
| **Stop**     | Dismiss permanently until next genuine arrival event               |
| **Snooze**   | Re-alert in 5 minutes regardless of location                        |
| **Hide (✕)** | Dismiss now; check in 5 min — re-alert only if still at the place  |
| **Reschedule** | Opens the intention editor to change timing                      |

---

## License

MIT — made with 🌙 for mindful living.
