import {
  normalizeJlptAnswerText,
  type JlptAnswerPayload,
  type JlptQuestionResult,
} from "./jlptExam.types.js";

export type JlptGradingQuestion = {
  question_id: number;
  section_id: number;
  question_type: string;
  explanation?: string | null;
  marks?: number | null;
  points?: number | null;
};

export type JlptGradingOption = {
  option_id: number;
  question_id: number;
  option_text: string;
  is_correct: boolean;
};

export interface JlptGradeResult {
  earnedMarks: number;
  totalMarks: number;
  score: number;
  passed: boolean;
  questionResults: JlptQuestionResult[];
}

export function gradeJlptExam(
  questions: JlptGradingQuestion[],
  optionsByQuestion: Map<number, JlptGradingOption[]>,
  answers: JlptAnswerPayload[],
  passingScore = 60
): JlptGradeResult {
  const answersByQuestion = new Map<number, JlptAnswerPayload>();
  answers.forEach((answer) => answersByQuestion.set(Number(answer.question_id), answer));

  let earnedMarks = 0;
  const totalMarks = questions.reduce((sum, question) => sum + Number(question.marks ?? question.points ?? 1), 0);

  const questionResults = questions.map((question) => {
    const answer = answersByQuestion.get(question.question_id);
    const options = optionsByQuestion.get(question.question_id) ?? [];
    const validOptionIds = new Set(options.map((option) => option.option_id));
    const correctOptions = options.filter((option) => option.is_correct);
    const correctOptionIds = correctOptions.map((option) => option.option_id).sort((a, b) => a - b);
    const selectedOptionIds = question.question_type === "multiple_choice"
      ? (answer?.option_ids ?? []).map(Number).filter((optionId) => validOptionIds.has(optionId)).sort((a, b) => a - b)
      : answer?.option_id
        ? [Number(answer.option_id)].filter((optionId) => validOptionIds.has(optionId))
        : [];

    const isCorrect = question.question_type === "fill_in_blank"
      ? correctOptions.some((option) => normalizeJlptAnswerText(option.option_text) === normalizeJlptAnswerText(answer?.answer_text))
      : selectedOptionIds.length === correctOptionIds.length && selectedOptionIds.every((id, index) => id === correctOptionIds[index]);

    const marks = Number(question.marks ?? question.points ?? 1);
    if (isCorrect) earnedMarks += marks;

    return {
      question_id: question.question_id,
      section_id: question.section_id,
      is_correct: isCorrect,
      explanation: question.explanation ?? null,
      selected_option_ids: selectedOptionIds,
      correct_option_ids: correctOptionIds,
      answer_text: answer?.answer_text ?? null,
      marks,
      earned_marks: isCorrect ? marks : 0,
    };
  });

  const score = totalMarks > 0 ? Number(((earnedMarks / totalMarks) * 100).toFixed(2)) : 0;
  const passed = score >= passingScore;

  return {
    earnedMarks,
    totalMarks,
    score,
    passed,
    questionResults,
  };
}
