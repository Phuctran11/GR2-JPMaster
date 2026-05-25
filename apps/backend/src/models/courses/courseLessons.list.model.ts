import databaseService from "../../services/database.service.js";
import {
  courseBaseSelectWithCreator,
  formatCourseWithLessons,
  lessonSelect,
  type CourseWithLessons,
  type Lesson,
} from "./course.types.js";
import { activeCourseLessonExistsSql } from "./courseVisibility.helpers.js";

export class CourseLessonsListModel {
  async getCoursesWithLessons(limit = 10, offset = 0): Promise<CourseWithLessons[]> {
    const courseResult = await databaseService.executeQuery(
      `
        SELECT ${courseBaseSelectWithCreator}
        FROM "Course" c
        LEFT JOIN "User" u ON u.user_id = c.created_by
        WHERE c.deleted_at IS NULL
          AND ${activeCourseLessonExistsSql("c")}
        ORDER BY c.created_at DESC
        LIMIT $1 OFFSET $2;
      `,
      [limit, offset]
    );
    if (courseResult.rows.length === 0) return [];

    const courseIds = courseResult.rows.map((course) => Number(course.course_id));
    const lessonsByCourseId = await this.getLessonsByCourseIds(courseIds);
    return courseResult.rows.map((course) =>
      formatCourseWithLessons(course, lessonsByCourseId.get(Number(course.course_id)) ?? [])
    );
  }

  async getCoursesWithLessonsByIds(courseIds: number[]): Promise<Map<number, CourseWithLessons>> {
    const uniqueCourseIds = Array.from(new Set(courseIds.filter(Number.isFinite)));
    if (uniqueCourseIds.length === 0) return new Map();

    const courseResult = await databaseService.executeQuery(
      `
        SELECT ${courseBaseSelectWithCreator}
        FROM "Course" c
        LEFT JOIN "User" u ON u.user_id = c.created_by
        WHERE c.course_id = ANY($1::int[])
          AND c.deleted_at IS NULL
          AND ${activeCourseLessonExistsSql("c")};
      `,
      [uniqueCourseIds]
    );
    if (courseResult.rows.length === 0) return new Map();

    const lessonsByCourseId = await this.getLessonsByCourseIds(uniqueCourseIds);
    return courseResult.rows.reduce((map, course) => {
      const courseId = Number(course.course_id);
      map.set(courseId, formatCourseWithLessons(course, lessonsByCourseId.get(courseId) ?? []));
      return map;
    }, new Map<number, CourseWithLessons>());
  }

  private async getLessonsByCourseIds(courseIds: number[]) {
    const lessonsResult = await databaseService.executeQuery(
      `
        SELECT ${lessonSelect}
        FROM "Lesson" l
        WHERE l.course_id = ANY($1::int[])
          AND l.deleted_at IS NULL
        ORDER BY l.course_id ASC, l.order_index ASC;
      `,
      [courseIds]
    );

    return lessonsResult.rows.reduce((map, lesson) => {
      const courseLessons = map.get(Number(lesson.course_id)) ?? [];
      courseLessons.push(lesson);
      map.set(Number(lesson.course_id), courseLessons);
      return map;
    }, new Map<number, Lesson[]>());
  }
}

export default new CourseLessonsListModel();
