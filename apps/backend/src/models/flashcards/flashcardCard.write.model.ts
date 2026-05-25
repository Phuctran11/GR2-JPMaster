import databaseService from "../../services/database.service.js";
import {
  flashcardSelect,
  formatFlashcard,
  type CreateFlashcardInput,
  type Flashcard,
  type UpdateFlashcardInput,
} from "./flashcard.types.js";
import flashcardCardReadModel from "./flashcardCard.read.model.js";

class FlashcardCardWriteModel {
  async createFlashcard(input: CreateFlashcardInput): Promise<Flashcard> {
    const result = await databaseService.executeQuery(
      `
        INSERT INTO "Flashcard" (
          collection_id, lesson_id, front_text, back_text, reading, example_sentence,
          image_url, audio_url, tags, order_index, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING ${flashcardSelect};
      `,
      [
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
      ]
    );
    return formatFlashcard(result.rows[0]);
  }

  async updateFlashcard(flashcardId: number, input: UpdateFlashcardInput): Promise<Flashcard | null> {
    const existing = await flashcardCardReadModel.getFlashcardById(flashcardId);
    if (!existing) return null;

    const result = await databaseService.executeQuery(
      `
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
        RETURNING ${flashcardSelect};
      `,
      [
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
      ]
    );
    return result.rows[0] ? formatFlashcard(result.rows[0]) : null;
  }

  async deleteFlashcard(flashcardId: number): Promise<boolean> {
    const result = await databaseService.executeQuery(
      `DELETE FROM "Flashcard" WHERE flashcard_id = $1;`,
      [flashcardId]
    );
    return (result.rowCount ?? 0) > 0;
  }
}

export default new FlashcardCardWriteModel();
