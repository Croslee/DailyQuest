# DailyQuest v1.0 — Minimalist Gamified RPG Task & Habit Productivity Extension

> **Turn everyday tasks into epic daily quests.**  
> A minimalist, local-first, offline-first productivity browser extension for Google Chrome and Chromium-based browsers (Microsoft Edge, Brave, Arc, Cốc Cốc, etc.) built with Manifest V3, React 19, TypeScript, Tailwind CSS v4, and IndexedDB.


---

## Table of Contents
1. [Overview](#overview)
2. [Core Product Principles](#core-product-principles)
3. [Key Features](#key-features)
4. [Architecture & Design](#architecture--design)
5. [IndexedDB Schema](#indexeddb-schema)
6. [Daily Quest Generation, Scoring & Streak Combo](#daily-quest-generation-scoring--streak-combo)
7. [Development Workflow & Scripts](#development-workflow--scripts)
8. [Installation & Release Guide](#installation--release-guide)
9. [Data Export, Import & Markdown Notes](#data-export-import--markdown-notes)
10. [Privacy & Security](#privacy--security)

---

## Overview

DailyQuest combines the quick-capture simplicity of **Google Keep**, the consistency tracking of **GitHub Contributions**, the focus discipline of **Pomodoro**, and the rewarding feedback loops of **RPG progression** into a clean, minimalist application inspired by Obsidian's calm dark design aesthetic.

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

---

## Core Product Principles

- **Minimal & Fast**: Lightweight popup (380px) for 3-second task check-offs; full-page dashboard for deep analysis, calendar browsing, and template management.
- **Offline-First & Local-First**: 100% client-side. Works completely offline with zero mandatory server dependencies or tracking.
- **Data-Preserving Snapshots**: Completed quest records are **immutable historical snapshots** and are never destroyed when a quest template is edited, archived, or deleted.
- **Calm, Rewarding Gamification**: No noisy paywalls or intrusive notifications. Success is defined as $\ge 70\%$ completion—encouraging healthy consistency over unhealthy perfectionism.

---

## Key Features

### Quests & Templates
- **Recurring & One-Off Tasks**: Daily recurrence blueprints, single-occurrence quests, and customizable schedules.
- **Task Hierarchy & Subtasks**: Break quests down into checklists with real-time progress indicators.
- **Categories & Priorities**: Filter by categories (Work, Health, Study, Personal) and priority levels (Low, Medium, High, Urgent).
- **Skip & Postpone**: Intentionally skip tasks (safely excluded from daily completion rate) or postpone to tomorrow.

### Pomodoro Focus Timer
- **Integrated Header Action**: Interactive expanding button on the dashboard header with smooth hover transition.
- **Modes**: 25-minute Focus, 5-minute Short Break, and 15-minute Long Break.
- **Audio Chimes**: Built-in harmonic Zen bell chimes (`D5 -> A5 -> D6`) via Web Audio API when sessions conclude (100% offline).
- **Quest Binding**: Attach the timer to any specific quest instance to maintain deep focus.

### Rank Progression & Achievements
- **Rank Realms**: Ascend through ranks based on XP milestones (Mortal $\rightarrow$ Awakened $\rightarrow$ Ascended $\rightarrow$ Transcendent $\rightarrow$ Supreme $\rightarrow$ Sacred $\rightarrow$ Divine).
- **Achievements & Badges**: Unlock badges for milestone achievements (total quests completed, unbroken streaks, rank promotions).
- **Equipable Titles**: Display your chosen badge on the Extension Popup with dynamic radiant rarity borders.

### Streak Multiplier (Combo Bonus)
- Maintain a daily completion score of $\ge 70\%$ to build your streak flame.
- **Streak Combo**: Earn **+5% bonus XP per consecutive day** (up to a **+50% maximum XP bonus**), prominently displayed on the dashboard streak card.

### Shortcuts & Omnibox Quick Capture
- **Top Header Action [N]**: Press `N` anywhere on the dashboard to open the quick-add quest modal.
- **Vim Navigation**: Navigate task rows with `J` / `K`, toggle completion with `X`, skip with `S`, postpone with `P`.
- **Omnibox Address Bar**: Type `dq` + Space in Chrome's address bar to instantly capture a quest from anywhere.
- **Context Menu**: Highlight any text on any webpage, right-click, and select "Add to DailyQuest".

### Heatmap, Statistics & Calendar
- **GitHub-Style Heatmap**: Continuous 12-month activity heatmap showing completed quest density with interactive day-click inspection.
- **Calendar History**: Month-by-month browser inspecting exact historical snapshotted titles and XP values.
- **Weekly & Category Analytics**: 7-day completion bar charts and category distribution breakdowns.

### Flexible Data Backup & Cloud Sync
- **JSON Full Backup**: Full database export and atomic import with duplicate avoidance.
- **CSV Spreadsheet**: RFC 4180 compliant with UTF-8 BOM for Excel and Google Sheets.
- **Markdown Note (.md)**: Export clean daily logs formatted for Obsidian, Logseq, or Notion, with one-click clipboard copying.
- **Optional GitHub Gist Sync**: Secure, encrypted cloud sync for multi-device workflows.

---




## Installation Guide

### Option A: Install from GitHub Release (.zip)
1. Download `dailyquest-v1.0.0.zip` from the latest [GitHub Release](https://github.com/).
2. Unzip the file into a folder of your choice (e.g. `dailyquest-v1.0.0`).
3. Open Google Chrome (or Edge / Brave / Arc) and navigate to `chrome://extensions`.
4. Enable **Developer mode** toggle in the top-right corner.
5. Click **Load unpacked** in the top-left and select the unzipped folder.
6. Pin **DailyQuest** to your browser toolbar for instant access!

### Option B: Build & Run from Source
```bash
git clone https://github.com/your-username/dailyquest.git
cd dailyquest
npm install
npm run pack
```
Then load the generated `dist/` directory into Chrome via `chrome://extensions` -> **Load unpacked**.

---

## Data Export, Import & Markdown Notes

### JSON Full Backup
Exports structured schema v1 data containing your quests, instances, completion snapshots, and daily stats for any chosen date range. Safe atomic import prevents duplicates.

### CSV Spreadsheet Export
Generates a denormalized spreadsheet matching RFC 4180 with a UTF-8 BOM, rendering smoothly in Microsoft Excel, Google Sheets, or Apple Numbers.

### Markdown Note (.md) Export
Formats your daily quest completions into clean Markdown daily notes compatible with **Obsidian**, **Logseq**, and **Notion**:
```markdown
# ⚔️ DailyQuest Log - Wednesday, 2026-09-02

- [x] Complete system architecture documentation (+30 XP)
- [x] Review pull requests (+20 XP)
- [-] Gym workout (Skipped)
```
Includes a quick-action button to copy directly to your clipboard.

---

## Privacy & Security

- **Zero Remote JavaScript / `eval()`**: Strictly compliant with Manifest V3 Content Security Policies.
- **Zero Tracking or Analytics**: The extension does not collect, monitor, or phone home any personal data.
- **100% Local-First Storage**: All tasks, history, and achievements live inside your browser's IndexedDB.
- **Secure Cloud Sync**: Gist synchronization uses direct user-provided tokens stored locally with optional client-side passphrase encryption.

