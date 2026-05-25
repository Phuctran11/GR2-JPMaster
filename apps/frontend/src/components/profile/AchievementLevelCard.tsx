import { useState } from 'react';
import { formatDate, tierStyles, type AchievementTrack } from './profileUtils';

export function AchievementLevelCard({ track }: { track: AchievementTrack }) {
  const defaultIndex = track.items.reduce((latestIndex, achievement, index) => {
    return achievement.earned_at ? index : latestIndex;
  }, 0);
  const [levelIndex, setLevelIndex] = useState(defaultIndex);
  const achievement = track.items[levelIndex] ?? track.items[0];
  const earned = Boolean(achievement.earned_at);
  const styles = tierStyles[achievement.tier];
  const progressPercent = Math.min(100, (achievement.current_value / achievement.condition_value) * 100);
  const canGoPrevious = levelIndex > 0;
  const canGoNext = levelIndex < track.items.length - 1;

  return (
    <div className={`group relative overflow-hidden rounded-xl border p-5 transition-all hover:-translate-y-1 hover:shadow-lg ${earned ? `${styles.shell} ${styles.glow}` : 'border-outline-variant bg-surface-container-low'}`}>
      <div className={`absolute left-0 top-0 h-full w-1 ${earned ? styles.accent : 'bg-outline-variant'}`} />
      {!earned && (
        <div className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant bg-surface/95 text-on-surface-variant shadow-sm" aria-label="Achievement locked" title="Achievement locked">
          <span className="material-symbols-outlined text-[15px]">lock</span>
        </div>
      )}

      <button
        type="button"
        onClick={() => setLevelIndex((current) => Math.max(0, current - 1))}
        disabled={!canGoPrevious}
        className={`absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-outline-variant bg-surface shadow-sm transition-all md:opacity-0 md:group-hover:opacity-100 ${
          canGoPrevious ? 'text-primary hover:border-primary hover:bg-primary hover:text-on-primary' : 'cursor-not-allowed text-outline opacity-40'
        }`}
        aria-label={`View previous ${track.title} level`}
      >
        <span className="material-symbols-outlined text-[20px]">chevron_left</span>
      </button>

      <button
        type="button"
        onClick={() => setLevelIndex((current) => Math.min(track.items.length - 1, current + 1))}
        disabled={!canGoNext}
        className={`absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-outline-variant bg-surface shadow-sm transition-all md:opacity-0 md:group-hover:opacity-100 ${
          canGoNext ? 'text-primary hover:border-primary hover:bg-primary hover:text-on-primary' : 'cursor-not-allowed text-outline opacity-40'
        }`}
        aria-label={`View next ${track.title} level`}
      >
        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
      </button>

      <div className="flex items-start gap-4 px-8 sm:px-10">
        <div className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-xl ${earned ? styles.icon : 'bg-surface text-outline ring-1 ring-outline-variant'}`}>
          <span className={`material-symbols-outlined text-[30px] ${earned ? '' : 'opacity-45'}`}>{achievement.badge_icon || track.icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-label-md font-black uppercase tracking-wide text-on-surface-variant">{track.title}</p>
              <h3 className="mt-1 truncate text-title-lg font-bold text-on-surface">{achievement.name}</h3>
            </div>
            <span className={`rounded-full bg-surface px-2 py-1 text-label-sm font-black uppercase ${earned ? styles.label : 'text-on-surface-variant'}`}>
              {achievement.tier}
            </span>
          </div>
          <p className="mt-1 text-body-md text-on-surface-variant">{achievement.description}</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-label-md">
            <span className="font-semibold text-on-surface-variant">Level {levelIndex + 1} / {track.items.length}</span>
            <span className={earned ? styles.label : 'font-semibold text-primary'}>
              {Math.min(achievement.current_value, achievement.condition_value)} / {achievement.condition_value}
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-surface shadow-inner">
            <div className={`h-full rounded-full transition-all ${earned ? styles.accent : 'bg-gradient-to-r from-outline-variant via-primary/55 to-primary/75'}`} style={{ width: `${earned ? 100 : progressPercent}%` }} />
          </div>
          <p className={`mt-2 text-label-md font-semibold ${earned ? styles.label : 'text-on-surface-variant'}`}>
            {earned ? `Earned ${formatDate(achievement.earned_at || undefined)}` : `${Math.min(achievement.current_value, achievement.condition_value)} / ${achievement.condition_value} to unlock`}
          </p>
          <div className="mt-4 flex gap-1">
            {track.items.map((item, index) => (
              <button
                key={item.achievement_id}
                type="button"
                onClick={() => setLevelIndex(index)}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  index === levelIndex ? styles.accent : item.earned_at ? 'bg-primary/40' : 'bg-outline-variant'
                }`}
                aria-label={`View ${item.tier} level`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
