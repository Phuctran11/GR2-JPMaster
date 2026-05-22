import { Response, NextFunction } from "express";
import cloudinaryAssetModel from "../models/cloudinaryAsset.model.js";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { MediaKind, uploadBufferToCloudinary } from "../services/cloudinary.service.js";

const VALID_MEDIA_KINDS: MediaKind[] = ["image", "video", "audio"];
const MAX_FILE_SIZE_MB = 200;

const getFolder = (mediaKind: MediaKind, scope: string) => {
  const safeScope = scope.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase() || "general";
  return `jpmaster/${safeScope}/${mediaKind}`;
};

export class CloudinaryAssetController {
  async uploadAsset(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "File is required" });
      }

      const mediaKind = req.body.media_kind as MediaKind;
      const scope = typeof req.body.scope === "string" ? req.body.scope : "admin";

      if (!VALID_MEDIA_KINDS.includes(mediaKind)) {
        return res.status(400).json({ error: "media_kind must be image, video, or audio" });
      }

      if (req.file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        return res.status(400).json({ error: `File must be smaller than ${MAX_FILE_SIZE_MB}MB` });
      }

      if (mediaKind === "image" && !req.file.mimetype.startsWith("image/")) {
        return res.status(400).json({ error: "Only image files are allowed for image uploads" });
      }

      if (mediaKind === "video" && !req.file.mimetype.startsWith("video/")) {
        return res.status(400).json({ error: "Only video files are allowed for video uploads" });
      }

      if (mediaKind === "audio" && !req.file.mimetype.startsWith("audio/")) {
        return res.status(400).json({ error: "Only audio files are allowed for audio uploads" });
      }

      const folder = getFolder(mediaKind, scope);
      const uploaded = await uploadBufferToCloudinary(req.file, mediaKind, folder);
      const asset = await cloudinaryAssetModel.createAsset({
        public_id: uploaded.public_id,
        secure_url: uploaded.secure_url,
        resource_type: uploaded.resource_type as "image" | "video" | "raw",
        media_kind: mediaKind,
        format: uploaded.format ?? null,
        bytes: uploaded.bytes ?? null,
        width: uploaded.width ?? null,
        height: uploaded.height ?? null,
        duration_seconds: typeof uploaded.duration === "number" ? uploaded.duration : null,
        folder,
        original_filename: req.file.originalname,
        uploaded_by: req.user?.user_id ?? null,
      });

      return res.status(201).json({ message: "Asset uploaded successfully", data: asset });
    } catch (error) {
      next(error);
    }
  }
}

export default new CloudinaryAssetController();
