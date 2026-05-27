import databaseService from "../../services/database.service.js";
import type { AdminListParams } from "../admin.model.js";
import { withLimitOffset } from "./adminModelHelpers.js";
import { buildLessonWhere } from "./lessons.helpers.js";

export class AdminLessonsReadModel {
  async listLessons(params: AdminListParams) {
    const { limit, offset } = withLimitOffset(params);
    const { values, whereSql } = buildLessonWhere(params);

    values.push(limit, offset);
    const result = await databaseService.executeQuery(
      `
        SELECT l.lesson_id, l.course_id, c.title AS course_title, l.title,
               l.content_text, l.video_asset_id, l.video_url, l.audio_asset_id, l.audio_url,
               l.order_index, l.duration, l.created_at, l.updated_at
        FROM "Lesson" l
        JOIN "Course" c ON c.course_id = l.course_id
        WHERE ${whereSql}
        ORDER BY l.course_id ASC, l.order_index ASC
        LIMIT $${values.length - 1} OFFSET $${values.length};
      `,
      values
    );
    return result.rows;
  }
}

export default new AdminLessonsReadModel();
