import { useEffect, useMemo, useState } from 'react';
import {
  quizAPI,
  type Quiz,
  type QuizSubmitResult,
} from '../../services/api';
import {
  buildQuizAnswerPayload,
  emptyQuizAnswer,
  isQuizQuestionAnswered,
  type QuizAnswerState,
} from '../../components/lesson/quizPanelUtils';

interface UseQuizPanelControllerParams {
  quiz: Quiz;
  attemptId?: number;
  allowIncompleteSubmit: boolean;
  submitSignal: number;
  onPassed?: (result: QuizSubmitResult) => void;
  onSubmitted?: (result: QuizSubmitResult) => void;
}

export function useQuizPanelController({
  quiz,
  attemptId,
  allowIncompleteSubmit,
  submitSignal,
  onPassed,
  onSubmitted,
}: UseQuizPanelControllerParams) {
  const [answers, setAnswers] = useState<QuizAnswerState>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<QuizSubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const latestAttempt = submitResult
    ? {
        score: submitResult.score,
        passed: submitResult.passed,
      }
    : quiz.latest_attempt;
  const requirementSatisfied = Boolean(quiz.has_passed || latestAttempt?.passed);

  const answeredCount = useMemo(
    () => quiz.questions.filter((question) => isQuizQuestionAnswered(quiz, question.question_id, answers[question.question_id])).length,
    [answers, quiz]
  );

  const allAnswered = quiz.questions.length > 0 && answeredCount === quiz.questions.length;
  const isSubmitted = Boolean(submitResult);
  const unansweredCount = quiz.questions.length - answeredCount;

  const setSingleOption = (questionId: number, optionId: number) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: { optionIds: [optionId], answerText: previous[questionId]?.answerText ?? '' },
    }));
  };

  const toggleMultipleOption = (questionId: number, optionId: number) => {
    setAnswers((previous) => {
      const current = previous[questionId] ?? emptyQuizAnswer;
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
      const result = await quizAPI.submitQuiz(quiz.quiz_id, buildQuizAnswerPayload(quiz, answers), attemptId);
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
      void performSubmit();
    }
  }, [submitSignal]);

  return {
    answers,
    submitting,
    submitResult,
    error,
    showSubmitConfirm,
    setShowSubmitConfirm,
    latestAttempt,
    requirementSatisfied,
    answeredCount,
    allAnswered,
    isSubmitted,
    unansweredCount,
    setSingleOption,
    toggleMultipleOption,
    setTextAnswer,
    performSubmit,
    handleSubmitRequest,
  };
}
