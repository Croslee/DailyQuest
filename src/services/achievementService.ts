import { completionRepository } from '@/db/index';
import { streakService } from './streakService';
import { statisticsService } from './statisticsService';
import type { Achievement } from '@/types/achievement';

function makeAchievement(
  id: string,
  title: string,
  titleVi: string,
  description: string,
  descriptionVi: string,
  icon: string,
  currentCount: number,
  targetCount: number
): Achievement {
  const current = Math.max(0, currentCount);
  const target = Math.max(1, targetCount);
  const unlocked = current >= target;
  const progress = Math.min(100, Math.round((current / target) * 1000) / 10);
  return {
    id,
    title,
    titleVi,
    description,
    descriptionVi,
    icon,
    unlocked,
    progress,
    currentCount: current,
    targetCount: target,
  };
}

export const achievementService = {
  async getAchievements(): Promise<Achievement[]> {
    const completions = await completionRepository.getAll();
    const completedRecords = completions.filter(c => c.status === 'completed');
    const streak = await streakService.getStreak();
    const levelInfo = await statisticsService.getLevelInfo();

    const completedCount = completedRecords.length;
    const streakCount = Math.max(streak.currentStreak, streak.bestStreak);
    const totalXP = levelInfo.totalXP;
    const currentLevel = levelInfo.level;

    const studyCount = completedRecords.filter(c => {
      const cat = (c.questCategory || '').toLowerCase();
      return cat.includes('study') || cat.includes('học') || cat.includes('learn');
    }).length;

    const healthCount = completedRecords.filter(c => {
      const cat = (c.questCategory || '').toLowerCase();
      return cat.includes('health') || cat.includes('fitness') || cat.includes('sức khỏe') || cat.includes('thể') || cat.includes('gym');
    }).length;

    const workCount = completedRecords.filter(c => {
      const cat = (c.questCategory || '').toLowerCase();
      return cat.includes('work') || cat.includes('job') || cat.includes('công việc') || cat.includes('dự án') || cat.includes('project');
    }).length;

    const habitCount = completedRecords.filter(c => {
      const cat = (c.questCategory || '').toLowerCase();
      return cat.includes('habit') || cat.includes('thói quen') || cat.includes('daily') || cat.includes('hàng ngày');
    }).length;

    return [
      // 1. Total Quests Milestones
      makeAchievement(
        'quests-1',
        'First Step',
        'Bước Đầu Tiên',
        'Complete your first productivity quest',
        'Hoàn thành nhiệm vụ đầu tiên của bạn',
        '🌱',
        completedCount,
        1
      ),
      makeAchievement(
        'quests-10',
        'Consistent Adventurer',
        'Nhà Thám Hiểm Kiên Trì',
        'Complete 10 quests in total',
        'Hoàn thành tổng cộng 10 nhiệm vụ',
        '⚔️',
        completedCount,
        10
      ),
      makeAchievement(
        'quests-25',
        'Diligent Warrior',
        'Chiến Binh Cần Mẫn',
        'Complete 25 quests in total',
        'Hoàn thành tổng cộng 25 nhiệm vụ',
        '🛡️',
        completedCount,
        25
      ),
      makeAchievement(
        'quests-50',
        'Productivity Master',
        'Bậc Thầy Năng Suất',
        'Complete 50 quests in total',
        'Hoàn thành tổng cộng 50 nhiệm vụ',
        '🏆',
        completedCount,
        50
      ),
      makeAchievement(
        'quests-100',
        'Centurion of Tasks',
        'Bách Chiến Bách Thắng',
        'Complete 100 quests in total',
        'Hoàn thành tổng cộng 100 nhiệm vụ',
        '👑',
        completedCount,
        100
      ),
      makeAchievement(
        'quests-250',
        'Legend of Discipline',
        'Huyền Thoại Kỷ Luật',
        'Complete 250 quests in total',
        'Hoàn thành tổng cộng 250 nhiệm vụ',
        '🌟',
        completedCount,
        250
      ),
      makeAchievement(
        'quests-500',
        'Grandmaster of Focus',
        'Đại Sư Tập Trung',
        'Complete 500 quests in total',
        'Hoàn thành tổng cộng 500 nhiệm vụ',
        '⚜️',
        completedCount,
        500
      ),
      makeAchievement(
        'quests-1000',
        'Titan of Productivity',
        'Khổng Lồ Năng Suất',
        'Complete 1,000 quests in total',
        'Hoàn thành tổng cộng 1,000 nhiệm vụ',
        '💎',
        completedCount,
        1000
      ),

      // 2. Streak Milestones
      makeAchievement(
        'streak-3',
        'Spark of Habit',
        'Đốm Lửa Thói Quen',
        'Maintain a 3-day streak',
        'Duy trì chuỗi Streak liên tục 3 ngày',
        '✨',
        streakCount,
        3
      ),
      makeAchievement(
        'streak-7',
        '7-Day Champion',
        'Kỷ Lục 7 Ngày',
        'Maintain a 7-day productivity streak',
        'Duy trì chuỗi Streak liên tục 7 ngày',
        '🔥',
        streakCount,
        7
      ),
      makeAchievement(
        'streak-14',
        'Fortnight of Iron',
        'Hai Tuần Bất Khuất',
        'Maintain an unbroken 14-day streak',
        'Duy trì chuỗi Streak liên tục 14 ngày',
        '⚡',
        streakCount,
        14
      ),
      makeAchievement(
        'streak-30',
        'Centurion 30-Day',
        'Chiến Binh 30 Ngày',
        'Maintain an unbroken 30-day streak',
        'Duy trì chuỗi Streak 30 ngày bất khả chiến bại',
        '🛡️',
        streakCount,
        30
      ),
      makeAchievement(
        'streak-60',
        'Unstoppable Momentum',
        'Đà Tiến Bất Bại',
        'Maintain an unbroken 60-day streak',
        'Duy trì chuỗi Streak 60 ngày liên tục',
        '☄️',
        streakCount,
        60
      ),
      makeAchievement(
        'streak-100',
        'Triple Century',
        'Bách Nhật Hoàng Kim',
        'Maintain an unbroken 100-day streak',
        'Duy trì chuỗi Streak 100 ngày hoàng kim',
        '☀️',
        streakCount,
        100
      ),
      makeAchievement(
        'streak-365',
        'Year of Mastery',
        'Một Năm Bất Diệt',
        'Maintain an unbroken 365-day streak',
        'Duy trì chuỗi Streak 365 ngày bất diệt',
        '🌌',
        streakCount,
        365
      ),

      // 3. Category Mastery
      makeAchievement(
        'scholar-10',
        'The Scholar',
        'Học Giả Tri Thức',
        'Complete 10 quests in Study or Learning category',
        'Hoàn thành 10 nhiệm vụ thuộc danh mục Học tập',
        '📚',
        studyCount,
        10
      ),
      makeAchievement(
        'scholar-50',
        'Sage of Knowledge',
        'Hiền Triết Tri Thức',
        'Complete 50 quests in Study or Learning category',
        'Hoàn thành 50 nhiệm vụ thuộc danh mục Học tập',
        '📖',
        studyCount,
        50
      ),
      makeAchievement(
        'health-10',
        'Iron Will',
        'Ý Chí Thép',
        'Complete 10 quests in Health or Fitness category',
        'Hoàn thành 10 nhiệm vụ rèn luyện Sức khỏe',
        '💪',
        healthCount,
        10
      ),
      makeAchievement(
        'health-50',
        'Body of Steel',
        'Thể Phách Kim Cương',
        'Complete 50 quests in Health or Fitness category',
        'Hoàn thành 50 nhiệm vụ rèn luyện Sức khỏe',
        '🏋️',
        healthCount,
        50
      ),
      makeAchievement(
        'work-25',
        'Career Champion',
        'Chuyên Gia Công Việc',
        'Complete 25 quests in Work or Career category',
        'Hoàn thành 25 nhiệm vụ thuộc danh mục Công việc / Dự án',
        '💼',
        workCount,
        25
      ),
      makeAchievement(
        'habit-25',
        'Habit Architect',
        'Kiến Trúc Sư Thói Quen',
        'Complete 25 quests in Habit category',
        'Hoàn thành 25 nhiệm vụ rèn luyện Thói quen',
        '🎯',
        habitCount,
        25
      ),

      // 4. XP Milestones
      makeAchievement(
        'xp-1000',
        'XP Collector',
        'Tích Lũy 1,000 XP',
        'Accumulate 1,000 total XP',
        'Tích lũy tổng cộng 1,000 XP',
        '🪙',
        totalXP,
        1000
      ),
      makeAchievement(
        'xp-5000',
        'XP Champion',
        'Tích Lũy 5,000 XP',
        'Accumulate 5,000 total XP',
        'Tích lũy tổng cộng 5,000 XP',
        '🎖️',
        totalXP,
        5000
      ),
      makeAchievement(
        'xp-20000',
        'XP Legend',
        'Tích Lũy 20,000 XP',
        'Accumulate 20,000 total XP',
        'Tích lũy tổng cộng 20,000 XP',
        '🪐',
        totalXP,
        20000
      ),

      // 5. Rank Progression Badges
      makeAchievement(
        'rank-dormant',
        'Rank: Dormant',
        'Cảnh Giới: Dormant (Ngủ yên)',
        'Awaken potential as a Sleeper (Level 1)',
        'Khai mở tiềm năng Người ngủ (Đạt Level 1)',
        '🪨',
        currentLevel,
        1
      ),
      makeAchievement(
        'rank-awakened',
        'Rank: Awakened',
        'Cảnh Giới: Awakened (Thức tỉnh)',
        'Breakthrough to Awakened rank (Reach Level 10)',
        'Đột phá cảnh giới Người thức tỉnh (Đạt Level 10)',
        '🌿',
        currentLevel,
        10
      ),
      makeAchievement(
        'rank-ascended',
        'Rank: Ascended',
        'Cảnh Giới: Ascended (Thăng hoa)',
        'Ascend to Master rank (Reach Level 25)',
        'Thăng hoa cảnh giới Bậc thầy (Đạt Level 25)',
        '🔷',
        currentLevel,
        25
      ),
      makeAchievement(
        'rank-transcended',
        'Rank: Transcended',
        'Cảnh Giới: Transcended (Siêu việt)',
        'Reach Saint rank with transformation form (Level 50)',
        'Siêu việt cảnh giới Thánh nhân (Đạt Level 50)',
        '🔮',
        currentLevel,
        50
      ),
      makeAchievement(
        'rank-supreme',
        'Rank: Supreme',
        'Cảnh Giới: Supreme (Tối thượng)',
        'Command domains as a Sovereign (Level 100)',
        'Tối thượng cảnh giới Chúa tể lãnh địa (Đạt Level 100)',
        '👑',
        currentLevel,
        100
      ),
      makeAchievement(
        'rank-sacred',
        'Rank: Sacred',
        'Cảnh Giới: Sacred (Thánh thần)',
        'Approach absolute divinity as a Demigod (Level 200)',
        'Thánh thần cảnh giới Bán thần đỉnh cao (Đạt Level 200)',
        '☀️',
        currentLevel,
        200
      ),
      makeAchievement(
        'rank-divine',
        'Rank: Divine',
        'Cảnh Giới: Divine (Thần thánh)',
        'Reach the pinnacle of cosmic existence as a God (Level 400)',
        'Đạt đỉnh cao vũ trụ cảnh giới Thần thánh (Đạt Level 400)',
        '🌌',
        currentLevel,
        400
      ),
    ];
  },
};
