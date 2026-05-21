import { Request, Response, NextFunction } from "express";
import adminModel, { AdminJlptSectionInput, AdminReadingPassageInput, AutoJlptSectionQuestionsInput, BlogStatus, JlptLevel, QuestionType, QuizType, SectionType, SortOrder, UserRole, UserStatus } from "../models/admin.model.js";
import userModel from "../models/user.model.js";
import passwordService from "../services/password.service.js";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.js";

const USER_ROLES: UserRole[] = ["learner", "owner", "admin"];
const USER_STATUSES: UserStatus[] = ["active", "suspended"];
const COURSE_LEVELS = ["beginner", "intermediate", "advanced"] as const;
const QUIZ_TYPES: QuizType[] = ["lesson_quiz", "practice_test", "final_test"];
const QUESTION_TYPES: QuestionType[] = ["single_choice", "multiple_choice", "true_false", "fill_in_blank"];
const QUESTION_DIFFICULTIES = ["easy", "medium", "hard", "expert"] as const;
const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const;
const SECTION_TYPES: SectionType[] = ["vocabulary", "grammar", "reading", "listening"];
const BLOG_STATUSES: BlogStatus[] = ["draft", "published", "archived"];

const toNumberOrNull = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const requireString = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const optionalNumber = (value: unknown) => (value === undefined ? undefined : toNumberOrNull(value));
const optionalStringOrNull = (value: unknown) => {
  const stringValue = requireString(value);
  return stringValue || null;
};
const isOneOf = <T extends string>(value: unknown, values: readonly T[]): value is T => typeof value === "string" && values.includes(value as T);
const parseSortOrder = (value: unknown): SortOrder => (value === "asc" ? "asc" : "desc");

const parseQuestionPayload = (body: any) => {
  const questionText = requireString(body.question_text);
  const questionType = body.question_type as QuestionType;
  const points = Number(body.points ?? 1);
  const marks = Number(body.marks ?? points);
  const orderIndex = toNumberOrNull(body.order_index);
  const options = Array.isArray(body.options) ? body.options : [];

  if (!questionText || !QUESTION_TYPES.includes(questionType) || !Number.isFinite(points) || !Number.isFinite(marks)) {
    return { error: "question_text, valid question_type, points, and marks are required" };
  }

  if (!isOneOf(body.difficulty_level, QUESTION_DIFFICULTIES)) {
    return { error: "valid difficulty_level is required" };
  }

  if (!isOneOf(body.jlpt_level, JLPT_LEVELS)) {
    return { error: "valid jlpt_level is required" };
  }

  if (!isOneOf(body.section_type, SECTION_TYPES)) {
    return { error: "valid section_type is required" };
  }

  const imageAssetId = toNumberOrNull(body.image_asset_id);
  const imageUrl = optionalStringOrNull(body.image_url);
  const audioAssetId = toNumberOrNull(body.audio_asset_id);
  const audioUrl = optionalStringOrNull(body.audio_url);
  const readingPassageId = toNumberOrNull(body.reading_passage_id);

  if ((audioAssetId || audioUrl) && body.section_type !== "listening") {
    return { error: "audio can only be attached to listening questions" };
  }

  const normalizedOptions = options
    .map((option: any) => ({
      option_id: toNumberOrNull(option.option_id) ?? undefined,
      option_text: requireString(option.option_text),
      is_correct: Boolean(option.is_correct),
      explanation: optionalStringOrNull(option.explanation),
    }))
    .filter((option: { option_text: string }) => option.option_text);

  if (questionType !== "fill_in_blank" && normalizedOptions.length < 2) {
    return { error: "At least two options are required" };
  }

  if (!normalizedOptions.some((option: { is_correct: boolean }) => option.is_correct)) {
    return { error: "At least one correct option is required" };
  }

  if (questionType === "single_choice" || questionType === "true_false") {
    const correctCount = normalizedOptions.filter((option: { is_correct: boolean }) => option.is_correct).length;
    if (correctCount !== 1) return { error: "Single choice and true/false questions require exactly one correct option" };
  }

  return {
    data: {
      question_text: questionText,
      question_type: questionType,
      difficulty_level: body.difficulty_level,
      explanation: optionalStringOrNull(body.explanation),
      points,
      jlpt_level: body.jlpt_level,
      section_type: body.section_type,
      reading_passage_id: body.section_type === "reading" ? readingPassageId : null,
      image_asset_id: imageAssetId,
      image_url: imageUrl,
      audio_asset_id: body.section_type === "listening" ? audioAssetId : null,
      audio_url: body.section_type === "listening" ? audioUrl : null,
      order_index: orderIndex,
      marks,
      options: normalizedOptions,
    },
  };
};

const defaultJlptSectionTitle = (sectionType: SectionType) =>
  ({
    vocabulary: "Vocabulary",
    grammar: "Grammar",
    reading: "Reading",
    listening: "Listening",
  })[sectionType];

const parseJlptSectionsPayload = (body: any): AdminJlptSectionInput[] => {
  const sections = Array.isArray(body.sections) ? body.sections : [];
  return sections
    .map((section: any, index: number) => {
      const sectionType = section.section_type;
      if (!isOneOf(sectionType, SECTION_TYPES)) return null;
      return {
        title: requireString(section.title) || defaultJlptSectionTitle(sectionType),
        section_type: sectionType,
        section_order: Number(section.section_order ?? index + 1),
        duration_minutes: toNumberOrNull(section.duration_minutes),
        audio_asset_id: sectionType === "listening" ? toNumberOrNull(section.audio_asset_id) : null,
        audio_url: sectionType === "listening" ? optionalStringOrNull(section.audio_url) : null,
      };
    })
    .filter(Boolean) as AdminJlptSectionInput[];
};

const parseAutoJlptQuestionsPayload = (body: any): AutoJlptSectionQuestionsInput | { error: string } => {
  const counts = body.difficulty_counts && typeof body.difficulty_counts === "object" ? body.difficulty_counts : body;
  const difficulty_counts: AutoJlptSectionQuestionsInput["difficulty_counts"] = {};
  let total = 0;

  for (const difficulty of QUESTION_DIFFICULTIES) {
    const value = Number(counts[difficulty] ?? 0);
    if (!Number.isFinite(value) || value < 0) return { error: "difficulty counts must be non-negative numbers" };
    const count = Math.floor(value);
    if (count > 0) {
      difficulty_counts[difficulty as keyof AutoJlptSectionQuestionsInput["difficulty_counts"]] = count;
      total += count;
    }
  }

  if (total <= 0) return { error: "At least one difficulty count is required" };
  if (body.jlpt_level !== undefined && !isOneOf(body.jlpt_level, JLPT_LEVELS)) return { error: "valid jlpt_level is required" };

  return {
    jlpt_level: body.jlpt_level,
    difficulty_counts,
  };
};

const parseReadingPassagePayload = (body: any): AdminReadingPassageInput | { error: string } => {
  if (!isOneOf(body.jlpt_level, JLPT_LEVELS)) return { error: "valid jlpt_level is required" };
  const passageText = optionalStringOrNull(body.passage_text);
  const imageUrl = optionalStringOrNull(body.image_url);
  const imageAssetId = toNumberOrNull(body.image_asset_id);

  if (!passageText && !imageUrl && !imageAssetId) {
    return { error: "passage_text or image is required" };
  }

  return {
    title: optionalStringOrNull(body.title),
    jlpt_level: body.jlpt_level,
    passage_text: passageText,
    image_asset_id: imageAssetId,
    image_url: imageUrl,
  };
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const ownerScope = (req: Request) => {
  const user = (req as AuthenticatedRequest).user;
  return user?.role === "owner" ? user.user_id : undefined;
};

export class AdminController {
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminModel.getStats(ownerScope(req));
      return res.status(200).json({ data: stats });
    } catch (error) {
      next(error);
    }
  }

  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      if ((req as AuthenticatedRequest).user?.role !== "admin") return res.status(403).json({ error: "Admin access is required" });
      const data = await adminModel.listUsers({
        limit: Number(req.query.limit),
        offset: Number(req.query.offset),
        search: String(req.query.search || ""),
        role: (req.query.role as UserRole | "all") || "all",
        sortOrder: parseSortOrder(req.query.sort_order),
      });
      return res.status(200).json({ data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      if ((req as AuthenticatedRequest).user?.role !== "admin") return res.status(403).json({ error: "Admin access is required" });
      const username = requireString(req.body.username);
      const email = requireString(req.body.email).toLowerCase();
      const password = requireString(req.body.password);
      const role = req.body.role as UserRole;

      if (!username || !email || !password) {
        return res.status(400).json({ error: "username, email, and password are required" });
      }

      if (!USER_ROLES.includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const existing = await userModel.getUserByEmailIncludingDeleted(email);
      if (existing) {
        return res.status(409).json({ error: "Email already exists" });
      }

      const user = await userModel.createUser(username, email, await passwordService.hashPassword(password), role);
      const { password_hash, ...publicUser } = user;
      return res.status(201).json({ message: "User created successfully", data: publicUser });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      if ((req as AuthenticatedRequest).user?.role !== "admin") return res.status(403).json({ error: "Admin access is required" });
      const userId = Number(req.params.id);
      const username = requireString(req.body.username);
      const email = requireString(req.body.email).toLowerCase();
      const role = req.body.role as UserRole;
      const status = req.body.status as UserStatus;

      if (!Number.isFinite(userId)) return res.status(400).json({ error: "Invalid user ID" });
      if (!username || !email || !USER_ROLES.includes(role) || !USER_STATUSES.includes(status)) {
        return res.status(400).json({ error: "username, email, valid role, and valid status are required" });
      }

      const updated = await userModel.updateUser(userId, username, email, role, status as "active" | "suspended");
      if (!updated) return res.status(404).json({ error: "User not found" });

      const { password_hash, ...publicUser } = updated;
      return res.status(200).json({ message: "User updated successfully", data: publicUser });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role !== "admin") return res.status(403).json({ error: "Admin access is required" });
      const userId = Number(req.params.id);
      if (!Number.isFinite(userId)) return res.status(400).json({ error: "Invalid user ID" });
      if (req.user?.user_id === userId) return res.status(400).json({ error: "You cannot delete your own admin account" });

      const deleted = await adminModel.softDeleteUser(userId);
      if (!deleted) return res.status(404).json({ error: "User not found" });

      return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  async listCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminModel.listCourses({
        limit: Number(req.query.limit),
        offset: Number(req.query.offset),
        search: String(req.query.search || ""),
        level: String(req.query.level || ""),
        sortOrder: parseSortOrder(req.query.sort_order),
        ownerId: ownerScope(req),
      });
      return res.status(200).json({ data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async createCourse(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const title = requireString(req.body.title);
      const price = Number(req.body.price ?? 0);

      if (!title || !Number.isFinite(price) || price < 0) {
        return res.status(400).json({ error: "title and a non-negative price are required" });
      }

      if (!isOneOf(req.body.level, COURSE_LEVELS)) {
        return res.status(400).json({ error: "valid course level is required" });
      }

      const data = await adminModel.createCourse({
        title,
        description: requireString(req.body.description) || null,
        price,
        level: req.body.level,
        duration: toNumberOrNull(req.body.duration),
        cover_asset_id: toNumberOrNull(req.body.cover_asset_id),
        image_url: requireString(req.body.image_url) || null,
        created_by: req.user!.role === "admin" ? Number(req.body.created_by) || req.user!.user_id : req.user!.user_id,
      });
      return res.status(201).json({ message: "Course created successfully", data });
    } catch (error) {
      next(error);
    }
  }

  async updateCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const courseId = Number(req.params.id);
      if (!Number.isFinite(courseId)) return res.status(400).json({ error: "Invalid course ID" });

      if (req.body.level !== undefined && !isOneOf(req.body.level, COURSE_LEVELS)) {
        return res.status(400).json({ error: "valid course level is required" });
      }

      const data = await adminModel.updateCourse(courseId, {
        title: req.body.title === undefined ? undefined : requireString(req.body.title),
        description: req.body.description === undefined ? undefined : requireString(req.body.description) || null,
        price: req.body.price === undefined ? undefined : Number(req.body.price),
        level: req.body.level === undefined ? undefined : req.body.level,
        duration: req.body.duration === undefined ? undefined : toNumberOrNull(req.body.duration),
        cover_asset_id: optionalNumber(req.body.cover_asset_id),
        image_url: req.body.image_url === undefined ? undefined : requireString(req.body.image_url) || null,
      }, ownerScope(req));
      if (!data) return res.status(404).json({ error: "Course not found or no changes provided" });
      return res.status(200).json({ message: "Course updated successfully", data });
    } catch (error) {
      next(error);
    }
  }

  async deleteCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const courseId = Number(req.params.id);
      if (!Number.isFinite(courseId)) return res.status(400).json({ error: "Invalid course ID" });

      const deleted = await adminModel.deleteCourse(courseId, ownerScope(req));
      if (!deleted) return res.status(404).json({ error: "Course not found" });

      return res.status(200).json({ message: "Course hidden successfully" });
    } catch (error) {
      next(error);
    }
  }

  async listLessons(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminModel.listLessons({
        limit: Number(req.query.limit),
        offset: Number(req.query.offset),
        search: String(req.query.search || ""),
        courseId: toNumberOrNull(req.query.course_id) || undefined,
        ownerId: ownerScope(req),
      });
      return res.status(200).json({ data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async createLesson(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const title = requireString(req.body.title);
      const courseId = Number(req.body.course_id);
      const orderIndex = Number(req.body.order_index ?? 1);

      if (!title || !Number.isFinite(courseId) || !Number.isFinite(orderIndex)) {
        return res.status(400).json({ error: "course_id, title, and order_index are required" });
      }

      const data = await adminModel.createLesson({
        course_id: courseId,
        title,
        content_text: requireString(req.body.content_text) || null,
        video_asset_id: toNumberOrNull(req.body.video_asset_id),
        video_url: requireString(req.body.video_url) || null,
        audio_asset_id: toNumberOrNull(req.body.audio_asset_id),
        audio_url: requireString(req.body.audio_url) || null,
        order_index: orderIndex,
        duration: toNumberOrNull(req.body.duration),
        owner_id: ownerScope(req),
      });
      if (!data) return res.status(404).json({ error: "Course not found" });
      return res.status(201).json({ message: "Lesson created successfully", data });
    } catch (error) {
      next(error);
    }
  }

  async updateLesson(req: Request, res: Response, next: NextFunction) {
    try {
      const lessonId = Number(req.params.id);
      if (!Number.isFinite(lessonId)) return res.status(400).json({ error: "Invalid lesson ID" });

      const data = await adminModel.updateLesson(lessonId, {
        title: req.body.title === undefined ? undefined : requireString(req.body.title),
        content_text: req.body.content_text === undefined ? undefined : requireString(req.body.content_text) || null,
        video_asset_id: optionalNumber(req.body.video_asset_id),
        video_url: req.body.video_url === undefined ? undefined : requireString(req.body.video_url) || null,
        audio_asset_id: optionalNumber(req.body.audio_asset_id),
        audio_url: req.body.audio_url === undefined ? undefined : requireString(req.body.audio_url) || null,
        order_index: req.body.order_index === undefined ? undefined : Number(req.body.order_index),
        duration: req.body.duration === undefined ? undefined : toNumberOrNull(req.body.duration),
      }, ownerScope(req));
      if (!data) return res.status(404).json({ error: "Lesson not found or no changes provided" });
      return res.status(200).json({ message: "Lesson updated successfully", data });
    } catch (error) {
      next(error);
    }
  }

  async deleteLesson(req: Request, res: Response, next: NextFunction) {
    try {
      const lessonId = Number(req.params.id);
      if (!Number.isFinite(lessonId)) return res.status(400).json({ error: "Invalid lesson ID" });

      const deleted = await adminModel.deleteLesson(lessonId, ownerScope(req));
      if (!deleted) return res.status(404).json({ error: "Lesson not found" });

      return res.status(200).json({ message: "Lesson hidden successfully" });
    } catch (error) {
      next(error);
    }
  }

  async listQuizzes(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminModel.listQuizzes({
        limit: Number(req.query.limit),
        offset: Number(req.query.offset),
        search: String(req.query.search || ""),
        quizType: (req.query.quiz_type as QuizType | "all") || "all",
        sortOrder: parseSortOrder(req.query.sort_order),
        ownerId: ownerScope(req),
      });
      return res.status(200).json({ data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async createQuiz(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const title = requireString(req.body.title);
      const quizType = req.body.quiz_type as QuizType;

      if (!title || !QUIZ_TYPES.includes(quizType)) {
        return res.status(400).json({ error: "title and valid quiz_type are required" });
      }

      const data = await adminModel.createQuiz({
        lesson_id: toNumberOrNull(req.body.lesson_id),
        course_id: toNumberOrNull(req.body.course_id),
        title,
        description: requireString(req.body.description) || null,
        quiz_type: quizType,
        passing_score: Number(req.body.passing_score ?? 70),
        total_marks: Number(req.body.total_marks ?? 0),
        time_limit_minutes: toNumberOrNull(req.body.time_limit_minutes),
        created_by: req.user!.role === "admin" ? Number(req.body.created_by) || req.user!.user_id : req.user!.user_id,
        owner_id: ownerScope(req),
      });
      if (!data) return res.status(404).json({ error: "Course or lesson not found" });
      return res.status(201).json({ message: "Test created successfully", data });
    } catch (error) {
      next(error);
    }
  }

  async updateQuiz(req: Request, res: Response, next: NextFunction) {
    try {
      const quizId = Number(req.params.id);
      if (!Number.isFinite(quizId)) return res.status(400).json({ error: "Invalid quiz ID" });

      if (req.body.quiz_type !== undefined && !QUIZ_TYPES.includes(req.body.quiz_type)) {
        return res.status(400).json({ error: "valid quiz_type is required" });
      }
      const data = await adminModel.updateQuiz(quizId, {
        lesson_id: req.body.lesson_id === undefined ? undefined : toNumberOrNull(req.body.lesson_id),
        course_id: req.body.course_id === undefined ? undefined : toNumberOrNull(req.body.course_id),
        title: req.body.title === undefined ? undefined : requireString(req.body.title),
        description: req.body.description === undefined ? undefined : requireString(req.body.description) || null,
        quiz_type: req.body.quiz_type,
        passing_score: req.body.passing_score === undefined ? undefined : Number(req.body.passing_score),
        total_marks: req.body.total_marks === undefined ? undefined : Number(req.body.total_marks),
        time_limit_minutes: req.body.time_limit_minutes === undefined ? undefined : toNumberOrNull(req.body.time_limit_minutes),
      }, ownerScope(req));
      if (!data) return res.status(404).json({ error: "Test not found or no changes provided" });
      return res.status(200).json({ message: "Test updated successfully", data });
    } catch (error) {
      next(error);
    }
  }

  async deleteQuiz(req: Request, res: Response, next: NextFunction) {
    try {
      const quizId = Number(req.params.id);
      if (!Number.isFinite(quizId)) return res.status(400).json({ error: "Invalid quiz ID" });

      const deleted = await adminModel.deleteQuiz(quizId, ownerScope(req));
      if (!deleted) return res.status(404).json({ error: "Test not found" });
      return res.status(200).json({ message: "Test hidden successfully" });
    } catch (error) {
      next(error);
    }
  }

  async listQuizQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      const quizId = Number(req.params.id);
      if (!Number.isFinite(quizId)) return res.status(400).json({ error: "Invalid quiz ID" });

      const data = await adminModel.listQuizQuestions(quizId, ownerScope(req));
      return res.status(200).json({ data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async createQuizQuestion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const quizId = Number(req.params.id);
      if (!Number.isFinite(quizId)) return res.status(400).json({ error: "Invalid quiz ID" });

      const parsed = parseQuestionPayload(req.body);
      if ("error" in parsed) return res.status(400).json({ error: parsed.error });

      const data = await adminModel.createQuizQuestion(quizId, parsed.data, req.user!.user_id, ownerScope(req));
      return res.status(201).json({ message: "Question created successfully", data });
    } catch (error) {
      next(error);
    }
  }

  async updateQuizQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const quizId = Number(req.params.quizId);
      const questionId = Number(req.params.questionId);
      if (!Number.isFinite(quizId) || !Number.isFinite(questionId)) return res.status(400).json({ error: "Invalid quiz or question ID" });

      const parsed = parseQuestionPayload(req.body);
      if ("error" in parsed) return res.status(400).json({ error: parsed.error });

      const data = await adminModel.updateQuizQuestion(quizId, questionId, parsed.data, ownerScope(req));
      if (!data) return res.status(404).json({ error: "Question not found" });
      return res.status(200).json({ message: "Question updated successfully", data });
    } catch (error) {
      next(error);
    }
  }

  async deleteQuizQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const quizId = Number(req.params.quizId);
      const questionId = Number(req.params.questionId);
      if (!Number.isFinite(quizId) || !Number.isFinite(questionId)) return res.status(400).json({ error: "Invalid quiz or question ID" });

      const deleted = await adminModel.deleteQuizQuestion(quizId, questionId, ownerScope(req));
      if (!deleted) return res.status(404).json({ error: "Question not found" });
      return res.status(200).json({ message: "Question hidden successfully" });
    } catch (error) {
      next(error);
    }
  }

  async updateQuizQuestionOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const quizId = Number(req.params.quizId);
      const questionId = Number(req.params.questionId);
      const orderIndex = toNumberOrNull(req.body.order_index);
      if (!Number.isFinite(quizId) || !Number.isFinite(questionId)) return res.status(400).json({ error: "Invalid quiz or question ID" });

      const updated = await adminModel.updateQuizQuestionOrder(quizId, questionId, orderIndex, ownerScope(req));
      if (!updated) return res.status(404).json({ error: "Question not found" });
      return res.status(200).json({ message: "Question order updated successfully" });
    } catch (error) {
      next(error);
    }
  }

  async listJlptExams(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminModel.listJlptExams({
        limit: Number(req.query.limit),
        offset: Number(req.query.offset),
        search: String(req.query.search || ""),
        sortOrder: parseSortOrder(req.query.sort_order),
        ownerId: ownerScope(req),
      });
      return res.status(200).json({ data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async createJlptExam(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const title = requireString(req.body.title);
      const jlptLevel = req.body.jlpt_level as JlptLevel;
      const sections = parseJlptSectionsPayload(req.body);

      if (!title || !isOneOf(jlptLevel, JLPT_LEVELS)) {
        return res.status(400).json({ error: "title and valid jlpt_level are required" });
      }

      if (!sections.length) {
        return res.status(400).json({ error: "At least one JLPT section is required" });
      }

      const duplicatedSections = sections.some((section, index) => sections.findIndex((item) => item.section_type === section.section_type) !== index);
      if (duplicatedSections) {
        return res.status(400).json({ error: "JLPT sections must be unique" });
      }

      const data = await adminModel.createJlptExam({
        title,
        jlpt_level: jlptLevel,
        year: toNumberOrNull(req.body.year),
        duration_minutes: toNumberOrNull(req.body.duration_minutes),
        created_by: req.user!.user_id,
        sections,
      });
      return res.status(201).json({ message: "JLPT test created successfully", data });
    } catch (error) {
      next(error);
    }
  }

  async updateJlptExam(req: Request, res: Response, next: NextFunction) {
    try {
      const examId = Number(req.params.examId);
      if (!Number.isFinite(examId)) return res.status(400).json({ error: "Invalid JLPT test ID" });

      if (req.body.jlpt_level !== undefined && !isOneOf(req.body.jlpt_level, JLPT_LEVELS)) {
        return res.status(400).json({ error: "valid jlpt_level is required" });
      }

      const data = await adminModel.updateJlptExam(examId, {
        title: req.body.title === undefined ? undefined : requireString(req.body.title),
        jlpt_level: req.body.jlpt_level,
        year: req.body.year === undefined ? undefined : toNumberOrNull(req.body.year),
        duration_minutes: req.body.duration_minutes === undefined ? undefined : toNumberOrNull(req.body.duration_minutes),
      }, ownerScope(req));
      if (!data) return res.status(404).json({ error: "JLPT test not found or no changes provided" });
      return res.status(200).json({ message: "JLPT test updated successfully", data });
    } catch (error) {
      next(error);
    }
  }

  async deleteJlptExam(req: Request, res: Response, next: NextFunction) {
    try {
      const examId = Number(req.params.examId);
      if (!Number.isFinite(examId)) return res.status(400).json({ error: "Invalid JLPT test ID" });

      const deleted = await adminModel.deleteJlptExam(examId, ownerScope(req));
      if (!deleted) return res.status(404).json({ error: "JLPT test not found" });
      return res.status(200).json({ message: "JLPT test hidden successfully" });
    } catch (error) {
      next(error);
    }
  }

  async listReadingPassages(req: Request, res: Response, next: NextFunction) {
    try {
      const jlptLevel = isOneOf(req.query.jlpt_level, JLPT_LEVELS) ? req.query.jlpt_level : undefined;
      const data = await adminModel.listReadingPassages({ jlptLevel, ownerId: ownerScope(req) });
      return res.status(200).json({ data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async createReadingPassage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const parsed = parseReadingPassagePayload(req.body);
      if ("error" in parsed) return res.status(400).json({ error: parsed.error });

      const data = await adminModel.createReadingPassage({
        ...parsed,
        created_by: req.user!.user_id,
      });
      return res.status(201).json({ message: "Reading passage created successfully", data });
    } catch (error) {
      next(error);
    }
  }

  async updateReadingPassage(req: Request, res: Response, next: NextFunction) {
    try {
      const passageId = Number(req.params.passageId);
      if (!Number.isFinite(passageId)) return res.status(400).json({ error: "Invalid reading passage ID" });
      const parsed = parseReadingPassagePayload(req.body);
      if ("error" in parsed) return res.status(400).json({ error: parsed.error });

      const data = await adminModel.updateReadingPassage(passageId, parsed, ownerScope(req));
      if (!data) return res.status(404).json({ error: "Reading passage not found" });
      return res.status(200).json({ message: "Reading passage updated successfully", data });
    } catch (error) {
      next(error);
    }
  }

  async deleteReadingPassage(req: Request, res: Response, next: NextFunction) {
    try {
      const passageId = Number(req.params.passageId);
      if (!Number.isFinite(passageId)) return res.status(400).json({ error: "Invalid reading passage ID" });

      const deleted = await adminModel.deleteReadingPassage(passageId, ownerScope(req));
      if (!deleted) return res.status(404).json({ error: "Reading passage not found" });
      return res.status(200).json({ message: "Reading passage hidden successfully" });
    } catch (error) {
      next(error);
    }
  }

  async listJlptSections(req: Request, res: Response, next: NextFunction) {
    try {
      const examId = Number(req.params.examId);
      if (!Number.isFinite(examId)) return res.status(400).json({ error: "Invalid JLPT test ID" });

      const data = await adminModel.listJlptSections(examId, ownerScope(req));
      return res.status(200).json({ data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async createJlptSection(req: Request, res: Response, next: NextFunction) {
    try {
      const examId = Number(req.params.examId);
      if (!Number.isFinite(examId)) return res.status(400).json({ error: "Invalid JLPT test ID" });
      if (!isOneOf(req.body.section_type, SECTION_TYPES)) {
        return res.status(400).json({ error: "valid section_type is required" });
      }

      const sectionType = req.body.section_type as SectionType;
      const data = await adminModel.createJlptSection(examId, {
        title: requireString(req.body.title) || defaultJlptSectionTitle(sectionType),
        section_type: sectionType,
        section_order: Number(req.body.section_order ?? 1),
        duration_minutes: toNumberOrNull(req.body.duration_minutes),
        audio_asset_id: sectionType === "listening" ? toNumberOrNull(req.body.audio_asset_id) : null,
        audio_url: sectionType === "listening" ? optionalStringOrNull(req.body.audio_url) : null,
      }, ownerScope(req));
      if (!data) return res.status(404).json({ error: "JLPT test not found" });
      return res.status(201).json({ message: "JLPT section created successfully", data });
    } catch (error) {
      next(error);
    }
  }

  async updateJlptSection(req: Request, res: Response, next: NextFunction) {
    try {
      const sectionId = Number(req.params.sectionId);
      if (!Number.isFinite(sectionId)) return res.status(400).json({ error: "Invalid JLPT section ID" });
      if (req.body.section_type !== undefined && !isOneOf(req.body.section_type, SECTION_TYPES)) {
        return res.status(400).json({ error: "valid section_type is required" });
      }

      const sectionType = req.body.section_type as SectionType | undefined;
      const data = await adminModel.updateJlptSection(sectionId, {
        title: req.body.title === undefined ? undefined : requireString(req.body.title),
        section_type: sectionType,
        section_order: req.body.section_order === undefined ? undefined : Number(req.body.section_order),
        duration_minutes: req.body.duration_minutes === undefined ? undefined : toNumberOrNull(req.body.duration_minutes),
        audio_asset_id: req.body.audio_asset_id === undefined ? undefined : sectionType === "listening" ? toNumberOrNull(req.body.audio_asset_id) : null,
        audio_url: req.body.audio_url === undefined ? undefined : sectionType === "listening" ? optionalStringOrNull(req.body.audio_url) : null,
      }, ownerScope(req));
      if (!data) return res.status(404).json({ error: "JLPT section not found or no changes provided" });
      return res.status(200).json({ message: "JLPT section updated successfully", data });
    } catch (error) {
      next(error);
    }
  }

  async deleteJlptSection(req: Request, res: Response, next: NextFunction) {
    try {
      const sectionId = Number(req.params.sectionId);
      if (!Number.isFinite(sectionId)) return res.status(400).json({ error: "Invalid JLPT section ID" });

      const deleted = await adminModel.deleteJlptSection(sectionId, ownerScope(req));
      if (!deleted) return res.status(404).json({ error: "JLPT section not found" });
      return res.status(200).json({ message: "JLPT section hidden successfully" });
    } catch (error) {
      next(error);
    }
  }

  async listJlptSectionQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      const sectionId = Number(req.params.sectionId);
      if (!Number.isFinite(sectionId)) return res.status(400).json({ error: "Invalid JLPT section ID" });

      const data = await adminModel.listJlptSectionQuestions(sectionId, ownerScope(req));
      return res.status(200).json({ data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async createJlptSectionQuestion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const sectionId = Number(req.params.sectionId);
      if (!Number.isFinite(sectionId)) return res.status(400).json({ error: "Invalid JLPT section ID" });

      const parsed = parseQuestionPayload(req.body);
      if ("error" in parsed) return res.status(400).json({ error: parsed.error });

      const data = await adminModel.createJlptSectionQuestion(sectionId, parsed.data, req.user!.user_id, ownerScope(req));
      if (!data) return res.status(404).json({ error: "JLPT section not found" });
      return res.status(201).json({ message: "JLPT question created successfully", data });
    } catch (error) {
      next(error);
    }
  }

  async autoAddJlptSectionQuestions(req: Request, res: Response, next: NextFunction) {
    try {
      const sectionId = Number(req.params.sectionId);
      if (!Number.isFinite(sectionId)) return res.status(400).json({ error: "Invalid JLPT section ID" });

      const parsed = parseAutoJlptQuestionsPayload(req.body);
      if ("error" in parsed) return res.status(400).json({ error: parsed.error });

      const result = await adminModel.autoAddJlptSectionQuestions(sectionId, parsed, ownerScope(req));
      if (result.status === "not_found") return res.status(404).json({ error: "JLPT section not found" });
      if (result.status === "unsupported_section") return res.status(400).json({ error: "Auto generation only supports vocabulary and grammar sections" });
      if (result.status === "invalid") return res.status(400).json({ error: result.error });
      if (result.status === "insufficient") {
        return res.status(409).json({
          error: "Not enough matching questions in the question bank",
          shortages: result.shortages,
        });
      }

      return res.status(201).json({
        message: `${result.added_count} questions added successfully`,
        data: result.questions,
        added_count: result.added_count,
        requested_count: result.requested_count,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateJlptSectionQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const sectionId = Number(req.params.sectionId);
      const questionId = Number(req.params.questionId);
      if (!Number.isFinite(sectionId) || !Number.isFinite(questionId)) return res.status(400).json({ error: "Invalid JLPT section or question ID" });

      const parsed = parseQuestionPayload(req.body);
      if ("error" in parsed) return res.status(400).json({ error: parsed.error });

      const data = await adminModel.updateJlptSectionQuestion(sectionId, questionId, parsed.data, ownerScope(req));
      if (!data) return res.status(404).json({ error: "JLPT question not found" });
      return res.status(200).json({ message: "JLPT question updated successfully", data });
    } catch (error) {
      next(error);
    }
  }

  async updateJlptSectionQuestionOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const sectionId = Number(req.params.sectionId);
      const questionId = Number(req.params.questionId);
      const orderIndex = toNumberOrNull(req.body.order_index);
      if (!Number.isFinite(sectionId) || !Number.isFinite(questionId)) return res.status(400).json({ error: "Invalid JLPT section or question ID" });

      const updated = await adminModel.updateJlptSectionQuestionOrder(sectionId, questionId, orderIndex, ownerScope(req));
      if (!updated) return res.status(404).json({ error: "JLPT question not found" });
      return res.status(200).json({ message: "JLPT question order updated successfully" });
    } catch (error) {
      next(error);
    }
  }

  async deleteJlptSectionQuestion(req: Request, res: Response, next: NextFunction) {
    try {
      const sectionId = Number(req.params.sectionId);
      const questionId = Number(req.params.questionId);
      if (!Number.isFinite(sectionId) || !Number.isFinite(questionId)) return res.status(400).json({ error: "Invalid JLPT section or question ID" });

      const deleted = await adminModel.deleteJlptSectionQuestion(sectionId, questionId, ownerScope(req));
      if (!deleted) return res.status(404).json({ error: "JLPT question not found" });
      return res.status(200).json({ message: "JLPT question hidden successfully" });
    } catch (error) {
      next(error);
    }
  }

  async listBlogs(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminModel.listBlogs({
        limit: Number(req.query.limit),
        offset: Number(req.query.offset),
        search: String(req.query.search || ""),
        status: (req.query.status as BlogStatus | "all") || "all",
        sortOrder: parseSortOrder(req.query.sort_order),
        ownerId: ownerScope(req),
      });
      return res.status(200).json({ data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async createBlog(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const title = requireString(req.body.title);
      const status = (req.body.status || "draft") as BlogStatus;

      if (!title || !BLOG_STATUSES.includes(status)) {
        return res.status(400).json({ error: "title and valid status are required" });
      }

      const data = await adminModel.createBlog({
        title,
        slug: requireString(req.body.slug) || slugify(title),
        excerpt: requireString(req.body.excerpt) || null,
        content: requireString(req.body.content) || null,
        category: requireString(req.body.category) || null,
        cover_asset_id: toNumberOrNull(req.body.cover_asset_id),
        image_url: requireString(req.body.image_url) || null,
        status,
        author_id: req.user!.user_id,
      });
      return res.status(201).json({ message: "Blog created successfully", data });
    } catch (error) {
      next(error);
    }
  }

  async updateBlog(req: Request, res: Response, next: NextFunction) {
    try {
      const blogId = Number(req.params.id);
      if (!Number.isFinite(blogId)) return res.status(400).json({ error: "Invalid blog ID" });

      const title = req.body.title === undefined ? undefined : requireString(req.body.title);
      const data = await adminModel.updateBlog(blogId, {
        title,
        slug: req.body.slug === undefined ? (title ? slugify(title) : undefined) : requireString(req.body.slug),
        excerpt: req.body.excerpt === undefined ? undefined : requireString(req.body.excerpt) || null,
        content: req.body.content === undefined ? undefined : requireString(req.body.content) || null,
        category: req.body.category === undefined ? undefined : requireString(req.body.category) || null,
        cover_asset_id: optionalNumber(req.body.cover_asset_id),
        image_url: req.body.image_url === undefined ? undefined : requireString(req.body.image_url) || null,
        status: req.body.status,
      }, ownerScope(req));
      if (!data) return res.status(404).json({ error: "Blog not found or no changes provided" });
      return res.status(200).json({ message: "Blog updated successfully", data });
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
