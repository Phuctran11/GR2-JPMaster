import type { GradedQuizAnswer } from "./quiz.grading.js";

export interface QuizUserAnswerInsertRow {
  attemptId: number;
  questionId: number;
  optionId: number | null;
  answerText: string | null;
  isCorrect: boolean;
}

export function buildQuizUserAnswerRows(
  attemptId: number,
  gradedAnswers: GradedQuizAnswer[]
): QuizUserAnswerInsertRow[] {
  return gradedAnswers.flatMap((gradedAnswer) => {
    const optionIds = gradedAnswer.selectedOptionIds.length > 0 ? gradedAnswer.selectedOptionIds : [null];
    return optionIds.map((optionId) => ({
      attemptId,
      questionId: gradedAnswer.question.question_id,
      optionId,
      answerText: gradedAnswer.answer?.answer_text ?? null,
      isCorrect: gradedAnswer.isCorrect,
    }));
  });
}
