import { adminAPI, type AdminQuizQuestion, type AdminTest } from '../../services/api';
import { emptyTest } from '../../components/admin/adminFormDefaults';
import type { AdminTestFormValues } from '../../components/admin/adminFormTypes';
import { toNullableNumber } from '../../components/admin/adminHelpers';
import type { ModalName } from '../../components/admin/adminTypes';

type RunAdminTask = (task: () => Promise<void>, success?: string) => Promise<void>;

export function useAdminTests({
  editingTestId,
  setEditingTestId,
  setTestForm,
  setReturnModalAfterTest,
  managingQuestionsQuizId,
  setManagingQuestionsQuizId,
  setQuizQuestions,
  setActiveModal,
  closeModal,
  run,
  loadTests,
  loadLessonQuizzes,
  loadStats,
}: {
  editingTestId: number | null;
  setEditingTestId: (value: number | null) => void;
  setTestForm: (values: AdminTestFormValues) => void;
  setReturnModalAfterTest: (value: ModalName) => void;
  managingQuestionsQuizId: number | null;
  setManagingQuestionsQuizId: (value: number | null) => void;
  setQuizQuestions: (values: AdminQuizQuestion[]) => void;
  setActiveModal: (value: ModalName) => void;
  closeModal: () => void;
  run: RunAdminTask;
  loadTests: () => Promise<void>;
  loadLessonQuizzes: () => Promise<void>;
  loadStats: () => Promise<void>;
}) {
  const openCreateTest = () => {
    setEditingTestId(null);
    setTestForm(emptyTest);
    setReturnModalAfterTest(null);
    setActiveModal('test');
  };

  const openEditTest = (item: AdminTest) => {
    setEditingTestId(item.quiz_id);
    setTestForm({
      title: item.title,
      description: item.description || '',
      quiz_type: item.quiz_type,
      course_id: item.course_id?.toString() || '',
      lesson_id: item.lesson_id?.toString() || '',
      passing_score: item.passing_score,
      total_marks: item.total_marks,
      time_limit_minutes: item.time_limit_minutes?.toString() || '',
    });
    setReturnModalAfterTest(null);
    setActiveModal('test');
  };

  const deleteTest = (test: AdminTest) => {
    const confirmed = window.confirm(`Hide quiz/test "${test.title}" from learners and admin lists? Learner attempts and answers will be kept.`);
    if (!confirmed) return;

    void run(async () => {
      await adminAPI.deleteTest(test.quiz_id);
      if (editingTestId === test.quiz_id || managingQuestionsQuizId === test.quiz_id) {
        setEditingTestId(null);
        setManagingQuestionsQuizId(null);
        setQuizQuestions([]);
        closeModal();
      }
      await Promise.all([loadTests(), loadLessonQuizzes(), loadStats()]);
    }, 'Test hidden successfully');
  };

  const submitTest = (values: AdminTestFormValues) => {
    void run(async () => {
      const payload = {
        title: values.title,
        description: values.description || null,
        quiz_type: values.quiz_type,
        course_id: toNullableNumber(values.course_id),
        lesson_id: toNullableNumber(values.lesson_id),
        passing_score: Number(values.passing_score),
        total_marks: Number(values.total_marks),
        time_limit_minutes: toNullableNumber(values.time_limit_minutes),
      };
      if (editingTestId) await adminAPI.updateTest(editingTestId, payload);
      else {
        const created = await adminAPI.createTest(payload);
        setEditingTestId(created.data.quiz_id);
      }
      await Promise.all([loadTests(), loadLessonQuizzes(), loadStats()]);
      setActiveModal('test');
    }, editingTestId ? 'Test updated successfully' : 'Test created successfully');
  };

  return { openCreateTest, openEditTest, deleteTest, submitTest };
}
