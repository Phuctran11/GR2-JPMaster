import flashcardModel from "../../models/flashcards/flashcard.model.js";
import { ApiError } from "../../utils/http.js";
import type { BodyInput } from "../../validators/common.validator.js";
import { parseCollectionPayload, requireAccessibleCollection } from "./flashcard.helpers.js";

class FlashcardCollectionService {
  async createCollection(userId: number, body: BodyInput) {
    const payload = parseCollectionPayload(body);
    return flashcardModel.createCollection(userId, payload.title, payload.description, payload.visibility);
  }

  async getMyCollections(userId: number, pagination: { limit: number; offset: number }) {
    const [collections, totalCount, totalCards] = await Promise.all([
      flashcardModel.getCollectionsByUser(userId, pagination.limit, pagination.offset),
      flashcardModel.countCollectionsByUser(userId),
      flashcardModel.countCardsByUser(userId),
    ]);

    return { collections, totalCount, totalCards };
  }

  async getPublicCollections(userId: number, pagination: { limit: number; offset: number }) {
    const [collections, totalCount] = await Promise.all([
      flashcardModel.getPublicCollections(userId, pagination.limit, pagination.offset),
      flashcardModel.countPublicCollections(userId),
    ]);

    return { collections, totalCount };
  }

  async getCollection(userId: number, collectionId: number) {
    return requireAccessibleCollection(userId, collectionId);
  }

  async updateCollection(userId: number, collectionId: number, body: BodyInput) {
    const payload = parseCollectionPayload(body);
    const collection = await flashcardModel.updateCollection(
      collectionId,
      userId,
      payload.title,
      payload.description,
      payload.visibility
    );

    if (!collection) {
      throw new ApiError(404, "Flashcard collection not found");
    }

    return collection;
  }

  async deleteCollection(userId: number, collectionId: number) {
    const deleted = await flashcardModel.deleteCollection(collectionId, userId);
    if (!deleted) {
      throw new ApiError(404, "Flashcard collection not found");
    }
  }
}

export default new FlashcardCollectionService();
