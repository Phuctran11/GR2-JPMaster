export function QuestionResultFeedback({
  isCorrect,
  explanation,
}: {
  isCorrect: boolean;
  explanation?: string | null;
}) {
  return (
    <div className={`mt-3 rounded-lg px-3 py-2 text-body-sm ${isCorrect ? 'bg-success-container text-on-success-container' : 'bg-error-container text-on-error-container'}`}>
      <strong>{isCorrect ? 'Correct.' : 'Incorrect.'}</strong>
      {explanation ? ` ${explanation}` : ''}
    </div>
  );
}
