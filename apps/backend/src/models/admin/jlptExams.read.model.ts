import databaseService from "../../services/database.service.js";
import type { AdminListParams } from "../admin.model.js";
import { orderDirection, withLimitOffset } from "./adminModelHelpers.js";
import { buildJlptExamWhere } from "./jlptExams.helpers.js";

class AdminJlptExamsReadModel {
  async listJlptExams(params: AdminListParams) {
    const { limit, offset } = withLimitOffset(params);
    const direction = orderDirection(params);
    const { values, whereSql } = buildJlptExamWhere(params);

    values.push(limit, offset);
    const result = await databaseService.executeQuery(
      `
        SELECT e.exam_id, e.title, e.jlpt_level, e.year, e.duration_minutes, e.created_by,
               e.created_at, e.updated_at,
               COUNT(DISTINCT s.section_id)::int AS section_count,
               COUNT(DISTINCT jsq.question_id)::int AS question_count
        FROM "JLPTExam" e
        LEFT JOIN "JLPTSection" s ON s.exam_id = e.exam_id AND s.deleted_at IS NULL
        LEFT JOIN "JLPTSectionQuestion" jsq ON jsq.section_id = s.section_id AND jsq.deleted_at IS NULL
        WHERE ${whereSql}
        GROUP BY e.exam_id
        ORDER BY e.exam_id ${direction}
        LIMIT $${values.length - 1} OFFSET $${values.length};
      `,
      values
    );
    return result.rows;
  }

  async countJlptExams(params: AdminListParams): Promise<number> {
    const { values, whereSql } = buildJlptExamWhere(params);
    const result = await databaseService.executeQuery(
      `
        SELECT COUNT(*)::int AS total_count
        FROM "JLPTExam" e
        WHERE ${whereSql};
      `,
      values
    );
    return Number(result.rows[0]?.total_count || 0);
  }
}

export default new AdminJlptExamsReadModel();
