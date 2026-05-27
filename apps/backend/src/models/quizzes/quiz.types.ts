export type QuestionType = "single_choice" | "multiple_choice" | "true_false" | "fill_in_blank";

export interface QuizOption {
  option_id: number;
  question_id: number;
  option_text: string;
  explanation: string | null;
  is_correct?: boolean;
}

export interface QuizQuestion {
  question_id: number;
  question_text: string;
  question_type: QuestionType;
  difficulty_level: string | null;
  explanation: string | null;
  points: number;
  jlpt_level: string | null;
  section_type: string | null;
  image_asset_id: number | null;
  image_url: string | null;
  audio_asset_id: number | null;
  audio_url: string | null;
  order_index: number | null;
  marks: number;
  options: QuizOption[];
}

export interface QuizDetail {
  quiz_id: number;
  lesson_id: number | null;
  course_id: number | null;
  title: string;
  description: string | null;
  quiz_type: "lesson_quiz" | "practice_test" | "final_test" | null;
  passing_score: number;
  total_marks: number;
  time_limit_minutes: number | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  questions: QuizQuestion[];
  latest_attempt?: QuizAttemptSummary | null;
  has_passed?: boolean;
}

export interface QuizAttemptSummary {
  attempt_id: number;
  quiz_id: number;
  score: number | null;
  total_marks: number | null;
  status: "in_progress" | "submitted" | "graded";
  started_at: Date;
  submitted_at: Date | null;
  passed: boolean;
}

export interface QuizAnswerInput {
  question_id: number;
  option_id?: number;
  option_ids?: number[];
  answer_text?: string;
}

export interface QuizAttemptState {
  latestAttempt: QuizAttemptSummary | null;
  hasPassed: boolean;
}

export const toNumber = (value: unknown, fallback = 0) => (value == null ? fallback : Number(value));

export const normalizeQuizAnswerText = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

export const withoutCorrectAnswers = (quiz: QuizDetail): QuizDetail => ({
  ...quiz,
  questions: quiz.questions.map((question) => ({
    ...question,
    options: question.options.map(({ is_correct: _isCorrect, ...option }) => option),
  })),
});

export const formatQuizAttemptSummary = (row: any, passingScore = Number.POSITIVE_INFINITY): QuizAttemptSummary => {
  const score = row.score == null ? null : Number(row.score);
  return {
    attempt_id: row.attempt_id,
    quiz_id: row.quiz_id,
    score,
    total_marks: row.total_marks == null ? null : Number(row.total_marks),
    status: row.status,
    started_at: row.started_at,
    submitted_at: row.submitted_at,
    passed: score != null && score >= passingScore,
  };
};

