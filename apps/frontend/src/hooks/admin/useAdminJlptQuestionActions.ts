import { adminAPI, type AdminJlptSection, type AdminQuizQuestion } from '../../services/api';
import type { AdminQuestionFormValues } from '../../components/admin/adminFormTypes';
import type { ModalName } from '../../components/admin/adminTypes';
import { getQuestionPayload } from './adminQuestionHelpers';

type RunAdminTask = (task: () => Promise<void>, success?: string) => Promise<void>;

export function useAdminJlptQuestionActions({
  managingJlptSectionId,
  managingJlptSection,
  managingJlptExamId,
  jlptQuestions,
  editingQuestionId,
  setActiveModal,
  run,
  loadJlptQuestions,
  loadJlptSections,
  loadJlptExams,
}: {
  managingJlptSectionId: number | null;
  managingJlptSection: AdminJlptSection | null;
  managingJlptExamId: number | null;
  jlptQuestions: AdminQuizQuestion[];
  editingQuestionId: number | null;
  setActiveModal: (value: ModalName) => void;
  run: RunAdminTask;
  loadJlptQuestions: (sectionId: number) => Promise<void>;
  loadJlptSections: (examId: number) => Promise<void>;
  loadJlptExams: () => Promise<void>;
}) {
  const refreshJlptQuestions = () =>
    Promise.all([
      managingJlptSectionId ? loadJlptQuestions(managingJlptSectionId) : Promise.resolve(),
      managingJlptExamId ? loadJlptSections(managingJlptExamId) : Promise.resolve(),
      loadJlptExams(),
    ]);

  const moveJlptQuestion = (questionId: number, direction: 'up' | 'down') => {
    if (!managingJlptSectionId) return;
    const sortedQuestions = [...jlptQuestions].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0) || a.question_id - b.question_id);
    const currentIndex = sortedQuestions.findIndex((question) => question.question_id === questionId);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentQuestion = sortedQuestions[currentIndex];
    const targetQuestion = sortedQuestions[targetIndex];

    if (!currentQuestion || !targetQuestion) return;

    void run(async () => {
      await Promise.all([
        adminAPI.updateJlptSectionQuestionOrder(managingJlptSectionId, currentQuestion.question_id, targetQuestion.order_index ?? targetIndex + 1),
        adminAPI.updateJlptSectionQuestionOrder(managingJlptSectionId, targetQuestion.question_id, currentQuestion.order_index ?? currentIndex + 1),
      ]);
      await refreshJlptQuestions();
    }, 'Question order updated successfully');
  };

  const deleteJlptQuestion = (question: AdminQuizQuestion) => {
    if (!managingJlptSectionId) return;
    const confirmed = window.confirm(`Hide question "${question.question_text}" from this JLPT section? Existing learner answers are kept.`);
    if (!confirmed) return;

    void run(async () => {
      await adminAPI.deleteJlptSectionQuestion(managingJlptSectionId, question.question_id);
      await refreshJlptQuestions();
    }, 'Question hidden successfully');
  };

  const submitJlptQuestion = (values: AdminQuestionFormValues) => {
    if (!managingJlptSectionId) return;

    void run(async () => {
      const payload = getQuestionPayload({ values, managingJlptSection, managingJlptSectionId });
      if (editingQuestionId) await adminAPI.updateJlptSectionQuestion(managingJlptSectionId, editingQuestionId, payload);
      else await adminAPI.createJlptSectionQuestion(managingJlptSectionId, payload);
      await refreshJlptQuestions();
      setActiveModal('jlptSections');
    }, editingQuestionId ? 'Question updated successfully' : 'Question created successfully');
  };

  return {
    moveJlptQuestion,
    deleteJlptQuestion,
    submitJlptQuestion,
  };
}
