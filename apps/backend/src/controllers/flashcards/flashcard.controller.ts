import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import flashcardService from "../../services/flashcards/flashcard.service.js";
import { created, message, ok, paginated, requireUser } from "../../utils/http.js";
import { parsePagination, parsePositiveInt } from "../../validators/common.validator.js";

export class FlashcardController {
  async createCollection(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const collection = await flashcardService.createCollection(user.user_id, req.body);

    return created(res, "Flashcard collection created successfully", collection);
  }

  async getMyCollections(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const { limit, offset } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });
    const { collections, totalCount, totalCards } = await flashcardService.getMyCollections(user.user_id, { limit, offset });
    return paginated(res, collections, totalCount, { total_cards: totalCards });
  }

  async getPublicCollections(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const { limit, offset } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });
    const { collections, totalCount } = await flashcardService.getPublicCollections(user.user_id, { limit, offset });
    return paginated(res, collections, totalCount);
  }

  async getCollection(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const collectionId = parsePositiveInt(req.params.collectionId, "collection ID");
    const collection = await flashcardService.getCollection(user.user_id, collectionId);

    return ok(res, collection);
  }

  async updateCollection(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const collectionId = parsePositiveInt(req.params.collectionId, "collection ID");
    const collection = await flashcardService.updateCollection(user.user_id, collectionId, req.body);

    return ok(res, collection, { message: "Flashcard collection updated successfully" });
  }

  async deleteCollection(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const collectionId = parsePositiveInt(req.params.collectionId, "collection ID");
    await flashcardService.deleteCollection(user.user_id, collectionId);

    return message(res, "Flashcard collection deleted successfully");
  }

  async createFlashcard(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const flashcard = await flashcardService.createFlashcard(user.user_id, req.body);

    return created(res, "Flashcard created successfully", flashcard);
  }

  async getFlashcard(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const flashcardId = parsePositiveInt(req.params.id, "flashcard ID");
    const flashcard = await flashcardService.getFlashcard(user.user_id, flashcardId);

    return ok(res, flashcard);
  }

  async getFlashcardsByCollection(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const collectionId = parsePositiveInt(req.params.collectionId, "collection ID");
    const { limit, offset } = parsePagination(req.query, { defaultLimit: 50, maxLimit: 100 });

    const { flashcards, totalCount } = await flashcardService.getFlashcardsByCollection(user.user_id, collectionId, { limit, offset });
    return paginated(res, flashcards, totalCount);
  }

  async getFlashcardsByLesson(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const lessonId = parsePositiveInt(req.params.lessonId, "lesson ID");
    const { limit, offset } = parsePagination(req.query, { defaultLimit: 50, maxLimit: 100 });

    const { flashcards, totalCount } = await flashcardService.getFlashcardsByLesson(user.user_id, lessonId, { limit, offset });
    return paginated(res, flashcards, totalCount);
  }

  async updateFlashcard(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const flashcardId = parsePositiveInt(req.params.id, "flashcard ID");
    const flashcard = await flashcardService.updateFlashcard(user.user_id, flashcardId, req.body);

    return ok(res, flashcard, { message: "Flashcard updated successfully" });
  }

  async deleteFlashcard(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const flashcardId = parsePositiveInt(req.params.id, "flashcard ID");
    await flashcardService.deleteFlashcard(user.user_id, flashcardId);
    return message(res, "Flashcard deleted successfully");
  }
}

export default new FlashcardController();
