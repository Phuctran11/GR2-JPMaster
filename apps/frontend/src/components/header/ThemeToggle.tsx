import { useRef, useState, type PointerEvent } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

function PullSwitchVisual({ isDark, dragOffset = 0, className = '' }: { isDark: boolean; dragOffset?: number; className?: string }) {
  return (
    <span className={`group relative flex h-12 w-10 shrink-0 items-end justify-center rounded-full ${className}`}>
      <span className="absolute bottom-7 left-1/2 h-12 w-0.5 -translate-x-1/2 rounded-full bg-outline-variant transition-colors group-hover:bg-primary/50" />
      <span
        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border transition-[box-shadow,transform,background] duration-200 ${
          isDark
            ? 'border-outline-variant bg-[radial-gradient(circle_at_center,_rgb(var(--color-outline)),_rgb(var(--color-surface-container-high)),_rgb(var(--color-surface-container-lowest)))] text-primary shadow-[0_0_18px_5px_rgba(31,41,55,0.55)]'
            : 'border-warning/30 bg-[radial-gradient(circle_at_center,_rgb(var(--color-warning)),_rgb(var(--color-secondary)),_rgb(var(--color-warning-container)))] text-on-secondary shadow-[0_0_20px_7px_rgba(250,204,21,0.38)]'
        }`}
        style={{ transform: `translateY(${dragOffset}px)` }}
      >
        <span className="material-symbols-outlined text-[18px]">{isDark ? 'dark_mode' : 'light_mode'}</span>
      </span>
    </span>
  );
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { resolvedTheme, transitionPhase, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const isTransitioning = transitionPhase !== 'idle';
  const startYRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const resetDrag = () => {
    setIsDragging(false);
    setDragOffset(0);
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (isTransitioning) return;
    startYRef.current = event.clientY;
    hasDraggedRef.current = false;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!isDragging || isTransitioning) return;

    const nextOffset = Math.max(0, Math.min(event.clientY - startYRef.current, 26));
    if (nextOffset > 3) hasDraggedRef.current = true;
    setDragOffset(nextOffset);
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    if (!isDragging || isTransitioning) return;

    const shouldToggle = dragOffset > 14 || !hasDraggedRef.current;
    resetDrag();
    event.currentTarget.releasePointerCapture(event.pointerId);

    if (shouldToggle) {
      toggleTheme();
    }
  };

  return (
    <button
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-disabled={isTransitioning}
      type="button"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={resetDrag}
      onKeyDown={(event) => {
        if (isTransitioning) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleTheme();
        }
      }}
      className={`group relative flex h-12 w-10 shrink-0 touch-none select-none items-end justify-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 ${isTransitioning ? 'cursor-wait' : isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${className}`}
    >
      <PullSwitchVisual isDark={isDark} dragOffset={dragOffset} />
    </button>
  );
}

export function ThemeTogglePreview({ className = '' }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  return <PullSwitchVisual isDark={resolvedTheme === 'dark'} className={className} />;
}
