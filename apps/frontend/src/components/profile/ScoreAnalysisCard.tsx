import { useId } from 'react';
import type { AnalyticsAttempt } from '../../services/api';
import { formatDate } from './profileUtils';

function AttemptList({ title, attempts }: { title: string; attempts: AnalyticsAttempt[] }) {
  return (
    <div className="mt-6 rounded-xl border border-outline-variant bg-surface p-4">
      <h3 className="mb-3 text-title-md font-bold text-on-surface">{title}</h3>
      {attempts.length === 0 ? (
        <p className="text-body-md text-on-surface-variant">No attempts yet.</p>
      ) : (
        <div className="space-y-3">
          {attempts.slice(0, 5).map((attempt) => (
            <div key={attempt.attempt_id} className="flex items-center justify-between gap-4 rounded-lg bg-surface-container-low p-3">
              <div className="min-w-0">
                <p className="truncate text-body-md font-semibold text-on-surface">{attempt.title}</p>
                <p className="text-label-md text-on-surface-variant">{formatDate(attempt.submitted_at || attempt.started_at)}</p>
              </div>
              <p className="text-title-md font-bold text-primary">{attempt.score ?? 0}%</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreTrendLine({ attempts }: { attempts: AnalyticsAttempt[] }) {
  const chartId = useId().replace(/:/g, '');
  const points = attempts
    .filter((attempt) => typeof attempt.score === 'number')
    .slice()
    .reverse()
    .slice(-8);
  const width = 320;
  const height = 120;
  const padding = 18;

  if (points.length === 0) {
    return (
      <div className="flex h-36 items-center justify-center rounded-xl bg-surface-container-low text-body-md text-on-surface-variant">
        No score data yet.
      </div>
    );
  }

  const coordinates = points.map((attempt, index) => {
    const x = points.length === 1 ? width / 2 : padding + (index / (points.length - 1)) * (width - padding * 2);
    const y = height - padding - ((attempt.score ?? 0) / 100) * (height - padding * 2);
    return { x, y, score: attempt.score ?? 0, title: attempt.title };
  });
  const pathData = coordinates.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = `${pathData} L ${coordinates[coordinates.length - 1].x} ${height - padding} L ${coordinates[0].x} ${height - padding} Z`;

  return (
    <div className="rounded-xl border border-outline-variant bg-[linear-gradient(180deg,#f8fbff_0%,#eef7ff_100%)] p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-36 w-full" role="img" aria-label="Score trend line chart">
        <defs>
          <linearGradient id={`scoreLine${chartId}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="55%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id={`scoreArea${chartId}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[25, 50, 75, 100].map((value) => {
          const y = height - padding - (value / 100) * (height - padding * 2);
          return <line key={value} x1={padding} y1={y} x2={width - padding} y2={y} stroke="currentColor" strokeDasharray="4 5" className="text-outline-variant/70" />;
        })}
        <path d={areaPath} fill={`url(#scoreArea${chartId})`} />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" className="text-outline-variant" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="currentColor" className="text-outline-variant" />
        <path d={pathData} fill="none" stroke={`url(#scoreLine${chartId})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {coordinates.map((point, index) => (
          <g key={`${point.title}-${index}`}>
            <circle cx={point.x} cy={point.y} r="6" fill="#ffffff" stroke="#14b8a6" strokeWidth="3">
              <title>{`${point.title}: ${point.score}%`}</title>
            </circle>
            <circle cx={point.x} cy={point.y} r="2.5" fill="#2563eb" />
          </g>
        ))}
      </svg>
      <div className="flex justify-between text-label-md text-on-surface-variant">
        <span>Oldest</span>
        <span>Score %</span>
        <span>Latest</span>
      </div>
    </div>
  );
}

export function ScoreAnalysisCard({
  title,
  icon,
  attempts,
  average,
  count,
}: {
  title: string;
  icon: string;
  attempts: AnalyticsAttempt[];
  average: number;
  count: number;
}) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">{icon}</span>
            <h3 className="text-title-md font-bold text-on-surface">{title}</h3>
          </div>
          <p className="mt-1 text-body-md text-on-surface-variant">Average score and recent score trend.</p>
        </div>
        <div className="text-right">
          <p className="text-headline-sm font-bold text-primary">{Math.round(average)}%</p>
          <p className="text-label-md text-on-surface-variant">{count} attempts</p>
        </div>
      </div>
      <ScoreTrendLine attempts={attempts} />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-surface-container-low p-3">
          <p className="text-label-md text-on-surface-variant">Best score</p>
          <p className="text-title-md font-bold text-primary">{Math.max(0, ...attempts.map((attempt) => attempt.score ?? 0))}%</p>
        </div>
        <div className="rounded-lg bg-surface-container-low p-3">
          <p className="text-label-md text-on-surface-variant">Latest score</p>
          <p className="text-title-md font-bold text-primary">{attempts[0]?.score ?? 0}%</p>
        </div>
      </div>
      <AttemptList title="Recent attempts" attempts={attempts} />
    </div>
  );
}
