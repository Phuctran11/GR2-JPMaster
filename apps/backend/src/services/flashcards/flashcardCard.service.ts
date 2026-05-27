import flashcardModel from "../../models/flashcards/flashcard.model.js";
import { ApiError } from "../../utils/http.js";
import { type BodyInput, requireString, toNumberOrNull } from "../../validators/common.validator.js";
import {
  requireOwnedCollection,
  requireOwnedFlashcardCollection,
  toStringArray,
} from "./flashcard.helpers.js";

class FlashcardCardService {
  async createFlashcard(userId: number, body: BodyInput) {
    const collectionId = Number(body.collection_id);
    const frontText = requireString(typeof body.front_text === "string" ? body.front_text : body.word);
    const backText = requireString(typeof body.back_text === "string" ? body.back_text : body.meaning);

    if (!collectionId || Number.isNaN(collectionId)) {
      throw new ApiError(400, "collection_id is required");
    }

    await requireOwnedCollection(userId, collectionId);

    if (!frontText || !backText) {
      throw new ApiError(400, "front_text and back_text are required");
    }

    return flashcardModel.createFlashcard({
      collectionId,
      lessonId: toNumberOrNull(body.lesson_id),
      frontText,
      backText,
      reading: requireString(body.reading) || null,
      exampleSentence: requireString(body.example_sentence) || null,
      imageUrl: requireString(body.image_url) || null,
      audioUrl: requireString(body.audio_url) || null,
      tags: toStringArray(body.tags),
      orderIndex: toNumberOrNull(body.order_index),
    });
  }

  async getFlashcard(userId: number, flashcardId: number) {
    const flashcard = await flashcardModel.getFlashcardById(flashcardId);
    if (!flashcard) {
      throw new ApiError(404, "Flashcard not found");
    }

    const canAccess = await flashcardModel.userCanAccessCollection(userId, flashcard.collection_id);
    if (!canAccess) {
      throw new ApiError(403, "Access denied");
    }

    return flashcard;
  }

  async getFlashcardsByCollection(userId: number, collectionId: number, pagination: { limit: number; offset: number }) {
    const canAccess = await flashcardModel.userCanAccessCollection(userId, collectionId);
    if (!canAccess) {
      throw new ApiError(403, "Access denied");
    }

    const [flashcards, totalCount] = await Promise.all([
      flashcardModel.getFlashcardsByCollection(collectionId, pagination.limit, pagination.offset),
      flashcardModel.countFlashcardsByCollection(collectionId),
    ]);

    return { flashcards, totalCount };
  }

  async getFlashcardsByLesson(userId: number, lessonId: number, pagination: { limit: number; offset: number }) {
    const [flashcards, totalCount] = await Promise.all([
      flashcardModel.getFlashcardsByLesson(userId, lessonId, pagination.limit, pagination.offset),
      flashcardModel.countFlashcardsByLesson(userId, lessonId),
    ]);

    return { flashcards, totalCount };
  }

  async updateFlashcard(userId: number, flashcardId: number, body: BodyInput) {
    await requireOwnedFlashcardCollection(userId, flashcardId);

    const frontText = typeof body.front_text === "string" ? requireString(body.front_text) : requireString(body.word);
    const backText = typeof body.back_text === "string" ? requireString(body.back_text) : requireString(body.meaning);

    return flashcardModel.updateFlashcard(flashcardId, {
      lessonId: body.lesson_id === undefined ? undefined : toNumberOrNull(body.lesson_id),
      frontText: frontText || undefined,
      backText: backText || undefined,
      reading: body.reading === undefined ? undefined : requireString(body.reading) || null,
      exampleSentence: body.example_sentence === undefined ? undefined : requireString(body.example_sentence) || null,
      imageUrl: body.image_url === undefined ? undefined : requireString(body.image_url) || null,
      audioUrl: body.audio_url === undefined ? undefined : requireString(body.audio_url) || null,
      tags: body.tags === undefined ? undefined : toStringArray(body.tags),
      orderIndex: body.order_index === undefined ? undefined : toNumberOrNull(body.order_index),
    });
  }

  async deleteFlashcard(userId: number, flashcardId: number) {
    await requireOwnedFlashcardCollection(userId, flashcardId);
    await flashcardModel.deleteFlashcard(flashcardId);
  }
}

export default new FlashcardCardService();
