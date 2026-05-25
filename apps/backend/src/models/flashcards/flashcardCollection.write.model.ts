import databaseService from "../../services/database.service.js";
import { assertReturnedRow } from "../modelAssertions.js";
import { formatCollection, type FlashcardCollection, type FlashcardVisibility } from "./flashcard.types.js";

export class FlashcardCollectionWriteModel {
  async createCollection(
    userId: number,
    title: string,
    description: string | null = null,
    visibility: FlashcardVisibility = "private"
  ): Promise<FlashcardCollection> {
    const result = await databaseService.executeQuery(
      `
        INSERT INTO "FlashcardCollection" (user_id, title, description, visibility, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING collection_id, user_id, title, description, visibility, created_at, updated_at;
      `,
      [userId, title, description, visibility]
    );
    return formatCollection(assertReturnedRow(result.rows[0], "Failed to create flashcard collection"));
  }

  async updateCollection(
    collectionId: number,
    userId: number,
    title: string,
    description: string | null,
    visibility: FlashcardVisibility
  ): Promise<FlashcardCollection | null> {
    const result = await databaseService.executeQuery(
      `
        UPDATE "FlashcardCollection"
        SET title = $1, description = $2, visibility = $3, updated_at = NOW()
        WHERE collection_id = $4 AND user_id = $5
        RETURNING collection_id, user_id, title, description, visibility, created_at, updated_at;
      `,
      [title, description, visibility, collectionId, userId]
    );
    return result.rows[0] ? formatCollection(result.rows[0]) : null;
  }

  async deleteCollection(collectionId: number, userId: number): Promise<boolean> {
    const result = await databaseService.executeQuery(
      `DELETE FROM "FlashcardCollection" WHERE collection_id = $1 AND user_id = $2;`,
      [collectionId, userId]
    );
    return (result.rowCount ?? 0) > 0;
  }
}

export default new FlashcardCollectionWriteModel();
