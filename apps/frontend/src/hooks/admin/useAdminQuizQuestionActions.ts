import { adminAPI, type AdminQuizQuestion } from '../../services/api';
import type { AdminQuestionFormValues } from '../../components/admin/adminFormTypes';
import type { ModalName } from '../../components/admin/adminTypes';
import { getQuestionPayload } from './adminQuestionHelpers';

type RunAdminTask = (task: () => Promise<void>, success?: string) => Promise<void>;

export function useAdminQuizQuestionActions({
  managingQuestionsQuizId,
  quizQuestions,
  editingQuestionId,
  setActiveModal,
  run,
  loadQuizQuestions,
  loadTests,
  loadLessonQuizzes,
  loadStats,
}: {
  managingQuestionsQuizId: number | null;
  quizQuestions: AdminQuizQuestion[];
  editingQuestionId: number | null;
  setActiveModal: (value: ModalName) => void;
  run: RunAdminTask;
  loadQuizQuestions: (quizId: number) => Promise<void>;
  loadTests: () => Promise<void>;
  loadLessonQuizzes: () => Promise<void>;
  loadStats: () => Promise<void>;
}) {
  const moveQuizQuestion = (questionId: number, direction: 'up' | 'down') => {
    if (!managingQuestionsQuizId) return;
    const sortedQuestions = [...quizQuestions].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0) || a.question_id - b.question_id);
    const currentIndex = sortedQuestions.findIndex((question) => question.question_id === questionId);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentQuestion = sortedQuestions[currentIndex];
    const targetQuestion = sortedQuestions[targetIndex];

    if (!currentQuestion || !targetQuestion) return;

    void run(async () => {
      await Promise.all([
        adminAPI.updateQuizQuestionOrder(managingQuestionsQuizId, currentQuestion.question_id, targetQuestion.order_index ?? targetIndex + 1),
        adminAPI.updateQuizQuestionOrder(managingQuestionsQuizId, targetQuestion.question_id, currentQuestion.order_index ?? currentIndex + 1),
      ]);
      await Promise.all([loadQuizQuestions(managingQuestionsQuizId), loadTests(), loadLessonQuizzes()]);
    }, 'Question order updated successfully');
  };

  const deleteQuizQuestion = (question: AdminQuizQuestion) => {
    if (!managingQuestionsQuizId) return;
    const confirmed = window.confirm(`Hide question "${question.question_text}" from this quiz? Existing learner answers are kept.`);
    if (!confirmed) return;

    void run(async () => {
      await adminAPI.deleteQuizQuestion(managingQuestionsQuizId, question.question_id);
      await Promise.all([loadQuizQuestions(managingQuestionsQuizId), loadTests(), loadLessonQuizzes(), loadStats()]);
    }, 'Question hidden successfully');
  };

  const submitQuizQuestion = (values: AdminQuestionFormValues) => {
    if (!managingQuestionsQuizId) return;

    void run(async () => {
      const payload = getQuestionPayload({ values, managingJlptSection: null, managingJlptSectionId: null });
      if (editingQuestionId) await adminAPI.updateQuizQuestion(managingQuestionsQuizId, editingQuestionId, payload);
      else await adminAPI.createQuizQuestion(managingQuestionsQuizId, payload);
      await Promise.all([loadQuizQuestions(managingQuestionsQuizId), loadTests(), loadLessonQuizzes(), loadStats()]);
      setActiveModal('questions');
    }, editingQuestionId ? 'Question updated successfully' : 'Question created successfully');
  };

  return {
    moveQuizQuestion,
    deleteQuizQuestion,
    submitQuizQuestion,
  };
}
