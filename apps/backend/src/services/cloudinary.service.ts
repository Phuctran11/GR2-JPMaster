import { UploadApiResponse, v2 as cloudinary } from "cloudinary";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

export type MediaKind = "image" | "video" | "audio";

const CLOUDINARY_UPLOAD_TIMEOUT_MS = 10 * 60 * 1000;
const CLOUDINARY_UPLOAD_CHUNK_SIZE = 20 * 1024 * 1024;
const CHUNKED_UPLOAD_THRESHOLD_BYTES = 20 * 1024 * 1024;
const MAX_UPLOAD_ATTEMPTS = 3;

const getResourceType = (mediaKind: MediaKind): "image" | "video" => {
  if (mediaKind === "image") return "image";
  return "video";
};

const configureCloudinary = () => {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ secure: true });
    return;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
};

const getErrorDetails = (error: unknown) => {
  if (error instanceof Error) {
    return { message: error.message, name: error.name, stack: error.stack };
  }
  if (error && typeof error === "object") {
    return error;
  }
  return { message: String(error) };
};

const getErrorMessage = (error: unknown) => {
  const details = getErrorDetails(error);
  if (details && typeof details === "object" && "error" in details) {
    const nested = (details as { error?: unknown }).error;
    if (nested && typeof nested === "object" && "message" in nested) {
      return String((nested as { message?: unknown }).message);
    }
  }
  if (details && typeof details === "object" && "message" in details) {
    return String((details as { message?: unknown }).message);
  }
  return String(error);
};

const isRetryableUploadError = (error: unknown) => {
  const details = getErrorDetails(error);
  const message = getErrorMessage(error);
  const httpCode = details && typeof details === "object" && "error" in details
    ? (details as { error?: { http_code?: unknown } }).error?.http_code
    : details && typeof details === "object" && "http_code" in details
      ? (details as { http_code?: unknown }).http_code
      : undefined;

  return /timeout|request timeout|econnreset|etimedout|socket hang up/i.test(message) || httpCode === 499 || httpCode === 502 || httpCode === 503 || httpCode === 504;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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

const shouldUseChunkedUpload = (mediaKind: MediaKind, fileSize: number) => {
  if (mediaKind === "image") return false;
  return fileSize >= CHUNKED_UPLOAD_THRESHOLD_BYTES;
};

const writeTempUploadFile = async (file: Express.Multer.File) => {
  const dir = await mkdtemp(path.join(tmpdir(), "jpmaster-upload-"));
  const extension = path.extname(file.originalname);
  const filePath = path.join(dir, `upload-${Date.now()}${extension}`);
  await writeFile(filePath, file.buffer);
  return filePath;
};

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

  console.info("[UPLOAD] Cloudinary upload options", {
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
        console.error("[UPLOAD] Cloudinary upload attempt failed", {
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

    console.info("[UPLOAD] Cloudinary upload completed", {
      folder,
      media_kind: mediaKind,
      resource_type: resourceType,
      filename: file.originalname,
      size: file.size,
      duration_ms: Date.now() - startedAt,
    });

    return toUploadResult(result);
  } catch (error) {
    console.error("[UPLOAD] Cloudinary upload failed", {
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
    await rm(path.dirname(filePath), { recursive: true, force: true }).catch(() => undefined);
  }
};

export const deleteCloudinaryAsset = async (publicId: string, mediaKind: MediaKind) => {
  configureCloudinary();
  const resourceType = getResourceType(mediaKind);
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

export default cloudinary;
