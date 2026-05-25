export interface Lesson {
  lesson_id: number;
  course_id: number;
  title: string;
  content_text: string | null;
  video_asset_id: number | null;
  video_url: string | null;
  audio_asset_id: number | null;
  audio_url: string | null;
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
  cover_asset_id: number | null;
  image_url: string | null;
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
  cover_asset_id: number | null;
  image_url: string | null;
  created_by: number;
  final_quiz_id: number | null;
  creator_username?: string;
  created_at: Date;
  updated_at: Date;
  average_rating?: number;
  rating_count?: number;
  enroll_count?: number;
}

export const formatCourse = (row: any): Course => ({
  ...row,
  price: Number(row.price),
  duration: row.duration != null ? Number(row.duration) : null,
  final_quiz_id: row.final_quiz_id != null ? Number(row.final_quiz_id) : null,
  average_rating: row.average_rating != null ? Number(row.average_rating) : undefined,
  rating_count: row.rating_count != null ? Number(row.rating_count) : undefined,
  enroll_count: row.enroll_count != null ? Number(row.enroll_count) : undefined,
});

export const formatCourseWithLessons = (courseRow: any, lessons: Lesson[] = []): CourseWithLessons => ({
  ...courseRow,
  price: Number(courseRow.price),
  duration: courseRow.duration != null ? Number(courseRow.duration) : null,
  final_quiz_id: courseRow.final_quiz_id != null ? Number(courseRow.final_quiz_id) : null,
  is_free: Number(courseRow.price) === 0,
  creator_username: courseRow.creator_username,
  lessons,
});

export const finalQuizIdSelect = `
  (
    SELECT q.quiz_id
    FROM "Quiz" q
    WHERE q.course_id = c.course_id
      AND q.quiz_type = 'final_test'
      AND q.deleted_at IS NULL
    ORDER BY q.quiz_id DESC
    LIMIT 1
  ) AS final_quiz_id
`;

export const courseBaseSelect = `
  c.course_id, c.title, c.description, c.price, c.level, c.duration, c.cover_asset_id, c.image_url, c.created_by,
  ${finalQuizIdSelect},
  c.created_at, c.updated_at
`;

export const courseBaseSelectWithCreator = `
  c.course_id, c.title, c.description, c.price, c.level, c.duration, c.cover_asset_id, c.image_url, c.created_by,
  ${finalQuizIdSelect},
  u.username AS creator_username,
  c.created_at, c.updated_at
`;

export const courseAggregateSelectWithCreator = `
  ${courseBaseSelectWithCreator},
  AVG(cr.rating) AS average_rating,
  COUNT(DISTINCT cr.rating_id) AS rating_count,
  COUNT(DISTINCT e.enrollment_id) AS enroll_count
`;

export const lessonSelect = `
  l.lesson_id,
  l.course_id,
  l.title,
  l.content_text,
  (to_jsonb(l)->>'video_asset_id')::int AS video_asset_id,
  l.video_url,
  (to_jsonb(l)->>'audio_asset_id')::int AS audio_asset_id,
  to_jsonb(l)->>'audio_url' AS audio_url,
  l.order_index,
  (to_jsonb(l)->>'duration')::int AS duration,
  (to_jsonb(l)->>'created_by')::int AS created_by,
  l.created_at,
  l.updated_at
`;
