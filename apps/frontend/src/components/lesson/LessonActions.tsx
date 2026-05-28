import { Button } from '../Button';

interface LessonActionsProps {
  isCompleted: boolean;
  isCompleting: boolean;
  isLoadingNext: boolean;
  hasNextLesson: boolean;
  canMarkComplete?: boolean;
  completeBlockedReason?: string;
  onMarkCompleted: () => void;
  onNextLesson: () => void;
}

export function LessonActions({
  isCompleted,
  isCompleting,
  isLoadingNext,
  hasNextLesson,
  canMarkComplete = true,
  completeBlockedReason,
  onMarkCompleted,
  onNextLesson,
}: LessonActionsProps) {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${isCompleted ? 'bg-emerald-600 text-white' : 'bg-primary-fixed text-on-primary-fixed'}`}>
            <span className="material-symbols-outlined text-[24px]">{isCompleted ? 'task_alt' : 'flag'}</span>
          </span>
          <div className="min-w-0">
            <h3 className="text-headline-sm font-headline-sm text-on-surface">
              {isCompleted ? 'Lesson completed' : 'Finish this lesson'}
            </h3>
            <p className="mt-1 text-body-md font-body-md text-on-surface-variant">
              {hasNextLesson ? 'Complete this lesson before moving to the next one.' : 'Complete this final lesson when you are done reviewing.'}
            </p>
            {!isCompleted && !canMarkComplete && completeBlockedReason && (
              <p className="mt-2 text-body-sm font-semibold text-on-warning-container">{completeBlockedReason}</p>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-white shadow-sm transition-all hover:bg-emerald-700 sm:w-auto"
            onClick={onMarkCompleted}
            disabled={isCompleting || isCompleted || !canMarkComplete}
          >
            <span className="material-symbols-outlined">check_circle</span>
            {isCompleted ? 'Completed' : isCompleting ? 'Marking...' : 'Mark complete'}
          </Button>

          {hasNextLesson && (
            <Button
              variant="secondary"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant bg-primary-container px-5 py-3 text-on-primary-container shadow-sm transition-all hover:shadow-md sm:w-auto"
              onClick={onNextLesson}
              disabled={isLoadingNext || !isCompleted}
              title={isCompleted ? 'Go to the next lesson' : 'Mark this lesson complete to unlock the next lesson'}
            >
              {isLoadingNext ? 'Loading...' : isCompleted ? 'Next lesson' : 'Complete to continue'}
              <span className="material-symbols-outlined">chevron_right</span>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
