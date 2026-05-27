import type { UseFormSetValue } from 'react-hook-form';
import type { AdminCloudinaryAsset } from '../../../../services/api';
import type { AdminQuestionFormValues } from '../../adminFormTypes';
import { AssetUploader } from '../../DashboardUi';

export function QuestionMediaFields({
  form,
  managingJlptSectionId,
  uploadingField,
  onUpload,
  setValue,
}: {
  form: AdminQuestionFormValues;
  managingJlptSectionId: number | null;
  uploadingField: string | null;
  onUpload: (file: File, mediaKind: 'image' | 'video' | 'audio', scope: string, fieldKey: string) => Promise<AdminCloudinaryAsset>;
  setValue: UseFormSetValue<AdminQuestionFormValues>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <AssetUploader
        label="Question Image"
        accept="image/*"
        previewUrl={form.image_url}
        mediaKind="image"
        scope="questions"
        fieldKey="question-image"
        uploadingField={uploadingField}
        onUpload={onUpload}
        onUploaded={(asset) => {
          setValue('image_asset_id', asset.asset_id);
          setValue('image_url', asset.secure_url);
        }}
      />
      {form.section_type === 'listening' && !managingJlptSectionId && (
        <AssetUploader
          label="Listening Audio"
          accept="audio/*"
          previewUrl={form.audio_url}
          mediaKind="audio"
          scope="questions"
          fieldKey="question-audio"
          uploadingField={uploadingField}
          onUpload={onUpload}
          onUploaded={(asset) => {
            setValue('audio_asset_id', asset.asset_id);
            setValue('audio_url', asset.secure_url);
          }}
        />
      )}
    </div>
  );
}
