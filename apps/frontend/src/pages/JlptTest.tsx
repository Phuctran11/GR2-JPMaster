import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Container } from '../components';
import {
  jlptExamAPI,
  type JlptExamAnswerPayload,
  type JlptExamDetail,
  type JlptExamQuestion,
  type JlptExamSection,
  type JlptExamSubmitResult,
} from '../services/api';

type AnswerState = Record<number, { optionIds: number[]; answerText: string }>;
type TestPhase = 'intro' | 'section' | 'break' | 'submitted';

const BREAK_SECONDS = 120;
const DEFAULT_SECTION_MINUTES = 30;

const sectionLabels: Record<string, string> = {
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  reading: 'Reading',
  listening: 'Listening',
};

const formatTime = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const getSectionSeconds = (section: JlptExamSection, exam: JlptExamDetail) => {
  const fallbackMinutes = exam.duration_minutes && exam.sections.length
    ? Math.max(1, Math.ceil(exam.duration_minutes / exam.sections.length))
    : DEFAULT_SECTION_MINUTES;
  return Math.max(1, section.duration_minutes ?? fallbackMinutes) * 60;
};

const isQuestionAnswered = (question: JlptExamQuestion, answer?: AnswerState[number]) => {
  if (question.question_type === 'fill_in_blank') return Boolean(answer?.answerText.trim());
  return Boolean(answer?.optionIds.length);
};

const buildPayload = (exam: JlptExamDetail, answers: AnswerState): JlptExamAnswerPayload[] =>
  exam.sections.flatMap((section) =>
    section.questions.map((question) => {
      const answer = answers[question.question_id] ?? { optionIds: [], answerText: '' };
      if (question.question_type === 'fill_in_blank') return { question_id: question.question_id, answer_text: answer.answerText.trim() };
      if (question.question_type === 'multiple_choice') return { question_id: question.question_id, option_ids: answer.optionIds };
      return { question_id: question.question_id, option_id: answer.optionIds[0] };
    })
  );

export default function JlptTest() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const numericExamId = Number(examId);
  const [exam, setExam] = useState<JlptExamDetail | null>(null);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [result, setResult] = useState<JlptExamSubmitResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<TestPhase>('intro');
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(numericExamId)) return;
    let active = true;

    const loadExam = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await jlptExamAPI.getExam(numericExamId);
        if (active) setExam(response.data);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Failed to load JLPT test');
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadExam();
    return () => {
      active = false;
    };
  }, [numericExamId]);

  const sections = exam?.sections ?? [];
  const activeSection = sections[activeSectionIndex] ?? null;
  const questions = useMemo(() => sections.flatMap((section) => section.questions), [sections]);
  const activeSectionAnsweredCount = useMemo(
    () => activeSection?.questions.filter((question) => isQuestionAnswered(question, answers[question.question_id])).length ?? 0,
    [activeSection, answers]
  );
  const totalAnsweredCount = useMemo(
    () => questions.filter((question) => isQuestionAnswered(question, answers[question.question_id])).length,
    [answers, questions]
  );

  useEffect(() => {
    if (phase !== 'section' && phase !== 'break') return;
    if (result || submitting) return;

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((previous) => {
        if (previous <= 1) {
          window.clearInterval(intervalId);
          if (phase === 'section') {
            window.setTimeout(() => {
              if (activeSectionIndex >= sections.length - 1) {
                void submitExam();
              } else {
                setPhase('break');
                setRemainingSeconds(BREAK_SECONDS);
              }
            }, 0);
          } else {
            window.setTimeout(() => startSection(activeSectionIndex + 1), 0);
          }
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [activeSectionIndex, phase, result, sections.length, submitting]);

  useEffect(() => {
    if (phase === 'submitted') return;

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [phase]);

  if (!Number.isFinite(numericExamId)) return <Navigate to="/tests" replace />;

  const startSection = (sectionIndex: number) => {
    if (!exam || !exam.sections[sectionIndex]) return;
    setActiveSectionIndex(sectionIndex);
    setPhase('section');
    setRemainingSeconds(getSectionSeconds(exam.sections[sectionIndex], exam));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startExam = () => startSection(0);

  const finishSection = () => {
    if (!exam) return;
    if (activeSectionIndex >= exam.sections.length - 1) {
      void submitExam();
      return;
    }
    setPhase('break');
    setRemainingSeconds(BREAK_SECONDS);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitExam = async () => {
    if (!exam || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      const response = await jlptExamAPI.submitExam(exam.exam_id, buildPayload(exam, answers));
      setResult(response.data);
      setPhase('submitted');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit JLPT test');
    } finally {
      setSubmitting(false);
    }
  };

  const resetTest = () => {
    setAnswers({});
    setResult(null);
    setPhase('intro');
    setActiveSectionIndex(0);
    setRemainingSeconds(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setSingleOption = (questionId: number, optionId: number) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: { optionIds: [optionId], answerText: previous[questionId]?.answerText ?? '' },
    }));
  };

  const toggleMultipleOption = (questionId: number, optionId: number) => {
    setAnswers((previous) => {
      const current = previous[questionId] ?? { optionIds: [], answerText: '' };
      const optionIds = current.optionIds.includes(optionId)
        ? current.optionIds.filter((id) => id !== optionId)
        : [...current.optionIds, optionId];
      return { ...previous, [questionId]: { ...current, optionIds } };
    });
  };

  const setTextAnswer = (questionId: number, answerText: string) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: { optionIds: previous[questionId]?.optionIds ?? [], answerText },
    }));
  };

  if (loading) {
    return (
      <main className="fixed inset-0 z-[70] flex items-center justify-center bg-surface-container-low">
        <p className="text-on-surface-variant">Preparing JLPT focus mode...</p>
      </main>
    );
  }

  if (error || !exam || exam.sections.length === 0) {
    return (
      <main className="fixed inset-0 z-[70] flex items-center justify-center bg-surface-container-low p-6">
        <section className="max-w-xl rounded-xl border border-outline-variant bg-white p-6 text-center shadow-lg">
          <h1 className="text-headline-md font-bold text-on-surface">JLPT test unavailable</h1>
          <p className="mt-2 text-on-surface-variant">{error || 'This test has no available sections.'}</p>
          <button type="button" onClick={() => navigate('/tests')} className="mt-5 rounded-lg bg-primary px-5 py-3 font-bold text-on-primary">
            Back to tests
          </button>
        </section>
      </main>
    );
  }

  if (phase === 'intro') {
    return (
      <main className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-surface-container-low p-6">
        <section className="w-full max-w-2xl rounded-xl border border-outline-variant bg-white p-6 shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-fixed text-on-primary-fixed">
            <span className="material-symbols-outlined text-[30px]">assignment</span>
          </div>
          <h1 className="text-center text-headline-md font-bold text-on-surface">{exam.title}</h1>
          <p className="mt-2 text-center text-body-md text-on-surface-variant">JLPT {exam.jlpt_level} focus mode</p>

          <div className="mt-6 space-y-3">
            {exam.sections.map((section, index) => (
              <div key={section.section_id} className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3">
                <div>
                  <p className="font-bold text-on-surface">{index + 1}. {section.title || sectionLabels[section.section_type]}</p>
                  <p className="text-label-md text-on-surface-variant">{section.questions.length} questions</p>
                </div>
                <span className="rounded-full bg-primary-fixed px-3 py-1 text-label-md font-bold text-on-primary-fixed">
                  {Math.ceil(getSectionSeconds(section, exam) / 60)} min
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-body-md text-amber-900">
            Each section has its own timer. Between sections, you get a 2-minute break. Once focus mode starts, submit the test before leaving.
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button type="button" onClick={startExam} className="rounded-lg bg-primary px-6 py-3 font-bold text-on-primary">
              Start test
            </button>
            <button type="button" onClick={() => navigate('/tests')} className="rounded-lg border border-outline-variant bg-white px-6 py-3 font-bold text-on-surface">
              Back to tests
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (phase === 'break') {
    const nextSection = exam.sections[activeSectionIndex + 1];
    return (
      <main className="fixed inset-0 z-[70] flex items-center justify-center bg-surface-container-low p-6">
        <section className="w-full max-w-xl rounded-xl border border-outline-variant bg-white p-6 text-center shadow-lg">
          <p className="text-label-md font-bold uppercase text-primary">Break time</p>
          <h1 className="mt-2 text-headline-md font-bold text-on-surface">{formatTime(remainingSeconds)}</h1>
          <p className="mt-3 text-body-md text-on-surface-variant">
            Next section: <strong>{nextSection?.title || sectionLabels[nextSection?.section_type ?? '']}</strong>
          </p>
          <button type="button" onClick={() => startSection(activeSectionIndex + 1)} className="mt-6 rounded-lg bg-primary px-6 py-3 font-bold text-on-primary">
            Start next section
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="fixed inset-0 z-[70] overflow-y-auto bg-surface-container-low">
      <div className="sticky top-0 z-10 border-b border-outline-variant bg-white/95 backdrop-blur">
        <Container>
          <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-label-md font-bold uppercase tracking-wide text-primary">JLPT focus mode</p>
              <h1 className="mt-1 text-headline-sm font-bold text-on-surface">{exam.title}</h1>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                Section {activeSectionIndex + 1}/{exam.sections.length}: {activeSection?.title || sectionLabels[activeSection?.section_type ?? '']}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {phase === 'section' && (
                <div className={`rounded-xl border px-4 py-3 font-bold ${remainingSeconds <= 60 ? 'border-red-300 bg-red-50 text-red-700' : 'border-primary/20 bg-primary-fixed text-on-primary-fixed'}`}>
                  <span className="mr-2 align-middle material-symbols-outlined text-[20px]">timer</span>
                  {formatTime(remainingSeconds)}
                </div>
              )}
              {phase === 'submitted' && (
                <button type="button" onClick={() => navigate('/tests')} className="rounded-lg bg-primary px-5 py-3 font-bold text-on-primary">
                  Exit focus mode
                </button>
              )}
            </div>
          </div>
        </Container>
      </div>

      <Container className="py-6 md:py-8">
        <div className="mx-auto max-w-4xl space-y-5">
          {phase === 'section' && (
            <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
              Focus mode is locked. Finish this section to continue. Answered {activeSectionAnsweredCount}/{activeSection?.questions.length ?? 0}.
            </section>
          )}

          {phase === 'submitted' && result && (
            <section className={`rounded-xl border p-5 ${result.passed ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-red-300 bg-red-50 text-red-800'}`}>
              <h2 className="text-headline-sm font-bold">{result.passed ? 'Passed' : 'Not passed'} · {result.score.toFixed(2)}%</h2>
              <p className="mt-1 text-body-md">{result.earned_marks}/{result.total_marks} marks</p>
              <button type="button" onClick={resetTest} className="mt-4 rounded-lg bg-primary px-5 py-3 font-bold text-on-primary">
                Retake test
              </button>
            </section>
          )}

          {activeSection && (
            <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
              <div className="mb-4 border-b border-outline-variant pb-4">
                <h2 className="text-headline-sm font-bold text-on-surface">{activeSection.title || sectionLabels[activeSection.section_type]}</h2>
                <p className="mt-1 text-label-md text-on-surface-variant">
                  {sectionLabels[activeSection.section_type]} · {activeSection.questions.length} questions
                </p>
                {activeSection.audio_url && <audio controls src={activeSection.audio_url} className="mt-3 w-full" />}
              </div>

              <div className="space-y-4">
                {activeSection.questions.map((question, questionIndex) => {
                  const currentAnswer = answers[question.question_id] ?? { optionIds: [], answerText: '' };
                  const questionResult = result?.question_results.find((item) => item.question_id === question.question_id);

                  return (
                    <article key={question.question_id} className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
                      <div className="flex gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary">
                          {questionIndex + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <h3 className="text-title-md font-bold text-on-surface">{question.question_text}</h3>
                            <span className="rounded-full bg-surface-container px-2 py-1 text-label-sm text-on-surface-variant">
                              {question.marks} mark{question.marks === 1 ? '' : 's'}
                            </span>
                          </div>

                          {question.image_url && <img src={question.image_url} alt="" className="mt-4 max-h-80 w-full rounded-lg border border-outline-variant object-contain" />}
                          {question.audio_url && <audio controls src={question.audio_url} className="mt-4 w-full" />}

                          {question.question_type === 'fill_in_blank' ? (
                            <input
                              value={currentAnswer.answerText}
                              onChange={(event) => setTextAnswer(question.question_id, event.target.value)}
                              disabled={phase === 'submitted'}
                              className="mt-4 w-full rounded-lg border border-outline-variant bg-white px-4 py-3 outline-none focus:border-primary"
                              placeholder="Type your answer"
                            />
                          ) : (
                            <div className="mt-4 space-y-2">
                              {question.options.map((option) => {
                                const checked = currentAnswer.optionIds.includes(option.option_id);
                                const isMultiple = question.question_type === 'multiple_choice';
                                const isCorrectOption = Boolean(questionResult?.correct_option_ids.includes(option.option_id));
                                const wasSelected = Boolean(questionResult?.selected_option_ids.includes(option.option_id) || checked);
                                const optionClass = questionResult
                                  ? isCorrectOption
                                    ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                                    : wasSelected
                                      ? 'border-red-300 bg-red-50 text-red-800'
                                      : 'border-outline-variant bg-white opacity-75'
                                  : checked
                                    ? 'border-primary bg-primary-fixed/40'
                                    : 'border-outline-variant bg-white hover:border-primary';

                                return (
                                  <label key={option.option_id} className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition ${optionClass}`}>
                                    <input
                                      type={isMultiple ? 'checkbox' : 'radio'}
                                      name={`question-${question.question_id}`}
                                      checked={checked}
                                      disabled={phase === 'submitted'}
                                      onChange={() => isMultiple ? toggleMultipleOption(question.question_id, option.option_id) : setSingleOption(question.question_id, option.option_id)}
                                      className="mt-1"
                                    />
                                    <span className="flex-1 text-body-md">{option.option_text}</span>
                                    {questionResult && isCorrectOption && <span className="rounded-full bg-emerald-600 px-2 py-1 text-label-sm font-bold text-white">Correct</span>}
                                  </label>
                                );
                              })}
                            </div>
                          )}

                          {questionResult && (
                            <div className={`mt-3 rounded-lg px-3 py-2 text-body-sm ${questionResult.is_correct ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                              <strong>{questionResult.is_correct ? 'Correct.' : 'Incorrect.'}</strong>
                              {questionResult.explanation ? ` ${questionResult.explanation}` : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {phase === 'section' && (
            <section className="sticky bottom-4 z-20 rounded-lg border border-outline-variant bg-white p-4 shadow-lg">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-body-md text-on-surface-variant">
                  Total answered {totalAnsweredCount}/{questions.length}
                </p>
                <button
                  type="button"
                  onClick={finishSection}
                  disabled={submitting}
                  className="rounded-lg bg-primary px-5 py-3 font-bold text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {activeSectionIndex >= exam.sections.length - 1 ? (submitting ? 'Submitting...' : 'Submit test') : 'Finish section'}
                </button>
              </div>
            </section>
          )}
        </div>
      </Container>
    </main>
  );
}
