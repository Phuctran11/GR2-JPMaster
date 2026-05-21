import { UploadApiResponse, v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

export type MediaKind = "image" | "video" | "audio";
const CLOUDINARY_UPLOAD_TIMEOUT_MS = 10 * 60 * 1000;
const CLOUDINARY_UPLOAD_CHUNK_SIZE = 20 * 1024 * 1024;

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

export const uploadBufferToCloudinary = async (
  file: Express.Multer.File,
  mediaKind: MediaKind,
  folder: string
): Promise<UploadApiResponse> => {
  configureCloudinary();
  const resourceType = getResourceType(mediaKind);
  const uploadOptions = {
    folder,
    resource_type: resourceType,
    use_filename: true,
    unique_filename: true,
    timeout: CLOUDINARY_UPLOAD_TIMEOUT_MS,
  };

  return new Promise((resolve, reject) => {
    const callback = (
      error: unknown,
      result?: UploadApiResponse
    ) => {
      if (error) {
        reject(error);
        return;
      }

      if (!result) {
        reject(new Error("Cloudinary did not return an upload result"));
        return;
      }

      resolve(result);
    };

    const uploadStream = mediaKind === "image"
      ? cloudinary.uploader.upload_stream(uploadOptions, callback)
      : cloudinary.uploader.upload_chunked_stream(
        {
          ...uploadOptions,
          chunk_size: CLOUDINARY_UPLOAD_CHUNK_SIZE,
        },
        callback
      );

    uploadStream.on("error", reject);
    Readable.from(file.buffer).pipe(uploadStream);
  });
};

export const deleteCloudinaryAsset = async (publicId: string, mediaKind: MediaKind) => {
  configureCloudinary();
  const resourceType = getResourceType(mediaKind);
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

export default cloudinary;
