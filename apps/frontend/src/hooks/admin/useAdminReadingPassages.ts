import { adminAPI, type AdminJlptExam, type AdminReadingPassage } from '../../services/api';
import { emptyReadingPassage } from '../../components/admin/adminFormDefaults';
import type { AdminReadingPassageFormValues } from '../../components/admin/adminFormTypes';
import type { ModalName } from '../../components/admin/adminTypes';

type RunAdminTask = (task: () => Promise<void>, success?: string) => Promise<void>;

export function useAdminReadingPassages({
  selectedJlptExam,
  setReadingPassageForm,
  editingReadingPassageId,
  setEditingReadingPassageId,
  setActiveModal,
  run,
  loadReadingPassages,
}: {
  selectedJlptExam: AdminJlptExam | null;
  setReadingPassageForm: (values: AdminReadingPassageFormValues) => void;
  editingReadingPassageId: number | null;
  setEditingReadingPassageId: (value: number | null) => void;
  setActiveModal: (value: ModalName) => void;
  run: RunAdminTask;
  loadReadingPassages: (level?: AdminJlptExam['jlpt_level']) => Promise<void>;
}) {
  const openCreateReadingPassage = () => {
    setEditingReadingPassageId(null);
    setReadingPassageForm({
      ...emptyReadingPassage,
      jlpt_level: selectedJlptExam?.jlpt_level ?? emptyReadingPassage.jlpt_level,
    });
    setActiveModal('readingPassage');
  };

  const openEditReadingPassage = (passage: AdminReadingPassage) => {
    setEditingReadingPassageId(passage.passage_id);
    setReadingPassageForm({
      title: passage.title || '',
      jlpt_level: passage.jlpt_level,
      passage_text: passage.passage_text || '',
      image_asset_id: passage.image_asset_id ?? null,
      image_url: passage.image_url || '',
    });
    setActiveModal('readingPassage');
  };

  const submitReadingPassage = (values: AdminReadingPassageFormValues) => {
    void run(async () => {
      const payload = {
        title: values.title || null,
        jlpt_level: values.jlpt_level,
        passage_text: values.passage_text || null,
        image_asset_id: values.image_asset_id,
        image_url: values.image_url || null,
      };

      if (editingReadingPassageId) await adminAPI.updateReadingPassage(editingReadingPassageId, payload);
      else await adminAPI.createReadingPassage(payload);

      await loadReadingPassages(selectedJlptExam?.jlpt_level);
      setActiveModal('jlptSections');
    }, editingReadingPassageId ? 'Reading passage updated successfully' : 'Reading passage created successfully');
  };

  return {
    openCreateReadingPassage,
    openEditReadingPassage,
    submitReadingPassage,
  };
}
