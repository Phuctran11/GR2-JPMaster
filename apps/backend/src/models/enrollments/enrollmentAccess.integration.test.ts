import assert from "node:assert/strict";
import { after } from "node:test";
import pool from "../../config/database.js";
import databaseService from "../../services/database.service.js";
import enrollmentService from "../../services/enrollments/enrollment.service.js";
import enrollmentModel from "./enrollment.model.js";
import { assertIntegrationDatabaseAllowed, integrationTest, runIntegrationTests } from "../integrationTest.helpers.js";

assertIntegrationDatabaseAllowed();

const testRunId = `eait_${Math.floor(Math.random() * 100000).toString(36)}`;
const createdUserIds: number[] = [];
const createdCourseIds: number[] = [];
const createdLessonIds: number[] = [];
const createdQuizIds: number[] = [];

const createUser = async () => {
  const result = await databaseService.executeQuery(
    `
      INSERT INTO "User" (username, email, password_hash, role, status, created_at, updated_at)
      VALUES ($1, $2, 'integration-test-password-hash', 'learner', 'active', NOW(), NOW())
      RETURNING user_id;
    `,
    [`${testRunId}_user_${createdUserIds.length}`, `${testRunId}_${createdUserIds.length}@example.test`]
  );
  const user = result.rows[0];
  createdUserIds.push(user.user_id);
  return user;
};

const createCourse = async (userId: number, suffix: string, deleted = false) => {
  const result = await databaseService.executeQuery(
    `
      INSERT INTO "Course" (title, description, level, duration, price, created_by, deleted_at, created_at, updated_at)
      VALUES ($1, 'Enrollment access integration test', 'beginner', 60, 0, $2, ${deleted ? "NOW()" : "NULL"}, NOW(), NOW())
      RETURNING course_id;
    `,
    [`${testRunId}_${suffix}`, userId]
  );
  const course = result.rows[0];
  createdCourseIds.push(course.course_id);
  return course;
};

const createEnrollment = async (userId: number, courseId: number, status: "active" | "completed" | "dropped" = "active") => {
  const result = await databaseService.executeQuery(
    `
      INSERT INTO "CourseEnrollment" (user_id, course_id, enrollment_date, status)
      VALUES ($1, $2, NOW(), $3)
      RETURNING enrollment_id;
    `,
    [userId, courseId, status]
  );
  return result.rows[0];
};

const createFinalQuiz = async (userId: number, courseId: number) => {
  const result = await databaseService.executeQuery(
    `
      INSERT INTO "Quiz" (course_id, title, quiz_type, passing_score, total_marks, created_by, created_at, updated_at)
      VALUES ($1, 'Integration final quiz', 'final_test', 70, 1, $2, NOW(), NOW())
      RETURNING quiz_id;
    `,
    [courseId, userId]
  );
  const quiz = result.rows[0];
  createdQuizIds.push(quiz.quiz_id);
  return quiz;
};

const createLesson = async (courseId: number, suffix: string) => {
  const result = await databaseService.executeQuery(
    `
      INSERT INTO "Lesson" (course_id, title, content_text, order_index, duration, created_at, updated_at)
      VALUES ($1, $2, 'Enrollment completion integration lesson', 1, 10, NOW(), NOW())
      RETURNING lesson_id;
    `,
    [courseId, `${testRunId}_${suffix}`]
  );
  const lesson = result.rows[0];
  createdLessonIds.push(lesson.lesson_id);
  return lesson;
};

const createPassedQuizAttempt = async (userId: number, quizId: number, score = 100) => {
  await databaseService.executeQuery(
    `
      INSERT INTO "QuizAttempt" (user_id, quiz_id, started_at, submitted_at, score, total_marks, status)
      VALUES ($1, $2, NOW(), NOW(), $3, 100, 'graded');
    `,
    [userId, quizId, score]
  );
};

after(async () => {
  if (runIntegrationTests) {
    await databaseService.executeQuery(`DELETE FROM "QuizAttempt" WHERE user_id = ANY($1::int[])`, [createdUserIds]);
    await databaseService.executeQuery(`DELETE FROM "UserLessonProgress" WHERE user_id = ANY($1::int[])`, [createdUserIds]);
    await databaseService.executeQuery(`DELETE FROM "Quiz" WHERE quiz_id = ANY($1::int[])`, [createdQuizIds]);
    await databaseService.executeQuery(`DELETE FROM "CourseEnrollment" WHERE user_id = ANY($1::int[])`, [createdUserIds]);
    await databaseService.executeQuery(`DELETE FROM "Lesson" WHERE lesson_id = ANY($1::int[])`, [createdLessonIds]);
    await databaseService.executeQuery(`DELETE FROM "Course" WHERE course_id = ANY($1::int[])`, [createdCourseIds]);
    await databaseService.executeQuery(`DELETE FROM "User" WHERE user_id = ANY($1::int[])`, [createdUserIds]);
  }

  await pool.end();
});

integrationTest("checkUserCourseAccess ignores enrollments for deleted courses", async () => {
  const user = await createUser();
  const course = await createCourse(user.user_id, "deleted_course", true);
  await createEnrollment(user.user_id, course.course_id, "active");

  const hasAccess = await enrollmentModel.checkUserCourseAccess(user.user_id, course.course_id);

  assert.equal(hasAccess, false);
});

integrationTest("completed enrollment with unpassed final quiz is effectively active", async () => {
  const user = await createUser();
  const course = await createCourse(user.user_id, "final_quiz_course");
  await createLesson(course.course_id, "final_quiz_course_lesson");
  await createEnrollment(user.user_id, course.course_id, "completed");
  await createFinalQuiz(user.user_id, course.course_id);

  const activeEnrollments = await enrollmentModel.getEnrolledCoursesByEffectiveStatus(user.user_id, "active", 10, 0);
  const completedCount = await enrollmentModel.getEnrolledCourseCountByEffectiveStatus(user.user_id, "completed");

  assert.equal(activeEnrollments.some((enrollment) => enrollment.course_id === course.course_id), true);
  assert.equal(completedCount, 0);
});

integrationTest("markLessonCompleted keeps enrollment active when final quiz is not passed", async () => {
  const user = await createUser();
  const course = await createCourse(user.user_id, "completion_final_required");
  const lesson = await createLesson(course.course_id, "completion_final_required_lesson");
  await createEnrollment(user.user_id, course.course_id, "active");
  await createFinalQuiz(user.user_id, course.course_id);

  const result = await enrollmentService.markLessonCompleted(user.user_id, course.course_id, lesson.lesson_id);
  assert.equal(result.needsLessonQuiz, false);
  if (result.needsLessonQuiz) return;

  assert.equal(result.data.course_completed, false);
  assert.equal(result.data.needs_final_quiz, true);
  assert.equal(result.data.enrollment_status, "active");

  const enrollment = await enrollmentModel.getEnrollmentByUserAndCourse(user.user_id, course.course_id);
  assert.equal(enrollment?.status, "active");
});

integrationTest("markLessonCompleted completes enrollment when all lessons and final quiz are passed", async () => {
  const user = await createUser();
  const course = await createCourse(user.user_id, "completion_done");
  const lesson = await createLesson(course.course_id, "completion_done_lesson");
  await createEnrollment(user.user_id, course.course_id, "active");
  const finalQuiz = await createFinalQuiz(user.user_id, course.course_id);
  await createPassedQuizAttempt(user.user_id, finalQuiz.quiz_id);

  const result = await enrollmentService.markLessonCompleted(user.user_id, course.course_id, lesson.lesson_id);
  assert.equal(result.needsLessonQuiz, false);
  if (result.needsLessonQuiz) return;

  assert.equal(result.data.course_completed, true);
  assert.equal(result.data.needs_final_quiz, false);
  assert.equal(result.data.enrollment_status, "completed");

  const enrollment = await enrollmentModel.getEnrollmentByUserAndCourse(user.user_id, course.course_id);
  assert.equal(enrollment?.status, "completed");
});
