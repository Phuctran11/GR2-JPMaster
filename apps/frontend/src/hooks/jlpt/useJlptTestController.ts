import { useCallback, useEffect, useMemo, useState } from 'react';
import { jlptExamAPI, type JlptExamDetail, type JlptExamSection, type JlptExamSubmitResult } from '../../services/api';
import {
  BREAK_SECONDS,
  buildJlptAnswerPayload,
  getSectionSeconds,
  isQuestionAnswered,
  type AnswerState,
  type JlptTestPhase,
} from '../../components/jlpt/jlptTestUtils';

const scrollJlptFocusToTop = () => {
  requestAnimationFrame(() => {
    document.getElementById('jlpt-focus-scroll')?.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  });
};

export function useJlptTestController(numericExamId: number) {
  const [exam, setExam] = useState<JlptExamDetail | null>(null);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [result, setResult] = useState<JlptExamSubmitResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<JlptTestPhase>('intro');
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [showSectionSubmitConfirm, setShowSectionSubmitConfirm] = useState(false);

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
  const sectionsToRender = phase === 'submitted' ? sections : activeSection ? [activeSection] : [];

  const getUnansweredCount = useCallback(
    (section: JlptExamSection) =>
      section.questions.filter((question) => !isQuestionAnswered(question, answers[question.question_id])).length,
    [answers]
  );

  const startSection = useCallback((sectionIndex: number) => {
    if (!exam || !exam.sections[sectionIndex]) return;
    setActiveSectionIndex(sectionIndex);
    setPhase('section');
    setRemainingSeconds(getSectionSeconds(exam.sections[sectionIndex], exam));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [exam]);

  const submitExam = useCallback(async () => {
    if (!exam || submitting) return;

    try {
      setSubmitting(true);
      setError(null);
      const response = await jlptExamAPI.submitExam(exam.exam_id, buildJlptAnswerPayload(exam, answers));
      setResult(response.data);
      setPhase('submitted');
      scrollJlptFocusToTop();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit JLPT test');
    } finally {
      setSubmitting(false);
    }
  }, [answers, exam, submitting]);

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
  }, [activeSectionIndex, phase, result, sections.length, startSection, submitExam, submitting]);

  useEffect(() => {
    if (phase === 'submitted') return;

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [phase]);

  const startExam = () => startSection(0);

  const performFinishSection = () => {
    if (!exam || !activeSection) return;
    setShowSectionSubmitConfirm(false);

    if (activeSectionIndex >= exam.sections.length - 1) {
      void submitExam();
      return;
    }
    setPhase('break');
    setRemainingSeconds(BREAK_SECONDS);
    scrollJlptFocusToTop();
  };

  const finishSection = () => {
    if (!exam || !activeSection || submitting) return;
    setShowSectionSubmitConfirm(true);
  };

  const resetTest = () => {
    setAnswers({});
    setResult(null);
    setPhase('intro');
    setActiveSectionIndex(0);
    setRemainingSeconds(0);
    setShowSectionSubmitConfirm(false);
    scrollJlptFocusToTop();
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

  return {
    exam,
    answers,
    result,
    loading,
    submitting,
    error,
    phase,
    activeSectionIndex,
    activeSection,
    sections,
    questions,
    sectionsToRender,
    activeSectionAnsweredCount,
    totalAnsweredCount,
    remainingSeconds,
    showSectionSubmitConfirm,
    setShowSectionSubmitConfirm,
    getUnansweredCount,
    startSection,
    startExam,
    finishSection,
    performFinishSection,
    resetTest,
    setSingleOption,
    toggleMultipleOption,
    setTextAnswer,
  };
}
