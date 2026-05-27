import { adminAPI, type AdminJlptExam, type AdminJlptSection, type AdminQuizQuestion } from '../../services/api';
import { emptyJlptExam } from '../../components/admin/adminFormDefaults';
import type { AdminJlptExamFormValues } from '../../components/admin/adminFormTypes';
import { optionLabel, toNullableNumber } from '../../components/admin/adminHelpers';
import { sectionTypeOptions } from '../../components/admin/adminOptions';
import type { ModalName } from '../../components/admin/adminTypes';

type RunAdminTask = (task: () => Promise<void>, success?: string) => Promise<void>;

export function useAdminJlptExams({
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
}: {
  editingJlptExamId: number | null;
  setEditingJlptExamId: (value: number | null) => void;
  managingJlptExamId: number | null;
  setManagingJlptExamId: (value: number | null) => void;
  setManagingJlptSectionId: (value: number | null) => void;
  setJlptExamForm: (values: AdminJlptExamFormValues) => void;
  setJlptSections: (values: AdminJlptSection[]) => void;
  setJlptQuestions: (values: AdminQuizQuestion[]) => void;
  setActiveModal: (value: ModalName) => void;
  closeModal: () => void;
  run: RunAdminTask;
  loadJlptExams: () => Promise<void>;
  loadJlptSections: (examId: number) => Promise<void>;
}) {
  const openCreateJlptExam = () => {
    setEditingJlptExamId(null);
    setManagingJlptExamId(null);
    setJlptExamForm(emptyJlptExam);
    setJlptSections([]);
    setJlptQuestions([]);
    setActiveModal('jlptExam');
  };

  const openEditJlptExam = (exam: AdminJlptExam) => {
    setEditingJlptExamId(exam.exam_id);
    setManagingJlptExamId(null);
    setJlptExamForm({
      title: exam.title,
      jlpt_level: exam.jlpt_level,
      year: exam.year?.toString() || '',
      duration_minutes: exam.duration_minutes?.toString() || '',
      sections: emptyJlptExam.sections,
    });
    setActiveModal('jlptExam');
  };

  const submitJlptExam = (values: AdminJlptExamFormValues) => {
    void run(async () => {
      const payload = {
        title: values.title,
        jlpt_level: values.jlpt_level,
        year: toNullableNumber(values.year),
        duration_minutes: toNullableNumber(values.duration_minutes),
      };

      if (editingJlptExamId) {
        await adminAPI.updateJlptExam(editingJlptExamId, payload);
      } else {
        const sections = values.sections.map((sectionType, index) => ({
          title: optionLabel(sectionTypeOptions, sectionType),
          section_type: sectionType,
          section_order: index + 1,
          duration_minutes: null,
          audio_asset_id: null,
          audio_url: null,
        }));
        const created = await adminAPI.createJlptExam({ ...payload, sections });
        setEditingJlptExamId(created.data.exam_id);
        setManagingJlptExamId(created.data.exam_id);
        await loadJlptSections(created.data.exam_id);
      }
      await loadJlptExams();
      setActiveModal('jlptExam');
    }, editingJlptExamId ? 'JLPT test updated successfully' : 'JLPT test created successfully');
  };

  const deleteJlptExam = (exam: AdminJlptExam) => {
    const confirmed = window.confirm(`Hide JLPT test "${exam.title}"? Sections and section-question links will be hidden, while question records remain available for history.`);
    if (!confirmed) return;

    void run(async () => {
      await adminAPI.deleteJlptExam(exam.exam_id);
      if (editingJlptExamId === exam.exam_id || managingJlptExamId === exam.exam_id) {
        setEditingJlptExamId(null);
        setManagingJlptExamId(null);
        setManagingJlptSectionId(null);
        setJlptSections([]);
        setJlptQuestions([]);
        closeModal();
      }
      await loadJlptExams();
    }, 'JLPT test hidden successfully');
  };

  return {
    openCreateJlptExam,
    openEditJlptExam,
    submitJlptExam,
    deleteJlptExam,
  };
}
