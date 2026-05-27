import { useState, type Dispatch, type SetStateAction } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { flashcardAPI, type FlashcardCollection } from '../../services/api';
import { getCollectionPayload, type CollectionFormState } from './collectionFormUtils';

interface ToastMessages {
  error: (message: string) => void;
  success: (message: string) => void;
}

export function useFlashcardCollectionActions({
  navigate,
  toast,
  form,
  dialogMode,
  editingCollection,
  setCollections,
  loadCollections,
  refreshPublicCollections,
  closeDialog,
}: {
  navigate: NavigateFunction;
  toast: ToastMessages;
  form: CollectionFormState;
  dialogMode: 'create' | 'edit' | null;
  editingCollection: FlashcardCollection | null;
  setCollections: Dispatch<SetStateAction<FlashcardCollection[]>>;
  loadCollections: () => Promise<void>;
  refreshPublicCollections: () => Promise<void>;
  closeDialog: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const handleSaveCollection = async () => {
    if (!form.title.trim() || saving) return;

    try {
      setSaving(true);
      if (dialogMode === 'create') {
        const result = await flashcardAPI.createCollection(getCollectionPayload(form));
        await loadCollections();
        closeDialog();
        toast.success('Flashcard collection created.');
        navigate(`/flashcards/${result.data.collection_id}`);
        return;
      }

      if (editingCollection) {
        const result = await flashcardAPI.updateCollection(
          editingCollection.collection_id,
          getCollectionPayload(form)
        );
        setCollections((previous) =>
          previous.map((collection) =>
            collection.collection_id === result.data.collection_id
              ? { ...collection, ...result.data, card_count: collection.card_count }
              : collection
          )
        );
        await refreshPublicCollections();
        closeDialog();
        toast.success('Flashcard collection updated.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save collection');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCollection = async () => {
    if (!editingCollection || saving) return;

    try {
      setSaving(true);
      await flashcardAPI.deleteCollection(editingCollection.collection_id);
      await loadCollections();
      await refreshPublicCollections();
      closeDialog();
      toast.success('Flashcard collection deleted.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete collection');
    } finally {
      setSaving(false);
    }
  };

  return {
    saving,
    handleSaveCollection,
    handleDeleteCollection,
  };
}
