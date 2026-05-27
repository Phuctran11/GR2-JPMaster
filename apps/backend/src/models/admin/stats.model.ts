import databaseService from "../../services/database.service.js";
import type { AdminStats } from "../admin.model.js";

export class AdminStatsModel {
  async getStats(ownerId?: number): Promise<AdminStats> {
    const values = ownerId ? [ownerId] : [];
    const ownerCourseFilter = ownerId ? "AND created_by = $1" : "";
    const ownerLessonFilter = ownerId ? "AND c.created_by = $1" : "";
    const ownerQuizFilter = ownerId ? "AND created_by = $1" : "";
    const ownerJlptFilter = ownerId ? "AND created_by = $1" : "";
    const ownerBlogFilter = ownerId ? "AND author_id = $1" : "";
    const ownerEnrollmentFilter = ownerId ? "AND c.created_by = $1" : "";
    const ownerPaymentFilter = ownerId ? "AND c.created_by = $1" : "";
    const ownerQuizAttemptFilter = ownerId ? "AND q.created_by = $1" : "";
    const ownerJlptAttemptFilter = ownerId ? "AND je.created_by = $1" : "";

    const totalsQuery = ownerId
      ? `
        SELECT
          0::int AS users,
          (SELECT COUNT(*)::int FROM "Course" WHERE deleted_at IS NULL ${ownerCourseFilter}) AS courses,
          (SELECT COUNT(*)::int FROM "Lesson" l JOIN "Course" c ON c.course_id = l.course_id WHERE l.deleted_at IS NULL AND c.deleted_at IS NULL ${ownerLessonFilter}) AS lessons,
          (SELECT COUNT(*)::int FROM "Quiz" WHERE deleted_at IS NULL ${ownerQuizFilter}) AS tests,
          (SELECT COUNT(*)::int FROM "JLPTExam" WHERE deleted_at IS NULL ${ownerJlptFilter}) AS "jlptTests",
          (SELECT COUNT(*)::int FROM "CourseEnrollment" ce JOIN "Course" c ON c.course_id = ce.course_id WHERE c.deleted_at IS NULL ${ownerEnrollmentFilter}) AS enrollments,
          (SELECT COUNT(*)::int FROM "Blog" WHERE deleted_at IS NULL ${ownerBlogFilter}) AS blogs,
          (SELECT COUNT(*)::int FROM "QuizAttempt" qa JOIN "Quiz" q ON q.quiz_id = qa.quiz_id WHERE qa.quiz_id IS NOT NULL AND q.deleted_at IS NULL ${ownerQuizFilter.replace("created_by", "q.created_by")}) AS "quizAttempts",
          (SELECT COUNT(*)::int FROM "QuizAttempt" qa JOIN "JLPTExam" je ON je.exam_id = qa.jlpt_exam_id WHERE qa.jlpt_exam_id IS NOT NULL AND je.deleted_at IS NULL ${ownerJlptFilter.replace("created_by", "je.created_by")}) AS "jlptAttempts",
          (SELECT COUNT(*)::int FROM "PaymentTransaction" pt JOIN "Purchase" p ON p.purchase_id = pt.purchase_id JOIN "Course" c ON c.course_id = p.course_id WHERE pt.status = 'paid' ${ownerPaymentFilter}) AS "paidPayments",
          (SELECT COUNT(*)::int FROM "PaymentTransaction" pt JOIN "Purchase" p ON p.purchase_id = pt.purchase_id JOIN "Course" c ON c.course_id = p.course_id WHERE pt.status = 'pending' ${ownerPaymentFilter}) AS "pendingPayments",
          (SELECT COALESCE(SUM(pt.amount), 0)::numeric FROM "PaymentTransaction" pt JOIN "Purchase" p ON p.purchase_id = pt.purchase_id JOIN "Course" c ON c.course_id = p.course_id WHERE pt.status = 'paid' ${ownerPaymentFilter}) AS "revenueTotal",
          (SELECT COALESCE(SUM(pt.amount), 0)::numeric FROM "PaymentTransaction" pt JOIN "Purchase" p ON p.purchase_id = pt.purchase_id JOIN "Course" c ON c.course_id = p.course_id WHERE pt.status = 'paid' AND pt.paid_at >= NOW() - INTERVAL '30 days' ${ownerPaymentFilter}) AS "revenueLast30Days";
      `
      : `
        SELECT
          (SELECT COUNT(*)::int FROM "User" WHERE status <> 'deleted' AND deleted_at IS NULL) AS users,
          (SELECT COUNT(*)::int FROM "Course" WHERE deleted_at IS NULL) AS courses,
          (SELECT COUNT(*)::int FROM "Lesson" WHERE deleted_at IS NULL) AS lessons,
          (SELECT COUNT(*)::int FROM "Quiz" WHERE deleted_at IS NULL) AS tests,
          (SELECT COUNT(*)::int FROM "JLPTExam" WHERE deleted_at IS NULL) AS "jlptTests",
          (SELECT COUNT(*)::int FROM "CourseEnrollment") AS enrollments,
          (SELECT COUNT(*)::int FROM "Blog" WHERE deleted_at IS NULL) AS blogs,
          (SELECT COUNT(*)::int FROM "QuizAttempt" WHERE quiz_id IS NOT NULL) AS "quizAttempts",
          (SELECT COUNT(*)::int FROM "QuizAttempt" WHERE jlpt_exam_id IS NOT NULL) AS "jlptAttempts",
          (SELECT COUNT(*)::int FROM "PaymentTransaction" WHERE status = 'paid') AS "paidPayments",
          (SELECT COUNT(*)::int FROM "PaymentTransaction" WHERE status = 'pending') AS "pendingPayments",
          (SELECT COALESCE(SUM(amount), 0)::numeric FROM "PaymentTransaction" WHERE status = 'paid') AS "revenueTotal",
          (SELECT COALESCE(SUM(amount), 0)::numeric FROM "PaymentTransaction" WHERE status = 'paid' AND paid_at >= NOW() - INTERVAL '30 days') AS "revenueLast30Days";
      `;
    const totalsResult = await databaseService.executeQuery(totalsQuery, values);
    const usersByRoleResult = ownerId ? { rows: [] } : await databaseService.executeQuery(`
      SELECT role, COUNT(*)::int AS count
      FROM "User"
      WHERE status <> 'deleted'
        AND deleted_at IS NULL
      GROUP BY role
      ORDER BY count DESC;
    `);
    const testsByTypeResult = await databaseService.executeQuery(`
      SELECT quiz_type, COUNT(*)::int AS count
      FROM "Quiz"
      WHERE deleted_at IS NULL
        ${ownerQuizFilter}
      GROUP BY quiz_type
      ORDER BY count DESC;
    `, values);
    const jlptByLevelResult = await databaseService.executeQuery(`
      SELECT jlpt_level, COUNT(*)::int AS count
      FROM "JLPTExam"
      WHERE deleted_at IS NULL
        ${ownerJlptFilter}
      GROUP BY jlpt_level
      ORDER BY jlpt_level DESC;
    `, values);
    const paymentsByStatusResult = await databaseService.executeQuery(`
      SELECT pt.status, COUNT(*)::int AS count, COALESCE(SUM(pt.amount), 0)::numeric AS amount
      FROM "PaymentTransaction" pt
      JOIN "Purchase" p ON p.purchase_id = pt.purchase_id
      JOIN "Course" c ON c.course_id = p.course_id
      WHERE 1 = 1
        ${ownerPaymentFilter}
      GROUP BY pt.status
      ORDER BY count DESC;
    `, values);
    const revenueByDayResult = await databaseService.executeQuery(`
      SELECT pt.paid_at::date AS revenue_date,
             COALESCE(SUM(pt.amount), 0)::numeric AS revenue,
             COUNT(*)::int AS paid_count
      FROM "PaymentTransaction" pt
      JOIN "Purchase" p ON p.purchase_id = pt.purchase_id
      JOIN "Course" c ON c.course_id = p.course_id
      WHERE pt.status = 'paid'
        AND pt.paid_at >= CURRENT_DATE - INTERVAL '13 days'
        ${ownerPaymentFilter}
      GROUP BY pt.paid_at::date
      ORDER BY revenue_date ASC;
    `, values);
    const userActivitySource = ownerId
      ? "SELECT NULL::date AS activity_date, 0::int AS count WHERE FALSE"
      : `
        SELECT created_at::date AS activity_date, COUNT(*)::int AS count
        FROM "User"
        WHERE status <> 'deleted'
          AND deleted_at IS NULL
          AND created_at >= CURRENT_DATE - INTERVAL '13 days'
        GROUP BY created_at::date
      `;
    const activityByDayResult = await databaseService.executeQuery(`
      WITH days AS (
        SELECT generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, INTERVAL '1 day')::date AS activity_date
      ),
      enrollments AS (
        SELECT ce.enrollment_date::date AS activity_date, COUNT(*)::int AS count
        FROM "CourseEnrollment" ce
        JOIN "Course" c ON c.course_id = ce.course_id
        WHERE ce.enrollment_date >= CURRENT_DATE - INTERVAL '13 days'
          AND c.deleted_at IS NULL
          ${ownerEnrollmentFilter}
        GROUP BY ce.enrollment_date::date
      ),
      quiz_attempts AS (
        SELECT COALESCE(qa.submitted_at, qa.started_at)::date AS activity_date, COUNT(*)::int AS count
        FROM "QuizAttempt" qa
        JOIN "Quiz" q ON q.quiz_id = qa.quiz_id
        WHERE qa.quiz_id IS NOT NULL
          AND COALESCE(qa.submitted_at, qa.started_at) >= CURRENT_DATE - INTERVAL '13 days'
          AND q.deleted_at IS NULL
          ${ownerQuizAttemptFilter}
        GROUP BY COALESCE(qa.submitted_at, qa.started_at)::date
      ),
      jlpt_attempts AS (
        SELECT COALESCE(qa.submitted_at, qa.started_at)::date AS activity_date, COUNT(*)::int AS count
        FROM "QuizAttempt" qa
        JOIN "JLPTExam" je ON je.exam_id = qa.jlpt_exam_id
        WHERE qa.jlpt_exam_id IS NOT NULL
          AND COALESCE(qa.submitted_at, qa.started_at) >= CURRENT_DATE - INTERVAL '13 days'
          AND je.deleted_at IS NULL
          ${ownerJlptAttemptFilter}
        GROUP BY COALESCE(qa.submitted_at, qa.started_at)::date
      ),
      users AS (${userActivitySource})
      SELECT d.activity_date,
             COALESCE(e.count, 0)::int AS enrollments,
             COALESCE(q.count, 0)::int AS quiz_attempts,
             COALESCE(j.count, 0)::int AS jlpt_attempts,
             COALESCE(u.count, 0)::int AS new_users
      FROM days d
      LEFT JOIN enrollments e ON e.activity_date = d.activity_date
      LEFT JOIN quiz_attempts q ON q.activity_date = d.activity_date
      LEFT JOIN jlpt_attempts j ON j.activity_date = d.activity_date
      LEFT JOIN users u ON u.activity_date = d.activity_date
      ORDER BY d.activity_date ASC;
    `, values);
    const recentUsersResult = ownerId ? { rows: [] } : await databaseService.executeQuery(`
      SELECT user_id, username, email, role, status, created_at
      FROM "User"
      WHERE status <> 'deleted'
        AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 5;
    `);
    const recentCoursesResult = await databaseService.executeQuery(`
      SELECT course_id, title, price, level, created_at
      FROM "Course"
      WHERE deleted_at IS NULL
        ${ownerCourseFilter}
      ORDER BY created_at DESC
      LIMIT 5;
    `, values);

    return {
      totals: {
        ...totalsResult.rows[0],
        revenueTotal: Number(totalsResult.rows[0].revenueTotal),
        revenueLast30Days: Number(totalsResult.rows[0].revenueLast30Days),
      },
      usersByRole: usersByRoleResult.rows,
      testsByType: testsByTypeResult.rows,
      jlptByLevel: jlptByLevelResult.rows,
      paymentsByStatus: paymentsByStatusResult.rows.map((row) => ({ ...row, amount: Number(row.amount) })),
      revenueByDay: revenueByDayResult.rows.map((row) => ({ ...row, revenue: Number(row.revenue) })),
      activityByDay: activityByDayResult.rows,
      recentUsers: recentUsersResult.rows,
      recentCourses: recentCoursesResult.rows.map((row) => ({ ...row, price: Number(row.price) })),
    };
  }
}

export default new AdminStatsModel();
