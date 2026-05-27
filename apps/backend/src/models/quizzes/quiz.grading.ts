import { normalizeQuizAnswerText, type QuizAnswerInput, type QuizDetail } from "./quiz.types.js";

export interface GradedQuizAnswer {
  question: QuizDetail["questions"][number];
  answer: QuizAnswerInput | undefined;
  selectedOptionIds: number[];
  isCorrect: boolean;
}

export interface QuizGradeResult {
  earnedMarks: number;
  totalMarks: number;
  score: number;
  passed: boolean;
  gradedAnswers: GradedQuizAnswer[];
}

export function gradeQuiz(quiz: QuizDetail, answers: QuizAnswerInput[]): QuizGradeResult {
  const answersByQuestion = new Map<number, QuizAnswerInput>();
  answers.forEach((answer) => answersByQuestion.set(answer.question_id, answer));

  let earnedMarks = 0;
  const gradedAnswers = quiz.questions.map((question) => {
    const answer = answersByQuestion.get(question.question_id);
    const correctOptionIds = question.options.filter((option) => option.is_correct).map((option) => option.option_id);
    const validOptionIds = new Set(question.options.map((option) => option.option_id));
    const selectedOptionIds = Array.from(
      new Set([...(answer?.option_ids ?? []), ...(answer?.option_id ? [answer.option_id] : [])])
    )
      .filter((optionId) => validOptionIds.has(optionId))
      .sort((a, b) => a - b);

    let isCorrect = false;
    if (question.question_type === "fill_in_blank") {
      const correctTexts = question.options
        .filter((option) => option.is_correct)
        .map((option) => normalizeQuizAnswerText(option.option_text));
      const userText = normalizeQuizAnswerText(answer?.answer_text ?? "");
      isCorrect = Boolean(userText && correctTexts.includes(userText));
    } else if (question.question_type === "multiple_choice") {
      const sortedCorrectOptionIds = [...correctOptionIds].sort((a, b) => a - b);
      isCorrect =
        sortedCorrectOptionIds.length > 0 &&
        selectedOptionIds.length === sortedCorrectOptionIds.length &&
        selectedOptionIds.every((optionId, index) => optionId === sortedCorrectOptionIds[index]);
    } else {
      isCorrect = correctOptionIds.length > 0 && selectedOptionIds.length === 1 && correctOptionIds.includes(selectedOptionIds[0]);
    }

    if (isCorrect) {
      earnedMarks += question.marks;
    }

    return {
      question,
      answer,
      selectedOptionIds,
      isCorrect,
    };
  });

  const totalMarks = quiz.total_marks || quiz.questions.reduce((sum, question) => sum + question.marks, 0);
  const score = totalMarks > 0 ? Number(((earnedMarks / totalMarks) * 100).toFixed(2)) : 0;
  const passed = score >= quiz.passing_score;

  return {
    earnedMarks,
    totalMarks,
    score,
    passed,
    gradedAnswers,
  };
}
