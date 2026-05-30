import type {
  emptyAutoJlptQuestions,
  emptyCourse,
  emptyJlptExam,
  emptyJlptSection,
  emptyLesson,
  emptyQuestion,
  emptyReadingPassage,
  emptyTest,
  emptyUser,
} from './adminFormDefaults';

export type AdminUserFormValues = typeof emptyUser;
export type AdminCourseFormValues = typeof emptyCourse;
export type AdminLessonFormValues = typeof emptyLesson;
export type AdminTestFormValues = typeof emptyTest;
export type AdminJlptExamFormValues = typeof emptyJlptExam;
export type AdminJlptSectionFormValues = typeof emptyJlptSection;
export type AdminQuestionFormValues = typeof emptyQuestion;
export type AdminReadingPassageFormValues = typeof emptyReadingPassage;
export type AdminAutoJlptQuestionsFormValues = typeof emptyAutoJlptQuestions;
