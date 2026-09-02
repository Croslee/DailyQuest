import { getLocalDateKey, formatDateKey } from '@/utils/date';

/** Simple hook that returns today's date information */
export function useToday() {
  const dateKey = getLocalDateKey();
  const formatted = formatDateKey(dateKey);
  return { dateKey, formatted };
}
