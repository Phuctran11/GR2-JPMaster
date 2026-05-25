import databaseService from "../../services/database.service.js";
import { gradeJlptExam } from "./jlptExam.grading.js";
import jlptExamReadModel from "./jlptExam.read.model.js";
import { createJlptAttempt, getJlptOptionsByQuestion, insertJlptUserAnswers } from "./jlptExamSubmit.persistence.js";
import type { JlptAnswerPayload } from "./jlptExam.types.js";

export class JlptExamSubmitModel {
  async submitExam(userId: number, examId: number, answers: JlptAnswerPayload[]) {
    const exam = await jlptExamReadModel.getExamById(examId);
    if (!exam) return null;

    const questions = exam.sections.flatMap((section: any) => section.questions);
    const questionIds = questions.map((question: any) => question.question_id);
    const optionsByQuestion = await getJlptOptionsByQuestion(questionIds);

    const { earnedMarks, totalMarks, score, passed, questionResults } = gradeJlptExam(questions, optionsByQuestion, answers);
    const attemptStatus = passed ? "graded" : "submitted";

    return databaseService.withTransaction(async (client) => {
      const attempt = await createJlptAttempt(client, {
        userId,
        examId: exam.exam_id,
        score,
        totalMarks,
        status: attemptStatus,
      });
      await insertJlptUserAnswers(client, attempt.attempt_id, questionResults);

      return {
        attempt_id: attempt.attempt_id,
        exam_id: exam.exam_id,
        score,
        total_marks: totalMarks,
        earned_marks: earnedMarks,
        passed,
        submitted_at: attempt.submitted_at,
        question_results: questionResults,
      };
    });
  }
}

export default new JlptExamSubmitModel();
