# DailyQuest — Minimalist Daily Quest Productivity Extension

> **Turn everyday tasks into daily quests.**  
> A minimalist, local-first, offline-first productivity browser extension for Google Chrome and Chromium-based browsers (Microsoft Edge, Brave, Arc, etc.) built with Manifest V3, React 19, TypeScript, Tailwind CSS v4, and IndexedDB (Dexie.js).

---

## Table of Contents
1. [Overview](#overview)
2. [Core Product Principles](#core-product-principles)
3. [Key Features](#key-features)
4. [Architecture & Design](#architecture--design)
5. [IndexedDB Schema](#indexeddb-schema)
6. [Daily Quest Generation & Scoring](#daily-quest-generation--scoring)
7. [Development Workflow](#development-workflow)
8. [Installation Guide](#installation-guide)
   - [Google Chrome](#google-chrome)
   - [Microsoft Edge](#microsoft-edge)
9. [Data Export & Import](#data-export--import)
10. [Privacy & Security](#privacy--security)

---

## Overview

DailyQuest combines the quick-capture simplicity of **Google Keep**, the consistency tracking of **GitHub Contributions**, and the rewarding feedback loops of **RPG daily quests** into a clean, minimalist application inspired by Obsidian's calm design aesthetic.

### The Core Loop
```text
Create Quest Blueprint
         ↓
Materialize Daily Instance
         ↓
Complete Quest (+XP reward & undo window)
         ↓
Build Daily Score (≥70% success)
         ↓
Maintain Streak & Level Progression
         ↓
Review Annual Activity Heatmap & History
```

---

## Core Product Principles

- **Minimal & Fast**: Lightweight popup for 3-second task check-offs; comprehensive full-page dashboard for deep analysis.
- **Offline-First & Local-First**: 100% client-side. Works completely offline with zero server dependencies.
- **Data-Preserving**: Completed quest records are **immutable historical snapshots** and are never destroyed when a quest is edited, archived, or deleted.
- **Non-Toxic Gamification**: A clean, calm interface without noisy streaks or distracting badges. Success is defined as $\ge 70\%$ completion—not perfection.

---

## Key Features

- ⚔️ **Daily Quests & Templates**: Create recurring daily quests, single-occurrence tasks, or scheduled quests.
- ✨ **Instant Feedback & XP**: Earn deterministic XP based on difficulty (`Easy: 10`, `Normal: 20`, `Hard: 30`, `Epic: 50`) with custom overrides.
- ↩️ **Undo Window**: Temporary toast notification allowing immediate revert of accidental completions.
- ⏭️ **Skip & Postpone**: Intentionally skip tasks (excluded from the daily completion denominator) or postpone to tomorrow.
- 🔥 **Streak System**: Track current streak, best streak, and total successful days ($\ge 70\%$ completion threshold).
- 📈 **GitHub-Style Contribution Heatmap**: 52-week activity grid with 5 intensity levels, hover tooltips, and day-click inspection.
- 📅 **Calendar & History**: Interactive month-by-month browser. Inspect any historical date to see completed, skipped, and missed quests with their exact snapshotted titles and XP values.
- 📊 **Statistics Dashboard**: Weekly 7-day performance bar charts, category distribution percentages, and productivity insights.
- 💾 **Export & Import**: Export custom date ranges to JSON or RFC 4180 CSV (with UTF-8 BOM for Japanese and Vietnamese Unicode text). Safe JSON import with deduplication.
- 🎨 **Appearance & Accessibility**: Native Light, Dark, and System theme support with `prefers-reduced-motion` compliance.

---

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
│       StatisticsService · ExportService · ImportService │
└─────────────┬─────────────────────────────┬─────────────┘
              │                             │
┌─────────────▼──────────────┐ ┌────────────▼─────────────┐
│    Pure Domain Functions   │ │     Repository Layer     │
│ Score · Streak · XP · Date │ │ Quests · Instances · etc │
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

## Daily Quest Generation & Scoring

### Idempotent Daily Generation
At startup, midnight transition, or window focus:
1. Pending instances from past days are automatically transitioned to `missed` with 0 XP.
2. Active quest blueprints materialize a `pending` instance for today (preventing duplicates via `[questId+date]` compound check).

### Daily Score Formula
$$\text{Daily Score} = \frac{\text{Completed}}{\text{Completed} + \text{Missed} + \text{Pending}} \times 100$$

> **Note**: Skipped quests are **excluded** from the denominator because intentionally skipping a task is not failure.

---

## Development Workflow

### Prerequisites
- Node.js 18+ (tested with Node 24 LTS)
- npm 9+

### Scripts
```bash
# Install dependencies
npm install

# Start development server with HMR
npm run dev

# Run full automated test suite (Vitest + fake-indexeddb)
npm test

# Build production extension bundles
npm run build
```

---

## Installation Guide

### Google Chrome
1. Run `npm run build` in the project root. This creates the production bundle in the `dist/` directory.
2. Open Chrome and navigate to `chrome://extensions`.
3. Toggle on **Developer mode** in the top right corner.
4. Click **Load unpacked** in the top left.
5. Select the `dist/` folder inside `dailyquest`.
6. Click the extension puzzle icon in your Chrome toolbar and pin **DailyQuest** for instant access!

### Microsoft Edge
1. Run `npm run build`.
2. Open Microsoft Edge and navigate to `edge://extensions`.
3. Enable **Developer mode** in the left sidebar.
4. Click **Load unpacked**.
5. Select the `dist/` folder.

---

## Data Export & Import

### JSON Export / Backup
Exports structured schema v1 data containing your quests, instances, completion snapshots, and daily stats for any chosen date range.
- Filename format: `dailyquest-YYYY-MM.json` or `dailyquest-YYYY-MM-DD-to-YYYY-MM-DD.json`.

### CSV Spreadsheet Export
Generates a denormalized spreadsheet matching RFC 4180 with a UTF-8 BOM, rendering smoothly in Microsoft Excel, Google Sheets, or Apple Numbers.
```csv
Date,Quest,Category,Difficulty,Priority,Status,XP
2026-08-01,Study Japanese,Study,Normal,High,completed,20
2026-08-01,Exercise 30 minutes,Health,Normal,Medium,completed,20
2026-08-01,Clean Desk,Personal,Easy,Low,skipped,0
```

### JSON Import
- Validates schema structure and entity type guards.
- **Safe deduplication**: Existing records with matching IDs are preserved; new records are safely inserted inside an atomic database transaction.

---

## Privacy & Security

- **No Remote JavaScript / `eval()`**: Fully compliant with strict Manifest V3 Content Security Policies.
- **Zero Network Permissions**: The extension does not request host permissions, telemetry, or remote analytics.
- **Local Storage Only**: All user data remains entirely inside your browser's IndexedDB storage.
