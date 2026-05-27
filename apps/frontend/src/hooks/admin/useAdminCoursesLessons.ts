import { useMemo } from 'react';
import type { AdminCourse, AdminLesson, AdminTest } from '../../services/api';
import type { AdminCourseFormValues, AdminLessonFormValues, AdminTestFormValues } from '../../components/admin/adminFormTypes';
import { toNullableNumber } from '../../components/admin/adminHelpers';
import type { ModalName } from '../../components/admin/adminTypes';
import { useAdminCourseActions } from './useAdminCourseActions';
import { useAdminLessonActions } from './useAdminLessonActions';

type RunAdminTask = (task: () => Promise<void>, success?: string) => Promise<void>;

export function useAdminCoursesLessons({
  activeModal,
  courses,
  lessons,
  lessonQuizzes,
  lessonForm,
  setLessonForm,
  editingCourseId,
  setEditingCourseId,
  setCourseForm,
  editingLessonId,
  setEditingLessonId,
  managingLessonsCourseId,
  setManagingLessonsCourseId,
  setTestForm,
  setEditingTestId,
  setReturnModalAfterTest,
  setActiveModal,
  closeModal,
  run,
  loadCourses,
  loadLessons,
  loadTests,
  loadLessonQuizzes,
  loadStats,
}: {
  activeModal: ModalName;
  courses: AdminCourse[];
  lessons: AdminLesson[];
  lessonQuizzes: AdminTest[];
  lessonForm: AdminLessonFormValues;
  setLessonForm: (values: AdminLessonFormValues) => void;
  editingCourseId: number | null;
  setEditingCourseId: (value: number | null) => void;
  setCourseForm: (values: AdminCourseFormValues) => void;
  editingLessonId: number | null;
  setEditingLessonId: (value: number | null) => void;
  managingLessonsCourseId: number | null;
  setManagingLessonsCourseId: (value: number | null) => void;
  setTestForm: (values: AdminTestFormValues) => void;
  setEditingTestId: (value: number | null) => void;
  setReturnModalAfterTest: (value: ModalName) => void;
  setActiveModal: (value: ModalName) => void;
  closeModal: () => void;
  run: RunAdminTask;
  loadCourses: () => Promise<void>;
  loadLessons: () => Promise<void>;
  loadTests: () => Promise<void>;
  loadLessonQuizzes: () => Promise<void>;
  loadStats: () => Promise<void>;
}) {
  const lessonCourseId = toNullableNumber(lessonForm.course_id);
  const selectedCourseId = activeModal === 'course'
    ? editingCourseId
    : activeModal === 'lessons'
      ? managingLessonsCourseId
      : lessonCourseId ?? managingLessonsCourseId;

  const selectedCourse = useMemo(
    () => courses.find((course) => course.course_id === selectedCourseId) ?? null,
    [courses, selectedCourseId]
  );
  const courseLessons = useMemo(
    () => lessons.filter((lesson) => lesson.course_id === selectedCourseId),
    [lessons, selectedCourseId]
  );
  const sortedCourseLessons = useMemo(
    () => [...courseLessons].sort((a, b) => a.order_index - b.order_index || a.lesson_id - b.lesson_id),
    [courseLessons]
  );
  const currentLessonQuiz = useMemo(
    () =>
      editingLessonId
        ? lessonQuizzes.find((quiz) => quiz.lesson_id === editingLessonId && quiz.quiz_type === 'lesson_quiz') ?? null
        : null,
    [editingLessonId, lessonQuizzes]
  );

  const courseActions = useAdminCourseActions({
    editingCourseId,
    setEditingCourseId,
    setCourseForm,
    setLessonForm,
    managingLessonsCourseId,
    setManagingLessonsCourseId,
    setActiveModal,
    closeModal,
    run,
    loadCourses,
    loadLessons,
    loadTests,
    loadLessonQuizzes,
    loadStats,
  });

  const lessonActions = useAdminLessonActions({
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
  });

  return {
    selectedCourse,
    courseLessons,
    sortedCourseLessons,
    currentLessonQuiz,
    ...courseActions,
    ...lessonActions,
  };
}
