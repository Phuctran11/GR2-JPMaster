import type {
  AdminJlptLevel,
  AdminQuestionType,
  AdminQuizType,
  AdminRole,
  AdminSectionType,
  AdminUserStatus,
} from './adminTypes';

export const emptyUser = { username: '', email: '', password: '', role: 'learner' as AdminRole, status: 'active' as AdminUserStatus };
export const emptyCourse = { title: '', description: '', price: 0, level: 'beginner', duration: '', cover_asset_id: null as number | null, image_url: '' };
export const emptyLesson = {
  course_id: '',
  title: '',
  content_text: '',
  video_asset_id: null as number | null,
  video_url: '',
  audio_asset_id: null as number | null,
  audio_url: '',
  order_index: 1,
  duration: '',
};
export const emptyTest = {
  title: '',
  description: '',
  quiz_type: 'practice_test' as AdminQuizType,
  course_id: '',
  lesson_id: '',
  passing_score: 70,
  total_marks: 0,
  time_limit_minutes: '',
};
export const emptyJlptExam = {
  title: '',
  jlpt_level: 'N5' as AdminJlptLevel,
  year: '',
  duration_minutes: '',
  sections: ['vocabulary', 'grammar', 'reading', 'listening'] as AdminSectionType[],
};
export const emptyJlptSection = {
  title: '',
  section_type: 'vocabulary' as AdminSectionType,
  section_order: 1,
  duration_minutes: '',
  audio_asset_id: null as number | null,
  audio_url: '',
};
export const emptyQuestion = {
  question_text: '',
  question_type: 'single_choice' as AdminQuestionType,
  difficulty_level: 'easy',
  explanation: '',
  points: 1,
  jlpt_level: 'N5',
  section_type: 'vocabulary',
  reading_passage_id: '',
  image_asset_id: null as number | null,
  image_url: '',
  audio_asset_id: null as number | null,
  audio_url: '',
  order_index: '',
  marks: 1,
  options: [
    { option_id: undefined as number | undefined, option_text: '', is_correct: true, explanation: '' },
    { option_id: undefined as number | undefined, option_text: '', is_correct: false, explanation: '' },
  ],
};
export const emptyReadingPassage = {
  title: '',
  jlpt_level: 'N5' as AdminJlptLevel,
  passage_text: '',
  image_asset_id: null as number | null,
  image_url: '',
};
export const emptyAutoJlptQuestions = {
  jlpt_level: 'N5' as AdminJlptLevel,
  easy: 0,
  medium: 0,
  hard: 0,
  expert: 0,
};
