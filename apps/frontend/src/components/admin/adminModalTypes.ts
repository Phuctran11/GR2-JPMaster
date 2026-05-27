import type { ReactNode } from 'react';
import type {
  AdminCloudinaryAsset,
  AdminCourse,
  AdminJlptExam,
  AdminJlptSection,
  AdminLesson,
  AdminQuizQuestion,
  AdminReadingPassage,
  AdminTest,
  UserProfile,
} from '../../services/api';
import type {
  AdminAutoJlptQuestionsFormValues,
  AdminBlogFormValues,
  AdminCourseFormValues,
  AdminJlptExamFormValues,
  AdminJlptSectionFormValues,
  AdminLessonFormValues,
  AdminQuestionFormValues,
  AdminReadingPassageFormValues,
  AdminTestFormValues,
  AdminUserFormValues,
} from './adminFormTypes';
import type { ModalName } from './adminTypes';

export type AdminModalKey = Exclude<ModalName, null>;
export type AdminModalMap = Partial<Record<AdminModalKey, ReactNode>>;
export type UploadAsset = (file: File, mediaKind: 'image' | 'video' | 'audio', scope: string, fieldKey: string) => Promise<AdminCloudinaryAsset>;

export type AdminDashboardCommonProps = {
  activeModal: ModalName;
  setActiveModal: (value: ModalName) => void;
  busy: boolean;
  uploadingField: string | null;
  uploadAsset: UploadAsset;
  closeModal: () => void;
};

export type AdminDashboardUserProps = {
  currentUserId?: number;
  users: UserProfile[];
  form: AdminUserFormValues;
  editingId: number | null;
  submit: (values: AdminUserFormValues) => void;
  deleteItem: (item: UserProfile) => void;
};

export type AdminDashboardCourseLessonProps = {
  courses: AdminCourse[];
  lessons: AdminLesson[];
  courseForm: AdminCourseFormValues;
  lessonForm: AdminLessonFormValues;
  editingCourseId: number | null;
  selectedCourse: AdminCourse | null;
  submitCourse: (values: AdminCourseFormValues) => void;
  openManageLessons: (courseId: number) => void;
  deleteCourse: (course: AdminCourse) => void;
  sortedCourseLessons: AdminLesson[];
  lessonQuizzes: AdminTest[];
  openCreateLesson: (courseId?: number | null) => void;
  openEditLesson: (item: AdminLesson) => void;
  moveLesson: (lessonId: number, direction: 'up' | 'down') => void;
  deleteLesson: (item: AdminLesson) => void;
  editingLessonId: number | null;
  courseLessons: AdminLesson[];
  currentLessonQuiz: AdminTest | null;
  submitLesson: (values: AdminLessonFormValues) => void;
  closeLessonForm: () => void;
  setManagingLessonsCourseId: (value: number | null) => void;
  openCreateLessonQuiz: () => void;
  openEditLessonQuiz: (quiz: AdminTest) => void;
};

export type AdminDashboardTestProps = {
  form: AdminTestFormValues;
  editingId: number | null;
  returnModalAfterTest: ModalName;
  tests: AdminTest[];
  submit: (values: AdminTestFormValues) => void;
  closeForm: () => void;
  openManageQuestions: (quizId: number) => void;
  deleteItem: (item: AdminTest) => void;
};

export type AdminDashboardJlptProps = {
  examForm: AdminJlptExamFormValues;
  sectionForm: AdminJlptSectionFormValues;
  autoQuestionsForm: AdminAutoJlptQuestionsFormValues;
  readingPassageForm: AdminReadingPassageFormValues;
  editingExamId: number | null;
  selectedExam: AdminJlptExam | null;
  submitExam: (values: AdminJlptExamFormValues) => void;
  openManageSections: (examId: number) => void;
  deleteExam: (exam: AdminJlptExam) => void;
  sections: AdminJlptSection[];
  sortedSections: AdminJlptSection[];
  sortedQuestions: AdminQuizQuestion[];
  readingPassages: AdminReadingPassage[];
  managingSectionId: number | null;
  managingSection: AdminJlptSection | null;
  openCreateSection: () => void;
  openManageQuestions: (section: AdminJlptSection) => void;
  openEditSection: (section: AdminJlptSection) => void;
  deleteSection: (section: AdminJlptSection) => void;
  openCreateReadingPassage: () => void;
  refreshReadingPassages: () => void;
  openEditReadingPassage: (passage: AdminReadingPassage) => void;
  openAutoQuestions: () => void;
  editingSectionId: number | null;
  submitSection: (values: AdminJlptSectionFormValues) => void;
  submitAutoQuestions: (values: AdminAutoJlptQuestionsFormValues) => void;
  editingReadingPassageId: number | null;
  submitReadingPassage: (values: AdminReadingPassageFormValues) => void;
};

export type AdminDashboardQuestionProps = {
  form: AdminQuestionFormValues;
  editingId: number | null;
  managingQuiz: AdminTest | null;
  visibleQuestions: AdminQuizQuestion[];
  openCreate: () => void;
  openEdit: (item: AdminQuizQuestion) => void;
  move: (questionId: number, direction: 'up' | 'down') => void;
  deleteItem: (item: AdminQuizQuestion) => void;
  submit: (values: AdminQuestionFormValues) => void;
  closeForm: () => void;
};

export type AdminDashboardBlogProps = {
  form: AdminBlogFormValues;
  editingId: number | null;
  submit: (values: AdminBlogFormValues) => void;
};
