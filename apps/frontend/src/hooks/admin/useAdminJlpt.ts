import { useMemo } from 'react';
import type {
  AdminJlptExam,
  AdminJlptSection,
  AdminQuizQuestion,
} from '../../services/api';
import type {
  AdminAutoJlptQuestionsFormValues,
  AdminJlptExamFormValues,
  AdminJlptSectionFormValues,
  AdminReadingPassageFormValues,
} from '../../components/admin/adminFormTypes';
import type { ModalName } from '../../components/admin/adminTypes';
import { useAdminJlptExams } from './useAdminJlptExams';
import { useAdminJlptSections } from './useAdminJlptSections';
import { useAdminReadingPassages } from './useAdminReadingPassages';

type RunAdminTask = (task: () => Promise<void>, success?: string) => Promise<void>;

export function useAdminJlpt({
  jlptExams,
  jlptSections,
  jlptQuestions,
  editingJlptExamId,
  setEditingJlptExamId,
  managingJlptExamId,
  setManagingJlptExamId,
  editingJlptSectionId,
  setEditingJlptSectionId,
  managingJlptSectionId,
  setManagingJlptSectionId,
  setJlptExamForm,
  setJlptSectionForm,
  setReadingPassageForm,
  editingReadingPassageId,
  setEditingReadingPassageId,
  autoJlptQuestionsForm,
  setAutoJlptQuestionsForm,
  setManagingQuestionsQuizId,
  setQuizQuestions,
  setJlptQuestions,
  setJlptSections,
  setActiveModal,
  closeModal,
  run,
  loadJlptExams,
  loadJlptSections,
  loadReadingPassages,
  loadStats,
}: {
  jlptExams: AdminJlptExam[];
  jlptSections: AdminJlptSection[];
  jlptQuestions: AdminQuizQuestion[];
  editingJlptExamId: number | null;
  setEditingJlptExamId: (value: number | null) => void;
  managingJlptExamId: number | null;
  setManagingJlptExamId: (value: number | null) => void;
  editingJlptSectionId: number | null;
  setEditingJlptSectionId: (value: number | null) => void;
  managingJlptSectionId: number | null;
  setManagingJlptSectionId: (value: number | null) => void;
  setJlptExamForm: (values: AdminJlptExamFormValues) => void;
  setJlptSectionForm: (values: AdminJlptSectionFormValues) => void;
  setReadingPassageForm: (values: AdminReadingPassageFormValues) => void;
  editingReadingPassageId: number | null;
  setEditingReadingPassageId: (value: number | null) => void;
  autoJlptQuestionsForm: AdminAutoJlptQuestionsFormValues;
  setAutoJlptQuestionsForm: (values: AdminAutoJlptQuestionsFormValues) => void;
  setManagingQuestionsQuizId: (value: number | null) => void;
  setQuizQuestions: (values: AdminQuizQuestion[]) => void;
  setJlptQuestions: (values: AdminQuizQuestion[]) => void;
  setJlptSections: (values: AdminJlptSection[]) => void;
  setActiveModal: (value: ModalName) => void;
  closeModal: () => void;
  run: RunAdminTask;
  loadJlptExams: () => Promise<void>;
  loadJlptSections: (examId: number) => Promise<void>;
  loadReadingPassages: (level?: AdminJlptExam['jlpt_level']) => Promise<void>;
  loadStats: () => Promise<void>;
}) {
  const selectedJlptExam = useMemo(
    () => jlptExams.find((exam) => exam.exam_id === (editingJlptExamId ?? managingJlptExamId)) ?? null,
    [editingJlptExamId, jlptExams, managingJlptExamId]
  );
  const managingJlptSection = useMemo(
    () => jlptSections.find((section) => section.section_id === managingJlptSectionId) ?? null,
    [jlptSections, managingJlptSectionId]
  );
  const sortedJlptSections = useMemo(
    () => [...jlptSections].sort((a, b) => (a.section_order ?? 0) - (b.section_order ?? 0) || a.section_id - b.section_id),
    [jlptSections]
  );
  const sortedJlptQuestions = useMemo(
    () => [...jlptQuestions].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0) || a.question_id - b.question_id),
    [jlptQuestions]
  );

  const examActions = useAdminJlptExams({
    editingJlptExamId,
    setEditingJlptExamId,
    managingJlptExamId,
    setManagingJlptExamId,
    setManagingJlptSectionId,
    setJlptExamForm,
    setJlptSections,
    setJlptQuestions,
    setActiveModal,
    closeModal,
    run,
    loadJlptExams,
    loadJlptSections,
  });

  const sectionActions = useAdminJlptSections({
    jlptSections,
    sortedJlptSections,
    selectedJlptExam,
    managingJlptSection,
    editingJlptSectionId,
    setEditingJlptSectionId,
    managingJlptExamId,
    setManagingJlptExamId,
    managingJlptSectionId,
    setManagingJlptSectionId,
    setJlptSectionForm,
    autoJlptQuestionsForm,
    setAutoJlptQuestionsForm,
    setManagingQuestionsQuizId,
    setQuizQuestions,
    setJlptQuestions,
    setActiveModal,
    run,
    loadJlptExams,
    loadJlptSections,
    loadStats,
  });

  const readingPassageActions = useAdminReadingPassages({
    selectedJlptExam,
    setReadingPassageForm,
    editingReadingPassageId,
    setEditingReadingPassageId,
    setActiveModal,
    run,
    loadReadingPassages,
  });

  return {
    selectedJlptExam,
    managingJlptSection,
    sortedJlptSections,
    sortedJlptQuestions,
    ...sectionActions,
    ...examActions,
    ...readingPassageActions,
  };
}
