import type {
  AdminBlogStatus,
  AdminJlptLevel,
  AdminQuestionType,
  AdminQuizType,
  AdminRole,
  AdminSectionType,
  AdminSortOrder,
  AdminUserStatus,
} from '../../services/api';

export type {
  AdminBlogStatus,
  AdminJlptLevel,
  AdminQuestionType,
  AdminQuizType,
  AdminRole,
  AdminSectionType,
  AdminSortOrder,
  AdminUserStatus,
};

export type AdminTab = 'overview' | 'users' | 'courses' | 'tests' | 'jlpt' | 'blogs' | 'payments';
export type ModalName =
  | 'user'
  | 'course'
  | 'lessons'
  | 'lesson'
  | 'test'
  | 'questions'
  | 'question'
  | 'jlptExam'
  | 'jlptSections'
  | 'jlptSection'
  | 'readingPassage'
  | 'autoJlptQuestions'
  | 'blog'
  | null;
