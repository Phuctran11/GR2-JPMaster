import { Card } from '../index';
import { Heading, Text } from '../ui/Typography';
import type { Achievement } from '../../services/api';
import { AchievementLevelCard } from './AchievementLevelCard';
import { tierStyles, type AchievementTrack } from './profileUtils';

export function ProfileAchievementsTab({
  achievements,
  achievementTracks,
  filteredAchievementTracks,
  achievementFilter,
  onAchievementFilterChange,
}: {
  achievements: Achievement[];
  achievementTracks: AchievementTrack[];
  filteredAchievementTracks: AchievementTrack[];
  achievementFilter: string;
  onAchievementFilterChange: (filter: string) => void;
}) {
  return (
    <Card className="p-6 md:p-8 border border-outline-variant">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Heading level="h2" size="headline-lg" className="text-primary">Achievements</Heading>
          <Text variant="body-md" color="on-surface-variant" className="mt-2">Collect tiered badges as you build strong study habits.</Text>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-right">
          <p className="text-headline-sm font-bold text-primary">{achievements.filter((item) => item.earned_at).length}/{achievements.length}</p>
          <p className="text-label-md text-on-surface-variant">earned</p>
        </div>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {(['bronze', 'silver', 'gold', 'platinum'] as const).map((tier) => {
          const earnedCount = achievements.filter((item) => item.tier === tier && item.earned_at).length;
          const totalCount = achievements.filter((item) => item.tier === tier).length;

          return (
            <div key={tier} className={`rounded-xl border p-3 shadow-sm ${tierStyles[tier].shell} ${tierStyles[tier].glow}`}>
              <div className="flex items-center justify-between gap-2">
                <p className={`text-label-sm font-black uppercase ${tierStyles[tier].label}`}>{tier}</p>
                <span className={`material-symbols-outlined rounded-full p-1 text-[17px] ${tierStyles[tier].icon}`}>workspace_premium</span>
              </div>
              <p className="mt-2 text-headline-sm font-bold text-on-surface">{earnedCount}</p>
              <p className="text-label-md text-on-surface-variant">{Math.max(totalCount - earnedCount, 0)} locked</p>
            </div>
          );
        })}
      </div>

      <div className="mb-6 overflow-x-auto">
        <div className="flex min-w-max gap-2">
          <button
            type="button"
            onClick={() => onAchievementFilterChange('all')}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-label-md font-bold transition-colors ${
              achievementFilter === 'all'
                ? 'border-primary bg-primary text-on-primary'
                : 'border-outline-variant bg-surface text-on-surface-variant hover:border-primary hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">apps</span>
            All
          </button>
          {achievementTracks.map((track) => (
            <button
              key={track.key}
              type="button"
              onClick={() => onAchievementFilterChange(track.key)}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-label-md font-bold transition-colors ${
                achievementFilter === track.key
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-outline-variant bg-surface text-on-surface-variant hover:border-primary hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{track.icon}</span>
              {track.title}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {filteredAchievementTracks.map((track) => (
          <AchievementLevelCard key={track.key} track={track} />
        ))}
      </div>
    </Card>
  );
}
