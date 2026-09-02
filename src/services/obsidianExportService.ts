import { questInstanceRepository, questRepository, dailyStatsRepository } from '@/db/index';
import { streakService } from './streakService';
import { statisticsService } from './statisticsService';
import { getLocalDateKey, formatDateKey, getDayOfWeek } from '@/utils/date';

export const obsidianExportService = {
  /**
   * Generates a beautifully formatted Obsidian / Notion daily note Markdown string.
   */
  async generateDailyNoteMarkdown(dateKey: string = getLocalDateKey()): Promise<string> {
    const [instances, quests, stats, streak, levelInfo] = await Promise.all([
      questInstanceRepository.getByDate(dateKey),
      questRepository.getAll(),
      dailyStatsRepository.getByDate(dateKey),
      streakService.getStreak(),
      statisticsService.getLevelInfo(),
    ]);

    const questMap = new Map(quests.map(q => [q.id, q]));
    const formattedDate = formatDateKey(dateKey);
    const dayOfWeek = getDayOfWeek(dateKey);

    const completedInstances = instances.filter(i => i.status === 'completed');
    const pendingInstances = instances.filter(i => i.status === 'pending');
    const skippedInstances = instances.filter(i => i.status === 'skipped');

    const scorePct = stats ? Math.round(stats.score) : 0;
    const xpEarned = stats ? stats.xpEarned : 0;

    let md = `---
date: ${dateKey}
day: ${dayOfWeek}
daily_score: ${scorePct}%
xp_earned: ${xpEarned}
level: ${levelInfo.level}
streak: ${streak.currentStreak}
tags: [dailyquest, daily-log, productivity]
---

# ⚔️ DailyQuest Log — ${dayOfWeek}, ${formattedDate}

> [!TIP] **Daily Performance**: ${scorePct}% (${completedInstances.length}/${instances.length} completed) · **XP Earned**: +${xpEarned} XP · **Streak**: ${streak.currentStreak} days 🔥

## 🎯 Completed Quests
`;

    if (completedInstances.length === 0) {
      md += `*No quests completed yet for this date.*\n\n`;
    } else {
      for (const inst of completedInstances) {
        const q = questMap.get(inst.questId);
        const catTag = q?.category ? `#${q.category.toLowerCase().replace(/\s+/g, '-')}` : '';
        md += `- [x] **${q?.title || 'Quest'}** ${catTag} (+${q?.xp || 0} XP)\n`;
        if (q?.description) {
          md += `  - *Notes*: ${q.description}\n`;
        }
        if (inst.subtasks && inst.subtasks.length > 0) {
          for (const st of inst.subtasks) {
            md += `  - [${st.completed ? 'x' : ' '}] ${st.title}\n`;
          }
        }
      }
      md += `\n`;
    }

    if (pendingInstances.length > 0) {
      md += `## ⏳ Remaining / In Progress\n`;
      for (const inst of pendingInstances) {
        const q = questMap.get(inst.questId);
        const catTag = q?.category ? `#${q.category.toLowerCase().replace(/\s+/g, '-')}` : '';
        md += `- [ ] **${q?.title || 'Quest'}** ${catTag}\n`;
        if (inst.subtasks && inst.subtasks.length > 0) {
          for (const st of inst.subtasks) {
            md += `  - [${st.completed ? 'x' : ' '}] ${st.title}\n`;
          }
        }
      }
      md += `\n`;
    }

    if (skippedInstances.length > 0) {
      md += `## ⏭️ Skipped Today\n`;
      for (const inst of skippedInstances) {
        const q = questMap.get(inst.questId);
        md += `- [-] ~~${q?.title || 'Quest'}~~ *(Skipped)*\n`;
      }
      md += `\n`;
    }

    md += `## 📈 Character Status
- **Current Level**: Level ${levelInfo.level} (${levelInfo.currentLevelXP}/${levelInfo.nextLevelXP} XP)
- **Lifetime XP**: ${levelInfo.totalXP} XP
- **Productivity Streak**: ${streak.currentStreak} consecutive days (Best: ${streak.bestStreak} days)

---
*Exported from DailyQuest Browser Extension on ${new Date().toLocaleTimeString()}*
`;

    return md;
  },

  /**
   * Triggers download of the markdown file.
   */
  downloadMarkdownFile(markdown: string, filename: string): void {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
