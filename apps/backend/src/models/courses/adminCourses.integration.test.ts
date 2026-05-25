import assert from "node:assert/strict";
import { after } from "node:test";
import pool from "../../config/database.js";
import databaseService from "../../services/database.service.js";
import adminCoursesModel from "../admin/courses.model.js";
import adminLessonsModel from "../admin/lessons.model.js";
import adminQuizzesModel from "../admin/quizzes.model.js";
import { assertIntegrationDatabaseAllowed, integrationTest, runIntegrationTests } from "../integrationTest.helpers.js";

assertIntegrationDatabaseAllowed();

const testRunId = `acit_${Math.floor(Math.random() * 100000).toString(36)}`;
const createdUserIds: number[] = [];
const createdCourseIds: number[] = [];
const createdLessonIds: number[] = [];
const createdQuizIds: number[] = [];

const createOwner = async (suffix: string) => {
  const result = await databaseService.executeQuery(
    `
      INSERT INTO "User" (username, email, password_hash, role, status, created_at, updated_at)
      VALUES ($1, $2, 'integration-test-password-hash', 'owner', 'active', NOW(), NOW())
      RETURNING user_id;
    `,
    [`${testRunId}_${suffix}`, `${testRunId}_${suffix}@example.test`]
  );
  const user = result.rows[0];
  createdUserIds.push(user.user_id);
  return user;
};

const createCourse = async (ownerId: number, suffix: string) => {
  const result = await databaseService.executeQuery(
    `
      INSERT INTO "Course" (title, description, level, duration, price, created_by, created_at, updated_at)
      VALUES ($1, 'Admin course integration test', 'beginner', 60, 100000, $2, NOW(), NOW())
      RETURNING course_id;
    `,
    [`${testRunId}_${suffix}`, ownerId]
  );
  const course = result.rows[0];
  createdCourseIds.push(course.course_id);
  return course;
};

const addLessonAndQuiz = async (courseId: number, ownerId: number) => {
  const lessonResult = await databaseService.executeQuery(
    `
      INSERT INTO "Lesson" (course_id, title, content_text, order_index, duration, created_at, updated_at)
      VALUES ($1, 'Integration lesson', 'content', 1, 10, NOW(), NOW())
      RETURNING lesson_id;
    `,
    [courseId]
  );
  const lesson = lessonResult.rows[0];
  createdLessonIds.push(lesson.lesson_id);

  const quizResult = await databaseService.executeQuery(
    `
      INSERT INTO "Quiz" (course_id, lesson_id, title, quiz_type, passing_score, total_marks, created_by, created_at, updated_at)
      VALUES ($1, $2, 'Integration quiz', 'lesson_quiz', 70, 1, $3, NOW(), NOW())
      RETURNING quiz_id;
    `,
    [courseId, lesson.lesson_id, ownerId]
  );
  const quiz = quizResult.rows[0];
  createdQuizIds.push(quiz.quiz_id);

  return { lesson, quiz };
};

after(async () => {
  if (runIntegrationTests) {
    await databaseService.executeQuery(`DELETE FROM "Quiz" WHERE quiz_id = ANY($1::int[])`, [createdQuizIds]);
    await databaseService.executeQuery(`DELETE FROM "Lesson" WHERE lesson_id = ANY($1::int[])`, [createdLessonIds]);
    await databaseService.executeQuery(`DELETE FROM "Course" WHERE course_id = ANY($1::int[])`, [createdCourseIds]);
    await databaseService.executeQuery(`DELETE FROM "User" WHERE user_id = ANY($1::int[])`, [createdUserIds]);
  }

  await pool.end();
});

integrationTest("owner cannot update another owner's course", async () => {
  const owner = await createOwner("owner_a");
  const otherOwner = await createOwner("owner_b");
  const course = await createCourse(owner.user_id, "owned_course");

  const result = await adminCoursesModel.updateCourse(course.course_id, { title: "blocked update" }, otherOwner.user_id);

  assert.equal(result, null);
});

integrationTest("owner course delete soft-deletes lessons and quizzes", async () => {
  const owner = await createOwner("delete_owner");
  const course = await createCourse(owner.user_id, "delete_course");
  const { lesson, quiz } = await addLessonAndQuiz(course.course_id, owner.user_id);

  const deleted = await adminCoursesModel.deleteCourse(course.course_id, owner.user_id);

  assert.equal(deleted, true);

  const stateResult = await databaseService.executeQuery(
    `
      SELECT
        c.deleted_at AS course_deleted_at,
        l.deleted_at AS lesson_deleted_at,
        q.deleted_at AS quiz_deleted_at
      FROM "Course" c
      JOIN "Lesson" l ON l.lesson_id = $2
      JOIN "Quiz" q ON q.quiz_id = $3
      WHERE c.course_id = $1;
    `,
    [course.course_id, lesson.lesson_id, quiz.quiz_id]
  );

  assert.ok(stateResult.rows[0].course_deleted_at);
  assert.ok(stateResult.rows[0].lesson_deleted_at);
  assert.ok(stateResult.rows[0].quiz_deleted_at);
});

integrationTest("owner cannot create quiz for another owner's course", async () => {
  const owner = await createOwner("quiz_owner_a");
  const otherOwner = await createOwner("quiz_owner_b");
  const otherCourse = await createCourse(otherOwner.user_id, "other_owner_quiz_course");

  const quiz = await adminQuizzesModel.createQuiz({
    course_id: otherCourse.course_id,
    lesson_id: null,
    title: "Blocked owner quiz",
    description: null,
    quiz_type: "final_test",
    passing_score: 70,
    total_marks: 100,
    time_limit_minutes: null,
    created_by: owner.user_id,
    owner_id: owner.user_id,
  });

  assert.equal(quiz, null);
});

integrationTest("owner cannot reassign quiz to another owner's course", async () => {
  const owner = await createOwner("reassign_owner_a");
  const otherOwner = await createOwner("reassign_owner_b");
  const ownedCourse = await createCourse(owner.user_id, "owned_quiz_course");
  const otherCourse = await createCourse(otherOwner.user_id, "target_other_course");
  const { quiz } = await addLessonAndQuiz(ownedCourse.course_id, owner.user_id);

  const updated = await adminQuizzesModel.updateQuiz(quiz.quiz_id, {
    course_id: otherCourse.course_id,
  }, owner.user_id);

  assert.equal(updated, null);

  const stateResult = await databaseService.executeQuery(
    `SELECT course_id FROM "Quiz" WHERE quiz_id = $1;`,
    [quiz.quiz_id]
  );
  assert.equal(stateResult.rows[0].course_id, ownedCourse.course_id);
});

integrationTest("owner cannot create lesson for another owner's course", async () => {
  const owner = await createOwner("lesson_owner_a");
  const otherOwner = await createOwner("lesson_owner_b");
  const otherCourse = await createCourse(otherOwner.user_id, "other_owner_lesson_course");

  const lesson = await adminLessonsModel.createLesson({
    course_id: otherCourse.course_id,
    title: "Blocked owner lesson",
    content_text: "content",
    video_asset_id: null,
    video_url: null,
    audio_asset_id: null,
    audio_url: null,
    order_index: 1,
    duration: 10,
    owner_id: owner.user_id,
  });

  assert.equal(lesson, null);
});

integrationTest("owner cannot update another owner's lesson", async () => {
  const owner = await createOwner("lesson_update_owner_a");
  const otherOwner = await createOwner("lesson_update_owner_b");
  const otherCourse = await createCourse(otherOwner.user_id, "other_lesson_update_course");
  const { lesson } = await addLessonAndQuiz(otherCourse.course_id, otherOwner.user_id);

  const updated = await adminLessonsModel.updateLesson(lesson.lesson_id, { title: "blocked update" }, owner.user_id);

  assert.equal(updated, null);

  const stateResult = await databaseService.executeQuery(
    `SELECT title FROM "Lesson" WHERE lesson_id = $1;`,
    [lesson.lesson_id]
  );
  assert.equal(stateResult.rows[0].title, "Integration lesson");
});

integrationTest("owner cannot delete another owner's lesson", async () => {
  const owner = await createOwner("lesson_delete_owner_a");
  const otherOwner = await createOwner("lesson_delete_owner_b");
  const otherCourse = await createCourse(otherOwner.user_id, "other_lesson_delete_course");
  const { lesson } = await addLessonAndQuiz(otherCourse.course_id, otherOwner.user_id);

  const deleted = await adminLessonsModel.deleteLesson(lesson.lesson_id, owner.user_id);

  assert.equal(deleted, false);

  const stateResult = await databaseService.executeQuery(
    `SELECT deleted_at FROM "Lesson" WHERE lesson_id = $1;`,
    [lesson.lesson_id]
  );
  assert.equal(stateResult.rows[0].deleted_at, null);
});
