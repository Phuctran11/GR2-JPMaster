import type {
  AdminJlptLevel,
  AdminQuestionType,
  AdminQuizType,
  AdminRole,
  AdminSectionType,
  AdminSortOrder,
  AdminUserStatus,
} from '../../services/api';

export type {
  AdminJlptLevel,
  AdminQuestionType,
  AdminQuizType,
  AdminRole,
  AdminSectionType,
  AdminSortOrder,
  AdminUserStatus,
};

export type AdminTab = 'overview' | 'users' | 'courses' | 'tests' | 'jlpt' | 'payments';
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
  | null;
