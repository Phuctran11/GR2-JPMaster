import { useTheme } from '../contexts/ThemeContext';

export function ThemeTransitionOverlay() {
  const { transitionPhase, resolvedTheme } = useTheme();
  const isIdle = transitionPhase === 'idle';
  const isClosing = transitionPhase === 'closing';
  const isDark = resolvedTheme === 'dark';

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-[200] overflow-hidden transition-opacity duration-200 ${
        isIdle ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`absolute inset-y-0 left-0 w-1/2 border-r border-outline-variant/50 bg-gradient-to-br from-surface-container-highest via-surface to-primary-container shadow-2xl transition-transform duration-[360ms] ease-in-out motion-reduce:transition-none ${
          isClosing ? 'translate-x-0' : '-translate-x-full'
        }`}
      />
      <div
        className={`absolute inset-y-0 right-0 w-1/2 border-l border-outline-variant/50 bg-gradient-to-bl from-surface-container-highest via-surface-container to-secondary-container shadow-2xl transition-transform duration-[360ms] ease-in-out motion-reduce:transition-none ${
          isClosing ? 'translate-x-0' : 'translate-x-full'
        }`}
      />

      <div
        className={`absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-outline-variant bg-surface text-primary shadow-2xl shadow-primary/20 transition-all duration-200 ${
          isIdle ? 'scale-75 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <span className="material-symbols-outlined text-[30px]">
          {isDark ? 'dark_mode' : 'light_mode'}
        </span>
      </div>
    </div>
  );
}
