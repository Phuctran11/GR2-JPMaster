import databaseService from "../../services/database.service.js";
import { flashcardSelect, formatFlashcard, type Flashcard } from "./flashcard.types.js";

class FlashcardCardReadModel {
  async getFlashcardById(flashcardId: number): Promise<Flashcard | null> {
    const result = await databaseService.executeQuery(
      `
        SELECT ${flashcardSelect}
        FROM "Flashcard"
        WHERE flashcard_id = $1;
      `,
      [flashcardId]
    );
    return result.rows[0] ? formatFlashcard(result.rows[0]) : null;
  }

  async getFlashcardsByCollection(collectionId: number, limit = 50, offset = 0): Promise<Flashcard[]> {
    const result = await databaseService.executeQuery(
      `
        SELECT ${flashcardSelect}
        FROM "Flashcard"
        WHERE collection_id = $1
        ORDER BY order_index ASC NULLS LAST, created_at DESC
        LIMIT $2 OFFSET $3;
      `,
      [collectionId, Math.min(limit, 100), offset]
    );
    return result.rows.map(formatFlashcard);
  }

  async countFlashcardsByCollection(collectionId: number): Promise<number> {
    const result = await databaseService.executeQuery(
      `SELECT COUNT(*)::int AS total FROM "Flashcard" WHERE collection_id = $1;`,
      [collectionId]
    );
    return Number(result.rows[0]?.total ?? 0);
  }

  async getFlashcardsByLesson(userId: number, lessonId: number, limit = 50, offset = 0): Promise<Flashcard[]> {
    const result = await databaseService.executeQuery(
      `
        SELECT ${flashcardSelect}
        FROM "Flashcard" f
        JOIN "FlashcardCollection" fc ON fc.collection_id = f.collection_id
        WHERE f.lesson_id = $1
          AND (fc.user_id = $2 OR fc.visibility = 'public')
        ORDER BY f.order_index ASC NULLS LAST, f.created_at DESC
        LIMIT $3 OFFSET $4;
      `,
      [lessonId, userId, Math.min(limit, 100), offset]
    );
    return result.rows.map(formatFlashcard);
  }

  async countFlashcardsByLesson(userId: number, lessonId: number): Promise<number> {
    const result = await databaseService.executeQuery(
      `
        SELECT COUNT(f.flashcard_id)::int AS total
        FROM "Flashcard" f
        JOIN "FlashcardCollection" fc ON fc.collection_id = f.collection_id
        WHERE f.lesson_id = $1
          AND (fc.user_id = $2 OR fc.visibility = 'public');
      `,
      [lessonId, userId]
    );
    return Number(result.rows[0]?.total ?? 0);
  }
}

export default new FlashcardCardReadModel();
