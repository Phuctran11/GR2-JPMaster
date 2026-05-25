import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import adminLessonsService from "../../services/admin/lessons.service.js";
import { ownerScope } from "../../utils/adminContext.js";
import { created, message, ok, paginated } from "../../utils/http.js";
import { parsePositiveInt } from "../../validators/common.validator.js";

export class AdminLessonsController {
  async listLessons(req: Request, res: Response) {
    const data = await adminLessonsService.listLessons(req.query, ownerScope(req));
    return paginated(res, data);
  }

  async createLesson(req: AuthenticatedRequest, res: Response) {
    const data = await adminLessonsService.createLesson(req.body, ownerScope(req));
    return created(res, "Lesson created successfully", data);
  }

  async updateLesson(req: Request, res: Response) {
    const lessonId = parsePositiveInt(req.params.id, "lesson ID");
    const data = await adminLessonsService.updateLesson(lessonId, req.body, ownerScope(req));
    return ok(res, data, { message: "Lesson updated successfully" });
  }

  async deleteLesson(req: Request, res: Response) {
    const lessonId = parsePositiveInt(req.params.id, "lesson ID");
    await adminLessonsService.deleteLesson(lessonId, ownerScope(req));
    return message(res, "Lesson hidden successfully");
  }
}

export default new AdminLessonsController();
