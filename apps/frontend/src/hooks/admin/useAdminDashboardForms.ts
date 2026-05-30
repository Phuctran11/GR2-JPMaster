import { useState } from 'react';
import {
  emptyAutoJlptQuestions,
  emptyCourse,
  emptyJlptExam,
  emptyJlptSection,
  emptyLesson,
  emptyQuestion,
  emptyReadingPassage,
  emptyTest,
  emptyUser,
} from '../../components/admin/adminFormDefaults';
import type {
  AdminAutoJlptQuestionsFormValues,
  AdminCourseFormValues,
  AdminJlptExamFormValues,
  AdminJlptSectionFormValues,
  AdminLessonFormValues,
  AdminQuestionFormValues,
  AdminReadingPassageFormValues,
  AdminTestFormValues,
  AdminUserFormValues,
} from '../../components/admin/adminFormTypes';
import type { ModalName } from '../../components/admin/adminTypes';

export function useAdminDashboardForms() {
  const [userForm, setUserForm] = useState<AdminUserFormValues>(emptyUser);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [courseForm, setCourseForm] = useState<AdminCourseFormValues>(emptyCourse);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [lessonForm, setLessonForm] = useState<AdminLessonFormValues>(emptyLesson);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [managingLessonsCourseId, setManagingLessonsCourseId] = useState<number | null>(null);
  const [testForm, setTestForm] = useState<AdminTestFormValues>(emptyTest);
  const [editingTestId, setEditingTestId] = useState<number | null>(null);
  const [returnModalAfterTest, setReturnModalAfterTest] = useState<ModalName>(null);
  const [managingQuestionsQuizId, setManagingQuestionsQuizId] = useState<number | null>(null);
  const [questionForm, setQuestionForm] = useState<AdminQuestionFormValues>(emptyQuestion);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [jlptExamForm, setJlptExamForm] = useState<AdminJlptExamFormValues>(emptyJlptExam);
  const [editingJlptExamId, setEditingJlptExamId] = useState<number | null>(null);
  const [managingJlptExamId, setManagingJlptExamId] = useState<number | null>(null);
  const [jlptSectionForm, setJlptSectionForm] = useState<AdminJlptSectionFormValues>(emptyJlptSection);
  const [editingJlptSectionId, setEditingJlptSectionId] = useState<number | null>(null);
  const [managingJlptSectionId, setManagingJlptSectionId] = useState<number | null>(null);
  const [readingPassageForm, setReadingPassageForm] = useState<AdminReadingPassageFormValues>(emptyReadingPassage);
  const [editingReadingPassageId, setEditingReadingPassageId] = useState<number | null>(null);
  const [autoJlptQuestionsForm, setAutoJlptQuestionsForm] = useState<AdminAutoJlptQuestionsFormValues>(emptyAutoJlptQuestions);

  return {
    userForm,
    setUserForm,
    editingUserId,
    setEditingUserId,
    courseForm,
    setCourseForm,
    editingCourseId,
    setEditingCourseId,
    lessonForm,
    setLessonForm,
    editingLessonId,
    setEditingLessonId,
    managingLessonsCourseId,
    setManagingLessonsCourseId,
    testForm,
    setTestForm,
    editingTestId,
    setEditingTestId,
    returnModalAfterTest,
    setReturnModalAfterTest,
    managingQuestionsQuizId,
    setManagingQuestionsQuizId,
    questionForm,
    setQuestionForm,
    editingQuestionId,
    setEditingQuestionId,
    jlptExamForm,
    setJlptExamForm,
    editingJlptExamId,
    setEditingJlptExamId,
    managingJlptExamId,
    setManagingJlptExamId,
    jlptSectionForm,
    setJlptSectionForm,
    editingJlptSectionId,
    setEditingJlptSectionId,
    managingJlptSectionId,
    setManagingJlptSectionId,
    readingPassageForm,
    setReadingPassageForm,
    editingReadingPassageId,
    setEditingReadingPassageId,
    autoJlptQuestionsForm,
    setAutoJlptQuestionsForm,
  };
}
