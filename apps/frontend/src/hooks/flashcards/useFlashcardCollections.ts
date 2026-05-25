import type { NavigateFunction } from 'react-router-dom';
import { useFlashcardCollectionActions } from './useFlashcardCollectionActions';
import { useFlashcardCollectionDialog } from './useFlashcardCollectionDialog';
import { useFlashcardCollectionsData } from './useFlashcardCollectionsData';

interface ToastMessages {
  error: (message: string) => void;
  success: (message: string) => void;
}

export function useFlashcardCollections({
  navigate,
  toast,
}: {
  navigate: NavigateFunction;
  toast: ToastMessages;
}) {
  const {
    collections,
    setCollections,
    publicCollections,
    collectionsPage,
    setCollectionsPage,
    publicCollectionsPage,
    setPublicCollectionsPage,
    collectionPageSize,
    publicCollectionPageSize,
    collectionTotalCount,
    publicCollectionTotalCount,
    loading,
    totalCards,
    loadCollections,
    refreshPublicCollections,
  } = useFlashcardCollectionsData({ toast });
  const {
    editingCollection,
    dialogMode,
    form,
    setForm,
    openCreateDialog,
    openEditDialog,
    closeDialog,
  } = useFlashcardCollectionDialog();
  const {
    saving,
    handleSaveCollection,
    handleDeleteCollection,
  } = useFlashcardCollectionActions({
    navigate,
    toast,
    form,
    dialogMode,
    editingCollection,
    setCollections,
    loadCollections,
    refreshPublicCollections,
    closeDialog,
  });

  return {
    collections,
    publicCollections,
    collectionsPage,
    setCollectionsPage,
    publicCollectionsPage,
    setPublicCollectionsPage,
    collectionPageSize,
    publicCollectionPageSize,
    collectionTotalCount,
    publicCollectionTotalCount,
    loading,
    saving,
    dialogMode,
    form,
    setForm,
    totalCards,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    handleSaveCollection,
    handleDeleteCollection,
  };
}
