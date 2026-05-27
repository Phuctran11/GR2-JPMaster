import databaseService from "../../services/database.service.js";
import { lessonSelect, type Lesson } from "./course.types.js";

export interface CourseProgressSummary {
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
}

const toProgressSummary = (row: any): CourseProgressSummary => {
  const totalLessons = Number(row?.total_lessons ?? 0);
  const completedLessons = Number(row?.completed_lessons ?? 0);
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  return { totalLessons, completedLessons, progressPercent };
};

export class CourseProgressModel {
  async getLessonCompletionMap(userId: number, courseId: number): Promise<Map<number, boolean>> {
    const result = await databaseService.executeQuery(
      `
        SELECT l.lesson_id,
               CASE
                 WHEN COALESCE(ulp.completed, FALSE) = TRUE
                   OR COALESCE(ulp.status, 'not_started') = 'completed'
                 THEN TRUE
                 ELSE FALSE
               END AS is_completed
        FROM "Lesson" l
        LEFT JOIN "UserLessonProgress" ulp
          ON ulp.lesson_id = l.lesson_id AND ulp.user_id = $1
        WHERE l.course_id = $2
          AND l.deleted_at IS NULL
        ORDER BY l.order_index ASC;
      `,
      [userId, courseId]
    );
    return new Map(result.rows.map((row) => [Number(row.lesson_id), Boolean(row.is_completed)]));
  }

  async getNextUnfinishedLessonByUserAndCourse(userId: number, courseId: number): Promise<Lesson | null> {
    const result = await databaseService.executeQuery(
      `
        SELECT ${lessonSelect}
        FROM "Lesson" l
        LEFT JOIN "UserLessonProgress" ulp
          ON ulp.lesson_id = l.lesson_id AND ulp.user_id = $1
        WHERE l.course_id = $2
          AND l.deleted_at IS NULL
          AND (
            ulp.user_lesson_progress_id IS NULL
            OR COALESCE(ulp.completed, FALSE) = FALSE
            OR COALESCE(ulp.status, 'not_started') <> 'completed'
          )
        ORDER BY l.order_index ASC
        LIMIT 1;
      `,
      [userId, courseId]
    );
    return result.rows[0] || null;
  }

  async getCourseProgressSummary(userId: number, courseId: number): Promise<CourseProgressSummary> {
    const result = await databaseService.executeQuery(
      `
        SELECT
          COUNT(l.lesson_id)::int AS total_lessons,
          COALESCE(
            SUM(
              CASE
                WHEN COALESCE(ulp.completed, FALSE) = TRUE
                  OR COALESCE(ulp.status, 'not_started') = 'completed'
                THEN 1
                ELSE 0
              END
            ),
            0
          )::int AS completed_lessons
        FROM "Lesson" l
        LEFT JOIN "UserLessonProgress" ulp
          ON ulp.lesson_id = l.lesson_id AND ulp.user_id = $1
        WHERE l.course_id = $2
          AND l.deleted_at IS NULL;
      `,
      [userId, courseId]
    );
    return toProgressSummary(result.rows[0]);
  }

  async getCourseProgressSummaries(userId: number, courseIds: number[]): Promise<Map<number, CourseProgressSummary>> {
    const uniqueCourseIds = Array.from(new Set(courseIds.filter(Number.isFinite)));
    if (uniqueCourseIds.length === 0) return new Map();

    const result = await databaseService.executeQuery(
      `
        WITH selected_courses AS (
          SELECT unnest($2::int[]) AS course_id
        )
        SELECT
          sc.course_id,
          COUNT(l.lesson_id)::int AS total_lessons,
          COALESCE(
            SUM(
              CASE
                WHEN COALESCE(ulp.completed, FALSE) = TRUE
                  OR COALESCE(ulp.status, 'not_started') = 'completed'
                THEN 1
                ELSE 0
              END
            ),
            0
          )::int AS completed_lessons
        FROM selected_courses sc
        LEFT JOIN "Lesson" l
          ON l.course_id = sc.course_id
          AND l.deleted_at IS NULL
        LEFT JOIN "UserLessonProgress" ulp
          ON ulp.lesson_id = l.lesson_id
          AND ulp.user_id = $1
        GROUP BY sc.course_id;
      `,
      [userId, uniqueCourseIds]
    );

    return result.rows.reduce((map, row) => {
      map.set(Number(row.course_id), toProgressSummary(row));
      return map;
    }, new Map<number, CourseProgressSummary>());
  }
}

export default new CourseProgressModel();

