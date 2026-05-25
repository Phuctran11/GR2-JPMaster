import { v2 as cloudinary } from "cloudinary";
import { configureCloudinary, getResourceType, type MediaKind } from "./cloudinary.helpers.js";

export const deleteCloudinaryAsset = async (publicId: string, mediaKind: MediaKind) => {
  configureCloudinary();
  const resourceType = getResourceType(mediaKind);
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};
