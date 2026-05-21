import databaseService from "../services/database.service.js";
import ratingModel from "./rating.model.js";

export interface Lesson {
  lesson_id: number;
  course_id: number;
  title: string;
  content_type: 'video' | 'text' | 'quiz';
  content_text: string | null;
  video_url: string | null;
  order_index: number;
  duration: number | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  is_completed?: boolean;
}

export interface CourseRatingInfo {
  rating_id: number;
  user_id: number;
  username?: string;
  rating: number;
  review: string | null;
  created_at: Date;
}

export interface CourseWithLessons {
  course_id: number;
  title: string;
  description: string | null;
  price: number;
  level: string | null;
  is_free: boolean;
  duration: number | null;
  created_by: number;
  final_quiz_id: number | null;
  creator_username?: string;
  created_at: Date;
  updated_at: Date;
  lessons?: Lesson[];
}

export interface CourseDetail extends CourseWithLessons {
  ratings?: CourseRatingInfo[];
  average_rating?: number;
  rating_count?: number;
}

export interface Course {
  course_id: number;
  title: string;
  description: string | null;
  price: number;
  level: string | null;
  duration: number | null;
  created_by: number;
  final_quiz_id: number | null;
  creator_username?: string;
  created_at: Date;
  updated_at: Date;
  average_rating?: number;
  rating_count?: number;
  enroll_count?: number;
}

const formatCourse = (row: any): Course => ({
  ...row,
  price: Number(row.price),
  duration: row.duration != null ? Number(row.duration) : null,
  final_quiz_id: row.final_quiz_id != null ? Number(row.final_quiz_id) : null,
  average_rating: row.average_rating != null ? Number(row.average_rating) : undefined,
  rating_count: row.rating_count != null ? Number(row.rating_count) : undefined,
  enroll_count: row.enroll_count != null ? Number(row.enroll_count) : undefined,
});

const formatCourseWithLessons = (courseRow: any, lessons: Lesson[] = []): CourseWithLessons => ({
  ...courseRow,
  price: Number(courseRow.price),
  duration: courseRow.duration != null ? Number(courseRow.duration) : null,
  final_quiz_id: courseRow.final_quiz_id != null ? Number(courseRow.final_quiz_id) : null,
  is_free: Number(courseRow.price) === 0,
  creator_username: courseRow.creator_username,
  lessons,
});

const finalQuizIdSelect = `
  (
    SELECT q.quiz_id
    FROM "Quiz" q
    WHERE q.course_id = c.course_id
      AND q.quiz_type = 'final_test'
    ORDER BY q.quiz_id DESC
    LIMIT 1
  ) AS final_quiz_id
`;

export class CourseModel {
  async createCourse(
    title: string,
    description: string | null,
    price: number,
    createdBy: number
  ): Promise<Course> {
    const query = `
      WITH created AS (
        INSERT INTO "Course" (title, description, price, level, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, NULL, $4, NOW(), NOW())
        RETURNING course_id, title, description, price, level, duration, created_by, created_at, updated_at
      )
      SELECT
        c.course_id, c.title, c.description, c.price, c.level, c.duration, c.created_by,
        ${finalQuizIdSelect},
        c.created_at, c.updated_at
      FROM created c;
    `;
    const result = await databaseService.executeQuery(query, [title, description, price, createdBy]);
    return formatCourse(result.rows[0]);
  }

  async getCourseById(courseId: number): Promise<Course | null> {
    const query = `
      SELECT
        c.course_id, c.title, c.description, c.price, c.level, c.duration, c.created_by,
        ${finalQuizIdSelect},
        u.username AS creator_username,
        c.created_at, c.updated_at
      FROM "Course" c
      LEFT JOIN "User" u ON u.user_id = c.created_by
      WHERE c.course_id = $1;
    `;
    const result = await databaseService.executeQuery(query, [courseId]);
    return result.rows[0] ? formatCourse(result.rows[0]) : null;
  }

  async getCourseByIdWithLessons(courseId: number): Promise<CourseWithLessons | null> {
    const query = `
      SELECT
        c.course_id, c.title, c.description, c.price, c.level, c.duration, c.created_by,
        ${finalQuizIdSelect},
        u.username AS creator_username,
        c.created_at, c.updated_at
      FROM "Course" c
      LEFT JOIN "User" u ON u.user_id = c.created_by
      WHERE c.course_id = $1;
    `;
    const result = await databaseService.executeQuery(query, [courseId]);
    if (!result.rows[0]) return null;

    let lessons: Lesson[] = [];
    try {
      const lessonsQuery = `
        SELECT
          l.lesson_id,
          l.course_id,
          l.title,
          l.content_type,
          l.content_text,
          l.video_url,
          l.order_index,
          (to_jsonb(l)->>'duration')::int AS duration,
          (to_jsonb(l)->>'created_by')::int AS created_by,
          l.created_at,
          l.updated_at
        FROM "Lesson" l
        WHERE l.course_id = $1
        ORDER BY l.order_index ASC;
      `;
      const lessonsResult = await databaseService.executeQuery(lessonsQuery, [courseId]);
      lessons = lessonsResult.rows;
    } catch (error) {
      console.error(`Failed to load lessons for course ${courseId}:`, error);
    }

    return formatCourseWithLessons(result.rows[0], lessons);
  }

  async getCourseByIdWithDetail(courseId: number): Promise<CourseDetail | null> {
    const course = await this.getCourseByIdWithLessons(courseId);
    if (!course) return null;

    try {
      const ratings = await ratingModel.getCourseRatings(courseId, 5, 0);
      const average_rating = await ratingModel.getAverageRating(courseId);
      const rating_count = await ratingModel.getRatingCount(courseId);

      return {
        ...course,
        ratings: ratings.map((r) => ({
          rating_id: r.rating_id,
          user_id: r.user_id,
          username: r.username,
          rating: r.rating,
          review: r.review,
          created_at: r.created_at,
        })),
        average_rating,
        rating_count,
      };
    } catch (error) {
      console.error(`Failed to load ratings for course ${courseId}:`, error);
      return course;
    }
  }

  async getLessonCompletionMap(userId: number, courseId: number): Promise<Map<number, boolean>> {
    const query = `
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
      ORDER BY l.order_index ASC;
    `;

    const result = await databaseService.executeQuery(query, [userId, courseId]);
    return new Map(result.rows.map((row) => [Number(row.lesson_id), Boolean(row.is_completed)]));
  }

  async getNextUnfinishedLessonByUserAndCourse(userId: number, courseId: number): Promise<Lesson | null> {
    const query = `
      SELECT
        l.lesson_id,
        l.course_id,
        l.title,
        l.content_type,
        l.content_text,
        l.video_url,
        l.order_index,
        (to_jsonb(l)->>'duration')::int AS duration,
        (to_jsonb(l)->>'created_by')::int AS created_by,
        l.created_at,
        l.updated_at
      FROM "Lesson" l
      LEFT JOIN "UserLessonProgress" ulp
        ON ulp.lesson_id = l.lesson_id AND ulp.user_id = $1
      WHERE l.course_id = $2
        AND (
          ulp.user_lesson_progress_id IS NULL
          OR COALESCE(ulp.completed, FALSE) = FALSE
          OR COALESCE(ulp.status, 'not_started') <> 'completed'
        )
      ORDER BY l.order_index ASC
      LIMIT 1;
    `;

    const result = await databaseService.executeQuery(query, [userId, courseId]);
    return result.rows[0] || null;
  }

  async getCourseProgressSummary(
    userId: number,
    courseId: number
  ): Promise<{ totalLessons: number; completedLessons: number; progressPercent: number }> {
    const query = `
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
      WHERE l.course_id = $2;
    `;

    const result = await databaseService.executeQuery(query, [userId, courseId]);
    const totalLessons = Number(result.rows[0]?.total_lessons ?? 0);
    const completedLessons = Number(result.rows[0]?.completed_lessons ?? 0);
    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return { totalLessons, completedLessons, progressPercent };
  }

  async getAllCourses(limit: number = 10, offset: number = 0): Promise<Course[]> {
    const query = `
      SELECT
        c.course_id, c.title, c.description, c.price, c.level, c.duration, c.created_by,
        ${finalQuizIdSelect},
        u.username AS creator_username,
        c.created_at, c.updated_at,
        AVG(cr.rating) AS average_rating,
        COUNT(DISTINCT cr.rating_id) AS rating_count,
        COUNT(DISTINCT e.enrollment_id) AS enroll_count
      FROM "Course" c
      LEFT JOIN "User" u ON u.user_id = c.created_by
      LEFT JOIN "CourseEnrollment" e ON e.course_id = c.course_id
      LEFT JOIN "CourseRating" cr ON cr.course_id = c.course_id
      GROUP BY c.course_id, u.username
      ORDER BY c.created_at DESC
      LIMIT $1 OFFSET $2;
    `;
    const result = await databaseService.executeQuery(query, [limit, offset]);
    return result.rows.map(formatCourse);
  }

  async getPopularCourses(limit: number = 4): Promise<Course[]> {
    const query = `
      SELECT
        c.course_id, c.title, c.description, c.price, c.level, c.duration, c.created_by,
        ${finalQuizIdSelect},
        u.username AS creator_username,
        c.created_at, c.updated_at,
        COUNT(DISTINCT e.enrollment_id) AS enroll_count,
        AVG(cr.rating) AS average_rating,
        COUNT(DISTINCT cr.rating_id) AS rating_count
      FROM "Course" c
      LEFT JOIN "User" u ON u.user_id = c.created_by
      LEFT JOIN "CourseEnrollment" e ON e.course_id = c.course_id
      LEFT JOIN "CourseRating" cr ON cr.course_id = c.course_id
      GROUP BY c.course_id, u.username
      ORDER BY enroll_count DESC, c.created_at DESC
      LIMIT $1;
    `;
    const result = await databaseService.executeQuery(query, [limit]);
    return result.rows.map(formatCourse);
  }

  async getCoursesByCreator(createdBy: number, limit: number = 10, offset: number = 0): Promise<Course[]> {
    const query = `
      SELECT
        c.course_id,
        c.title,
        c.description,
        c.price,
        c.level,
        c.duration,
        c.created_by,
        ${finalQuizIdSelect},
        c.created_at,
        c.updated_at
      FROM "Course" c
      WHERE c.created_by = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3;
    `;
    const result = await databaseService.executeQuery(query, [createdBy, limit, offset]);
    return result.rows.map(formatCourse);
  }

  async updateCourse(
    courseId: number,
    title: string,
    description: string | null,
    price: number
  ): Promise<Course | null> {
    const query = `
      WITH updated AS (
        UPDATE "Course"
        SET title = $1, description = $2, price = $3, updated_at = NOW()
        WHERE course_id = $4
        RETURNING course_id, title, description, price, level, duration, created_by, created_at, updated_at
      )
      SELECT
        c.course_id, c.title, c.description, c.price, c.level, c.duration, c.created_by,
        ${finalQuizIdSelect},
        c.created_at, c.updated_at
      FROM updated c;
    `;
    const result = await databaseService.executeQuery(query, [title, description, price, courseId]);
    return result.rows[0] ? formatCourse(result.rows[0]) : null;
  }

  async getFirstLessonByCourseId(courseId: number): Promise<Lesson | null> {
    const query = `
      SELECT
        l.lesson_id,
        l.course_id,
        l.title,
        l.content_type,
        l.content_text,
        l.video_url,
        l.order_index,
        (to_jsonb(l)->>'duration')::int AS duration,
        (to_jsonb(l)->>'created_by')::int AS created_by,
        l.created_at,
        l.updated_at
      FROM "Lesson" l
      WHERE l.course_id = $1
      ORDER BY l.order_index ASC
      LIMIT 1;
    `;
    const result = await databaseService.executeQuery(query, [courseId]);
    return result.rows[0] || null;
  }

  async getLessonByCourseAndLessonId(courseId: number, lessonId: number): Promise<Lesson | null> {
    const query = `
      SELECT
        l.lesson_id,
        l.course_id,
        l.title,
        l.content_type,
        l.content_text,
        l.video_url,
        l.order_index,
        (to_jsonb(l)->>'duration')::int AS duration,
        (to_jsonb(l)->>'created_by')::int AS created_by,
        l.created_at,
        l.updated_at
      FROM "Lesson" l
      WHERE l.course_id = $1 AND l.lesson_id = $2
      LIMIT 1;
    `;

    const result = await databaseService.executeQuery(query, [courseId, lessonId]);
    return result.rows[0] || null;
  }

  async deleteCourse(courseId: number): Promise<boolean> {
    const query = `DELETE FROM "Course" WHERE course_id = $1;`;
    const result = await databaseService.executeQuery(query, [courseId]);
    return (result.rowCount ?? 0) > 0;
  }
}

export default new CourseModel();
