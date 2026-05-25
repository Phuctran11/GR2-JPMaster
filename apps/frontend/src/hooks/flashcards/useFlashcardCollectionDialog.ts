import { useState } from 'react';
import type { FlashcardCollection } from '../../services/api';
import {
  emptyCollectionForm,
  getCollectionFormFromCollection,
  type CollectionFormState,
} from './collectionFormUtils';

export function useFlashcardCollectionDialog() {
  const [editingCollection, setEditingCollection] = useState<FlashcardCollection | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
  const [form, setForm] = useState<CollectionFormState>(emptyCollectionForm);

  const openCreateDialog = () => {
    setEditingCollection(null);
    setForm(emptyCollectionForm);
    setDialogMode('create');
  };

  const openEditDialog = (collection: FlashcardCollection) => {
    setEditingCollection(collection);
    setForm(getCollectionFormFromCollection(collection));
    setDialogMode('edit');
  };

  const closeDialog = () => {
    setDialogMode(null);
    setEditingCollection(null);
    setForm(emptyCollectionForm);
  };

  return {
    editingCollection,
    dialogMode,
    form,
    setForm,
    openCreateDialog,
    openEditDialog,
    closeDialog,
  };
}
