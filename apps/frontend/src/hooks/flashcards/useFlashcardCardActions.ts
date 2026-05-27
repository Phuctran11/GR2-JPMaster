import { useState, type Dispatch, type SetStateAction } from 'react';
import { assetAPI, flashcardAPI, type Flashcard } from '../../services/api';
import {
  emptyFlashcardForm,
  getFlashcardFormFromCard,
  getFlashcardPayload,
  getFlashcardUpdatePayload,
  type FlashcardFormState,
} from './flashcardFormUtils';

interface ToastMessages {
  error: (message: string) => void;
  success: (message: string) => void;
}

interface UseFlashcardCardActionsParams {
  collectionId: number;
  cards: Flashcard[];
  setCards: Dispatch<SetStateAction<Flashcard[]>>;
  setCardTotalCount?: Dispatch<SetStateAction<number>>;
  setCurrentIndex: Dispatch<SetStateAction<number>>;
  setShowBack: Dispatch<SetStateAction<boolean>>;
  setSelectedCardIds: Dispatch<SetStateAction<number[]>>;
  toast: ToastMessages;
}

export function useFlashcardCardActions({
  collectionId,
  cards,
  setCards,
  setCardTotalCount,
  setCurrentIndex,
  setShowBack,
  setSelectedCardIds,
  toast,
}: UseFlashcardCardActionsParams) {
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState<'image' | 'audio' | null>(null);
  const [createForm, setCreateForm] = useState<FlashcardFormState>(emptyFlashcardForm);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [editForm, setEditForm] = useState<FlashcardFormState>(emptyFlashcardForm);

  const uploadCreateCardMedia = async (file: File, mediaKind: 'image' | 'audio') => {
    try {
      setUploadingMedia(mediaKind);
      const result = await assetAPI.upload({ file, media_kind: mediaKind, scope: 'flashcards' });
      setCreateForm((previous) =>
        mediaKind === 'image'
          ? { ...previous, imageUrl: result.data.secure_url }
          : { ...previous, audioUrl: result.data.secure_url }
      );
      toast.success(`${mediaKind === 'image' ? 'Image' : 'Audio'} uploaded.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to upload ${mediaKind}`);
    } finally {
      setUploadingMedia(null);
    }
  };

  const uploadEditCardMedia = async (file: File, mediaKind: 'image' | 'audio') => {
    try {
      setUploadingMedia(mediaKind);
      const result = await assetAPI.upload({ file, media_kind: mediaKind, scope: 'flashcards' });
      setEditForm((previous) =>
        mediaKind === 'image'
          ? { ...previous, imageUrl: result.data.secure_url }
          : { ...previous, audioUrl: result.data.secure_url }
      );
      toast.success(`${mediaKind === 'image' ? 'Image' : 'Audio'} uploaded.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to upload ${mediaKind}`);
    } finally {
      setUploadingMedia(null);
    }
  };

  const handleCreateCard = async () => {
    if (!collectionId || Number.isNaN(collectionId) || saving) return;
    if (!createForm.frontText.trim() || !createForm.backText.trim()) return;

    try {
      setSaving(true);
      const result = await flashcardAPI.createCard(getFlashcardPayload(createForm, collectionId));
      setCards((previous) => [result.data, ...previous]);
      setCardTotalCount?.((previous) => previous + 1);
      setCurrentIndex(0);
      setShowBack(false);
      setCreateForm(emptyFlashcardForm);
      toast.success('Flashcard created.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create flashcard');
    } finally {
      setSaving(false);
    }
  };

  const openEditCard = (card: Flashcard) => {
    setEditingCard(card);
    setEditForm(getFlashcardFormFromCard(card));
  };

  const closeEditCard = () => setEditingCard(null);

  const handleUpdateCard = async () => {
    if (!editingCard || saving) return;
    if (!editForm.frontText.trim() || !editForm.backText.trim()) {
      toast.error('Front and back text are required.');
      return;
    }

    try {
      setSaving(true);
      const result = await flashcardAPI.updateCard(editingCard.flashcard_id, getFlashcardUpdatePayload(editForm));
      setCards((previous) =>
        previous.map((card) => card.flashcard_id === result.data.flashcard_id ? result.data : card)
      );
      setEditingCard(null);
      toast.success('Flashcard updated.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update flashcard');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async (flashcardId: number) => {
    try {
      await flashcardAPI.deleteCard(flashcardId);
      setCards((previous) => previous.filter((card) => card.flashcard_id !== flashcardId));
      setCardTotalCount?.((previous) => Math.max(0, previous - 1));
      setSelectedCardIds((previous) => previous.filter((id) => id !== flashcardId));
      setCurrentIndex((index) => Math.max(0, Math.min(index, cards.length - 2)));
      setShowBack(false);
      toast.success('Flashcard deleted.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete flashcard');
    }
  };

  return {
    saving,
    uploadingMedia,
    createForm,
    setCreateForm,
    editingCard,
    editForm,
    setEditForm,
    openEditCard,
    closeEditCard,
    uploadCreateCardMedia,
    uploadEditCardMedia,
    handleCreateCard,
    handleUpdateCard,
    handleDeleteCard,
  };
}
