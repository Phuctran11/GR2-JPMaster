import { adminAPI, type AdminLesson, type AdminTest } from '../../services/api';
import { emptyLesson, emptyTest } from '../../components/admin/adminFormDefaults';
import type { AdminLessonFormValues, AdminTestFormValues } from '../../components/admin/adminFormTypes';
import { toNullableNumber } from '../../components/admin/adminHelpers';
import type { ModalName } from '../../components/admin/adminTypes';

type RunAdminTask = (task: () => Promise<void>, success?: string) => Promise<void>;

export function useAdminLessonActions({
  lessons,
  lessonForm,
  sortedCourseLessons,
  editingCourseId,
  editingLessonId,
  setEditingLessonId,
  setLessonForm,
  managingLessonsCourseId,
  setManagingLessonsCourseId,
  setTestForm,
  setEditingTestId,
  setReturnModalAfterTest,
  setActiveModal,
  run,
  loadCourses,
  loadLessons,
  loadTests,
  loadLessonQuizzes,
  loadStats,
}: {
  lessons: AdminLesson[];
  lessonForm: AdminLessonFormValues;
  sortedCourseLessons: AdminLesson[];
  editingCourseId: number | null;
  editingLessonId: number | null;
  setEditingLessonId: (value: number | null) => void;
  setLessonForm: (values: AdminLessonFormValues) => void;
  managingLessonsCourseId: number | null;
  setManagingLessonsCourseId: (value: number | null) => void;
  setTestForm: (values: AdminTestFormValues) => void;
  setEditingTestId: (value: number | null) => void;
  setReturnModalAfterTest: (value: ModalName) => void;
  setActiveModal: (value: ModalName) => void;
  run: RunAdminTask;
  loadCourses: () => Promise<void>;
  loadLessons: () => Promise<void>;
  loadTests: () => Promise<void>;
  loadLessonQuizzes: () => Promise<void>;
  loadStats: () => Promise<void>;
}) {
  const moveLesson = (lessonId: number, direction: 'up' | 'down') => {
    const currentIndex = sortedCourseLessons.findIndex((lesson) => lesson.lesson_id === lessonId);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentLesson = sortedCourseLessons[currentIndex];
    const targetLesson = sortedCourseLessons[targetIndex];

    if (!currentLesson || !targetLesson) return;

    void run(async () => {
      await Promise.all([
        adminAPI.updateLesson(currentLesson.lesson_id, { order_index: targetLesson.order_index }),
        adminAPI.updateLesson(targetLesson.lesson_id, { order_index: currentLesson.order_index }),
      ]);
      await Promise.all([loadLessons(), loadCourses()]);
    }, 'Lesson order updated successfully');
  };

  const deleteLesson = (lesson: AdminLesson) => {
    const confirmed = window.confirm(`Hide lesson "${lesson.title}" from learners and admin lists? Lesson quizzes will be hidden, but learner progress and answers are kept.`);
    if (!confirmed) return;

    void run(async () => {
      await adminAPI.deleteLesson(lesson.lesson_id);
      if (editingLessonId === lesson.lesson_id) {
        setEditingLessonId(null);
        setActiveModal(managingLessonsCourseId ? 'lessons' : null);
      }
      await Promise.all([loadLessons(), loadCourses(), loadTests(), loadLessonQuizzes(), loadStats()]);
    }, 'Lesson hidden successfully');
  };

  const openCreateLesson = (courseId?: number | null) => {
    const targetCourseId = courseId ?? managingLessonsCourseId;
    if (targetCourseId) setManagingLessonsCourseId(targetCourseId);
    setEditingLessonId(null);
    setLessonForm({
      ...emptyLesson,
      course_id: targetCourseId ? String(targetCourseId) : '',
      order_index:
        targetCourseId
          ? lessons.filter((lesson) => lesson.course_id === targetCourseId).length + 1
          : emptyLesson.order_index,
    });
    setActiveModal('lesson');
  };

  const openEditLesson = (item: AdminLesson) => {
    setEditingLessonId(item.lesson_id);
    setLessonForm({
      course_id: String(item.course_id),
      title: item.title,
      content_text: item.content_text || '',
      video_asset_id: item.video_asset_id ?? null,
      video_url: item.video_url || '',
      audio_asset_id: item.audio_asset_id ?? null,
      audio_url: item.audio_url || '',
      order_index: item.order_index,
      duration: item.duration?.toString() || '',
    });
    setManagingLessonsCourseId(item.course_id);
    setActiveModal('lesson');
  };

  const openCreateLessonQuiz = () => {
    if (!editingLessonId) return;
    setEditingTestId(null);
    setTestForm({
      ...emptyTest,
      title: lessonForm.title ? `${lessonForm.title} Quiz` : 'Lesson Quiz',
      quiz_type: 'lesson_quiz',
      course_id: lessonForm.course_id,
      lesson_id: String(editingLessonId),
      passing_score: 70,
    });
    setReturnModalAfterTest('lesson');
    setActiveModal('test');
  };

  const openEditLessonQuiz = (quiz: AdminTest) => {
    setEditingTestId(quiz.quiz_id);
    setTestForm({
      title: quiz.title,
      description: quiz.description || '',
      quiz_type: quiz.quiz_type,
      course_id: quiz.course_id?.toString() || lessonForm.course_id,
      lesson_id: quiz.lesson_id?.toString() || (editingLessonId ? String(editingLessonId) : ''),
      passing_score: quiz.passing_score,
      total_marks: quiz.total_marks,
      time_limit_minutes: quiz.time_limit_minutes?.toString() || '',
    });
    setReturnModalAfterTest('lesson');
    setActiveModal('test');
  };

  const submitLesson = (values: AdminLessonFormValues) => {
    void run(async () => {
      const courseId = Number(values.course_id || editingCourseId);
      if (!Number.isFinite(courseId) || courseId <= 0) throw new Error('Select a course before adding a lesson');
      const payload = {
        course_id: courseId,
        title: values.title,
        content_text: values.content_text || null,
        video_asset_id: values.video_asset_id,
        video_url: values.video_url || null,
        audio_asset_id: values.audio_asset_id,
        audio_url: values.audio_url || null,
        order_index: Number(values.order_index),
        duration: toNullableNumber(values.duration),
      };
      if (editingLessonId) {
        await adminAPI.updateLesson(editingLessonId, payload);
      } else {
        const created = await adminAPI.createLesson(payload);
        setEditingLessonId(created.data.lesson_id);
        setManagingLessonsCourseId(courseId);
      }
      await Promise.all([loadLessons(), loadCourses(), loadStats()]);
      setActiveModal('lesson');
    }, editingLessonId ? 'Lesson updated successfully' : 'Lesson created successfully');
  };

  return {
    moveLesson,
    deleteLesson,
    openCreateLesson,
    openEditLesson,
    openCreateLessonQuiz,
    openEditLessonQuiz,
    submitLesson,
  };
}
