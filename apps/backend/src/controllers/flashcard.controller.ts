import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import flashcardModel, { FlashcardVisibility } from "../models/flashcard.model.js";

const toOptionalNumber = (value: unknown): number | null => {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const toStringArray = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  return value.map((item) => String(item).trim()).filter(Boolean);
};

const isVisibility = (value: unknown): value is FlashcardVisibility =>
  value === "private" || value === "public";

export class FlashcardController {
  async createCollection(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });

      const { title, description, visibility = "private" } = req.body;
      if (!title?.trim()) {
        return res.status(400).json({ error: "title is required" });
      }

      if (!isVisibility(visibility)) {
        return res.status(400).json({ error: "visibility must be private or public" });
      }

      const collection = await flashcardModel.createCollection(
        req.user.user_id,
        title.trim(),
        description?.trim() || null,
        visibility
      );

      return res.status(201).json({ message: "Flashcard collection created successfully", data: collection });
    } catch (error) {
      next(error);
    }
  }

  async getMyCollections(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });

      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const offset = Number(req.query.offset) || 0;
      const collections = await flashcardModel.getCollectionsByUser(req.user.user_id, limit, offset);
      return res.status(200).json({ data: collections, count: collections.length });
    } catch (error) {
      next(error);
    }
  }

  async getPublicCollections(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });

      const limit = Math.min(Number(req.query.limit) || 20, 100);
      const offset = Number(req.query.offset) || 0;
      const collections = await flashcardModel.getPublicCollections(req.user.user_id, limit, offset);
      return res.status(200).json({ data: collections, count: collections.length });
    } catch (error) {
      next(error);
    }
  }

  async getCollection(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });

      const collectionId = Number(req.params.collectionId);
      if (!collectionId || Number.isNaN(collectionId)) {
        return res.status(400).json({ error: "Invalid collection ID" });
      }

      const collection = await flashcardModel.getCollectionById(collectionId);
      if (!collection) {
        return res.status(404).json({ error: "Flashcard collection not found" });
      }

      if (collection.user_id !== req.user.user_id && collection.visibility !== "public") {
        return res.status(403).json({ error: "Access denied" });
      }

      return res.status(200).json({ data: collection });
    } catch (error) {
      next(error);
    }
  }

  async updateCollection(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });

      const collectionId = Number(req.params.collectionId);
      const { title, description, visibility = "private" } = req.body;
      if (!collectionId || Number.isNaN(collectionId)) {
        return res.status(400).json({ error: "Invalid collection ID" });
      }

      if (!title?.trim()) {
        return res.status(400).json({ error: "title is required" });
      }

      if (!isVisibility(visibility)) {
        return res.status(400).json({ error: "visibility must be private or public" });
      }

      const collection = await flashcardModel.updateCollection(
        collectionId,
        req.user.user_id,
        title.trim(),
        description?.trim() || null,
        visibility
      );

      if (!collection) {
        return res.status(404).json({ error: "Flashcard collection not found" });
      }

      return res.status(200).json({ message: "Flashcard collection updated successfully", data: collection });
    } catch (error) {
      next(error);
    }
  }

  async deleteCollection(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });

      const collectionId = Number(req.params.collectionId);
      if (!collectionId || Number.isNaN(collectionId)) {
        return res.status(400).json({ error: "Invalid collection ID" });
      }

      const deleted = await flashcardModel.deleteCollection(collectionId, req.user.user_id);
      if (!deleted) {
        return res.status(404).json({ error: "Flashcard collection not found" });
      }

      return res.status(200).json({ message: "Flashcard collection deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  async createFlashcard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });

      const {
        collection_id,
        lesson_id,
        front_text,
        back_text,
        word,
        meaning,
        reading,
        example_sentence,
        image_url,
        audio_url,
        tags,
        order_index,
      } = req.body;

      const collectionId = Number(collection_id);
      const frontText = typeof front_text === "string" ? front_text : word;
      const backText = typeof back_text === "string" ? back_text : meaning;

      if (!collectionId || Number.isNaN(collectionId)) {
        return res.status(400).json({ error: "collection_id is required" });
      }

      const collection = await flashcardModel.getCollectionById(collectionId);
      if (!collection || collection.user_id !== req.user.user_id) {
        return res.status(404).json({ error: "Flashcard collection not found" });
      }

      if (!frontText?.trim() || !backText?.trim()) {
        return res.status(400).json({ error: "front_text and back_text are required" });
      }

      const flashcard = await flashcardModel.createFlashcard({
        collectionId,
        lessonId: toOptionalNumber(lesson_id),
        frontText: frontText.trim(),
        backText: backText.trim(),
        reading: reading?.trim() || null,
        exampleSentence: example_sentence?.trim() || null,
        imageUrl: image_url?.trim() || null,
        audioUrl: audio_url?.trim() || null,
        tags: toStringArray(tags),
        orderIndex: toOptionalNumber(order_index),
      });

      return res.status(201).json({ message: "Flashcard created successfully", data: flashcard });
    } catch (error) {
      next(error);
    }
  }

  async getFlashcard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });

      const flashcardId = Number(req.params.id);
      if (!flashcardId || Number.isNaN(flashcardId)) {
        return res.status(400).json({ error: "Invalid flashcard ID" });
      }

      const flashcard = await flashcardModel.getFlashcardById(flashcardId);
      if (!flashcard) {
        return res.status(404).json({ error: "Flashcard not found" });
      }

      const canAccess = await flashcardModel.userCanAccessCollection(req.user.user_id, flashcard.collection_id);
      if (!canAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      return res.status(200).json({ data: flashcard });
    } catch (error) {
      next(error);
    }
  }

  async getFlashcardsByCollection(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });

      const collectionId = Number(req.params.collectionId);
      const limit = Math.min(Number(req.query.limit) || 50, 100);
      const offset = Number(req.query.offset) || 0;
      if (!collectionId || Number.isNaN(collectionId)) {
        return res.status(400).json({ error: "Invalid collection ID" });
      }

      const canAccess = await flashcardModel.userCanAccessCollection(req.user.user_id, collectionId);
      if (!canAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const flashcards = await flashcardModel.getFlashcardsByCollection(collectionId, limit, offset);
      return res.status(200).json({ data: flashcards, count: flashcards.length });
    } catch (error) {
      next(error);
    }
  }

  async getFlashcardsByLesson(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });

      const lessonId = Number(req.params.lessonId);
      const limit = Math.min(Number(req.query.limit) || 50, 100);
      const offset = Number(req.query.offset) || 0;
      if (!lessonId || Number.isNaN(lessonId)) {
        return res.status(400).json({ error: "Invalid lesson ID" });
      }

      const flashcards = await flashcardModel.getFlashcardsByLesson(req.user.user_id, lessonId, limit, offset);
      return res.status(200).json({ data: flashcards, count: flashcards.length });
    } catch (error) {
      next(error);
    }
  }

  async updateFlashcard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });

      const flashcardId = Number(req.params.id);
      if (!flashcardId || Number.isNaN(flashcardId)) {
        return res.status(400).json({ error: "Invalid flashcard ID" });
      }

      const existingFlashcard = await flashcardModel.getFlashcardById(flashcardId);
      if (!existingFlashcard) {
        return res.status(404).json({ error: "Flashcard not found" });
      }

      const collection = await flashcardModel.getCollectionById(existingFlashcard.collection_id);
      if (!collection || collection.user_id !== req.user.user_id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const frontText = typeof req.body.front_text === "string" ? req.body.front_text : req.body.word;
      const backText = typeof req.body.back_text === "string" ? req.body.back_text : req.body.meaning;

      const flashcard = await flashcardModel.updateFlashcard(flashcardId, {
        lessonId: req.body.lesson_id === undefined ? undefined : toOptionalNumber(req.body.lesson_id),
        frontText: frontText?.trim(),
        backText: backText?.trim(),
        reading: req.body.reading === undefined ? undefined : req.body.reading?.trim() || null,
        exampleSentence: req.body.example_sentence === undefined ? undefined : req.body.example_sentence?.trim() || null,
        imageUrl: req.body.image_url === undefined ? undefined : req.body.image_url?.trim() || null,
        audioUrl: req.body.audio_url === undefined ? undefined : req.body.audio_url?.trim() || null,
        tags: req.body.tags === undefined ? undefined : toStringArray(req.body.tags),
        orderIndex: req.body.order_index === undefined ? undefined : toOptionalNumber(req.body.order_index),
      });

      return res.status(200).json({ message: "Flashcard updated successfully", data: flashcard });
    } catch (error) {
      next(error);
    }
  }

  async deleteFlashcard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json({ error: "User not authenticated" });

      const flashcardId = Number(req.params.id);
      if (!flashcardId || Number.isNaN(flashcardId)) {
        return res.status(400).json({ error: "Invalid flashcard ID" });
      }

      const existingFlashcard = await flashcardModel.getFlashcardById(flashcardId);
      if (!existingFlashcard) {
        return res.status(404).json({ error: "Flashcard not found" });
      }

      const collection = await flashcardModel.getCollectionById(existingFlashcard.collection_id);
      if (!collection || collection.user_id !== req.user.user_id) {
        return res.status(403).json({ error: "Access denied" });
      }

      await flashcardModel.deleteFlashcard(flashcardId);
      return res.status(200).json({ message: "Flashcard deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}

export default new FlashcardController();
