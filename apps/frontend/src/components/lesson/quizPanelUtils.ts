import type { Quiz, QuizAnswerPayload } from '../../services/api';

export type QuizAnswerState = Record<number, { optionIds: number[]; answerText: string }>;

export const emptyQuizAnswer = { optionIds: [], answerText: '' };

export const isQuizQuestionAnswered = (
  quiz: Quiz,
  questionId: number,
  answer?: QuizAnswerState[number]
) => {
  const question = quiz.questions.find((item) => item.question_id === questionId);
  if (!question) return false;

  if (question.question_type === 'fill_in_blank') {
    return Boolean(answer?.answerText.trim());
  }

  return Boolean(answer?.optionIds.length);
};

export const buildQuizAnswerPayload = (quiz: Quiz, answers: QuizAnswerState): QuizAnswerPayload[] =>
  quiz.questions.map((question) => {
    const answer = answers[question.question_id] ?? emptyQuizAnswer;

    if (question.question_type === 'fill_in_blank') {
      return {
        question_id: question.question_id,
        answer_text: answer.answerText.trim(),
      };
    }

    if (question.question_type === 'multiple_choice') {
      return {
        question_id: question.question_id,
        option_ids: answer.optionIds,
      };
    }

    return {
      question_id: question.question_id,
      option_id: answer.optionIds[0],
    };
  });
