# DailyQuest — Checklists Extension

> **Turn everyday tasks into epic daily quests.**  
> A minimalist, local-first, offline-first productivity browser extension for Google Chrome and Chromium-based browsers (Microsoft Edge, Brave, Arc, Cốc Cốc, etc.) built with Manifest V3, React 19, TypeScript, Tailwind CSS v4, and IndexedDB.


---

## Table of Contents
1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Installation Guide](#installation-guide)
4. [Data Export, Import & Markdown Notes](#data-export-import--markdown-notes)
5. [Privacy & Security](#privacy--security)

---

## Overview

DailyQuest combines the quick-capture simplicity of **Google Keep**, the consistency tracking of **GitHub Contributions**, the focus discipline of **Pomodoro**, and the rewarding feedback loops of **RPG progression** into a clean, minimalist application inspired by Obsidian's calm dark design aesthetic.

---

## Key Features

### Quest Management

* **Daily & One-Off Quests** — Create recurring daily quests or one-time tasks with flexible schedules.
* **Subquests** — Break complex quests into smaller objectives with real-time progress tracking.
* **Categories & Priorities** — Organize quests with categories and priority levels.
* **Skip & Postpone** — Skip or postpone quests without negatively affecting completion statistics.

### Gamified Progression

* **XP & Ranks** — Earn XP from completed quests and progress through multiple ranks.
* **Streaks & Combo Bonus** — Maintain daily streaks and earn bonus XP for consistent progress.
* **Achievements & Badges** — Unlock achievements and equip earned titles as you reach milestones.

### Focus & Productivity

* **Pomodoro Timer** — Built-in Focus, Short Break, and Long Break modes.
* **Quest Binding** — Link focus sessions to specific quests.
* **Keyboard Shortcuts** — Quickly create, navigate, complete, skip, and postpone quests.
* **Quick Capture** — Add quests instantly through the browser Omnibox or context menu.

### Progress Analytics

* **Activity Heatmap** — Visualize your quest activity with a GitHub-style 12-month heatmap.
* **Calendar History** — Review historical quests, completion status, and earned XP.
* **Statistics** — Track weekly completion and category distribution.

### Data & Portability

* **Local-First Storage** — Store quests, history, and achievements locally using IndexedDB.
* **JSON Backup & Restore** — Export and safely restore your complete quest data.
* **CSV Export** — Export quest data for use with Excel, Google Sheets, and other spreadsheet tools.
* **Markdown Export** — Export daily logs for Obsidian, Logseq, or Notion.
* **Optional GitHub Gist Sync** — Sync your data across devices using GitHub Gist.

---




## Installation Guide

### Option A: Install from GitHub Release (.zip)
1. Download `dailyquest-v1.0.0.zip` from the latest [GitHub Release](https://github.com/Croslee/Daily_Quest-Checklists_Extension/releases).
2. Unzip the file into a folder of your choice 
3. Open Google Chrome (or Edge / Brave / Arc) and navigate to `chrome://extensions`.
4. Enable **Developer mode** toggle in the top-right corner.
5. Click **Load unpacked** in the top-left and select the unzipped folder.
6. Pin **DailyQuest** to your browser toolbar for instant access!

### Option B: Build & Run from Source
```bash
git clone https://github.com/Croslee/DailyQuest.git
cd DailyQuest
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
### Experimental
- **Secure Cloud Sync**: Gist synchronization uses direct user-provided tokens stored locally with optional client-side passphrase encryption.

