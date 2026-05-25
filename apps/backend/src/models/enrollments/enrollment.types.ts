import type { Purchase } from "../purchases/purchase.model.js";

export const ENROLLMENT_STATUSES = ["active", "completed", "dropped"] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export interface CourseEnrollment {
  enrollment_id: number;
  user_id: number;
  course_id: number;
  enrollment_date: Date;
  status: EnrollmentStatus;
}

export const formatEnrollment = (row: any): CourseEnrollment => ({
  enrollment_id: row.enrollment_id,
  user_id: row.user_id,
  course_id: row.course_id,
  enrollment_date: row.enrollment_date,
  status: row.status,
});

export const formatPurchase = (row: any): Purchase => ({
  purchase_id: row.purchase_id,
  user_id: row.user_id,
  course_id: row.course_id,
  purchase_date: row.purchase_date,
  price_paid: Number(row.price_paid),
  status: row.status,
});

