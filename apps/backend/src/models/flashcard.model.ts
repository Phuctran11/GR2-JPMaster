import databaseService from "../services/database.service.js";

export type FlashcardVisibility = "private" | "public";

export interface FlashcardCollection {
  collection_id: number;
  user_id: number;
  owner_username?: string;
  title: string;
  description: string | null;
  visibility: FlashcardVisibility;
  card_count?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Flashcard {
  flashcard_id: number;
  collection_id: number;
  lesson_id: number | null;
  front_text: string;
  back_text: string;
  reading: string | null;
  example_sentence: string | null;
  image_url: string | null;
  audio_url: string | null;
  tags: string[] | null;
  order_index: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateFlashcardInput {
  collectionId: number;
  lessonId?: number | null;
  frontText: string;
  backText: string;
  reading?: string | null;
  exampleSentence?: string | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
  tags?: string[] | null;
  orderIndex?: number | null;
}

export interface UpdateFlashcardInput extends Partial<Omit<CreateFlashcardInput, "collectionId">> {}

const formatCollection = (row: any): FlashcardCollection => ({
  collection_id: Number(row.collection_id),
  user_id: Number(row.user_id),
  owner_username: row.owner_username,
  title: row.title,
  description: row.description,
  visibility: row.visibility,
  card_count: row.card_count != null ? Number(row.card_count) : undefined,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const formatFlashcard = (row: any): Flashcard => ({
  flashcard_id: Number(row.flashcard_id),
  collection_id: Number(row.collection_id),
  lesson_id: row.lesson_id != null ? Number(row.lesson_id) : null,
  front_text: row.front_text,
  back_text: row.back_text,
  reading: row.reading,
  example_sentence: row.example_sentence,
  image_url: row.image_url,
  audio_url: row.audio_url,
  tags: row.tags,
  order_index: row.order_index != null ? Number(row.order_index) : null,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

export class FlashcardModel {
  async createCollection(
    userId: number,
    title: string,
    description: string | null = null,
    visibility: FlashcardVisibility = "private"
  ): Promise<FlashcardCollection> {
    const query = `
      INSERT INTO "FlashcardCollection" (user_id, title, description, visibility, created_at, updated_at)
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING collection_id, user_id, title, description, visibility, created_at, updated_at;
    `;
    const result = await databaseService.executeQuery(query, [userId, title, description, visibility]);
    return formatCollection(result.rows[0]);
  }

  async getCollectionsByUser(userId: number, limit = 20, offset = 0): Promise<FlashcardCollection[]> {
    const query = `
      SELECT
        fc.collection_id,
        fc.user_id,
        u.username AS owner_username,
        fc.title,
        fc.description,
        fc.visibility,
        COUNT(f.flashcard_id)::int AS card_count,
        fc.created_at,
        fc.updated_at
      FROM "FlashcardCollection" fc
      JOIN "User" u ON u.user_id = fc.user_id
      LEFT JOIN "Flashcard" f ON f.collection_id = fc.collection_id
      WHERE fc.user_id = $1
      GROUP BY fc.collection_id, u.username
      ORDER BY fc.updated_at DESC, fc.created_at DESC
      LIMIT $2 OFFSET $3;
    `;
    const result = await databaseService.executeQuery(query, [userId, Math.min(limit, 100), offset]);
    return result.rows.map(formatCollection);
  }

  async getPublicCollections(userId: number, limit = 20, offset = 0): Promise<FlashcardCollection[]> {
    const query = `
      SELECT
        fc.collection_id,
        fc.user_id,
        u.username AS owner_username,
        fc.title,
        fc.description,
        fc.visibility,
        COUNT(f.flashcard_id)::int AS card_count,
        fc.created_at,
        fc.updated_at
      FROM "FlashcardCollection" fc
      JOIN "User" u ON u.user_id = fc.user_id
      LEFT JOIN "Flashcard" f ON f.collection_id = fc.collection_id
      WHERE fc.visibility = 'public'
        AND fc.user_id <> $1
      GROUP BY fc.collection_id, u.username
      ORDER BY COUNT(f.flashcard_id) DESC, fc.updated_at DESC, fc.created_at DESC
      LIMIT $2 OFFSET $3;
    `;
    const result = await databaseService.executeQuery(query, [userId, Math.min(limit, 100), offset]);
    return result.rows.map(formatCollection);
  }

  async getCollectionById(collectionId: number): Promise<FlashcardCollection | null> {
    const query = `
      SELECT
        fc.collection_id,
        fc.user_id,
        u.username AS owner_username,
        fc.title,
        fc.description,
        fc.visibility,
        COUNT(f.flashcard_id)::int AS card_count,
        fc.created_at,
        fc.updated_at
      FROM "FlashcardCollection" fc
      JOIN "User" u ON u.user_id = fc.user_id
      LEFT JOIN "Flashcard" f ON f.collection_id = fc.collection_id
      WHERE fc.collection_id = $1
      GROUP BY fc.collection_id, u.username;
    `;
    const result = await databaseService.executeQuery(query, [collectionId]);
    return result.rows[0] ? formatCollection(result.rows[0]) : null;
  }

  async updateCollection(
    collectionId: number,
    userId: number,
    title: string,
    description: string | null,
    visibility: FlashcardVisibility
  ): Promise<FlashcardCollection | null> {
    const query = `
      UPDATE "FlashcardCollection"
      SET title = $1, description = $2, visibility = $3, updated_at = NOW()
      WHERE collection_id = $4 AND user_id = $5
      RETURNING collection_id, user_id, title, description, visibility, created_at, updated_at;
    `;
    const result = await databaseService.executeQuery(query, [title, description, visibility, collectionId, userId]);
    return result.rows[0] ? formatCollection(result.rows[0]) : null;
  }

  async deleteCollection(collectionId: number, userId: number): Promise<boolean> {
    const query = `DELETE FROM "FlashcardCollection" WHERE collection_id = $1 AND user_id = $2;`;
    const result = await databaseService.executeQuery(query, [collectionId, userId]);
    return (result.rowCount ?? 0) > 0;
  }

  async userCanAccessCollection(userId: number, collectionId: number): Promise<boolean> {
    const query = `
      SELECT 1
      FROM "FlashcardCollection"
      WHERE collection_id = $1
        AND (user_id = $2 OR visibility = 'public')
      LIMIT 1;
    `;
    const result = await databaseService.executeQuery(query, [collectionId, userId]);
    return Boolean(result.rows[0]);
  }

  async createFlashcard(input: CreateFlashcardInput): Promise<Flashcard> {
    const query = `
      INSERT INTO "Flashcard" (
        collection_id, lesson_id, front_text, back_text, reading, example_sentence,
        image_url, audio_url, tags, order_index, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING flashcard_id, collection_id, lesson_id, front_text, back_text, reading,
        example_sentence, image_url, audio_url, tags, order_index, created_at, updated_at;
    `;
    const result = await databaseService.executeQuery(query, [
      input.collectionId,
      input.lessonId ?? null,
      input.frontText,
      input.backText,
      input.reading ?? null,
      input.exampleSentence ?? null,
      input.imageUrl ?? null,
      input.audioUrl ?? null,
      input.tags ?? null,
      input.orderIndex ?? null,
    ]);
    return formatFlashcard(result.rows[0]);
  }

  async getFlashcardById(flashcardId: number): Promise<Flashcard | null> {
    const query = `
      SELECT flashcard_id, collection_id, lesson_id, front_text, back_text, reading,
        example_sentence, image_url, audio_url, tags, order_index, created_at, updated_at
      FROM "Flashcard"
      WHERE flashcard_id = $1;
    `;
    const result = await databaseService.executeQuery(query, [flashcardId]);
    return result.rows[0] ? formatFlashcard(result.rows[0]) : null;
  }

  async getFlashcardsByCollection(collectionId: number, limit = 50, offset = 0): Promise<Flashcard[]> {
    const query = `
      SELECT flashcard_id, collection_id, lesson_id, front_text, back_text, reading,
        example_sentence, image_url, audio_url, tags, order_index, created_at, updated_at
      FROM "Flashcard"
      WHERE collection_id = $1
      ORDER BY order_index ASC NULLS LAST, created_at DESC
      LIMIT $2 OFFSET $3;
    `;
    const result = await databaseService.executeQuery(query, [collectionId, Math.min(limit, 100), offset]);
    return result.rows.map(formatFlashcard);
  }

  async getFlashcardsByLesson(userId: number, lessonId: number, limit = 50, offset = 0): Promise<Flashcard[]> {
    const query = `
      SELECT f.flashcard_id, f.collection_id, f.lesson_id, f.front_text, f.back_text, f.reading,
        f.example_sentence, f.image_url, f.audio_url, f.tags, f.order_index, f.created_at, f.updated_at
      FROM "Flashcard" f
      JOIN "FlashcardCollection" fc ON fc.collection_id = f.collection_id
      WHERE f.lesson_id = $1
        AND (fc.user_id = $2 OR fc.visibility = 'public')
      ORDER BY f.order_index ASC NULLS LAST, f.created_at DESC
      LIMIT $3 OFFSET $4;
    `;
    const result = await databaseService.executeQuery(query, [lessonId, userId, Math.min(limit, 100), offset]);
    return result.rows.map(formatFlashcard);
  }

  async updateFlashcard(flashcardId: number, input: UpdateFlashcardInput): Promise<Flashcard | null> {
    const existing = await this.getFlashcardById(flashcardId);
    if (!existing) return null;

    const query = `
      UPDATE "Flashcard"
      SET
        lesson_id = $1,
        front_text = $2,
        back_text = $3,
        reading = $4,
        example_sentence = $5,
        image_url = $6,
        audio_url = $7,
        tags = $8,
        order_index = $9,
        updated_at = NOW()
      WHERE flashcard_id = $10
      RETURNING flashcard_id, collection_id, lesson_id, front_text, back_text, reading,
        example_sentence, image_url, audio_url, tags, order_index, created_at, updated_at;
    `;

    const result = await databaseService.executeQuery(query, [
      input.lessonId !== undefined ? input.lessonId : existing.lesson_id,
      input.frontText ?? existing.front_text,
      input.backText ?? existing.back_text,
      input.reading !== undefined ? input.reading : existing.reading,
      input.exampleSentence !== undefined ? input.exampleSentence : existing.example_sentence,
      input.imageUrl !== undefined ? input.imageUrl : existing.image_url,
      input.audioUrl !== undefined ? input.audioUrl : existing.audio_url,
      input.tags !== undefined ? input.tags : existing.tags,
      input.orderIndex !== undefined ? input.orderIndex : existing.order_index,
      flashcardId,
    ]);
    return result.rows[0] ? formatFlashcard(result.rows[0]) : null;
  }

  async deleteFlashcard(flashcardId: number): Promise<boolean> {
    const query = `DELETE FROM "Flashcard" WHERE flashcard_id = $1;`;
    const result = await databaseService.executeQuery(query, [flashcardId]);
    return (result.rowCount ?? 0) > 0;
  }
}

export default new FlashcardModel();
