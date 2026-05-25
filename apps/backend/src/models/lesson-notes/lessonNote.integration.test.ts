import assert from "node:assert/strict";
import { after } from "node:test";
import pool from "../../config/database.js";
import databaseService from "../../services/database.service.js";
import lessonNoteModel from "./lessonNote.model.js";
import { assertIntegrationDatabaseAllowed, integrationTest, runIntegrationTests } from "../integrationTest.helpers.js";

assertIntegrationDatabaseAllowed();

const testRunId = `lnit_${Math.floor(Math.random() * 100000).toString(36)}`;
const createdUserIds: number[] = [];
const createdCourseIds: number[] = [];
const createdLessonIds: number[] = [];
const createdNoteIds: number[] = [];

const createUser = async (suffix: string, role: "learner" | "owner") => {
  const result = await databaseService.executeQuery(
    `
      INSERT INTO "User" (username, email, password_hash, role, status, created_at, updated_at)
      VALUES ($1, $2, 'integration-test-password-hash', $3, 'active', NOW(), NOW())
      RETURNING user_id;
    `,
    [`${testRunId}_${suffix}`, `${testRunId}_${suffix}@example.test`, role]
  );
  const user = result.rows[0];
  createdUserIds.push(user.user_id);
  return user;
};

const createLesson = async (ownerId: number) => {
  const courseResult = await databaseService.executeQuery(
    `
      INSERT INTO "Course" (title, description, level, duration, price, created_by, created_at, updated_at)
      VALUES ($1, 'Lesson note integration test', 'beginner', 60, 100000, $2, NOW(), NOW())
      RETURNING course_id;
    `,
    [`${testRunId}_course`, ownerId]
  );
  const course = courseResult.rows[0];
  createdCourseIds.push(course.course_id);

  const lessonResult = await databaseService.executeQuery(
    `
      INSERT INTO "Lesson" (course_id, title, content_text, order_index, duration, created_at, updated_at)
      VALUES ($1, 'Integration lesson', 'content', 1, 10, NOW(), NOW())
      RETURNING lesson_id;
    `,
    [course.course_id]
  );
  const lesson = lessonResult.rows[0];
  createdLessonIds.push(lesson.lesson_id);
  return lesson;
};

after(async () => {
  if (runIntegrationTests) {
    await databaseService.executeQuery(`DELETE FROM "LessonNote" WHERE note_id = ANY($1::int[])`, [createdNoteIds]);
    await databaseService.executeQuery(`DELETE FROM "Lesson" WHERE lesson_id = ANY($1::int[])`, [createdLessonIds]);
    await databaseService.executeQuery(`DELETE FROM "Course" WHERE course_id = ANY($1::int[])`, [createdCourseIds]);
    await databaseService.executeQuery(`DELETE FROM "User" WHERE user_id = ANY($1::int[])`, [createdUserIds]);
  }

  await pool.end();
});

integrationTest("duplicate text lesson notes upsert into one scoped row", async () => {
  const owner = await createUser("owner", "owner");
  const learner = await createUser("learner", "learner");
  const lesson = await createLesson(owner.user_id);

  const [first, second] = await Promise.all([
    lessonNoteModel.createNote(learner.user_id, {
      lessonId: lesson.lesson_id,
      noteType: "text_note",
      noteContent: "first note content",
      isPinned: false,
    }),
    lessonNoteModel.createNote(learner.user_id, {
      lessonId: lesson.lesson_id,
      noteType: "text_note",
      noteContent: "second note content",
      isPinned: true,
    }),
  ]);
  createdNoteIds.push(first.note_id, second.note_id);

  assert.equal(first.note_id, second.note_id);

  const countResult = await databaseService.executeQuery(
    `
      SELECT COUNT(*)::int AS total
      FROM "LessonNote"
      WHERE user_id = $1
        AND lesson_id = $2
        AND note_type = 'text_note'
        AND is_deleted = FALSE;
    `,
    [learner.user_id, lesson.lesson_id]
  );

  assert.equal(countResult.rows[0].total, 1);
});
