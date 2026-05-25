import { QUIZ_TYPES } from "../../constants/admin.constants.js";
import { QuizType } from "../../models/admin.model.js";
import adminTestsModel from "../../models/admin/tests.model.js";
import { ApiError } from "../../utils/http.js";
import {
  BodyInput,
  optionalFiniteNumber,
  parseAdminPagination,
  parseSortOrder,
  QueryInput,
  requireFiniteNumber,
  requireString,
  toNumberOrNull,
} from "../../validators/admin/common.validator.js";
import { parseQuestionPayload } from "../../validators/admin/question.validator.js";

type ActorContext = {
  userId: number;
  role: string;
};

export class AdminTestsService {
  async listQuizzes(query: QueryInput, ownerId?: number) {
    const { limit, offset } = parseAdminPagination(query);
    const params = {
      limit,
      offset,
      search: String(query.search || ""),
      quizType: (query.quiz_type as QuizType | "all") || "all",
      sortOrder: parseSortOrder(query.sort_order),
      ownerId,
    };
    const [data, totalCount] = await Promise.all([
      adminTestsModel.listQuizzes(params),
      adminTestsModel.countQuizzes(params),
    ]);

    return { data, totalCount };
  }

  async createQuiz(body: BodyInput, actor: ActorContext, ownerId?: number) {
    const title = requireString(body.title);
    const quizType = body.quiz_type as QuizType;

    if (!title || !QUIZ_TYPES.includes(quizType)) {
      throw new ApiError(400, "title and valid quiz_type are required");
    }

    const data = await adminTestsModel.createQuiz({
      lesson_id: toNumberOrNull(body.lesson_id),
      course_id: toNumberOrNull(body.course_id),
      title,
      description: requireString(body.description) || null,
      quiz_type: quizType,
      passing_score: requireFiniteNumber(body.passing_score ?? 70, "passing_score"),
      total_marks: requireFiniteNumber(body.total_marks ?? 0, "total_marks"),
      time_limit_minutes: toNumberOrNull(body.time_limit_minutes),
      created_by: actor.role === "admin" ? Number(body.created_by) || actor.userId : actor.userId,
      owner_id: ownerId,
    });

    if (!data) {
      throw new ApiError(404, "Course or lesson not found");
    }

    return data;
  }

  async updateQuiz(quizId: number, body: BodyInput, ownerId?: number) {
    const quizType = body.quiz_type as QuizType | undefined;
    if (quizType !== undefined && !QUIZ_TYPES.includes(quizType)) {
      throw new ApiError(400, "valid quiz_type is required");
    }

    const data = await adminTestsModel.updateQuiz(quizId, {
      lesson_id: body.lesson_id === undefined ? undefined : toNumberOrNull(body.lesson_id),
      course_id: body.course_id === undefined ? undefined : toNumberOrNull(body.course_id),
      title: body.title === undefined ? undefined : requireString(body.title),
      description: body.description === undefined ? undefined : requireString(body.description) || null,
      quiz_type: quizType,
      passing_score: optionalFiniteNumber(body.passing_score, "passing_score"),
      total_marks: optionalFiniteNumber(body.total_marks, "total_marks"),
      time_limit_minutes: body.time_limit_minutes === undefined ? undefined : toNumberOrNull(body.time_limit_minutes),
    }, ownerId);

    if (!data) {
      throw new ApiError(404, "Test not found or no changes provided");
    }

    return data;
  }

  async deleteQuiz(quizId: number, ownerId?: number) {
    const deleted = await adminTestsModel.deleteQuiz(quizId, ownerId);
    if (!deleted) {
      throw new ApiError(404, "Test not found");
    }
  }

  async listQuizQuestions(quizId: number, ownerId?: number) {
    return adminTestsModel.listQuizQuestions(quizId, ownerId);
  }

  async createQuizQuestion(quizId: number, body: BodyInput, userId: number, ownerId?: number) {
    const parsed = parseQuestionPayload(body);
    if ("error" in parsed) {
      throw new ApiError(400, parsed.error);
    }

    return adminTestsModel.createQuizQuestion(quizId, parsed.data, userId, ownerId);
  }

  async updateQuizQuestion(quizId: number, questionId: number, body: BodyInput, ownerId?: number) {
    const parsed = parseQuestionPayload(body);
    if ("error" in parsed) {
      throw new ApiError(400, parsed.error);
    }

    const data = await adminTestsModel.updateQuizQuestion(quizId, questionId, parsed.data, ownerId);
    if (!data) {
      throw new ApiError(404, "Question not found");
    }

    return data;
  }

  async deleteQuizQuestion(quizId: number, questionId: number, ownerId?: number) {
    const deleted = await adminTestsModel.deleteQuizQuestion(quizId, questionId, ownerId);
    if (!deleted) {
      throw new ApiError(404, "Question not found");
    }
  }

  async updateQuizQuestionOrder(quizId: number, questionId: number, orderIndex: unknown, ownerId?: number) {
    const updated = await adminTestsModel.updateQuizQuestionOrder(quizId, questionId, toNumberOrNull(orderIndex), ownerId);
    if (!updated) {
      throw new ApiError(404, "Question not found");
    }
  }
}

export default new AdminTestsService();
