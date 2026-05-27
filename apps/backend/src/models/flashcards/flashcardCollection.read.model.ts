import databaseService from "../../services/database.service.js";
import { formatCollection, type FlashcardCollection } from "./flashcard.types.js";
import { clampFlashcardCollectionLimit, flashcardCollectionWithCountSelect } from "./flashcardCollection.helpers.js";

export class FlashcardCollectionReadModel {
  async getCollectionsByUser(userId: number, limit = 20, offset = 0): Promise<FlashcardCollection[]> {
    const result = await databaseService.executeQuery(
      `
        SELECT ${flashcardCollectionWithCountSelect}
        FROM "FlashcardCollection" fc
        JOIN "User" u ON u.user_id = fc.user_id
        LEFT JOIN "Flashcard" f ON f.collection_id = fc.collection_id
        WHERE fc.user_id = $1
        GROUP BY fc.collection_id, u.username
        ORDER BY fc.updated_at DESC, fc.created_at DESC
        LIMIT $2 OFFSET $3;
      `,
      [userId, clampFlashcardCollectionLimit(limit), offset]
    );
    return result.rows.map(formatCollection);
  }

  async countCollectionsByUser(userId: number): Promise<number> {
    const result = await databaseService.executeQuery(
      `SELECT COUNT(*)::int AS total FROM "FlashcardCollection" WHERE user_id = $1;`,
      [userId]
    );
    return Number(result.rows[0]?.total ?? 0);
  }

  async countCardsByUser(userId: number): Promise<number> {
    const result = await databaseService.executeQuery(
      `
        SELECT COUNT(f.flashcard_id)::int AS total
        FROM "Flashcard" f
        JOIN "FlashcardCollection" fc ON fc.collection_id = f.collection_id
        WHERE fc.user_id = $1;
      `,
      [userId]
    );
    return Number(result.rows[0]?.total ?? 0);
  }

  async getPublicCollections(userId: number, limit = 20, offset = 0): Promise<FlashcardCollection[]> {
    const result = await databaseService.executeQuery(
      `
        SELECT ${flashcardCollectionWithCountSelect}
        FROM "FlashcardCollection" fc
        JOIN "User" u ON u.user_id = fc.user_id
        LEFT JOIN "Flashcard" f ON f.collection_id = fc.collection_id
        WHERE fc.visibility = 'public'
          AND fc.user_id <> $1
        GROUP BY fc.collection_id, u.username
        ORDER BY COUNT(f.flashcard_id) DESC, fc.updated_at DESC, fc.created_at DESC
        LIMIT $2 OFFSET $3;
      `,
      [userId, clampFlashcardCollectionLimit(limit), offset]
    );
    return result.rows.map(formatCollection);
  }

  async countPublicCollections(userId: number): Promise<number> {
    const result = await databaseService.executeQuery(
      `
        SELECT COUNT(*)::int AS total
        FROM "FlashcardCollection"
        WHERE visibility = 'public'
          AND user_id <> $1;
      `,
      [userId]
    );
    return Number(result.rows[0]?.total ?? 0);
  }

  async getCollectionById(collectionId: number): Promise<FlashcardCollection | null> {
    const result = await databaseService.executeQuery(
      `
        SELECT ${flashcardCollectionWithCountSelect}
        FROM "FlashcardCollection" fc
        JOIN "User" u ON u.user_id = fc.user_id
        LEFT JOIN "Flashcard" f ON f.collection_id = fc.collection_id
        WHERE fc.collection_id = $1
        GROUP BY fc.collection_id, u.username;
      `,
      [collectionId]
    );
    return result.rows[0] ? formatCollection(result.rows[0]) : null;
  }
}

export default new FlashcardCollectionReadModel();
