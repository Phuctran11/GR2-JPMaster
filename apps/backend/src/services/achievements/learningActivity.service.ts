import databaseService from "../database.service.js";
import achievementEvaluationService from "./achievementEvaluation.service.js";
import goalProgressService, { type GoalEventType } from "../goals/goalProgress.service.js";

export class LearningActivityService {
  private async getLessonDurationSeconds(lessonId: number) {
    const result = await databaseService.executeQuery(
      `
        SELECT
          COALESCE(
            NULLIF(l.duration, 0) * 60,
            ROUND(ca.duration_seconds)::int,
            ROUND(audio.duration_seconds)::int,
            0
          ) AS duration_seconds
        FROM "Lesson" l
        LEFT JOIN "CloudinaryAsset" ca ON ca.asset_id = l.video_asset_id
        LEFT JOIN "CloudinaryAsset" audio ON audio.asset_id = l.audio_asset_id
        WHERE l.lesson_id = $1
        LIMIT 1;
      `,
      [lessonId]
    );
    return Number(result.rows[0]?.duration_seconds ?? 0);
  }

  async recordStudySession(input: {
    userId: number;
    activityType: "lesson" | "quiz" | "jlpt_test" | "flashcard" | "review";
    courseId?: number | null;
    lessonId?: number | null;
    quizId?: number | null;
    jlptExamId?: number | null;
    durationSeconds?: number;
  }) {
    await databaseService.executeQuery(
      `
        INSERT INTO "StudySession" (
          user_id, course_id, lesson_id, quiz_id, jlpt_exam_id,
          activity_type, started_at, ended_at, duration_seconds, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW() - ($7::int * interval '1 second'), NOW(), $7, NOW());
      `,
      [
        input.userId,
        input.courseId ?? null,
        input.lessonId ?? null,
        input.quizId ?? null,
        input.jlptExamId ?? null,
        input.activityType,
        input.durationSeconds ?? 0,
      ]
    );
  }

  async incrementGoals(userId: number, eventType: GoalEventType, amount = 1) {
    await goalProgressService.incrementGoals(userId, eventType, amount);
  }

  async recordLessonCompleted(userId: number, courseId: number, lessonId: number, durationSeconds?: number) {
    const resolvedDurationSeconds = durationSeconds ?? await this.getLessonDurationSeconds(lessonId);
    await this.incrementGoals(userId, "lesson", 1);
    if (resolvedDurationSeconds > 0) await this.incrementGoals(userId, "study_minutes", Math.ceil(resolvedDurationSeconds / 60));
    await this.evaluateAchievements(userId);
  }

  async recordQuizSubmitted(userId: number, quizId: number, score: number) {
    await this.incrementGoals(userId, "quiz", 1);
    await this.evaluateAchievements(userId, { latest_score: score });
  }

  async recordJlptSubmitted(userId: number, examId: number, score: number) {
    await this.incrementGoals(userId, "jlpt_test", 1);
    await this.evaluateAchievements(userId, { latest_score: score });
  }

  async evaluateAchievements(userId: number, metadata: Record<string, unknown> = {}) {
    await achievementEvaluationService.evaluateAchievements(userId, metadata);
  }
}

export default new LearningActivityService();
