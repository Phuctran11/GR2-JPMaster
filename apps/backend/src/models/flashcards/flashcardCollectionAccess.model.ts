import databaseService from "../../services/database.service.js";

export class FlashcardCollectionAccessModel {
  async userCanAccessCollection(userId: number, collectionId: number): Promise<boolean> {
    const result = await databaseService.executeQuery(
      `
        SELECT 1
        FROM "FlashcardCollection"
        WHERE collection_id = $1
          AND (user_id = $2 OR visibility = 'public')
        LIMIT 1;
      `,
      [collectionId, userId]
    );
    return Boolean(result.rows[0]);
  }
}

export default new FlashcardCollectionAccessModel();
