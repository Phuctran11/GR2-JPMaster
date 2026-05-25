import type { AdminJlptExam, AdminQuizQuestion, AdminJlptSection } from '../../services/api';
import { emptyQuestion } from '../../components/admin/adminFormDefaults';
import type { AdminQuestionFormValues } from '../../components/admin/adminFormTypes';
import { toNullableNumber } from '../../components/admin/adminHelpers';
import { difficultyOptions, jlptLevelOptions, sectionTypeOptions } from '../../components/admin/adminOptions';

export const getQuestionFormValues = (question: AdminQuizQuestion): AdminQuestionFormValues => ({
  question_text: question.question_text,
  question_type: question.question_type,
  difficulty_level: difficultyOptions.some((option) => option.value === question.difficulty_level) ? question.difficulty_level || 'easy' : 'easy',
  explanation: question.explanation || '',
  points: question.points,
  jlpt_level: jlptLevelOptions.some((option) => option.value === question.jlpt_level) ? question.jlpt_level || 'N5' : 'N5',
  section_type: sectionTypeOptions.some((option) => option.value === question.section_type) ? question.section_type || 'vocabulary' : 'vocabulary',
  reading_passage_id: question.reading_passage_id?.toString() || '',
  image_asset_id: question.image_asset_id ?? null,
  image_url: question.image_url || '',
  audio_asset_id: question.audio_asset_id ?? null,
  audio_url: question.audio_url || '',
  order_index: question.order_index?.toString() || '',
  marks: question.marks,
  options: question.options.length
    ? question.options.map((option) => ({
        option_id: option.option_id,
        option_text: option.option_text,
        is_correct: option.is_correct,
        explanation: option.explanation || '',
      }))
    : emptyQuestion.options,
});

export const getNewQuestionFormValues = ({
  selectedJlptExam,
  managingJlptSection,
  managingJlptSectionId,
  jlptQuestions,
  quizQuestions,
}: {
  selectedJlptExam: AdminJlptExam | null;
  managingJlptSection: AdminJlptSection | null;
  managingJlptSectionId: number | null;
  jlptQuestions: AdminQuizQuestion[];
  quizQuestions: AdminQuizQuestion[];
}): AdminQuestionFormValues => {
  const section = managingJlptSection?.section_type ?? emptyQuestion.section_type;
  const sectionQuestionCount = managingJlptSectionId ? jlptQuestions.length : quizQuestions.filter((question) => question.section_type === section).length;

  return {
    ...emptyQuestion,
    jlpt_level: selectedJlptExam?.jlpt_level ?? emptyQuestion.jlpt_level,
    section_type: section,
    reading_passage_id: '',
    order_index: String(sectionQuestionCount + 1),
  };
};

export const getQuestionPayload = ({
  values,
  managingJlptSection,
  managingJlptSectionId,
}: {
  values: AdminQuestionFormValues;
  managingJlptSection: AdminJlptSection | null;
  managingJlptSectionId: number | null;
}) => {
  const sectionType = managingJlptSection?.section_type ?? values.section_type;
  const allowQuestionAudio = !managingJlptSectionId && sectionType === 'listening';

  return {
    question_text: values.question_text,
    question_type: values.question_type,
    difficulty_level: values.difficulty_level,
    explanation: values.explanation || null,
    points: Number(values.points),
    jlpt_level: values.jlpt_level,
    section_type: sectionType,
    reading_passage_id: sectionType === 'reading' ? toNullableNumber(values.reading_passage_id) : null,
    image_asset_id: values.image_asset_id,
    image_url: values.image_url || null,
    audio_asset_id: allowQuestionAudio ? values.audio_asset_id : null,
    audio_url: allowQuestionAudio ? values.audio_url || null : null,
    order_index: toNullableNumber(values.order_index),
    marks: Number(values.marks),
    options: values.options
      .filter((option) => option.option_text.trim())
      .map((option) => ({
        option_id: option.option_id,
        option_text: option.option_text,
        is_correct: option.is_correct,
        explanation: option.explanation || null,
      })),
  };
};
