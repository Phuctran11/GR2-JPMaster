export type UserRole = "learner" | "owner" | "admin";
export type UserStatus = "active" | "suspended" | "deleted";
export type QuizType = "lesson_quiz" | "practice_test" | "final_test";
export type BlogStatus = "draft" | "published" | "archived";
export type QuestionType = "single_choice" | "multiple_choice" | "true_false" | "fill_in_blank";
export type SectionType = "vocabulary" | "grammar" | "reading" | "listening";
export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";
export type SortOrder = "asc" | "desc";

export interface AdminListParams {
  limit?: number;
  offset?: number;
  search?: string;
  role?: UserRole | "all";
  level?: string;
  courseId?: number;
  quizType?: QuizType | "all";
  status?: BlogStatus | "all";
  sortOrder?: SortOrder;
  ownerId?: number;
}

export interface AdminStats {
  totals: {
    users: number;
    courses: number;
    lessons: number;
    tests: number;
    jlptTests: number;
    enrollments: number;
    blogs: number;
    quizAttempts: number;
    jlptAttempts: number;
    paidPayments: number;
    pendingPayments: number;
    revenueTotal: number;
    revenueLast30Days: number;
  };
  usersByRole: Array<{ role: UserRole; count: number }>;
  testsByType: Array<{ quiz_type: QuizType | null; count: number }>;
  jlptByLevel: Array<{ jlpt_level: JlptLevel | null; count: number }>;
  paymentsByStatus: Array<{ status: string; count: number; amount: number }>;
  revenueByDay: Array<{ revenue_date: Date; revenue: number; paid_count: number }>;
  activityByDay: Array<{
    activity_date: Date;
    enrollments: number;
    quiz_attempts: number;
    jlpt_attempts: number;
    new_users: number;
  }>;
  recentUsers: Array<{ user_id: number; username: string; email: string; role: UserRole; status: UserStatus; created_at: Date }>;
  recentCourses: Array<{ course_id: number; title: string; price: number; level: string | null; created_at: Date }>;
}


export interface AdminQuestionOptionInput {
  option_id?: number;
  option_text: string;
  is_correct: boolean;
  explanation?: string | null;
}

export interface AdminQuizQuestionInput {
  question_text: string;
  question_type: QuestionType;
  difficulty_level?: string | null;
  explanation?: string | null;
  points: number;
  jlpt_level?: string | null;
  section_type?: string | null;
  reading_passage_id?: number | null;
  image_asset_id?: number | null;
  image_url?: string | null;
  audio_asset_id?: number | null;
  audio_url?: string | null;
  order_index?: number | null;
  marks: number;
  options: AdminQuestionOptionInput[];
}

export interface AdminJlptSectionInput {
  title: string;
  section_type: SectionType;
  section_order: number;
  duration_minutes?: number | null;
  audio_asset_id?: number | null;
  audio_url?: string | null;
}

export interface AutoJlptSectionQuestionsInput {
  jlpt_level?: JlptLevel;
  difficulty_counts: Partial<Record<"easy" | "medium" | "hard" | "expert", number>>;
}

export interface AdminReadingPassageInput {
  title: string | null;
  jlpt_level: JlptLevel;
  passage_text: string | null;
  image_asset_id?: number | null;
  image_url?: string | null;
}


