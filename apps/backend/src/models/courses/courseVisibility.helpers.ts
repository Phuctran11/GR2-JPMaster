export const activeCourseLessonExistsSql = (courseAlias = "c") => `
  EXISTS (
    SELECT 1
    FROM "Lesson" visible_lesson
    WHERE visible_lesson.course_id = ${courseAlias}.course_id
      AND visible_lesson.deleted_at IS NULL
  )
`;
