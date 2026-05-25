export interface JlptAnswerPayload {
  question_id: number;
  option_id?: number;
  option_ids?: number[];
  answer_text?: string;
}

export interface JlptQuestionResult {
  question_id: number;
  section_id: number;
  is_correct: boolean;
  explanation: string | null;
  selected_option_ids: number[];
  correct_option_ids: number[];
  answer_text: string | null;
  marks: number;
  earned_marks: number;
}

export interface UserAnswerInsertRow {
  attemptId: number;
  questionId: number;
  sectionId: number;
  optionId: number | null;
  answerText: string | null;
  isCorrect: boolean;
}

export const normalizeJlptAnswerText = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

