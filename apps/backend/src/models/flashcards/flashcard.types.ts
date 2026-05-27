export type FlashcardVisibility = "private" | "public";

export interface FlashcardCollection {
  collection_id: number;
  user_id: number;
  owner_username?: string;
  title: string;
  description: string | null;
  visibility: FlashcardVisibility;
  card_count?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Flashcard {
  flashcard_id: number;
  collection_id: number;
  lesson_id: number | null;
  front_text: string;
  back_text: string;
  reading: string | null;
  example_sentence: string | null;
  image_url: string | null;
  audio_url: string | null;
  tags: string[] | null;
  order_index: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateFlashcardInput {
  collectionId: number;
  lessonId?: number | null;
  frontText: string;
  backText: string;
  reading?: string | null;
  exampleSentence?: string | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
  tags?: string[] | null;
  orderIndex?: number | null;
}

export interface UpdateFlashcardInput extends Partial<Omit<CreateFlashcardInput, "collectionId">> {}

export const formatCollection = (row: any): FlashcardCollection => ({
  collection_id: Number(row.collection_id),
  user_id: Number(row.user_id),
  owner_username: row.owner_username,
  title: row.title,
  description: row.description,
  visibility: row.visibility,
  card_count: row.card_count != null ? Number(row.card_count) : undefined,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export const formatFlashcard = (row: any): Flashcard => ({
  flashcard_id: Number(row.flashcard_id),
  collection_id: Number(row.collection_id),
  lesson_id: row.lesson_id != null ? Number(row.lesson_id) : null,
  front_text: row.front_text,
  back_text: row.back_text,
  reading: row.reading,
  example_sentence: row.example_sentence,
  image_url: row.image_url,
  audio_url: row.audio_url,
  tags: row.tags,
  order_index: row.order_index != null ? Number(row.order_index) : null,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export const flashcardSelect = `
  flashcard_id, collection_id, lesson_id, front_text, back_text, reading,
  example_sentence, image_url, audio_url, tags, order_index, created_at, updated_at
`;

