/** Difficulty levels for quests */
export type Difficulty = 'easy' | 'normal' | 'hard' | 'epic';

/** Priority levels for quest ordering */
export type Priority = 'low' | 'medium' | 'high';

/** Status of a quest instance for a specific day */
export type InstanceStatus = 'pending' | 'completed' | 'skipped' | 'missed';

/** Subtask item inside a quest */
export interface Subtask {
  id: string;
  title: string;
  completed?: boolean;
}

/** Recurrence pattern for a quest */
export type Recurrence =
  | { type: 'once' }
  | { type: 'daily' }
  | { type: 'weekly'; days: number[] } // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  | { type: 'scheduled'; date: string };

/**
 * Quest — The reusable template/definition of a task.
 * Quests are never mutated for historical purposes; instances track daily state.
 */
export interface Quest {
  /** Unique identifier (crypto.randomUUID()) */
  id: string;
  /** Display title */
  title: string;
  /** Optional longer description */
  description?: string;
  /** Category for grouping and statistics */
  category: string;
  /** Difficulty level — determines default XP */
  difficulty: Difficulty;
  /** XP earned on completion (snapshot at creation, user-overridable) */
  xp: number;
  /** How often this quest recurs */
  recurrence: Recurrence;
  /** Sorting priority */
  priority: Priority;
  /** Subtasks blueprint */
  subtasks?: Subtask[];
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** ISO 8601 last-updated timestamp */
  updatedAt: string;
  /** Soft-delete flag — archived quests stop generating instances but history is preserved */
  archived: boolean;
}

/**
 * QuestInstance — A materialized occurrence of a quest for a specific day.
 * One instance per quest per day. Never mutate the parent Quest for daily tracking.
 */
export interface QuestInstance {
  /** Unique identifier */
  id: string;
  /** FK to Quest.id */
  questId: string;
  /** Local date key (YYYY-MM-DD) */
  date: string;
  /** Current status of this instance */
  status: InstanceStatus;
  /** Subtasks for this specific daily instance */
  subtasks?: Subtask[];
  /** Manual sort order */
  order?: number;
  /** If postponed, the target date (YYYY-MM-DD) */
  postponedTo?: string;
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** ISO 8601 last-updated timestamp */
  updatedAt: string;
}

/** Input for creating a new quest (before defaults are applied) */
export interface CreateQuestInput {
  title: string;
  description?: string;
  category?: string;
  difficulty?: Difficulty;
  xp?: number;
  recurrence?: Recurrence;
  priority?: Priority;
  subtasks?: Subtask[];
}

/** Input for updating an existing quest */
export interface UpdateQuestInput {
  title?: string;
  description?: string;
  category?: string;
  difficulty?: Difficulty;
  xp?: number;
  recurrence?: Recurrence;
  priority?: Priority;
  subtasks?: Subtask[];
}
