export const flashcardCollectionWithCountSelect = `
  fc.collection_id,
  fc.user_id,
  u.username AS owner_username,
  fc.title,
  fc.description,
  fc.visibility,
  COUNT(f.flashcard_id)::int AS card_count,
  fc.created_at,
  fc.updated_at
`;

export const clampFlashcardCollectionLimit = (limit: number) => Math.min(limit, 100);
