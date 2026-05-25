import databaseService from "../../services/database.service.js";
import { assertReturnedRow } from "../modelAssertions.js";
import { buildUpdateSet } from "./adminModelHelpers.js";
import {
  courseMutationFields,
  formatAdminCourse,
  type AdminCourseCreateInput,
  type AdminCourseMutationInput,
} from "./courses.helpers.js";

export class AdminCoursesWriteModel {
  async createCourse(input: AdminCourseCreateInput) {
    const result = await databaseService.executeQuery(
      `
        INSERT INTO "Course" (title, description, price, level, duration, cover_asset_id, image_url, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING course_id, title, description, price, level, duration, cover_asset_id, image_url, created_by, created_at, updated_at;
      `,
      [input.title, input.description, input.price, input.level, input.duration, input.cover_asset_id, input.image_url, input.created_by]
    );
    return formatAdminCourse(assertReturnedRow(result.rows[0], "Failed to create admin course"));
  }

  async updateCourse(courseId: number, input: Partial<AdminCourseMutationInput>, ownerId?: number) {
    const { updates, values } = buildUpdateSet(input, courseMutationFields);

    if (!updates.length) return null;

    values.push(courseId);
    if (ownerId) values.push(ownerId);
    const result = await databaseService.executeQuery(
      `
        UPDATE "Course"
        SET ${updates.join(", ")}, updated_at = NOW()
        WHERE course_id = $${ownerId ? values.length - 1 : values.length}
          AND deleted_at IS NULL
          ${ownerId ? `AND created_by = $${values.length}` : ""}
        RETURNING course_id, title, description, price, level, duration, cover_asset_id, image_url, created_by, created_at, updated_at;
      `,
      values
    );
    return result.rows[0] ? formatAdminCourse(result.rows[0]) : null;
  }
}

export default new AdminCoursesWriteModel();
