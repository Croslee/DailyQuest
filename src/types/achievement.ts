export interface Achievement {
  id: string;
  title: string;
  titleVi?: string;
  description: string;
  descriptionVi?: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number; // 0 - 100%
  isCustom?: boolean;
  targetCount?: number;
  currentCount?: number;
  createdAt?: string;
}

export interface CreateCustomAchievementInput {
  title: string;
  description: string;
  icon: string;
  targetCount?: number;
}
