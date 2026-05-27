import databaseService from "../../services/database.service.js";
import { formatEnrollment, formatPurchase, type CourseEnrollment } from "./enrollment.types.js";
import { assertReturnedRow } from "../modelAssertions.js";
import type { EnrollmentStatus } from "./enrollment.types.js";
import type { Purchase } from "../purchases/purchase.model.js";

export class CourseEnrollmentWriteModel {
  async enrollUser(userId: number, courseId: number, status: EnrollmentStatus = "active"): Promise<CourseEnrollment> {
    const result = await databaseService.executeQuery(
      `
        INSERT INTO "CourseEnrollment" (user_id, course_id, enrollment_date, status)
        SELECT $1, c.course_id, NOW(), $3
        FROM "Course" c
        WHERE c.course_id = $2
          AND c.deleted_at IS NULL
        ON CONFLICT (user_id, course_id)
        DO UPDATE SET
          enrollment_date = NOW(),
          status = EXCLUDED.status
        RETURNING enrollment_id, user_id, course_id, enrollment_date, status;
      `,
      [userId, courseId, status]
    );

    return formatEnrollment(assertReturnedRow(result.rows[0], "Failed to create enrollment record"));
  }

  async enrollUserWithCompletedPurchase(
    userId: number,
    courseId: number,
    pricePaid = 0
  ): Promise<{ enrollment: CourseEnrollment; purchase: Purchase }> {
    return databaseService.withTransaction(async (client) => {
      const enrollmentResult = await client.query(
        `
          INSERT INTO "CourseEnrollment" (user_id, course_id, enrollment_date, status)
          SELECT $1, c.course_id, NOW(), 'active'
          FROM "Course" c
          WHERE c.course_id = $2
            AND c.deleted_at IS NULL
          ON CONFLICT (user_id, course_id)
          DO UPDATE SET
            enrollment_date = NOW(),
            status = EXCLUDED.status
          RETURNING enrollment_id, user_id, course_id, enrollment_date, status;
        `,
        [userId, courseId]
      );

      const enrollment = assertReturnedRow(enrollmentResult.rows[0], "Failed to create enrollment record");

      const purchaseResult = await client.query(
        `
          INSERT INTO "Purchase" (user_id, course_id, price_paid, status, purchase_date)
          VALUES ($1, $2, $3, 'completed', NOW())
          RETURNING purchase_id, user_id, course_id, purchase_date, price_paid, status;
        `,
        [userId, courseId, pricePaid]
      );

      const purchase = assertReturnedRow(purchaseResult.rows[0], "Failed to create purchase record");

      return {
        enrollment: formatEnrollment(enrollment),
        purchase: formatPurchase(purchase),
      };
    });
  }

  async updateEnrollmentStatus(enrollmentId: number, status: EnrollmentStatus): Promise<CourseEnrollment | null> {
    const result = await databaseService.executeQuery(
      `
        UPDATE "CourseEnrollment"
        SET status = $1
        WHERE enrollment_id = $2
        RETURNING enrollment_id, user_id, course_id, enrollment_date, status;
      `,
      [status, enrollmentId]
    );
    return result.rows[0] ? formatEnrollment(result.rows[0]) : null;
  }

  async updateEnrollmentStatusByUserAndCourse(
    userId: number,
    courseId: number,
    status: EnrollmentStatus
  ): Promise<CourseEnrollment | null> {
    const result = await databaseService.executeQuery(
      `
        UPDATE "CourseEnrollment"
        SET status = $1
        WHERE user_id = $2 AND course_id = $3
        RETURNING enrollment_id, user_id, course_id, enrollment_date, status;
      `,
      [status, userId, courseId]
    );
    return result.rows[0] ? formatEnrollment(result.rows[0]) : null;
  }

  async deleteEnrollment(enrollmentId: number): Promise<boolean> {
    const result = await databaseService.executeQuery(
      `
        UPDATE "CourseEnrollment"
        SET status = 'dropped'
        WHERE enrollment_id = $1
        RETURNING enrollment_id;
      `,
      [enrollmentId]
    );
    return (result.rowCount ?? 0) > 0;
  }
}

export default new CourseEnrollmentWriteModel();
