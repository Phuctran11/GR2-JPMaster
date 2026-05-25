import { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { adminAPI, type AdminCloudinaryAsset } from '../../services/api';

export function useAdminAssetUpload() {
  const { addToast } = useToast();
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const uploadAsset = async (
    file: File,
    mediaKind: 'image' | 'video' | 'audio',
    scope: string,
    fieldKey: string
  ): Promise<AdminCloudinaryAsset> => {
    setUploadingField(fieldKey);
    try {
      const response = await adminAPI.uploadAsset({ file, media_kind: mediaKind, scope });
      addToast('Asset uploaded successfully', 'success', 2500);
      return response.data;
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Upload failed', 'error');
      throw err;
    } finally {
      setUploadingField(null);
    }
  };

  return { uploadingField, uploadAsset };
}
