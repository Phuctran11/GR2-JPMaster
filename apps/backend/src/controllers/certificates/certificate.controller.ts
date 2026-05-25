import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import certificateService from "../../services/certificates/certificate.service.js";
import { ok, requireUser } from "../../utils/http.js";
import { parsePositiveInt } from "../../validators/common.validator.js";

export class CertificateController {
  async getCourseCertificate(req: AuthenticatedRequest, res: Response) {
    const user = requireUser(req);

    const courseId = parsePositiveInt(req.params.courseId, "course ID");
    const certificate = await certificateService.getCourseCertificate(user.user_id, courseId);

    return ok(res, certificate);
  }
}

export default new CertificateController();
