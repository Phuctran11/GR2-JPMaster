import { useCallback, useState } from 'react';
import {
  assetAPI,
  flashcardAPI,
  type FlashcardCollection,
  type Lesson as LessonData,
} from '../../services/api';

export type LessonFlashcardDraft = {
  selectedText: string;
  frontText: string;
  backText: string;
  reading: string;
  exampleSentence: string;
  imageUrl: string;
  audioUrl: string;
  tags: string;
  collectionId: string;
  isCreatingCollection: boolean;
  newCollectionTitle: string;
  newCollectionDescription: string;
  newCollectionVisibility: 'private' | 'public';
};

type LessonToast = {
  success: (message: string) => void;
  error: (message: string) => void;
};

export function useLessonFlashcards({
  currentLesson,
  toast,
}: {
  currentLesson?: LessonData;
  toast: LessonToast;
}) {
  const [flashcardCollections, setFlashcardCollections] = useState<FlashcardCollection[]>([]);
  const [flashcardCollectionLoading, setFlashcardCollectionLoading] = useState(false);
  const [flashcardSaving, setFlashcardSaving] = useState(false);
  const [flashcardUploadingMedia, setFlashcardUploadingMedia] = useState<'image' | 'audio' | null>(null);
  const [flashcardDraft, setFlashcardDraft] = useState<LessonFlashcardDraft | null>(null);

  const updateFlashcardDraft = useCallback((changes: Partial<LessonFlashcardDraft>) => {
    setFlashcardDraft((previous) => previous ? { ...previous, ...changes } : previous);
  }, []);

  const loadFlashcardCollections = useCallback(async () => {
    setFlashcardCollectionLoading(true);
    try {
      const result = await flashcardAPI.getCollections(100, 0);
      setFlashcardCollections(result.data);
      return result.data;
    } finally {
      setFlashcardCollectionLoading(false);
    }
  }, []);

  const handleSaveSelectionFlashcard = useCallback(
    async (selectedText: string) => {
      if (!currentLesson) return;

      const trimmedText = selectedText.trim();
      if (!trimmedText) return;

      setFlashcardDraft({
        selectedText: trimmedText,
        frontText: trimmedText,
        backText: `From lesson: ${currentLesson.title}`,
        reading: '',
        exampleSentence: trimmedText,
        imageUrl: '',
        audioUrl: '',
        tags: 'lesson-selection',
        collectionId: '',
        isCreatingCollection: false,
        newCollectionTitle: '',
        newCollectionDescription: '',
        newCollectionVisibility: 'private',
      });

      try {
        const collections = await loadFlashcardCollections();
        if (collections.length > 0) {
          updateFlashcardDraft({ collectionId: String(collections[0].collection_id) });
        } else {
          updateFlashcardDraft({
            isCreatingCollection: true,
            newCollectionTitle: 'Lesson Highlights',
            newCollectionVisibility: 'private',
          });
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load flashcard collections');
      }
    },
    [currentLesson, loadFlashcardCollections, toast, updateFlashcardDraft]
  );

  const closeFlashcardDraft = useCallback(() => {
    if (flashcardSaving) return;
    setFlashcardDraft(null);
  }, [flashcardSaving]);

  const submitFlashcardDraft = useCallback(async () => {
    if (!currentLesson || !flashcardDraft || flashcardSaving) return;

    const frontText = flashcardDraft.frontText.trim();
    const backText = flashcardDraft.backText.trim();
    const newCollectionTitle = flashcardDraft.newCollectionTitle.trim();
    const selectedCollectionId = Number(flashcardDraft.collectionId);

    if (!frontText || !backText) {
      toast.error('Front and back text are required.');
      return;
    }

    if (!flashcardDraft.isCreatingCollection && (!Number.isFinite(selectedCollectionId) || selectedCollectionId <= 0)) {
      toast.error('Please choose a flashcard collection.');
      return;
    }

    if (flashcardDraft.isCreatingCollection && !newCollectionTitle) {
      toast.error('Collection title is required.');
      return;
    }

    try {
      setFlashcardSaving(true);
      const collection = flashcardDraft.isCreatingCollection
        ? (await flashcardAPI.createCollection({
            title: newCollectionTitle,
            description: flashcardDraft.newCollectionDescription.trim() || null,
            visibility: flashcardDraft.newCollectionVisibility,
          })).data
        : flashcardCollections.find((item) => item.collection_id === selectedCollectionId);

      if (!collection) throw new Error('Selected collection was not found');

      await flashcardAPI.createCard({
        collection_id: collection.collection_id,
        lesson_id: currentLesson.lesson_id,
        front_text: frontText,
        back_text: backText,
        reading: flashcardDraft.reading.trim() || null,
        example_sentence: flashcardDraft.exampleSentence.trim() || null,
        image_url: flashcardDraft.imageUrl.trim() || null,
        audio_url: flashcardDraft.audioUrl.trim() || null,
        tags: flashcardDraft.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      });

      setFlashcardCollections((previous) => {
        const exists = previous.some((item) => item.collection_id === collection.collection_id);
        const nextCollection = {
          ...collection,
          card_count: (collection.card_count ?? 0) + 1,
        };
        return exists
          ? previous.map((item) => item.collection_id === collection.collection_id ? { ...item, card_count: (item.card_count ?? 0) + 1 } : item)
          : [nextCollection, ...previous];
      });
      setFlashcardDraft(null);
      toast.success('Flashcard saved.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save flashcard');
    } finally {
      setFlashcardSaving(false);
    }
  }, [currentLesson, flashcardCollections, flashcardDraft, flashcardSaving, toast]);

  const uploadFlashcardMedia = useCallback(
    async (file: File, mediaKind: 'image' | 'audio') => {
      if (!flashcardDraft) return;

      try {
        setFlashcardUploadingMedia(mediaKind);
        const result = await assetAPI.upload({
          file,
          media_kind: mediaKind,
          scope: 'flashcards',
        });
        updateFlashcardDraft(
          mediaKind === 'image'
            ? { imageUrl: result.data.secure_url }
            : { audioUrl: result.data.secure_url }
        );
        toast.success(`${mediaKind === 'image' ? 'Image' : 'Audio'} uploaded.`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : `Failed to upload ${mediaKind}`);
      } finally {
        setFlashcardUploadingMedia(null);
      }
    },
    [flashcardDraft, toast, updateFlashcardDraft]
  );

  return {
    flashcardCollections,
    flashcardCollectionLoading,
    flashcardSaving,
    flashcardUploadingMedia,
    flashcardDraft,
    updateFlashcardDraft,
    handleSaveSelectionFlashcard,
    closeFlashcardDraft,
    submitFlashcardDraft,
    uploadFlashcardMedia,
  };
}
