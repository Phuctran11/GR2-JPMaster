import type { AnalyticsSummary } from '../../services/api';
import { formatMinutes } from './profileUtils';

export function StudyTimeOverview({ summary }: { summary: AnalyticsSummary | null }) {
  const totalSeconds = summary?.total_study_seconds ?? 0;
  const weekSeconds = summary?.study_seconds_this_week ?? 0;
  const monthSeconds = summary?.study_seconds_this_month ?? 0;
  const monthPercent = totalSeconds > 0 ? Math.min(100, Math.round((monthSeconds / totalSeconds) * 100)) : 0;
  const weekPercent = monthSeconds > 0 ? Math.min(100, Math.round((weekSeconds / monthSeconds) * 100)) : 0;

  return (
    <div className="rounded-xl border border-outline-variant bg-surface p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.1fr_0.9fr_0.9fr]">
        <div className="rounded-lg bg-gradient-to-br from-primary via-[#2563eb] to-[#0f766e] p-4 text-white shadow-md shadow-primary/20">
          <div className="flex items-center justify-between gap-3">
            <p className="text-label-md font-bold uppercase tracking-wide text-white/80">Total study time</p>
            <span className="material-symbols-outlined text-[22px]">timer</span>
          </div>
          <p className="mt-3 text-headline-md font-black">{formatMinutes(totalSeconds)}</p>
          <p className="mt-1 text-label-md text-white/85">From completed lessons</p>
        </div>
        <div className="rounded-lg border border-[#20b486]/25 bg-[#eafaf4] p-4">
          <p className="text-label-md font-bold text-on-surface-variant">This week</p>
          <p className="mt-2 text-headline-sm font-black text-[#08795c]">{formatMinutes(weekSeconds)}</p>
          <div className="mt-3 h-2 rounded-full bg-white/80 shadow-inner">
            <div className="h-full rounded-full bg-gradient-to-r from-[#20b486] to-[#73d13d] transition-all" style={{ width: `${weekPercent}%` }} />
          </div>
          <p className="mt-2 text-label-md text-on-surface-variant">{weekPercent}% of this month</p>
        </div>
        <div className="rounded-lg border border-[#7c3aed]/20 bg-[#f4efff] p-4">
          <p className="text-label-md font-bold text-on-surface-variant">This month</p>
          <p className="mt-2 text-headline-sm font-black text-[#6d28d9]">{formatMinutes(monthSeconds)}</p>
          <div className="mt-3 h-2 rounded-full bg-white/80 shadow-inner">
            <div className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#38bdf8] transition-all" style={{ width: `${monthPercent}%` }} />
          </div>
          <p className="mt-2 text-label-md text-on-surface-variant">{monthPercent}% of total</p>
        </div>
      </div>
    </div>
  );
}
