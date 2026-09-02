# Architecture Overview
This document serves as a critical, living template designed to equip agents with a rapid and comprehensive understanding of the codebase's architecture, enabling efficient navigation and effective contribution from day one.

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
