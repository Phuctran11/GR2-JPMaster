import databaseService from "../services/database.service.js";
import { MediaKind } from "../services/cloudinary.service.js";

export interface CloudinaryAssetInput {
  public_id: string;
  secure_url: string;
  resource_type: "image" | "video" | "raw";
  media_kind: MediaKind;
  format: string | null;
  bytes: number | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  folder: string | null;
  original_filename: string | null;
  uploaded_by: number | null;
}

export interface CloudinaryAsset extends CloudinaryAssetInput {
  asset_id: number;
  created_at: Date;
  updated_at: Date;
}

export class CloudinaryAssetModel {
  async createAsset(input: CloudinaryAssetInput): Promise<CloudinaryAsset> {
    const result = await databaseService.executeQuery(
      `
        INSERT INTO "CloudinaryAsset" (
          public_id, secure_url, resource_type, media_kind, format, bytes, width, height,
          duration_seconds, folder, original_filename, uploaded_by, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING asset_id, public_id, secure_url, resource_type, media_kind, format, bytes, width,
                  height, duration_seconds, folder, original_filename, uploaded_by, created_at, updated_at;
      `,
      [
        input.public_id,
        input.secure_url,
        input.resource_type,
        input.media_kind,
        input.format,
        input.bytes,
        input.width,
        input.height,
        input.duration_seconds,
        input.folder,
        input.original_filename,
        input.uploaded_by,
      ]
    );

    return result.rows[0];
  }

  async getAssetById(assetId: number): Promise<CloudinaryAsset | null> {
    const result = await databaseService.executeQuery(
      `
        SELECT asset_id, public_id, secure_url, resource_type, media_kind, format, bytes, width,
               height, duration_seconds, folder, original_filename, uploaded_by, created_at, updated_at
        FROM "CloudinaryAsset"
        WHERE asset_id = $1;
      `,
      [assetId]
    );

    return result.rows[0] || null;
  }
}

export default new CloudinaryAssetModel();
