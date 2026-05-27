import type { EnrollmentStatus } from "./enrollment.types.js";

export const finalQuizExistsSql = `
  EXISTS (
    SELECT 1
    FROM "Quiz" q
    WHERE q.course_id = ce.course_id
      AND q.quiz_type = 'final_test'
      AND q.deleted_at IS NULL
  )
`;

export const finalQuizPassedSql = `
  EXISTS (
    SELECT 1
    FROM "Quiz" q
    JOIN "QuizAttempt" qa ON qa.quiz_id = q.quiz_id
    WHERE q.course_id = ce.course_id
      AND q.quiz_type = 'final_test'
      AND q.deleted_at IS NULL
      AND qa.user_id = ce.user_id
      AND qa.status IN ('submitted', 'graded')
      AND qa.score >= q.passing_score
  )
`;

const effectiveStatusConditionByStatus: Record<EnrollmentStatus, string> = {
  dropped: "ce.status = 'dropped'",
  completed: `ce.status = 'completed' AND (NOT ${finalQuizExistsSql} OR ${finalQuizPassedSql})`,
  active: `(ce.status = 'active' OR (ce.status = 'completed' AND ${finalQuizExistsSql} AND NOT ${finalQuizPassedSql}))`,
};

export const getEffectiveStatusCondition = (status: EnrollmentStatus) =>
  effectiveStatusConditionByStatus[status];

