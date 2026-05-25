import { useMemo } from 'react';
import {
  type AdminJlptExam,
  type AdminJlptSection,
  type AdminQuizQuestion,
  type AdminTest,
} from '../../services/api';
import type { AdminQuestionFormValues } from '../../components/admin/adminFormTypes';
import type { ModalName } from '../../components/admin/adminTypes';
import { getNewQuestionFormValues, getQuestionFormValues } from './adminQuestionHelpers';
import { useAdminJlptQuestionActions } from './useAdminJlptQuestionActions';
import { useAdminQuizQuestionActions } from './useAdminQuizQuestionActions';

type RunAdminTask = (task: () => Promise<void>, success?: string) => Promise<void>;

export function useAdminQuestions({
  tests,
  lessonQuizzes,
  quizQuestions,
  jlptQuestions,
  selectedJlptExam,
  managingJlptSection,
  managingJlptExamId,
  managingQuestionsQuizId,
  setManagingQuestionsQuizId,
  managingJlptSectionId,
  setManagingJlptSectionId,
  setQuizQuestions,
  setJlptQuestions,
  editingQuestionId,
  setEditingQuestionId,
  setEditingJlptSectionId,
  setQuestionForm,
  setActiveModal,
  run,
  loadQuizQuestions,
  loadTests,
  loadLessonQuizzes,
  loadStats,
  loadJlptQuestions,
  loadJlptSections,
  loadJlptExams,
  loadReadingPassages,
}: {
  tests: AdminTest[];
  lessonQuizzes: AdminTest[];
  quizQuestions: AdminQuizQuestion[];
  jlptQuestions: AdminQuizQuestion[];
  selectedJlptExam: AdminJlptExam | null;
  managingJlptSection: AdminJlptSection | null;
  managingJlptExamId: number | null;
  managingQuestionsQuizId: number | null;
  setManagingQuestionsQuizId: (value: number | null) => void;
  managingJlptSectionId: number | null;
  setManagingJlptSectionId: (value: number | null) => void;
  setQuizQuestions: (values: AdminQuizQuestion[]) => void;
  setJlptQuestions: (values: AdminQuizQuestion[]) => void;
  editingQuestionId: number | null;
  setEditingQuestionId: (value: number | null) => void;
  setEditingJlptSectionId: (value: number | null) => void;
  setQuestionForm: (values: AdminQuestionFormValues) => void;
  setActiveModal: (value: ModalName) => void;
  run: RunAdminTask;
  loadQuizQuestions: (quizId: number) => Promise<void>;
  loadTests: () => Promise<void>;
  loadLessonQuizzes: () => Promise<void>;
  loadStats: () => Promise<void>;
  loadJlptQuestions: (sectionId: number) => Promise<void>;
  loadJlptSections: (examId: number) => Promise<void>;
  loadJlptExams: () => Promise<void>;
  loadReadingPassages: (level?: AdminJlptExam['jlpt_level']) => Promise<void>;
}) {
  const managingQuestionsQuiz = useMemo(
    () => tests.find((test) => test.quiz_id === managingQuestionsQuizId) ?? lessonQuizzes.find((test) => test.quiz_id === managingQuestionsQuizId) ?? null,
    [lessonQuizzes, managingQuestionsQuizId, tests]
  );
  const visibleQuizQuestions = quizQuestions;

  const quizActions = useAdminQuizQuestionActions({
    managingQuestionsQuizId,
    quizQuestions,
    editingQuestionId,
    setActiveModal,
    run,
    loadQuizQuestions,
    loadTests,
    loadLessonQuizzes,
    loadStats,
  });

  const jlptActions = useAdminJlptQuestionActions({
    managingJlptSectionId,
    managingJlptSection,
    managingJlptExamId,
    jlptQuestions,
    editingQuestionId,
    setActiveModal,
    run,
    loadJlptQuestions,
    loadJlptSections,
    loadJlptExams,
  });

  const openManageQuestions = (quizId: number) => {
    setManagingQuestionsQuizId(quizId);
    setManagingJlptSectionId(null);
    setJlptQuestions([]);
    setEditingQuestionId(null);
    setQuizQuestions([]);
    void loadQuizQuestions(quizId);
    setActiveModal('questions');
  };

  const openManageJlptQuestions = (section: AdminJlptSection) => {
    setManagingJlptSectionId(section.section_id);
    setManagingQuestionsQuizId(null);
    setQuizQuestions([]);
    setEditingJlptSectionId(null);
    setEditingQuestionId(null);
    setJlptQuestions([]);
    void loadJlptQuestions(section.section_id);
    if (section.section_type === 'reading') void loadReadingPassages(selectedJlptExam?.jlpt_level);
    setActiveModal('jlptSections');
  };

  const openCreateQuestion = () => {
    setEditingQuestionId(null);
    const nextForm = getNewQuestionFormValues({
      selectedJlptExam,
      managingJlptSection,
      managingJlptSectionId,
      jlptQuestions,
      quizQuestions,
    });
    setQuestionForm(nextForm);
    if (nextForm.section_type === 'reading') void loadReadingPassages(selectedJlptExam?.jlpt_level);
    setActiveModal('question');
  };

  const openEditQuestion = (question: AdminQuizQuestion) => {
    setEditingQuestionId(question.question_id);
    setQuestionForm(getQuestionFormValues(question));
    if (question.section_type === 'reading') void loadReadingPassages(selectedJlptExam?.jlpt_level);
    setActiveModal('question');
  };

  const moveQuestion = (questionId: number, direction: 'up' | 'down') => {
    if (managingJlptSectionId) {
      jlptActions.moveJlptQuestion(questionId, direction);
      return;
    }
    quizActions.moveQuizQuestion(questionId, direction);
  };

  const deleteQuestion = (question: AdminQuizQuestion) => {
    if (managingJlptSectionId) {
      jlptActions.deleteJlptQuestion(question);
      return;
    }
    quizActions.deleteQuizQuestion(question);
  };

  const submitQuestion = (values: AdminQuestionFormValues) => {
    if (managingJlptSectionId) {
      jlptActions.submitJlptQuestion(values);
      return;
    }
    quizActions.submitQuizQuestion(values);
  };

  return {
    managingQuestionsQuiz,
    visibleQuizQuestions,
    openManageQuestions,
    openCreateQuestion,
    openEditQuestion,
    moveQuestion,
    deleteQuestion,
    submitQuestion,
    openManageJlptQuestions,
  };
}
