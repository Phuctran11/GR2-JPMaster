import { useEffect, useMemo, useState } from 'react';
import { Button } from '../Button';
import { lessonNoteAPI, quizAPI, type LessonNote, type Quiz, type QuizAnswerPayload, type QuizSubmitResult } from '../../services/api';
import { NoteComposer } from '../notes';

type AnswerState = Record<number, { optionIds: number[]; answerText: string }>;

interface QuizPanelProps {
  quiz: Quiz;
  attemptId?: number;
  titlePrefix?: string;
  lockedMessage?: string;
  allowIncompleteSubmit?: boolean;
  submitSignal?: number;
  onPassed?: (result: QuizSubmitResult) => void;
  onSubmitted?: (result: QuizSubmitResult) => void;
  onRetake?: () => void;
  lessonId?: number;
}

const isQuestionAnswered = (quiz: Quiz, questionId: number, answer?: AnswerState[number]) => {
  const question = quiz.questions.find((item) => item.question_id === questionId);
  if (!question) return false;

  if (question.question_type === 'fill_in_blank') {
    return Boolean(answer?.answerText.trim());
  }

  return Boolean(answer?.optionIds.length);
};

const buildPayload = (quiz: Quiz, answers: AnswerState): QuizAnswerPayload[] => {
  return quiz.questions.map((question) => {
    const answer = answers[question.question_id] ?? { optionIds: [], answerText: '' };

    if (question.question_type === 'fill_in_blank') {
      return {
        question_id: question.question_id,
        answer_text: answer.answerText.trim(),
      };
    }

    if (question.question_type === 'multiple_choice') {
      return {
        question_id: question.question_id,
        option_ids: answer.optionIds,
      };
    }

    return {
      question_id: question.question_id,
      option_id: answer.optionIds[0],
    };
  });
};

export function QuizPanel({
  quiz,
  attemptId,
  titlePrefix = 'Quiz',
  lockedMessage,
  allowIncompleteSubmit = false,
  submitSignal = 0,
  onPassed,
  onSubmitted,
  onRetake,
  lessonId,
}: QuizPanelProps) {
  const [answers, setAnswers] = useState<AnswerState>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<QuizSubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [questionNotes, setQuestionNotes] = useState<LessonNote[]>([]);

  const latestAttempt = submitResult
    ? {
        score: submitResult.score,
        passed: submitResult.passed,
      }
    : quiz.latest_attempt;
  const requirementSatisfied = Boolean(quiz.has_passed || latestAttempt?.passed);

  const answeredCount = useMemo(() => {
    return quiz.questions.filter((question) => isQuestionAnswered(quiz, question.question_id, answers[question.question_id])).length;
  }, [answers, quiz]);

  const allAnswered = quiz.questions.length > 0 && answeredCount === quiz.questions.length;
  const isSubmitted = Boolean(submitResult);

  const setSingleOption = (questionId: number, optionId: number) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: { optionIds: [optionId], answerText: previous[questionId]?.answerText ?? '' },
    }));
  };

  const toggleMultipleOption = (questionId: number, optionId: number) => {
    setAnswers((previous) => {
      const current = previous[questionId] ?? { optionIds: [], answerText: '' };
      const nextOptionIds = current.optionIds.includes(optionId)
        ? current.optionIds.filter((id) => id !== optionId)
        : [...current.optionIds, optionId];

      return {
        ...previous,
        [questionId]: { ...current, optionIds: nextOptionIds },
      };
    });
  };

  const setTextAnswer = (questionId: number, answerText: string) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: { optionIds: previous[questionId]?.optionIds ?? [], answerText },
    }));
  };

  const performSubmit = async () => {
    if ((!allAnswered && !allowIncompleteSubmit) || submitting) return;

    try {
      setShowSubmitConfirm(false);
      setSubmitting(true);
      setError(null);
      const result = await quizAPI.submitQuiz(quiz.quiz_id, buildPayload(quiz, answers), attemptId);
      setSubmitResult(result.data);
      onSubmitted?.(result.data);
      if (result.data.passed) {
        onPassed?.(result.data);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitRequest = () => {
    if ((!allAnswered && !allowIncompleteSubmit) || submitting) return;
    setShowSubmitConfirm(true);
  };

  useEffect(() => {
    if (submitSignal > 0) {
      setShowSubmitConfirm(false);
      performSubmit();
    }
  }, [submitSignal]);

  useEffect(() => {
    let active = true;

    const loadQuestionNotes = async () => {
      try {
        const result = await lessonNoteAPI.getMyNotes({ note_type: 'question_note', limit: 100 });
        if (!active) return;
        const questionIds = new Set(quiz.questions.map((question) => question.question_id));
        setQuestionNotes(result.data.filter((note) => note.question_id != null && questionIds.has(note.question_id)));
      } catch {
        if (active) setQuestionNotes([]);
      }
    };

    loadQuestionNotes();

    return () => {
      active = false;
    };
  }, [quiz.questions]);

  const handleQuestionNoteSaved = (savedNote: LessonNote) => {
    setQuestionNotes((previous) => {
      const sameQuestionIndex = previous.findIndex((note) => note.question_id === savedNote.question_id);
      if (sameQuestionIndex >= 0) {
        return previous.map((note, index) => (index === sameQuestionIndex ? { ...note, ...savedNote } : note));
      }
      return [savedNote, ...previous];
    });
  };

  const handleQuestionNoteDeleted = (noteId: number) => {
    setQuestionNotes((previous) => previous.filter((note) => note.note_id !== noteId));
  };

  const quizLabel = titlePrefix.toLowerCase().includes('final') ? 'final test' : 'quiz';
  const unansweredCount = quiz.questions.length - answeredCount;

  return (
    <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
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

      {latestAttempt?.score != null && (
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
      )}

      <div className="mt-5 space-y-4">
        {quiz.questions.map((question, index) => {
          const currentAnswer = answers[question.question_id] ?? { optionIds: [], answerText: '' };
          const result = submitResult?.question_results.find((item) => item.question_id === question.question_id);
          const existingQuestionNote = questionNotes.find((note) => note.question_id === question.question_id) ?? null;

          return (
            <article key={question.question_id} className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
              <div className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h4 className="text-title-md font-bold text-on-surface">{question.question_text}</h4>
                    <span className="rounded-full bg-surface-container px-2 py-1 text-label-sm text-on-surface-variant">
                      {question.marks} mark{question.marks === 1 ? '' : 's'}
                    </span>
                  </div>
                  {question.image_url && (
                    <img
                      src={question.image_url}
                      alt=""
                      className="mt-4 max-h-80 w-full rounded-lg border border-outline-variant object-contain"
                    />
                  )}
                  {question.audio_url && (
                    <audio controls src={question.audio_url} className="mt-4 w-full">
                      Your browser does not support audio playback.
                    </audio>
                  )}

                  {question.question_type === 'fill_in_blank' ? (
                    <input
                      value={currentAnswer.answerText}
                      onChange={(event) => setTextAnswer(question.question_id, event.target.value)}
                      disabled={isSubmitted}
                      className="mt-4 w-full rounded-lg border border-outline-variant bg-white px-4 py-3 outline-none focus:border-primary"
                      placeholder="Type your answer"
                    />
                  ) : (
                    <div className="mt-4 space-y-2">
                      {question.options.map((option) => {
                        const checked = currentAnswer.optionIds.includes(option.option_id);
                        const isMultiple = question.question_type === 'multiple_choice';
                        const wasSelected = Boolean(result?.selected_option_ids.includes(option.option_id) || checked);
                        const isCorrectOption = Boolean(result?.correct_option_ids.includes(option.option_id));
                        const optionStateClass = result
                          ? isCorrectOption
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                            : wasSelected
                              ? 'border-red-300 bg-red-50 text-red-800'
                              : 'border-outline-variant bg-white opacity-75'
                          : checked
                            ? 'border-primary bg-primary-fixed/40'
                            : 'border-outline-variant bg-white hover:border-primary';

                        return (
                          <label
                            key={option.option_id}
                            className={`flex items-start gap-3 rounded-lg border px-4 py-3 transition ${isSubmitted ? 'cursor-default' : 'cursor-pointer'} ${optionStateClass}`}
                          >
                            <input
                              type={isMultiple ? 'checkbox' : 'radio'}
                              name={`question-${question.question_id}`}
                              checked={checked}
                              disabled={isSubmitted}
                              onChange={() =>
                                isMultiple
                                  ? toggleMultipleOption(question.question_id, option.option_id)
                                  : setSingleOption(question.question_id, option.option_id)
                              }
                              className="mt-1"
                            />
                            <span className="flex-1 text-body-md">{option.option_text}</span>
                            {result && wasSelected && (
                              <span className="rounded-full bg-white/70 px-2 py-1 text-label-sm font-bold">
                                Your answer
                              </span>
                            )}
                            {result && isCorrectOption && (
                              <span className="rounded-full bg-emerald-600 px-2 py-1 text-label-sm font-bold text-white">
                                Correct
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {result && (
                    <div className={`mt-3 rounded-lg px-3 py-2 text-body-sm ${result.is_correct ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                      <strong>{result.is_correct ? 'Correct.' : 'Incorrect.'}</strong>
                      {result.explanation ? ` ${result.explanation}` : ''}
                    </div>
                  )}

                  <details className="mt-3 rounded-lg border border-outline-variant bg-white p-3">
                    <summary className="cursor-pointer text-label-md font-bold text-primary">
                      {existingQuestionNote ? 'Question note saved' : 'Add question note'}
                      {existingQuestionNote && (
                        <span className="ml-2 rounded-full bg-emerald-50 px-2 py-1 text-label-sm text-emerald-700">noted</span>
                      )}
                    </summary>
                    <div className="mt-3">
                      <NoteComposer
                        lessonId={lessonId ?? quiz.lesson_id ?? null}
                        questionId={question.question_id}
                        noteType="question_note"
                        existingNote={existingQuestionNote}
                        title={`Question ${index + 1}`}
                        placeholder="Why was this answer right or wrong?"
                        compact
                        onSaved={handleQuestionNoteSaved}
                        onDeleted={handleQuestionNoteDeleted}
                      />
                    </div>
                  </details>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-red-700">{error}</p>}

      {showSubmitConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="submit-confirm-title">
          <section className="w-full max-w-md rounded-xl border border-outline-variant bg-white p-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-on-primary-fixed">
                <span className="material-symbols-outlined text-[28px]">assignment_turned_in</span>
              </div>
              <div>
                <h3 id="submit-confirm-title" className="text-headline-sm font-bold text-on-surface">
                  Submit this {quizLabel}?
                </h3>
                <p className="mt-2 text-body-md text-on-surface-variant">
                  After submitting, your answers will be graded and you cannot edit this attempt.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 text-body-sm text-on-surface-variant">
              <div className="flex items-center justify-between gap-3">
                <span>Answered</span>
                <strong className="text-on-surface">{answeredCount}/{quiz.questions.length}</strong>
              </div>
              {unansweredCount > 0 && (
                <p className="mt-2 text-amber-800">
                  {unansweredCount} question{unansweredCount === 1 ? '' : 's'} still unanswered.
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="rounded-lg border border-outline-variant bg-white px-5 py-3 font-bold text-on-surface"
              >
                Back to questions
              </button>
              <button
                type="button"
                onClick={performSubmit}
                disabled={submitting}
                className="rounded-lg bg-primary px-5 py-3 font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit now'}
              </button>
            </div>
          </section>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 border-t border-outline-variant pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body-md text-on-surface-variant">
          Answered {answeredCount}/{quiz.questions.length}
        </p>
        {isSubmitted ? (
          <Button onClick={onRetake} disabled={!onRetake} className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3">
            <span className="material-symbols-outlined">restart_alt</span>
            Retake quiz
          </Button>
        ) : (
          <Button onClick={handleSubmitRequest} disabled={(!allAnswered && !allowIncompleteSubmit) || submitting} className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3">
            <span className="material-symbols-outlined">quiz</span>
            {submitting ? 'Submitting...' : allAnswered ? 'Submit quiz' : 'Submit incomplete'}
          </Button>
        )}
      </div>
    </section>
  );
}
