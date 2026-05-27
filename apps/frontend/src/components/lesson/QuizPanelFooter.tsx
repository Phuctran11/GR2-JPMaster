import { Button } from '../Button';

export function QuizPanelFooter({
  answeredCount,
  questionCount,
  isSubmitted,
  canRetake,
  allAnswered,
  allowIncompleteSubmit,
  submitting,
  onRetake,
  onSubmitRequest,
}: {
  answeredCount: number;
  questionCount: number;
  isSubmitted: boolean;
  canRetake: boolean;
  allAnswered: boolean;
  allowIncompleteSubmit: boolean;
  submitting: boolean;
  onRetake?: () => void;
  onSubmitRequest: () => void;
}) {
  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-outline-variant pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-body-md text-on-surface-variant">
        Answered {answeredCount}/{questionCount}
      </p>
      {isSubmitted ? (
        <Button onClick={onRetake} disabled={!canRetake} className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3">
          <span className="material-symbols-outlined">restart_alt</span>
          Retake quiz
        </Button>
      ) : (
        <Button onClick={onSubmitRequest} disabled={(!allAnswered && !allowIncompleteSubmit) || submitting} className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3">
          <span className="material-symbols-outlined">quiz</span>
          {submitting ? 'Submitting...' : allAnswered ? 'Submit quiz' : 'Submit incomplete'}
        </Button>
      )}
    </div>
  );
}
