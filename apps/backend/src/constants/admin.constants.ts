import type { BlogStatus, JlptLevel, QuestionType, QuizType, SectionType, UserRole, UserStatus } from "../models/admin.model.js";

export const USER_ROLES: UserRole[] = ["learner", "owner", "admin"];
export const USER_STATUSES: UserStatus[] = ["active", "suspended"];
export const COURSE_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export const QUIZ_TYPES: QuizType[] = ["lesson_quiz", "practice_test", "final_test"];
export const QUESTION_TYPES: QuestionType[] = ["single_choice", "multiple_choice", "true_false", "fill_in_blank"];
export const QUESTION_DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;
export const JLPT_LEVELS: JlptLevel[] = ["N5", "N4", "N3", "N2", "N1"];
export const SECTION_TYPES: SectionType[] = ["vocabulary", "grammar", "reading", "listening"];
export const BLOG_STATUSES: BlogStatus[] = ["draft", "published", "archived"];
