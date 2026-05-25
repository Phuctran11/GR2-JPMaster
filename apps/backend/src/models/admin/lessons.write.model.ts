import databaseService from "../../services/database.service.js";
import { buildUpdateSet } from "./adminModelHelpers.js";
import { lessonMutationFields, type AdminLessonCreateInput, type AdminLessonMutationInput } from "./lessons.helpers.js";

export class AdminLessonsWriteModel {
  async createLesson(input: AdminLessonCreateInput) {
    const result = await databaseService.executeQuery(
      `
        INSERT INTO "Lesson" (
          course_id, title, content_text, video_asset_id, video_url,
          audio_asset_id, audio_url, order_index, duration, created_at, updated_at
        )
        SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
        FROM "Course" c
        WHERE c.course_id = $1
          AND c.deleted_at IS NULL
          ${input.owner_id ? "AND c.created_by = $10" : ""}
        RETURNING lesson_id, course_id, title, content_text, video_asset_id, video_url,
                  audio_asset_id, audio_url, order_index, duration, created_at, updated_at;
      `,
      [
        input.course_id,
        input.title,
        input.content_text,
        input.video_asset_id,
        input.video_url,
        input.audio_asset_id,
        input.audio_url,
        input.order_index,
        input.duration,
        ...(input.owner_id ? [input.owner_id] : []),
      ]
    );
    return result.rows[0] || null;
  }

  async updateLesson(lessonId: number, input: Partial<AdminLessonMutationInput>, ownerId?: number) {
    const { updates, values } = buildUpdateSet(input, lessonMutationFields);

    if (!updates.length) return null;
    values.push(lessonId);
    if (ownerId) values.push(ownerId);
    const result = await databaseService.executeQuery(
      `
        UPDATE "Lesson" l
        SET ${updates.join(", ")}, updated_at = NOW()
        FROM "Course" c
        WHERE l.course_id = c.course_id
          AND l.lesson_id = $${ownerId ? values.length - 1 : values.length}
          AND l.deleted_at IS NULL
          AND c.deleted_at IS NULL
          ${ownerId ? `AND c.created_by = $${values.length}` : ""}
        RETURNING l.lesson_id, l.course_id, l.title, l.content_text, l.video_asset_id, l.video_url,
                  l.audio_asset_id, l.audio_url, l.order_index, l.duration, l.created_at, l.updated_at;
      `,
      values
    );
    return result.rows[0] || null;
  }
}

export default new AdminLessonsWriteModel();
