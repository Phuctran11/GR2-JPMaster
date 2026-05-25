import type { Express } from "express";
import { getMaxUploadFileSizeMb } from "../../config/runtime.js";
import cloudinaryAssetModel from "../../models/assets/cloudinaryAsset.model.js";
import { ApiError } from "../../utils/http.js";
import { logger } from "../../utils/logger.js";
import { MediaKind, uploadBufferToCloudinary } from "./cloudinary.service.js";

const VALID_MEDIA_KINDS: MediaKind[] = ["image", "video", "audio"];
const MAX_FILE_SIZE_MB = getMaxUploadFileSizeMb();

const getFolder = (mediaKind: MediaKind, scope: string) => {
  const normalizedScope = scope === "questions" ? "question-bank" : scope;
  const safeScope = normalizedScope.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase() || "general";
  return `jpmaster/${safeScope}/${mediaKind}`;
};

const assertValidUpload = (file: Express.Multer.File, mediaKind: MediaKind) => {
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new ApiError(400, `File must be smaller than ${MAX_FILE_SIZE_MB}MB`);
  }

  if (mediaKind === "image" && !file.mimetype.startsWith("image/")) {
    throw new ApiError(400, "Only image files are allowed for image uploads");
  }

  if (mediaKind === "video" && !file.mimetype.startsWith("video/")) {
    throw new ApiError(400, "Only video files are allowed for video uploads");
  }

  if (mediaKind === "audio" && !file.mimetype.startsWith("audio/")) {
    throw new ApiError(400, "Only audio files are allowed for audio uploads");
  }
};

export class CloudinaryAssetService {
  async uploadAsset(input: {
    file?: Express.Multer.File;
    mediaKind: unknown;
    scope: unknown;
    uploadedBy?: number | null;
  }) {
    if (!input.file) {
      throw new ApiError(400, "File is required");
    }

    const mediaKind = input.mediaKind as MediaKind;
    const scope = typeof input.scope === "string" ? input.scope : "admin";

    if (!VALID_MEDIA_KINDS.includes(mediaKind)) {
      throw new ApiError(400, "media_kind must be image, video, or audio");
    }

    assertValidUpload(input.file, mediaKind);

    const folder = getFolder(mediaKind, scope);
    logger.info("Starting Cloudinary upload", {
      context: "cloudinaryAsset.service",
      media_kind: mediaKind,
      scope,
      folder,
      filename: input.file.originalname,
      mimetype: input.file.mimetype,
      size: input.file.size,
      user_id: input.uploadedBy ?? null,
    });

    const uploaded = await uploadBufferToCloudinary(input.file, mediaKind, folder);
    logger.info("Cloudinary upload completed", {
      context: "cloudinaryAsset.service",
      media_kind: mediaKind,
      folder,
      public_id: uploaded.public_id,
      resource_type: uploaded.resource_type,
      bytes: uploaded.bytes,
    });

    return cloudinaryAssetModel.createAsset({
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
      original_filename: input.file.originalname,
      uploaded_by: input.uploadedBy ?? null,
    });
  }
}

export default new CloudinaryAssetService();
