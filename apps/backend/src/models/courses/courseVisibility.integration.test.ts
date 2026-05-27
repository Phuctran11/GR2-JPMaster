import assert from "node:assert/strict";
import { after } from "node:test";
import pool from "../../config/database.js";
import databaseService from "../../services/database.service.js";
import courseModel from "./course.model.js";
import { assertIntegrationDatabaseAllowed, integrationTest, runIntegrationTests } from "../integrationTest.helpers.js";

assertIntegrationDatabaseAllowed();

const testRunId = `cvit_${Math.floor(Math.random() * 100000).toString(36)}`;
const createdUserIds: number[] = [];
const createdCourseIds: number[] = [];
const createdLessonIds: number[] = [];

const createOwner = async () => {
  const result = await databaseService.executeQuery(
    `
      INSERT INTO "User" (username, email, password_hash, role, status, created_at, updated_at)
      VALUES ($1, $2, 'integration-test-password-hash', 'owner', 'active', NOW(), NOW())
      RETURNING user_id;
    `,
    [`${testRunId}_owner`, `${testRunId}_owner@example.test`]
  );
  const user = result.rows[0];
  createdUserIds.push(user.user_id);
  return user;
};

const createCourse = async (ownerId: number, suffix: string) => {
  const result = await databaseService.executeQuery(
    `
      INSERT INTO "Course" (title, description, level, duration, price, created_by, created_at, updated_at)
      VALUES ($1, 'Course visibility integration test', 'beginner', 60, 0, $2, NOW(), NOW())
      RETURNING course_id;
    `,
    [`${testRunId}_${suffix}`, ownerId]
  );
  const course = result.rows[0];
  createdCourseIds.push(course.course_id);
  return course;
};

const createLesson = async (courseId: number) => {
  const result = await databaseService.executeQuery(
    `
      INSERT INTO "Lesson" (course_id, title, content_text, order_index, duration, created_at, updated_at)
      VALUES ($1, 'Visible lesson', 'content', 1, 10, NOW(), NOW())
      RETURNING lesson_id;
    `,
    [courseId]
  );
  const lesson = result.rows[0];
  createdLessonIds.push(lesson.lesson_id);
  return lesson;
};

after(async () => {
  if (runIntegrationTests) {
    await databaseService.executeQuery(`DELETE FROM "Lesson" WHERE lesson_id = ANY($1::int[])`, [createdLessonIds]);
    await databaseService.executeQuery(`DELETE FROM "Course" WHERE course_id = ANY($1::int[])`, [createdCourseIds]);
    await databaseService.executeQuery(`DELETE FROM "User" WHERE user_id = ANY($1::int[])`, [createdUserIds]);
  }

  await pool.end();
});

integrationTest("user-facing course reads hide courses without active lessons", async () => {
  const owner = await createOwner();
  const hiddenCourse = await createCourse(owner.user_id, "hidden_no_lesson");
  const visibleCourse = await createCourse(owner.user_id, "visible_with_lesson");
  await createLesson(visibleCourse.course_id);

  const [allCourses, hiddenDetail, visibleDetail, creatorCourses] = await Promise.all([
    courseModel.getAllCourses(100, 0),
    courseModel.getCourseById(hiddenCourse.course_id),
    courseModel.getCourseById(visibleCourse.course_id),
    courseModel.getCoursesByCreator(owner.user_id, 100, 0),
  ]);

  assert.equal(hiddenDetail, null);
  assert.ok(visibleDetail);
  assert.equal(allCourses.some((course) => course.course_id === hiddenCourse.course_id), false);
  assert.equal(allCourses.some((course) => course.course_id === visibleCourse.course_id), true);
  assert.equal(creatorCourses.some((course) => course.course_id === hiddenCourse.course_id), false);
  assert.equal(creatorCourses.some((course) => course.course_id === visibleCourse.course_id), true);
});
