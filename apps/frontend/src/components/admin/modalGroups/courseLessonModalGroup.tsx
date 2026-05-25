import type {
  AdminDashboardCommonProps,
  AdminDashboardCourseLessonProps,
  AdminDashboardTestProps,
  AdminModalMap,
} from '../adminModalTypes';
import { CourseFormModal, LessonFormModal, LessonsManagerModal, TestFormModal } from '../modals';

export function createCourseLessonModalGroup({
  common,
  courseLessons,
  tests,
}: {
  common: AdminDashboardCommonProps;
  courseLessons: AdminDashboardCourseLessonProps;
  tests: AdminDashboardTestProps;
}): AdminModalMap {
  return {
    course: (
      <CourseFormModal
        editingCourseId={courseLessons.editingCourseId}
        selectedCourse={courseLessons.selectedCourse}
        busy={common.busy}
        initialValues={courseLessons.courseForm}
        uploadingField={common.uploadingField}
        onUpload={common.uploadAsset}
        onSubmit={courseLessons.submitCourse}
        onClose={common.closeModal}
        onManageLessons={courseLessons.openManageLessons}
        onDelete={courseLessons.deleteCourse}
      />
    ),
    lessons: (
      <LessonsManagerModal
        selectedCourse={courseLessons.selectedCourse}
        lessons={courseLessons.sortedCourseLessons}
        lessonQuizzes={courseLessons.lessonQuizzes}
        busy={common.busy}
        onClose={common.closeModal}
        onCreateLesson={courseLessons.openCreateLesson}
        onEditLesson={courseLessons.openEditLesson}
        onMoveLesson={courseLessons.moveLesson}
        onDeleteLesson={courseLessons.deleteLesson}
      />
    ),
    lesson: (
      <LessonFormModal
        editingLessonId={courseLessons.editingLessonId}
        selectedCourse={courseLessons.selectedCourse}
        courses={courseLessons.courses}
        courseLessons={courseLessons.courseLessons}
        currentLessonQuiz={courseLessons.currentLessonQuiz}
        busy={common.busy}
        initialValues={courseLessons.lessonForm}
        uploadingField={common.uploadingField}
        onUpload={common.uploadAsset}
        onSubmit={courseLessons.submitLesson}
        onClose={courseLessons.closeLessonForm}
        onCourseChange={courseLessons.setManagingLessonsCourseId}
        onCreateLessonQuiz={courseLessons.openCreateLessonQuiz}
        onEditLessonQuiz={courseLessons.openEditLessonQuiz}
      />
    ),
    test: (
      <TestFormModal
        editingTestId={tests.editingId}
        returnModalAfterTest={tests.returnModalAfterTest}
        courses={courseLessons.courses}
        lessons={courseLessons.lessons}
        tests={tests.tests}
        lessonQuizzes={courseLessons.lessonQuizzes}
        busy={common.busy}
        initialValues={tests.form}
        onSubmit={tests.submit}
        onClose={tests.closeForm}
        onManageQuestions={tests.openManageQuestions}
        onDelete={tests.deleteItem}
      />
    ),
  };
}
