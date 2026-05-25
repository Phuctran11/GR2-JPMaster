import { getYouTubeEmbedUrl } from '../../lesson/lessonUtils';
import type { AdminCloudinaryAsset } from '../../../services/api';
import { secondaryButtonClass } from '../adminClasses';

export function AssetUploader({
  label,
  accept,
  previewUrl,
  mediaKind,
  scope,
  fieldKey,
  uploadingField,
  onUpload,
  onUploaded,
}: {
  label: string;
  accept: string;
  previewUrl?: string | null;
  mediaKind: 'image' | 'video' | 'audio';
  scope: string;
  fieldKey: string;
  uploadingField: string | null;
  onUpload: (file: File, mediaKind: 'image' | 'video' | 'audio', scope: string, fieldKey: string) => Promise<AdminCloudinaryAsset>;
  onUploaded: (asset: AdminCloudinaryAsset) => void;
}) {
  const isUploading = uploadingField === fieldKey;
  const youtubeEmbedUrl = mediaKind === 'video' ? getYouTubeEmbedUrl(previewUrl ?? null) : null;

  return (
    <div className="space-y-2 rounded-lg border border-outline-variant bg-surface-container-low p-3">
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
        <div>
          <p className="text-label-md font-semibold text-on-surface">{label}</p>
          <p className="text-label-md text-on-surface-variant">Upload from your computer to Cloudinary.</p>
        </div>
        <label className={`${secondaryButtonClass} cursor-pointer`}>
          <span className="material-symbols-outlined text-[18px]">upload</span>
          {isUploading ? 'Uploading...' : 'Choose File'}
          <input
            type="file"
            accept={accept}
            disabled={isUploading}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (!file) return;
              void onUpload(file, mediaKind, scope, fieldKey).then(onUploaded);
            }}
          />
        </label>
      </div>
      {previewUrl && (
        <div className="overflow-hidden rounded border border-outline-variant bg-surface p-2">
          {mediaKind === 'image' && <img src={previewUrl} alt={label} className="max-h-40 w-full object-cover" />}
          {mediaKind === 'video' && (
            youtubeEmbedUrl ? (
              <div className="aspect-video w-full overflow-hidden rounded bg-inverse-surface">
                <iframe
                  className="h-full w-full"
                  src={youtubeEmbedUrl}
                  title={label}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              <video src={previewUrl} controls className="max-h-52 w-full" />
            )
          )}
          {mediaKind === 'audio' && <audio src={previewUrl} controls className="w-full" />}
          <p className="mt-2 break-all text-label-md text-on-surface-variant">{previewUrl}</p>
        </div>
      )}
    </div>
  );
}
