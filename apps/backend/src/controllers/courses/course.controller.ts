import { Request, Response } from "express";
import courseService from "../../services/courses/course.service.js";
import { created, message, ok, paginated } from "../../utils/http.js";
import { parsePagination, parsePositiveInt } from "../../validators/common.validator.js";

export class CourseController {
  async createCourse(req: Request, res: Response) {
    const course = await courseService.createCourse(req.body);
    return created(res, "Course created successfully", course);
  }

  async getAllCourses(req: Request, res: Response) {
    const { limit, offset } = parsePagination(req.query, { defaultLimit: 10, maxLimit: 100 });
    const withLessons = req.query.withLessons === 'true';
    const level = typeof req.query.level === "string" ? req.query.level : "all";
    const sort = typeof req.query.sort === "string" ? req.query.sort : "newest";

    const { courses, totalCount } = await courseService.getAllCourses({
      limit,
      offset,
      withLessons,
      level,
      sort,
      hasExploreFilters: Boolean(req.query.level || req.query.sort),
    });

    return paginated(res, courses, totalCount);
  }

  async getPopularCourses(req: Request, res: Response) {
    const { limit } = parsePagination(req.query, { defaultLimit: 4, maxLimit: 20 });
    const courses = await courseService.getPopularCourses(limit);
    return paginated(res, courses);
  }

  async getCourse(req: Request, res: Response) {
    const courseId = parsePositiveInt(req.params.id, "course ID");
    const course = await courseService.getCourse(courseId);

    return ok(res, course);
  }

  async getCoursesByCreator(req: Request, res: Response) {
    const userId = parsePositiveInt(req.params.userId, "user ID");
    const { limit, offset } = parsePagination(req.query, { defaultLimit: 10, maxLimit: 100 });

    const courses = await courseService.getCoursesByCreator(userId, limit, offset);
    return paginated(res, courses);
  }

  async updateCourse(req: Request, res: Response) {
    const courseId = parsePositiveInt(req.params.id, "course ID");
    const course = await courseService.updateCourse(courseId, req.body);
    return ok(res, course, { message: "Course updated successfully" });
  }

  async deleteCourse(req: Request, res: Response) {
    const courseId = parsePositiveInt(req.params.id, "course ID");
    await courseService.deleteCourse(courseId);
    return message(res, "Course hidden successfully");
  }
}

export default new CourseController();
