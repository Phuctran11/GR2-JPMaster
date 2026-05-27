import type { QuizAttemptSummary } from '../../services/api';

export function QuizLatestAttemptBanner({
  latestAttempt,
  requirementSatisfied,
}: {
  latestAttempt?: Pick<QuizAttemptSummary, 'score' | 'passed'> | null;
  requirementSatisfied: boolean;
}) {
  if (latestAttempt?.score == null) return null;

  return (
    <div
      className={`mt-4 rounded-lg border p-4 ${
        requirementSatisfied
          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
          : 'border-amber-300 bg-amber-50 text-amber-900'
      }`}
    >
      <div className="flex items-center gap-2 font-bold">
        <span className="material-symbols-outlined">{requirementSatisfied ? 'verified' : 'error'}</span>
        Latest score: {Number(latestAttempt.score).toFixed(2)}%
      </div>
      <p className="mt-1 text-body-sm">
        {requirementSatisfied
          ? latestAttempt.passed
            ? 'Requirement satisfied.'
            : 'Requirement already satisfied by a previous passed attempt.'
          : 'You need to pass this quiz before continuing.'}
      </p>
    </div>
  );
}
