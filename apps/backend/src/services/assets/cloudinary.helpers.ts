import { v2 as cloudinary } from "cloudinary";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

export type MediaKind = "image" | "video" | "audio";

export const CLOUDINARY_UPLOAD_TIMEOUT_MS = 10 * 60 * 1000;
export const CLOUDINARY_UPLOAD_CHUNK_SIZE = 20 * 1024 * 1024;
export const CHUNKED_UPLOAD_THRESHOLD_BYTES = 20 * 1024 * 1024;
export const MAX_UPLOAD_ATTEMPTS = 3;

export const getResourceType = (mediaKind: MediaKind): "image" | "video" => {
  if (mediaKind === "image") return "image";
  return "video";
};

export const configureCloudinary = () => {
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

export const getErrorDetails = (error: unknown) => {
  if (error instanceof Error) {
    return { message: error.message, name: error.name, stack: error.stack };
  }
  if (error && typeof error === "object") {
    return error;
  }
  return { message: String(error) };
};

export const getErrorMessage = (error: unknown) => {
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

export const isRetryableUploadError = (error: unknown) => {
  const details = getErrorDetails(error);
  const message = getErrorMessage(error);
  const httpCode = details && typeof details === "object" && "error" in details
    ? (details as { error?: { http_code?: unknown } }).error?.http_code
    : details && typeof details === "object" && "http_code" in details
      ? (details as { http_code?: unknown }).http_code
      : undefined;

  return /timeout|request timeout|econnreset|etimedout|socket hang up/i.test(message) ||
    httpCode === 499 ||
    httpCode === 502 ||
    httpCode === 503 ||
    httpCode === 504;
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const shouldUseChunkedUpload = (mediaKind: MediaKind, fileSize: number) => {
  if (mediaKind === "image") return false;
  return fileSize >= CHUNKED_UPLOAD_THRESHOLD_BYTES;
};

export const writeTempUploadFile = async (file: Express.Multer.File) => {
  const dir = await mkdtemp(path.join(tmpdir(), "jpmaster-upload-"));
  const extension = path.extname(file.originalname);
  const filePath = path.join(dir, `upload-${Date.now()}${extension}`);
  await writeFile(filePath, file.buffer);
  return filePath;
};

export const removeTempUploadFile = async (filePath: string) => {
  await rm(path.dirname(filePath), { recursive: true, force: true }).catch(() => undefined);
};
