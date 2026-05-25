export function QuestionResultFeedback({
  isCorrect,
  explanation,
}: {
  isCorrect: boolean;
  explanation?: string | null;
}) {
  return (
    <div className={`mt-3 rounded-lg px-3 py-2 text-body-sm ${isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
      <strong>{isCorrect ? 'Correct.' : 'Incorrect.'}</strong>
      {explanation ? ` ${explanation}` : ''}
    </div>
  );
}
