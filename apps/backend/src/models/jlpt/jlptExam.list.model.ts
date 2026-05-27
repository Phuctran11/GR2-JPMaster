import databaseService from "../../services/database.service.js";
import { WhereBuilder, withLimitOffset } from "../sqlHelpers.js";

class JlptExamListModel {
  async listExams(filters: { level?: string; section_type?: string; limit?: number; offset?: number }) {
    const where = new WhereBuilder(["e.deleted_at IS NULL"]);
    const { limit, offset } = withLimitOffset(filters);

    if (filters.level && filters.level !== "All") {
      where.add(`e.jlpt_level = ?`, filters.level);
    }

    if (filters.section_type && filters.section_type !== "all") {
      where.add(`
        EXISTS (
          SELECT 1
          FROM "JLPTSection" fs
          WHERE fs.exam_id = e.exam_id
            AND fs.deleted_at IS NULL
            AND fs.section_type = ?
        )
      `, filters.section_type);
    }

    const countResult = await databaseService.executeQuery(
      `
        SELECT COUNT(*)::int AS total_count
        FROM (
          SELECT e.exam_id
          FROM "JLPTExam" e
          LEFT JOIN "JLPTSection" s ON s.exam_id = e.exam_id AND s.deleted_at IS NULL
          LEFT JOIN "JLPTSectionQuestion" jsq ON jsq.section_id = s.section_id AND jsq.deleted_at IS NULL
          WHERE ${where.toSql()}
          GROUP BY e.exam_id
          HAVING COUNT(DISTINCT jsq.question_id) > 0
        ) counted;
      `,
      where.values
    );

    const values = [...where.values, limit, offset];
    const result = await databaseService.executeQuery(
      `
        SELECT e.exam_id, e.title, e.jlpt_level, e.year, e.duration_minutes, e.created_at,
               COUNT(DISTINCT s.section_id)::int AS section_count,
               COUNT(DISTINCT jsq.question_id)::int AS question_count,
               STRING_AGG(DISTINCT s.section_type, ',' ORDER BY s.section_type) AS section_types
        FROM "JLPTExam" e
        LEFT JOIN "JLPTSection" s ON s.exam_id = e.exam_id AND s.deleted_at IS NULL
        LEFT JOIN "JLPTSectionQuestion" jsq ON jsq.section_id = s.section_id AND jsq.deleted_at IS NULL
        WHERE ${where.toSql()}
        GROUP BY e.exam_id
        HAVING COUNT(DISTINCT jsq.question_id) > 0
        ORDER BY e.exam_id DESC
        LIMIT $${values.length - 1} OFFSET $${values.length};
      `,
      values
    );

    return {
      data: result.rows.map((row) => ({
        ...row,
        section_types: row.section_types ? String(row.section_types).split(",") : [],
      })),
      totalCount: Number(countResult.rows[0]?.total_count || 0),
    };
  }
}

export default new JlptExamListModel();
