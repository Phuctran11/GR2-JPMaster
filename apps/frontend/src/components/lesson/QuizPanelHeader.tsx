import type { Quiz } from '../../services/api';

export function QuizPanelHeader({
  quiz,
  titlePrefix,
  lockedMessage,
}: {
  quiz: Quiz;
  titlePrefix: string;
  lockedMessage?: string;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-outline-variant pb-4 md:flex-row md:items-start md:justify-between">
      <div>
        <p className="text-label-md font-bold uppercase tracking-wide text-primary">{titlePrefix}</p>
        <h3 className="mt-1 text-headline-md font-headline-md text-on-surface">{quiz.title}</h3>
        {quiz.description && (
          <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">{quiz.description}</p>
        )}
        {lockedMessage && <p className="mt-2 text-body-sm text-on-surface-variant">{lockedMessage}</p>}
      </div>
      <div className="flex flex-wrap gap-2 text-label-md">
        <span className="rounded-full bg-primary-fixed px-3 py-1 text-on-primary-fixed">Pass {quiz.passing_score}%</span>
        <span className="rounded-full bg-surface-container px-3 py-1 text-on-surface-variant">{quiz.questions.length} questions</span>
        {quiz.time_limit_minutes && (
          <span className="rounded-full bg-surface-container px-3 py-1 text-on-surface-variant">{quiz.time_limit_minutes} min</span>
        )}
      </div>
    </div>
  );
}
