import assert from "node:assert/strict";
import { after } from "node:test";
import pool from "../../config/database.js";
import databaseService from "../../services/database.service.js";
import { assertIntegrationDatabaseAllowed, integrationTest, runIntegrationTests } from "../integrationTest.helpers.js";
import paymentModel from "./payment.model.js";

assertIntegrationDatabaseAllowed();

const testRunId = `it_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
const createdUserIds: number[] = [];
const createdCourseIds: number[] = [];

const createSeedUserAndCourse = async () => {
  const userResult = await databaseService.executeQuery(
    `
      INSERT INTO "User" (username, email, password_hash, role, status, created_at, updated_at)
      VALUES ($1, $2, 'integration-test-password-hash', 'learner', 'active', NOW(), NOW())
      RETURNING user_id, email;
    `,
    [`${testRunId}_user_${createdUserIds.length}`, `${testRunId}_${createdUserIds.length}@example.test`]
  );
  const user = userResult.rows[0];
  createdUserIds.push(user.user_id);

  const ownerResult = await databaseService.executeQuery(
    `
      INSERT INTO "User" (username, email, password_hash, role, status, created_at, updated_at)
      VALUES ($1, $2, 'integration-test-password-hash', 'owner', 'active', NOW(), NOW())
      RETURNING user_id;
    `,
    [`${testRunId}_owner_${createdUserIds.length}`, `${testRunId}_owner_${createdUserIds.length}@example.test`]
  );
  const owner = ownerResult.rows[0];
  createdUserIds.push(owner.user_id);

  const courseResult = await databaseService.executeQuery(
    `
      INSERT INTO "Course" (title, description, level, duration, price, created_by, created_at, updated_at)
      VALUES ($1, 'Integration test course', 'beginner', 60, 100000, $2, NOW(), NOW())
      RETURNING course_id;
    `,
    [`${testRunId}_course_${createdCourseIds.length}`, owner.user_id]
  );
  const course = courseResult.rows[0];
  createdCourseIds.push(course.course_id);

  return { user, course };
};

const createPendingPayment = async (amount = 100000) => {
  const { user, course } = await createSeedUserAndCourse();
  const orderCode = Date.now() * 1000 + Math.floor(Math.random() * 1000);
  const payment = await paymentModel.createPayOsTransaction({
    userId: user.user_id,
    courseId: course.course_id,
    amount,
    orderCode,
    paymentContent: `JPM${orderCode}`,
    checkoutUrl: "https://checkout.example.test",
    qrCode: null,
    paymentLinkId: `plink_${orderCode}`,
    rawResponse: { integration_test: true },
    expiresInMinutes: 30,
  });

  return { user, course, orderCode, payment };
};

after(async () => {
  if (runIntegrationTests) {
    await databaseService.executeQuery(
      `DELETE FROM "CourseEnrollment" WHERE user_id = ANY($1::int[]) OR course_id = ANY($2::int[])`,
      [createdUserIds, createdCourseIds]
    );
    await databaseService.executeQuery(
      `DELETE FROM "PaymentTransaction" WHERE purchase_id IN (SELECT purchase_id FROM "Purchase" WHERE user_id = ANY($1::int[]))`,
      [createdUserIds]
    );
    await databaseService.executeQuery(`DELETE FROM "Purchase" WHERE user_id = ANY($1::int[])`, [createdUserIds]);
    await databaseService.executeQuery(`DELETE FROM "Course" WHERE course_id = ANY($1::int[])`, [createdCourseIds]);
    await databaseService.executeQuery(`DELETE FROM "User" WHERE user_id = ANY($1::int[])`, [createdUserIds]);
  }

  await pool.end();
});

integrationTest("payment webhook confirms pending transaction and enrolls user", async () => {
  const { user, course, orderCode, payment } = await createPendingPayment();

  const enrollment = await paymentModel.confirmPayOsWebhook({
    orderCode,
    amount: 100000,
    paymentLinkId: "paid_link",
    rawPayload: { code: "00" },
  });

  assert.ok(enrollment);
  assert.equal(enrollment.user_id, user.user_id);
  assert.equal(enrollment.course_id, course.course_id);

  const transaction = await paymentModel.getTransactionWithPurchase(payment.transaction.payment_transaction_id);
  assert.equal(transaction.status, "paid");
  assert.equal(transaction.purchase_status, "completed");
});

integrationTest("payment webhook amount mismatch does not complete purchase", async () => {
  const { orderCode, payment } = await createPendingPayment(100000);

  const enrollment = await paymentModel.confirmPayOsWebhook({
    orderCode,
    amount: 50000,
    paymentLinkId: "underpaid_link",
    rawPayload: { code: "00" },
  });

  assert.equal(enrollment, null);
  const transaction = await paymentModel.getTransactionWithPurchase(payment.transaction.payment_transaction_id);
  assert.equal(transaction.status, "pending");
  assert.equal(transaction.purchase_status, "pending");
});

integrationTest("duplicate paid webhook remains idempotent through enrollment conflict", async () => {
  const { user, course, orderCode } = await createPendingPayment();

  const firstResult = await paymentModel.confirmPayOsWebhook({ orderCode, amount: 100000, rawPayload: { code: "00" } });
  const secondResult = await paymentModel.confirmPayOsWebhook({ orderCode, amount: 100000, rawPayload: { code: "00" } });

  assert.ok(firstResult);
  assert.equal(secondResult, null);

  const countResult = await databaseService.executeQuery(
    `
      SELECT COUNT(*)::int AS count
      FROM "CourseEnrollment"
      WHERE user_id = $1 AND course_id = $2;
    `,
    [user.user_id, course.course_id]
  );
  assert.equal(Number(countResult.rows[0].count), 1);
});
