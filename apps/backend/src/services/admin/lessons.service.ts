import adminLessonsModel from "../../models/admin/lessons.model.js";
import { ApiError } from "../../utils/http.js";
import {
  BodyInput,
  optionalFiniteNumber,
  optionalNumber,
  parseAdminPagination,
  QueryInput,
  requireFiniteNumber,
  requireString,
  toNumberOrNull,
} from "../../validators/admin/common.validator.js";

export class AdminLessonsService {
  async listLessons(query: QueryInput, ownerId?: number) {
    const { limit, offset } = parseAdminPagination(query);
    return adminLessonsModel.listLessons({
      limit,
      offset,
      search: String(query.search || ""),
      courseId: toNumberOrNull(query.course_id) || undefined,
      ownerId,
    });
  }

  async createLesson(body: BodyInput, ownerId?: number) {
    const title = requireString(body.title);
    const courseId = requireFiniteNumber(body.course_id, "course_id");
    const orderIndex = requireFiniteNumber(body.order_index ?? 1, "order_index");

    if (!title) {
      throw new ApiError(400, "course_id, title, and order_index are required");
    }

    const data = await adminLessonsModel.createLesson({
      course_id: courseId,
      title,
      content_text: requireString(body.content_text) || null,
      video_asset_id: toNumberOrNull(body.video_asset_id),
      video_url: requireString(body.video_url) || null,
      audio_asset_id: toNumberOrNull(body.audio_asset_id),
      audio_url: requireString(body.audio_url) || null,
      order_index: orderIndex,
      duration: toNumberOrNull(body.duration),
      owner_id: ownerId,
    });

    if (!data) {
      throw new ApiError(404, "Course not found");
    }

    return data;
  }

  async updateLesson(lessonId: number, body: BodyInput, ownerId?: number) {
    const data = await adminLessonsModel.updateLesson(lessonId, {
      title: body.title === undefined ? undefined : requireString(body.title),
      content_text: body.content_text === undefined ? undefined : requireString(body.content_text) || null,
      video_asset_id: optionalNumber(body.video_asset_id),
      video_url: body.video_url === undefined ? undefined : requireString(body.video_url) || null,
      audio_asset_id: optionalNumber(body.audio_asset_id),
      audio_url: body.audio_url === undefined ? undefined : requireString(body.audio_url) || null,
      order_index: optionalFiniteNumber(body.order_index, "order_index"),
      duration: body.duration === undefined ? undefined : toNumberOrNull(body.duration),
    }, ownerId);

    if (!data) {
      throw new ApiError(404, "Lesson not found or no changes provided");
    }

    return data;
  }

  async deleteLesson(lessonId: number, ownerId?: number) {
    const deleted = await adminLessonsModel.deleteLesson(lessonId, ownerId);
    if (!deleted) {
      throw new ApiError(404, "Lesson not found");
    }
  }
}

export default new AdminLessonsService();
