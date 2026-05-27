import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import adminCoursesService from "../../services/admin/courses.service.js";
import { ownerScope } from "../../utils/adminContext.js";
import { created, message, ok, paginated, requireUser } from "../../utils/http.js";
import { parsePositiveInt } from "../../validators/common.validator.js";

export class AdminCoursesController {
  async listCourses(req: Request, res: Response) {
    const { data, totalCount } = await adminCoursesService.listCourses(req.query, ownerScope(req));
    return paginated(res, data, totalCount);
  }

  async createCourse(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);
    const data = await adminCoursesService.createCourse(req.body, { userId: user.user_id, role: user.role });
    return created(res, "Course created successfully", data);
  }

  async updateCourse(req: Request, res: Response) {
    const courseId = parsePositiveInt(req.params.id, "course ID");
    const data = await adminCoursesService.updateCourse(courseId, req.body, ownerScope(req));
    return ok(res, data, { message: "Course updated successfully" });
  }

  async deleteCourse(req: Request, res: Response) {
    const courseId = parsePositiveInt(req.params.id, "course ID");
    await adminCoursesService.deleteCourse(courseId, ownerScope(req));
    return message(res, "Course hidden successfully");
  }
}

export default new AdminCoursesController();
