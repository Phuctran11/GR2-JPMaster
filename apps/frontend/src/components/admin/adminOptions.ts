import type { AdminJlptLevel, AdminQuestionType, AdminQuizType, AdminSectionType, AdminSortOrder, AdminTab } from './adminTypes';

export const tabs: Array<{ id: AdminTab; label: string; icon: string }> = [
  { id: 'overview', label: 'Overview', icon: 'monitoring' },
  { id: 'users', label: 'Users', icon: 'group' },
  { id: 'courses', label: 'Courses & Lessons', icon: 'school' },
  { id: 'tests', label: 'Quizzes', icon: 'quiz' },
  { id: 'jlpt', label: 'JLPT Tests', icon: 'assignment' },
  { id: 'blogs', label: 'Blogs', icon: 'article' },
  { id: 'payments', label: 'Payments', icon: 'payments' },
];

export const courseLevelOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export const quizTypeOptions: Array<{ value: AdminQuizType; label: string }> = [
  { value: 'practice_test', label: 'Practice test' },
  { value: 'lesson_quiz', label: 'Lesson quiz' },
  { value: 'final_test', label: 'Final test' },
];

export const questionTypeOptions: Array<{ value: AdminQuestionType; label: string }> = [
  { value: 'single_choice', label: 'Single choice' },
  { value: 'multiple_choice', label: 'Multiple choice' },
  { value: 'true_false', label: 'True / false' },
  { value: 'fill_in_blank', label: 'Fill in blank' },
];

export const difficultyOptions = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'expert', label: 'Expert' },
];

export const jlptLevelOptions = [
  { value: 'N5' as AdminJlptLevel, label: 'N5' },
  { value: 'N4' as AdminJlptLevel, label: 'N4' },
  { value: 'N3' as AdminJlptLevel, label: 'N3' },
  { value: 'N2' as AdminJlptLevel, label: 'N2' },
  { value: 'N1' as AdminJlptLevel, label: 'N1' },
];

export const sectionTypeOptions = [
  { value: 'vocabulary' as AdminSectionType, label: 'Vocabulary' },
  { value: 'grammar' as AdminSectionType, label: 'Grammar' },
  { value: 'reading' as AdminSectionType, label: 'Reading' },
  { value: 'listening' as AdminSectionType, label: 'Listening' },
];

export const sortOrderOptions: Array<{ value: AdminSortOrder; label: string }> = [
  { value: 'desc', label: 'Newest ID' },
  { value: 'asc', label: 'Oldest ID' },
];
