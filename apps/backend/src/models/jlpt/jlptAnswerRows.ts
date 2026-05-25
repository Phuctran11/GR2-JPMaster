import type { JlptQuestionResult, UserAnswerInsertRow } from "./jlptExam.types.js";

export function buildJlptUserAnswerRows(
  attemptId: number,
  questionResults: JlptQuestionResult[]
): UserAnswerInsertRow[] {
  return questionResults.flatMap((questionResult) => {
    const optionIds = questionResult.selected_option_ids.length > 0 ? questionResult.selected_option_ids : [null];
    return optionIds.map((optionId) => ({
      attemptId,
      questionId: questionResult.question_id,
      sectionId: questionResult.section_id,
      optionId,
      answerText: questionResult.answer_text,
      isCorrect: questionResult.is_correct,
    }));
  });
}
