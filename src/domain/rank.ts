/**
 * Rank Progression Domain
 *
 * Progression ranks (Exponential Power Scale):
 * - Dormant (Ngủ yên): Người ngủ (Sleeper) (Lv 1 - 9)
 * - Awakened (Thức tỉnh): Người thức tỉnh (Lv 10 - 24)
 * - Ascended (Thăng hoa): Bậc Master (Bậc thầy) (Lv 25 - 49)
 * - Transcended (Siêu việt): Bậc Saint (Thánh) (Lv 50 - 99)
 * - Supreme (Tối thượng): Bậc Sovereign (Chủ nhân) (Lv 100 - 199)
 * - Sacred (Thánh thần): Thực thể bán thần (Lv 200 - 399)
 * - Divine (Thần thánh): Cấp bậc cao nhất (Lv 400+)
 */

export interface ShadowSlaveRank {
  id: 'dormant' | 'awakened' | 'ascended' | 'transcended' | 'supreme' | 'sacred' | 'divine';
  titleVi: string;
  titleEn: string;
  classVi: string;
  classEn: string;
  icon: string;
  descriptionVi: string;
  descriptionEn: string;
  minLevel: number;
  maxLevel: number;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  accentGlow: string;
}

export const SHADOW_SLAVE_RANKS: ShadowSlaveRank[] = [
  {
    id: 'dormant',
    titleVi: 'Dormant (Ngủ yên)',
    titleEn: 'Dormant',
    classVi: 'Người ngủ (Sleeper)',
    classEn: 'Sleeper',
    icon: '🪨',
    descriptionVi: 'Giai đoạn sơ khởi, rèn luyện ý chí và tiềm năng',
    descriptionEn: 'Initial awakening of dormant potential and will',
    minLevel: 1,
    maxLevel: 9,
    color: '#94a3b8', // slate-400
    badgeBg: 'rgba(148, 163, 184, 0.12)',
    badgeBorder: 'rgba(148, 163, 184, 0.25)',
    accentGlow: 'rgba(148, 163, 184, 0.2)',
  },
  {
    id: 'awakened',
    titleVi: 'Awakened (Thức tỉnh)',
    titleEn: 'Awakened',
    classVi: 'Người thức tỉnh',
    classEn: 'Awakened',
    icon: '🌿',
    descriptionVi: 'Bắt đầu làm chủ năng lực cốt lõi và kiểm soát bản thân',
    descriptionEn: 'Mastering core abilities and disciplined focus',
    minLevel: 10,
    maxLevel: 24,
    color: '#10b981', // emerald-500
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    badgeBorder: 'rgba(16, 185, 129, 0.25)',
    accentGlow: 'rgba(16, 185, 129, 0.25)',
  },
  {
    id: 'ascended',
    titleVi: 'Ascended (Thăng hoa)',
    titleEn: 'Ascended',
    classVi: 'Bậc Master (Bậc thầy)',
    classEn: 'Master',
    icon: '🔷',
    descriptionVi: 'Khai mở năng lực thăng hoa, biến kỷ luật thành sức mạnh',
    descriptionEn: 'Transcending limits, discipline transformed into power',
    minLevel: 25,
    maxLevel: 49,
    color: '#3b82f6', // blue-500
    badgeBg: 'rgba(59, 130, 246, 0.12)',
    badgeBorder: 'rgba(59, 130, 246, 0.25)',
    accentGlow: 'rgba(59, 130, 246, 0.25)',
  },
  {
    id: 'transcended',
    titleVi: 'Transcended (Siêu việt)',
    titleEn: 'Transcended',
    classVi: 'Bậc Saint (Thánh)',
    classEn: 'Saint',
    icon: '⚜️',
    descriptionVi: 'Sở hữu hình thái biến hình riêng, uy lực áp đảo',
    descriptionEn: 'Possessing a unique transformation form and immense presence',
    minLevel: 50,
    maxLevel: 99,
    color: '#a855f7', // purple-500
    badgeBg: 'rgba(168, 85, 247, 0.12)',
    badgeBorder: 'rgba(168, 85, 247, 0.25)',
    accentGlow: 'rgba(168, 85, 247, 0.25)',
  },
  {
    id: 'supreme',
    titleVi: 'Supreme (Tối thượng)',
    titleEn: 'Supreme',
    classVi: 'Bậc Sovereign (Chủ nhân)',
    classEn: 'Sovereign',
    icon: '👑',
    descriptionVi: 'Kiểm soát các vùng miền, thiết lập lãnh địa riêng',
    descriptionEn: 'Ruling over vast domains and controlling reality bounds',
    minLevel: 100,
    maxLevel: 199,
    color: '#ef4444', // red-500
    badgeBg: 'rgba(239, 68, 68, 0.12)',
    badgeBorder: 'rgba(239, 68, 68, 0.25)',
    accentGlow: 'rgba(239, 68, 68, 0.25)',
  },
  {
    id: 'sacred',
    titleVi: 'Sacred (Thánh thần)',
    titleEn: 'Sacred',
    classVi: 'Thực thể bán thần',
    classEn: 'Demigod',
    icon: '☀️',
    descriptionVi: 'Cảnh giới tiệm cận thần linh, sức mạnh thay đổi quy luật',
    descriptionEn: 'Approaching godhood, authority altering laws of reality',
    minLevel: 200,
    maxLevel: 399,
    color: '#f59e0b', // amber-500
    badgeBg: 'rgba(245, 158, 11, 0.12)',
    badgeBorder: 'rgba(245, 158, 11, 0.25)',
    accentGlow: 'rgba(245, 158, 11, 0.25)',
  },
  {
    id: 'divine',
    titleVi: 'Divine (Thần thánh)',
    titleEn: 'Divine',
    classVi: 'Thần thánh (God)',
    classEn: 'God',
    icon: '🌌',
    descriptionVi: 'Cảnh giới tuyệt đối cao nhất, làm chủ toàn bộ vận mệnh',
    descriptionEn: 'The absolute pinnacle domain, master of destiny',
    minLevel: 400,
    maxLevel: 99999,
    color: '#ec4899', // pink-500
    badgeBg: 'rgba(236, 72, 153, 0.12)',
    badgeBorder: 'rgba(236, 72, 153, 0.25)',
    accentGlow: 'rgba(236, 72, 153, 0.25)',
  },
];

/**
 * Get the Shadow Slave Rank corresponding to a given level.
 */
export function getRankForLevel(level: number): ShadowSlaveRank {
  const lvl = Math.max(1, Math.floor(level));
  const rank = SHADOW_SLAVE_RANKS.find(r => lvl >= r.minLevel && lvl <= r.maxLevel);
  return rank || SHADOW_SLAVE_RANKS[SHADOW_SLAVE_RANKS.length - 1];
}

/**
 * Check if leveling from prevLevel to newLevel achieved a rank promotion.
 */
export function checkRankPromotion(prevLevel: number, newLevel: number): {
  promoted: boolean;
  oldRank: ShadowSlaveRank;
  newRank: ShadowSlaveRank;
} {
  const oldRank = getRankForLevel(prevLevel);
  const newRank = getRankForLevel(newLevel);
  const promoted = newLevel > prevLevel && oldRank.id !== newRank.id;

  return {
    promoted,
    oldRank,
    newRank,
  };
}
