import type {
  JlptExamAnswerPayload,
  JlptExamDetail,
  JlptExamQuestion,
  JlptExamSection,
} from '../../services/api';

export type AnswerState = Record<number, { optionIds: number[]; answerText: string }>;
export type JlptTestPhase = 'intro' | 'section' | 'break' | 'submitted';

export const BREAK_SECONDS = 120;
export const DEFAULT_SECTION_MINUTES = 30;

export const sectionLabels: Record<string, string> = {
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  reading: 'Reading',
  listening: 'Listening',
};

export const formatTime = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

export const getSectionSeconds = (section: JlptExamSection, exam: JlptExamDetail) => {
  const fallbackMinutes = exam.duration_minutes && exam.sections.length
    ? Math.max(1, Math.ceil(exam.duration_minutes / exam.sections.length))
    : DEFAULT_SECTION_MINUTES;
  return Math.max(1, section.duration_minutes ?? fallbackMinutes) * 60;
};

export const isQuestionAnswered = (question: JlptExamQuestion, answer?: AnswerState[number]) => {
  if (question.question_type === 'fill_in_blank') return Boolean(answer?.answerText.trim());
  return Boolean(answer?.optionIds.length);
};

export const buildJlptAnswerPayload = (
  exam: JlptExamDetail,
  answers: AnswerState
): JlptExamAnswerPayload[] =>
  exam.sections.flatMap((section) =>
    section.questions.map((question) => {
      const answer = answers[question.question_id] ?? { optionIds: [], answerText: '' };
      if (question.question_type === 'fill_in_blank') {
        return { question_id: question.question_id, answer_text: answer.answerText.trim() };
      }
      if (question.question_type === 'multiple_choice') {
        return { question_id: question.question_id, option_ids: answer.optionIds };
      }
      return { question_id: question.question_id, option_id: answer.optionIds[0] };
    })
  );
