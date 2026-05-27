export function FlashcardMediaField({
  label,
  placeholder,
  value,
  mediaKind,
  uploadingMedia,
  previewAlt,
  onChange,
  onUploadMedia,
}: {
  label?: string;
  placeholder: string;
  value: string;
  mediaKind: 'image' | 'audio';
  uploadingMedia: 'image' | 'audio' | null;
  previewAlt: string;
  onChange: (value: string) => void;
  onUploadMedia: (file: File, mediaKind: 'image' | 'audio') => void;
}) {
  return (
    <label className="block rounded-lg border border-outline-variant p-3">
      {label && (
        <span className="mb-1 block text-label-md font-bold text-on-surface">
          {label} <span className="font-normal text-on-surface-variant">Optional</span>
        </span>
      )}
      <input
        className="w-full outline-none"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <input
        className="mt-2 block w-full text-label-md text-on-surface-variant file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-label-md file:font-bold file:text-on-primary"
        type="file"
        accept={`${mediaKind}/*`}
        disabled={uploadingMedia !== null}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onUploadMedia(file, mediaKind);
          event.currentTarget.value = '';
        }}
      />
      {mediaKind === 'image' && value && (
        <img src={value} alt={previewAlt} className="mt-3 max-h-40 w-full rounded-lg border border-outline-variant object-contain" />
      )}
      {mediaKind === 'audio' && value && (
        <audio controls src={value} className="mt-3 w-full">
          <track kind="captions" />
        </audio>
      )}
    </label>
  );
}
