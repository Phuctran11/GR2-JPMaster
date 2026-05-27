import type { JlptExamSection, JlptExamSubmitResult } from '../../services/api';
import type { AnswerState, JlptTestPhase } from './jlptTestUtils';
import { sectionLabels } from './jlptTestUtils';
import { JlptQuestionCard } from './JlptQuestionCard';

export function JlptSectionPanel({
  section,
  sectionRenderIndex,
  answers,
  result,
  phase,
  onSingleOption,
  onToggleMultipleOption,
  onTextAnswer,
}: {
  section: JlptExamSection;
  sectionRenderIndex: number;
  answers: AnswerState;
  result: JlptExamSubmitResult | null;
  phase: JlptTestPhase;
  onSingleOption: (questionId: number, optionId: number) => void;
  onToggleMultipleOption: (questionId: number, optionId: number) => void;
  onTextAnswer: (questionId: number, answerText: string) => void;
}) {
  const sectionResultCount = result?.question_results.filter((item) => item.section_id === section.section_id).length ?? 0;
  const sectionCorrectCount = result?.question_results.filter((item) => item.section_id === section.section_id && item.is_correct).length ?? 0;

  return (
    <section className="rounded-xl border border-outline-variant bg-surface p-5 shadow-sm">
      <div className="mb-4 border-b border-outline-variant pb-4">
        <h2 className="text-headline-sm font-bold text-on-surface">{section.title || sectionLabels[section.section_type]}</h2>
        <p className="mt-1 text-label-md text-on-surface-variant">
          {sectionLabels[section.section_type]} / {section.questions.length} questions
        </p>
        {phase === 'submitted' && result && (
          <p className="mt-2 inline-flex rounded-full bg-surface-container px-3 py-1 text-label-md font-bold text-on-surface">
            {sectionCorrectCount}/{sectionResultCount || section.questions.length} correct
          </p>
        )}
        {section.audio_url && <audio controls src={section.audio_url} className="mt-3 w-full" />}
      </div>

      <div className="space-y-4">
        {section.questions.map((question, questionIndex) => (
          <JlptQuestionCard
            key={question.question_id}
            question={question}
            questionIndex={questionIndex}
            sectionRenderIndex={sectionRenderIndex}
            previousQuestion={section.questions[questionIndex - 1]}
            answer={answers[question.question_id] ?? { optionIds: [], answerText: '' }}
            result={result}
            phase={phase}
            onSingleOption={onSingleOption}
            onToggleMultipleOption={onToggleMultipleOption}
            onTextAnswer={onTextAnswer}
          />
        ))}
      </div>
    </section>
  );
}
