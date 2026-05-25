import type { CreateFlashcardPayload, Flashcard } from '../../services/api';

export interface FlashcardFormState {
  frontText: string;
  backText: string;
  reading: string;
  exampleSentence: string;
  imageUrl: string;
  audioUrl: string;
  tags: string;
}

export const emptyFlashcardForm: FlashcardFormState = {
  frontText: '',
  backText: '',
  reading: '',
  exampleSentence: '',
  imageUrl: '',
  audioUrl: '',
  tags: '',
};

export const getFlashcardFormFromCard = (card: Flashcard): FlashcardFormState => ({
  frontText: card.front_text,
  backText: card.back_text,
  reading: card.reading ?? '',
  exampleSentence: card.example_sentence ?? '',
  imageUrl: card.image_url ?? '',
  audioUrl: card.audio_url ?? '',
  tags: card.tags?.join(', ') ?? '',
});

export const getFlashcardPayload = (
  form: FlashcardFormState,
  collectionId: number
): CreateFlashcardPayload => ({
  collection_id: collectionId,
  front_text: form.frontText.trim(),
  back_text: form.backText.trim(),
  reading: form.reading.trim() || null,
  example_sentence: form.exampleSentence.trim() || null,
  image_url: form.imageUrl.trim() || null,
  audio_url: form.audioUrl.trim() || null,
  tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
});

export const getFlashcardUpdatePayload = (form: FlashcardFormState): Partial<CreateFlashcardPayload> => ({
  front_text: form.frontText.trim(),
  back_text: form.backText.trim(),
  reading: form.reading.trim() || null,
  example_sentence: form.exampleSentence.trim() || null,
  image_url: form.imageUrl.trim() || null,
  audio_url: form.audioUrl.trim() || null,
  tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
});

export const getSelectedCardContext = (cards: Flashcard[]) =>
  cards.map((card) =>
    [card.front_text, card.back_text, card.reading ? `reading: ${card.reading}` : null]
      .filter(Boolean)
      .join(' - ')
  );
