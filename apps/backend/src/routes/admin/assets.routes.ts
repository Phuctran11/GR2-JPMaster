import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";
import cloudinaryAssetController from "../../controllers/assets/cloudinaryAsset.controller.js";
import { getMaxUploadFileSizeMb } from "../../config/runtime.js";
import { asyncHandler } from "../../utils/http.js";

const router = Router();
const MAX_UPLOAD_FILE_SIZE_MB = getMaxUploadFileSizeMb();
const UPLOAD_REQUEST_TIMEOUT_MS = 10 * 60 * 1000;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_FILE_SIZE_MB * 1024 * 1024,
    files: 1,
  },
});

const extendUploadTimeout = (req: Request, res: Response, next: NextFunction) => {
  req.setTimeout(UPLOAD_REQUEST_TIMEOUT_MS);
  res.setTimeout(UPLOAD_REQUEST_TIMEOUT_MS);
  next();
};

router.post("/upload", extendUploadTimeout, upload.single("file"), asyncHandler(cloudinaryAssetController.uploadAsset));

export default router;
