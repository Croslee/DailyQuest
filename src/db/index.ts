/**
 * Database module — re-exports database instance and all repositories.
 * This is the single entry point for database access from services.
 */
export { db, DailyQuestDB } from './database';
export { QuestRepository } from './repositories/questRepository';
export { QuestInstanceRepository } from './repositories/questInstanceRepository';
export { CompletionRepository } from './repositories/completionRepository';
export { DailyStatsRepository } from './repositories/dailyStatsRepository';
export { SettingsRepository } from './repositories/settingsRepository';

import { db } from './database';
import { QuestRepository } from './repositories/questRepository';
import { QuestInstanceRepository } from './repositories/questInstanceRepository';
import { CompletionRepository } from './repositories/completionRepository';
import { DailyStatsRepository } from './repositories/dailyStatsRepository';
import { SettingsRepository } from './repositories/settingsRepository';

/** Pre-instantiated repository singletons using the default database */
export const questRepository = new QuestRepository(db);
export const questInstanceRepository = new QuestInstanceRepository(db);
export const completionRepository = new CompletionRepository(db);
export const dailyStatsRepository = new DailyStatsRepository(db);
export const settingsRepository = new SettingsRepository(db);
