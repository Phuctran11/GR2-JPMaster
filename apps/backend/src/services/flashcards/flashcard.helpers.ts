import flashcardModel, { type FlashcardVisibility } from "../../models/flashcards/flashcard.model.js";
import { ApiError } from "../../utils/http.js";
import { type BodyInput, requireString } from "../../validators/common.validator.js";

export const toStringArray = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  return value.map((item) => String(item).trim()).filter(Boolean);
};

const isVisibility = (value: unknown): value is FlashcardVisibility =>
  value === "private" || value === "public";

export async function requireOwnedCollection(userId: number, collectionId: number) {
  const collection = await flashcardModel.getCollectionById(collectionId);
  if (!collection || collection.user_id !== userId) {
    throw new ApiError(404, "Flashcard collection not found");
  }
  return collection;
}

export async function requireAccessibleCollection(userId: number, collectionId: number) {
  const collection = await flashcardModel.getCollectionById(collectionId);
  if (!collection) {
    throw new ApiError(404, "Flashcard collection not found");
  }

  if (collection.user_id !== userId && collection.visibility !== "public") {
    throw new ApiError(403, "Access denied");
  }

  return collection;
}

export async function requireOwnedFlashcardCollection(userId: number, flashcardId: number) {
  const existingFlashcard = await flashcardModel.getFlashcardById(flashcardId);
  if (!existingFlashcard) {
    throw new ApiError(404, "Flashcard not found");
  }

  const collection = await flashcardModel.getCollectionById(existingFlashcard.collection_id);
  if (!collection || collection.user_id !== userId) {
    throw new ApiError(403, "Access denied");
  }

  return { flashcard: existingFlashcard, collection };
}

export function parseCollectionPayload(body: BodyInput) {
  const title = requireString(body.title);
  const description = requireString(body.description);
  const visibility = body.visibility ?? "private";
  if (!title) {
    throw new ApiError(400, "title is required");
  }

  if (!isVisibility(visibility)) {
    throw new ApiError(400, "visibility must be private or public");
  }

  return {
    title,
    description: description || null,
    visibility,
  };
}
