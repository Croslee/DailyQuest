import { useEffect, useRef, useCallback } from 'react';
import { getLocalDateKey } from '@/utils/date';

/**
 * Hook that detects date changes (midnight transition, sleep/wake, etc.).
 * Calls the onDateChange callback when the local date changes.
 */
export function useDateCheck(onDateChange: (newDate: string) => void) {
  const currentDateRef = useRef(getLocalDateKey());

  const checkDate = useCallback(() => {
    const now = getLocalDateKey();
    if (now !== currentDateRef.current) {
      currentDateRef.current = now;
      onDateChange(now);
    }
  }, [onDateChange]);

  useEffect(() => {
    // Check on mount
    checkDate();

    // Check periodically (every 30 seconds)
    const interval = setInterval(checkDate, 30_000);

    // Check on visibility change (tab focus, wake from sleep)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkDate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [checkDate]);
}
