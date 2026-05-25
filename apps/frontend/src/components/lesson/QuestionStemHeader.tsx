export function QuestionStemHeader({
  questionText,
  marks,
}: {
  questionText: string;
  marks: number;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <h4 className="text-title-md font-bold text-on-surface">{questionText}</h4>
      <span className="rounded-full bg-surface-container px-2 py-1 text-label-sm text-on-surface-variant">
        {marks} mark{marks === 1 ? '' : 's'}
      </span>
    </div>
  );
}
