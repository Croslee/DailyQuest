# Architecture Overview

## Tech Stack

- **Platform:** Chrome/Chromium Extension, Manifest V3
- **Frontend:** React 19, ReactDOM, TypeScript
- **Styling & Icons:** Tailwind CSS, Lucide React
- **Build:** Vite, CRXJS Vite Plugin
- **Data:** Dexie.js with IndexedDB
- **Testing:** Vitest, JSDOM, fake-indexeddb

## Project Structure

```text
dailyquest/
├── public/                 # Static assets, including extension icons
├── src/
│   ├── background/         # Manifest V3 service worker
│   ├── components/         # Reusable React UI components
│   ├── constants/          # Default values and theme definitions
│   ├── contexts/           # Shared React context providers
│   ├── dashboard/          # Full-page dashboard entry point
│   ├── db/                 # Dexie database and repositories
│   ├── domain/             # Pure business rules and calculations
│   ├── hooks/              # React hooks for application state and data
│   ├── i18n/               # Localization context and locale files
│   ├── pages/              # Dashboard page views
│   ├── popup/              # Browser extension popup entry point
│   ├── services/           # Application and data services
│   ├── styles/             # Global styles
│   ├── types/              # Shared TypeScript types
│   └── utils/              # Small cross-cutting utilities
├── tests/                  # Unit and component tests by feature layer
├── manifest.json           # Chrome/Chromium extension manifest
├── vite.config.ts          # Vite and CRX build configuration
├── package.json            # Scripts and dependencies
└── README.md               # Project usage and release guide
```

## Architecture & Design

DailyQuest enforces strict layer isolation. React UI components never access IndexedDB directly.

```text
┌─────────────────────────────────────────────────────────┐
│                     React UI Layer                      │
│        Popup (380px)  ·  Dashboard (Full Page)          │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│                    React Hooks Layer                    │
│   useTodayInstances · useQuests · useStreak · useStats  │
└────────────────────────────┬────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────┐
│                  Application Services                   │
│   QuestService · CompletionService · QuestGenService    │
│   StatisticsService · ExportService · SyncChannel       │
└─────────────┬─────────────────────────────┬─────────────┘
              │                             │
┌─────────────▼──────────────┐ ┌────────────▼─────────────┐
│    Pure Domain Functions   │ │     Repository Layer     │
│ Score · Streak · XP · Rank │ │ Quests · Instances · etc │
└────────────────────────────┘ └────────────┬─────────────┘
                                            │
                               ┌────────────▼─────────────┐
                               │   IndexedDB (Dexie.js)   │
                               │      DailyQuestDB        │
                               └──────────────────────────┘
```

---
### The Core Loop
```text
Create Quest Blueprint / Quick Add [N]
               ↓
     Materialize Daily Instance
               ↓
   Focus with Pomodoro & Sound Chime
               ↓
 Complete Quest (+XP reward & Streak Combo Multiplier)
               ↓
     Build Daily Score (≥70% success)
               ↓
 Advance Rank Progression & Equip Badges
               ↓
Review Annual Activity Heatmap, Calendar & Export Markdown (.md)
```

## IndexedDB Schema

Database Name: `DailyQuestDB` (Version `1`)

| Object Store | Primary Key | Indexes | Purpose |
|---|---|---|---|
| `quests` | `id` | `category`, `archived` | Reusable quest definitions / blueprints |
| `questInstances` | `id` | `questId`, `date`, `status`, `[questId+date]` | Daily materializations of tasks |
| `completionRecords` | `id` | `questId`, `questInstanceId`, `date`, `status`, `[questId+date]` | **Immutable** historical completion snapshots |
| `dailyStats` | `date` | `date` (PK) | Cached daily score, XP, and success status |
| `settings` | `key` | `key` (PK) | Key-value application preferences |

---

## Daily Quest Generation, Scoring & Streak Combo

### Idempotent Daily Generation
At startup, midnight transition, or window focus:
1. Pending instances from past days are automatically transitioned to `missed` with 0 XP.
2. Active quest blueprints materialize a `pending` instance for today (preventing duplicates via `[questId+date]` compound check).

### Daily Score Formula
$$\text{Daily Score} = \frac{\text{Completed}}{\text{Completed} + \text{Missed} + \text{Pending}} \times 100$$

> **Note**: Skipped quests are **excluded** from the denominator because intentionally skipping a task is not failure.

### Streak Multiplier Formula
$$\text{XP Bonus} = \min(\text{Current Streak} \times 5\%, 50\%)$$

$$\text{Awarded XP} = \text{Base XP} \times (1 + \text{XP Bonus})$$

---

## Development Workflow & Scripts

### Prerequisites
- Node.js 18+ (tested with Node 20 & 24 LTS)
- npm 9+

### Available Scripts
```bash
# Install dependencies
npm install

# Start development server with Hot Module Replacement (HMR)
npm run dev

# Run full automated test suite (18 suites, 77 tests)
npm test

# Build production bundles into dist/
npm run build

# Build and package a production-ready ZIP for GitHub Releases / Web Store
npm run pack
```

---
