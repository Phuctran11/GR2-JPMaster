import type { StudyTimePoint } from '../../services/api';
import { formatCompactDate, formatDate, formatMinutes } from './profileUtils';

export function StudyTimeChart({ points }: { points: StudyTimePoint[] }) {
  const maxSeconds = Math.max(...points.map((item) => item.duration_seconds), 1);
  const totalSeconds = points.reduce((sum, item) => sum + item.duration_seconds, 0);
  const activeDays = points.filter((item) => item.duration_seconds > 0).length;
  const averageSeconds = activeDays ? Math.round(totalSeconds / activeDays) : 0;
  const peakPoint = points.reduce<StudyTimePoint | null>((peak, point) => {
    if (!peak || point.duration_seconds > peak.duration_seconds) return point;
    return peak;
  }, null);

  return (
    <div className="rounded-xl border border-outline-variant bg-surface p-4 shadow-sm md:p-5">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">monitoring</span>
            <h3 className="text-title-md font-bold text-on-surface">Study time trend</h3>
          </div>
          <p className="mt-2 text-body-md text-on-surface-variant">Completed lesson duration by day over the last 30 days.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-left sm:text-right">
          <div className="rounded-lg bg-surface-container-low px-3 py-2">
            <p className="text-title-md font-bold text-primary">{formatMinutes(totalSeconds)}</p>
            <p className="text-label-md text-on-surface-variant">Total</p>
          </div>
          <div className="rounded-lg bg-surface-container-low px-3 py-2">
            <p className="text-title-md font-bold text-primary">{formatMinutes(averageSeconds)}</p>
            <p className="text-label-md text-on-surface-variant">Daily avg</p>
          </div>
          <div className="rounded-lg bg-surface-container-low px-3 py-2">
            <p className="text-title-md font-bold text-primary">{peakPoint ? formatMinutes(peakPoint.duration_seconds) : '0 min'}</p>
            <p className="text-label-md text-on-surface-variant">Best day</p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-outline-variant bg-[linear-gradient(180deg,#f8fbff_0%,#eef7f5_100%)] p-3 dark:bg-[linear-gradient(180deg,rgba(30,41,59,0.75)_0%,rgba(15,23,42,0.95)_100%)]">
        <div className="flex h-52 min-w-[620px] items-end gap-1">
          {points.map((point, index) => {
            const isActive = point.duration_seconds > 0;
            const showLabel = index === 0 || index === points.length - 1 || index % 7 === 0;
            const isPeak = peakPoint?.study_date === point.study_date && isActive;
            return (
              <div key={point.study_date} className="flex flex-1 flex-col items-center gap-2">
                <div className="relative flex h-36 w-full items-end rounded-md bg-surface/70 px-0.5 shadow-inner dark:bg-white/6 dark:ring-1 dark:ring-white/8">
                  <div
                    title={`${formatDate(point.study_date)}: ${formatMinutes(point.duration_seconds)}`}
                    className={`w-full rounded-t transition-all duration-300 hover:scale-y-105 ${
                      isActive
                        ? isPeak
                          ? 'bg-gradient-to-t from-[#f59e0b] via-[#facc15] to-[#fef08a] shadow-sm shadow-[#f59e0b]/30 dark:from-[#fb923c] dark:via-[#facc15] dark:to-[#fef3c7] dark:shadow-[#facc15]/35'
                          : 'bg-gradient-to-t from-[#2563eb] via-[#14b8a6] to-[#86efac] shadow-sm shadow-primary/10 dark:from-[#60a5fa] dark:via-[#2dd4bf] dark:to-[#bbf7d0] dark:shadow-[#2dd4bf]/30'
                        : 'bg-outline-variant/50 dark:bg-white/12'
                    }`}
                    style={{ height: `${isActive ? Math.max(8, (point.duration_seconds / maxSeconds) * 100) : 4}%` }}
                  />
                  {isPeak && (
                    <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#f59e0b] shadow-[0_0_0_4px_rgba(245,158,11,0.18)]" />
                  )}
                </div>
                <span className="h-4 text-[10px] font-semibold text-on-surface-variant">
                  {showLabel ? formatCompactDate(point.study_date) : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-2 text-label-md text-on-surface-variant sm:grid-cols-3">
        <div className="rounded-lg bg-[#eef7fb] px-3 py-2 dark:bg-sky-400/10 dark:text-sky-100">
          <span className="font-bold text-on-surface">{activeDays}</span> active days
        </div>
        <div className="rounded-lg bg-[#fff7df] px-3 py-2 dark:bg-amber-400/10 dark:text-amber-100">
          Peak: <span className="font-bold text-on-surface">{peakPoint ? formatCompactDate(peakPoint.study_date) : 'None'}</span>
        </div>
        <div className="rounded-lg bg-[#f1f5f9] px-3 py-2 dark:bg-slate-700/40 dark:text-slate-100">
          Range: <span className="font-bold text-on-surface">{points[0] ? formatCompactDate(points[0].study_date) : ''}</span>
          {' - '}
          <span className="font-bold text-on-surface">{points[points.length - 1] ? formatCompactDate(points[points.length - 1].study_date) : ''}</span>
        </div>
      </div>
    </div>
  );
}
