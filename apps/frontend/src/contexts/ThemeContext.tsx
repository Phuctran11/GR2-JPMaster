import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';
type ThemeTransitionPhase = 'idle' | 'closing' | 'opening';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  transitionPhase: ThemeTransitionPhase;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = 'theme';
const CLOSE_DURATION_MS = 800;
const OPEN_DURATION_MS = 1700;
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system' ? storedTheme : 'system';
}

function applyTheme(theme: ResolvedTheme) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);
  const [transitionPhase, setTransitionPhase] = useState<ThemeTransitionPhase>('idle');
  const timerRefs = useRef<number[]>([]);
  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    handleSystemThemeChange();
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, []);

  useEffect(() => () => {
    timerRefs.current.forEach((timerId) => window.clearTimeout(timerId));
  }, []);

  const changeThemeWithTransition = useCallback((getNextTheme: (currentTheme: Theme) => Theme) => {
    if (transitionPhase !== 'idle') return;

    setTransitionPhase('closing');

    const closeTimer = window.setTimeout(() => {
      setThemeState((currentTheme) => getNextTheme(currentTheme));
      setTransitionPhase('opening');

      const openTimer = window.setTimeout(() => {
        setTransitionPhase('idle');
      }, OPEN_DURATION_MS);
      timerRefs.current.push(openTimer);
    }, CLOSE_DURATION_MS);

    timerRefs.current.push(closeTimer);
  }, [transitionPhase]);

  const setTheme = useCallback((nextTheme: Theme) => {
    changeThemeWithTransition(() => nextTheme);
  }, [changeThemeWithTransition]);

  const toggleTheme = useCallback(() => {
    changeThemeWithTransition((currentTheme) => {
      const currentResolvedTheme = currentTheme === 'system' ? getSystemTheme() : currentTheme;
      return currentResolvedTheme === 'dark' ? 'light' : 'dark';
    });
  }, [changeThemeWithTransition]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, transitionPhase, setTheme, toggleTheme }),
    [theme, resolvedTheme, transitionPhase, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
