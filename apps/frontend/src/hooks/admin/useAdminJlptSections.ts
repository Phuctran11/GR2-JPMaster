import { adminAPI, type AdminJlptExam, type AdminJlptSection, type AdminQuizQuestion } from '../../services/api';
import { emptyAutoJlptQuestions, emptyJlptSection } from '../../components/admin/adminFormDefaults';
import type { AdminAutoJlptQuestionsFormValues, AdminJlptSectionFormValues } from '../../components/admin/adminFormTypes';
import { optionLabel, toNullableNumber } from '../../components/admin/adminHelpers';
import { sectionTypeOptions } from '../../components/admin/adminOptions';
import type { ModalName } from '../../components/admin/adminTypes';

type RunAdminTask = (task: () => Promise<void>, success?: string) => Promise<void>;

export function useAdminJlptSections({
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
}: {
  jlptSections: AdminJlptSection[];
  sortedJlptSections: AdminJlptSection[];
  selectedJlptExam: AdminJlptExam | null;
  managingJlptSection: AdminJlptSection | null;
  editingJlptSectionId: number | null;
  setEditingJlptSectionId: (value: number | null) => void;
  managingJlptExamId: number | null;
  setManagingJlptExamId: (value: number | null) => void;
  managingJlptSectionId: number | null;
  setManagingJlptSectionId: (value: number | null) => void;
  setJlptSectionForm: (values: AdminJlptSectionFormValues) => void;
  autoJlptQuestionsForm: AdminAutoJlptQuestionsFormValues;
  setAutoJlptQuestionsForm: (values: AdminAutoJlptQuestionsFormValues) => void;
  setManagingQuestionsQuizId: (value: number | null) => void;
  setQuizQuestions: (values: AdminQuizQuestion[]) => void;
  setJlptQuestions: (values: AdminQuizQuestion[]) => void;
  setActiveModal: (value: ModalName) => void;
  run: RunAdminTask;
  loadJlptExams: () => Promise<void>;
  loadJlptSections: (examId: number) => Promise<void>;
  loadStats: () => Promise<void>;
}) {
  const openManageJlptSections = (examId: number) => {
    setManagingJlptExamId(examId);
    setManagingQuestionsQuizId(null);
    setEditingJlptSectionId(null);
    setManagingJlptSectionId(null);
    setQuizQuestions([]);
    setJlptQuestions([]);
    void loadJlptSections(examId);
    setActiveModal('jlptSections');
  };

  const openEditJlptSection = (section: AdminJlptSection) => {
    setEditingJlptSectionId(section.section_id);
    setJlptSectionForm({
      title: section.title || '',
      section_type: section.section_type,
      section_order: section.section_order ?? 1,
      duration_minutes: section.duration_minutes?.toString() || '',
      audio_asset_id: section.audio_asset_id ?? null,
      audio_url: section.audio_url || '',
    });
    setActiveModal('jlptSection');
  };

  const openCreateJlptSection = () => {
    if (!managingJlptExamId) return;
    const existingTypes = new Set(jlptSections.map((section) => section.section_type));
    if (existingTypes.size >= sectionTypeOptions.length) return;

    const nextType = sectionTypeOptions.find((option) => !existingTypes.has(option.value))?.value ?? 'vocabulary';
    setEditingJlptSectionId(null);
    setJlptSectionForm({
      ...emptyJlptSection,
      title: optionLabel(sectionTypeOptions, nextType),
      section_type: nextType,
      section_order: sortedJlptSections.length + 1,
    });
    setActiveModal('jlptSection');
  };

  const openAutoJlptQuestions = () => {
    if (!managingJlptSection || !['vocabulary', 'grammar'].includes(managingJlptSection.section_type)) return;
    setAutoJlptQuestionsForm({
      ...emptyAutoJlptQuestions,
      jlpt_level: selectedJlptExam?.jlpt_level ?? emptyAutoJlptQuestions.jlpt_level,
    });
    setActiveModal('autoJlptQuestions');
  };

  const submitJlptSection = (values: AdminJlptSectionFormValues) => {
    if (!editingJlptSectionId && !managingJlptExamId) return;

    void run(async () => {
      const sectionType = values.section_type;
      const payload = {
        title: values.title || optionLabel(sectionTypeOptions, sectionType),
        section_type: sectionType,
        section_order: Number(values.section_order),
        duration_minutes: toNullableNumber(values.duration_minutes),
        audio_asset_id: sectionType === 'listening' ? values.audio_asset_id : null,
        audio_url: sectionType === 'listening' ? values.audio_url || null : null,
      };

      if (editingJlptSectionId) await adminAPI.updateJlptSection(editingJlptSectionId, payload);
      else if (managingJlptExamId) await adminAPI.createJlptSection(managingJlptExamId, payload);

      if (managingJlptExamId) await loadJlptSections(managingJlptExamId);
      await loadJlptExams();
      setActiveModal('jlptSections');
    }, editingJlptSectionId ? 'JLPT section updated successfully' : 'JLPT section created successfully');
  };

  const deleteJlptSection = (section: AdminJlptSection) => {
    const confirmed = window.confirm(`Hide section "${section.title || optionLabel(sectionTypeOptions, section.section_type)}"? Its question links will be hidden, while question records remain available.`);
    if (!confirmed) return;

    void run(async () => {
      await adminAPI.deleteJlptSection(section.section_id);
      if (managingJlptSectionId === section.section_id) {
        setManagingJlptSectionId(null);
        setJlptQuestions([]);
      }
      if (editingJlptSectionId === section.section_id) {
        setEditingJlptSectionId(null);
        setActiveModal('jlptSections');
      }
      if (managingJlptExamId) await loadJlptSections(managingJlptExamId);
      await loadJlptExams();
    }, 'JLPT section hidden successfully');
  };

  const submitAutoJlptQuestions = (values: AdminAutoJlptQuestionsFormValues = autoJlptQuestionsForm) => {
    if (!managingJlptSectionId) return;

    void run(async () => {
      const result = await adminAPI.autoAddJlptSectionQuestions(managingJlptSectionId, {
        jlpt_level: values.jlpt_level,
        difficulty_counts: {
          easy: Number(values.easy) || 0,
          medium: Number(values.medium) || 0,
          hard: Number(values.hard) || 0,
          expert: Number(values.expert) || 0,
        },
      });
      setJlptQuestions(result.data);
      await Promise.all([managingJlptExamId ? loadJlptSections(managingJlptExamId) : Promise.resolve(), loadJlptExams(), loadStats()]);
      setActiveModal('jlptSections');
    }, 'Questions added from bank successfully');
  };

  return {
    openAutoJlptQuestions,
    openManageJlptSections,
    openEditJlptSection,
    openCreateJlptSection,
    submitJlptSection,
    deleteJlptSection,
    submitAutoJlptQuestions,
  };
}
