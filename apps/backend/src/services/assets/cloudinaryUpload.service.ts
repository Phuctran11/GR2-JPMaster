import { UploadApiResponse, v2 as cloudinary } from "cloudinary";
import { logger } from "../../utils/logger.js";
import {
  CHUNKED_UPLOAD_THRESHOLD_BYTES,
  CLOUDINARY_UPLOAD_CHUNK_SIZE,
  CLOUDINARY_UPLOAD_TIMEOUT_MS,
  configureCloudinary,
  getErrorDetails,
  getResourceType,
  isRetryableUploadError,
  type MediaKind,
  MAX_UPLOAD_ATTEMPTS,
  removeTempUploadFile,
  shouldUseChunkedUpload,
  sleep,
  writeTempUploadFile,
} from "./cloudinary.helpers.js";

const toUploadResult = (result: UploadApiResponse | unknown): UploadApiResponse => {
  if (!result || typeof result !== "object" || !("public_id" in result)) {
    throw new Error("Cloudinary did not return a completed upload result");
  }
  return result as UploadApiResponse;
};

const uploadLargeFile = (
  filePath: string,
  options: {
    folder: string;
    resource_type: "image" | "video";
    use_filename: boolean;
    unique_filename: boolean;
    timeout: number;
    chunk_size: number;
  }
) =>
  new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinary.uploader.upload_large(filePath, options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }

      try {
        resolve(toUploadResult(result));
      } catch (resultError) {
        reject(resultError);
      }
    });
  });

export const uploadBufferToCloudinary = async (
  file: Express.Multer.File,
  mediaKind: MediaKind,
  folder: string
): Promise<UploadApiResponse> => {
  configureCloudinary();
  const resourceType = getResourceType(mediaKind);
  const filePath = await writeTempUploadFile(file);
  const startedAt = Date.now();
  const useChunkedUpload = shouldUseChunkedUpload(mediaKind, file.size);

  const uploadOptions = {
    folder,
    resource_type: resourceType,
    use_filename: true,
    unique_filename: true,
    timeout: CLOUDINARY_UPLOAD_TIMEOUT_MS,
  };

  const uploadOnce = () => useChunkedUpload
    ? uploadLargeFile(filePath, {
      ...uploadOptions,
      chunk_size: CLOUDINARY_UPLOAD_CHUNK_SIZE,
    })
    : cloudinary.uploader.upload(filePath, uploadOptions);

  logger.info("Cloudinary upload options", {
    context: "cloudinary.upload",
    folder,
    media_kind: mediaKind,
    resource_type: resourceType,
    filename: file.originalname,
    size: file.size,
    timeout_ms: uploadOptions.timeout,
    chunk_size: CLOUDINARY_UPLOAD_CHUNK_SIZE,
    chunked_threshold: CHUNKED_UPLOAD_THRESHOLD_BYTES,
    strategy: useChunkedUpload ? "upload_large" : "upload",
  });

  try {
    let result: UploadApiResponse | unknown;
    for (let attempt = 1; attempt <= MAX_UPLOAD_ATTEMPTS; attempt += 1) {
      try {
        result = await uploadOnce();
        break;
      } catch (error) {
        logger.error("Cloudinary upload attempt failed", {
          context: "cloudinary.upload",
          attempt,
          max_attempts: MAX_UPLOAD_ATTEMPTS,
          folder,
          media_kind: mediaKind,
          resource_type: resourceType,
          filename: file.originalname,
          size: file.size,
          duration_ms: Date.now() - startedAt,
          error: getErrorDetails(error),
        });

        if (attempt >= MAX_UPLOAD_ATTEMPTS || !isRetryableUploadError(error)) {
          throw error;
        }

        await sleep(1000 * attempt);
      }
    }

    logger.info("Cloudinary upload completed", {
      context: "cloudinary.upload",
      folder,
      media_kind: mediaKind,
      resource_type: resourceType,
      filename: file.originalname,
      size: file.size,
      duration_ms: Date.now() - startedAt,
    });

    return toUploadResult(result);
  } catch (error) {
    logger.error("Cloudinary upload failed", {
      context: "cloudinary.upload",
      folder,
      media_kind: mediaKind,
      resource_type: resourceType,
      filename: file.originalname,
      size: file.size,
      duration_ms: Date.now() - startedAt,
      error: getErrorDetails(error),
    });
    throw error;
  } finally {
    await removeTempUploadFile(filePath);
  }
};
