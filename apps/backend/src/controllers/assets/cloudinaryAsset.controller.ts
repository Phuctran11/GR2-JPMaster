import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import cloudinaryAssetService from "../../services/assets/cloudinaryAsset.service.js";
import { created } from "../../utils/http.js";

export class CloudinaryAssetController {
  async uploadAsset(req: AuthenticatedRequest, res: Response) {
    const asset = await cloudinaryAssetService.uploadAsset({
      file: req.file,
      mediaKind: req.body.media_kind,
      scope: req.body.scope,
      uploadedBy: req.user?.user_id ?? null,
    });

    return created(res, "Asset uploaded successfully", asset);
  }
}

export default new CloudinaryAssetController();
