import { adminAPI, type AdminCourse } from '../../services/api';
import { emptyCourse, emptyLesson } from '../../components/admin/adminFormDefaults';
import type { AdminCourseFormValues, AdminLessonFormValues } from '../../components/admin/adminFormTypes';
import { toNullableNumber } from '../../components/admin/adminHelpers';
import { courseLevelOptions } from '../../components/admin/adminOptions';
import type { ModalName } from '../../components/admin/adminTypes';

type RunAdminTask = (task: () => Promise<void>, success?: string) => Promise<void>;

export function useAdminCourseActions({
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
}: {
  editingCourseId: number | null;
  setEditingCourseId: (value: number | null) => void;
  setCourseForm: (values: AdminCourseFormValues) => void;
  setLessonForm: (values: AdminLessonFormValues) => void;
  managingLessonsCourseId: number | null;
  setManagingLessonsCourseId: (value: number | null) => void;
  setActiveModal: (value: ModalName) => void;
  closeModal: () => void;
  run: RunAdminTask;
  loadCourses: () => Promise<void>;
  loadLessons: () => Promise<void>;
  loadTests: () => Promise<void>;
  loadLessonQuizzes: () => Promise<void>;
  loadStats: () => Promise<void>;
}) {
  const openCreateCourse = () => {
    setEditingCourseId(null);
    setCourseForm(emptyCourse);
    setActiveModal('course');
  };

  const openEditCourse = (item: AdminCourse) => {
    setEditingCourseId(item.course_id);
    setCourseForm({
      title: item.title,
      description: item.description || '',
      price: item.price,
      level: courseLevelOptions.some((option) => option.value === item.level) ? item.level || 'beginner' : 'beginner',
      duration: item.duration?.toString() || '',
      cover_asset_id: item.cover_asset_id ?? null,
      image_url: item.image_url || '',
    });
    setActiveModal('course');
  };

  const openManageLessons = (courseId: number) => {
    setManagingLessonsCourseId(courseId);
    setActiveModal('lessons');
  };

  const deleteCourse = (course: AdminCourse) => {
    const confirmed = window.confirm(`Hide course "${course.title}" from learners and admin lists? Lessons and quizzes will be hidden, but learner history is kept.`);
    if (!confirmed) return;

    void run(async () => {
      await adminAPI.deleteCourse(course.course_id);
      if (editingCourseId === course.course_id || managingLessonsCourseId === course.course_id) {
        setEditingCourseId(null);
        setManagingLessonsCourseId(null);
        closeModal();
      }
      await Promise.all([loadCourses(), loadLessons(), loadTests(), loadLessonQuizzes(), loadStats()]);
    }, 'Course hidden successfully');
  };

  const submitCourse = (values: AdminCourseFormValues) => {
    void run(async () => {
      const payload = {
        title: values.title,
        description: values.description || null,
        price: Number(values.price),
        level: values.level,
        duration: toNullableNumber(values.duration),
        cover_asset_id: values.cover_asset_id,
        image_url: values.image_url || null,
      };
      if (editingCourseId) {
        await adminAPI.updateCourse(editingCourseId, payload);
      } else {
        const created = await adminAPI.createCourse(payload);
        setEditingCourseId(created.data.course_id);
        setLessonForm({ ...emptyLesson, course_id: String(created.data.course_id) });
      }
      await Promise.all([loadCourses(), loadStats()]);
    }, editingCourseId ? 'Course updated successfully' : 'Course created successfully');
  };

  return {
    openCreateCourse,
    openEditCourse,
    openManageLessons,
    deleteCourse,
    submitCourse,
  };
}
