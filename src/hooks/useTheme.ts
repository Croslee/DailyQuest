import { useEffect } from 'react';
import type { Theme } from '@/types/settings';
import { applyTheme } from '@/constants/theme';

/** Hook to apply theme on mount. Used in entry points. */
export function useTheme(theme: Theme) {
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
}
