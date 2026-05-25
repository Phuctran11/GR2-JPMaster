import { Button } from '../Button';
import { Card } from '../ui';
import type { FlashcardFormState } from '../../hooks/flashcards/flashcardFormUtils';
import { FlashcardMediaField } from './FlashcardMediaField';

export function FlashcardCreateCardForm({
  form,
  saving,
  uploadingMedia,
  onChange,
  onSubmit,
  onUploadMedia,
}: {
  form: FlashcardFormState;
  saving: boolean;
  uploadingMedia: 'image' | 'audio' | null;
  onChange: (form: FlashcardFormState) => void;
  onSubmit: () => void;
  onUploadMedia: (file: File, mediaKind: 'image' | 'audio') => void;
}) {
  return (
    <Card className="rounded-xl border border-outline-variant p-stack-lg">
      <div className="grid grid-cols-1 gap-stack-md md:grid-cols-2">
        <input
          className="rounded-lg border border-outline-variant p-3 outline-none focus:border-primary"
          placeholder="Front text"
          value={form.frontText}
          onChange={(event) => onChange({ ...form, frontText: event.target.value })}
        />
        <input
          className="rounded-lg border border-outline-variant p-3 outline-none focus:border-primary"
          placeholder="Back text"
          value={form.backText}
          onChange={(event) => onChange({ ...form, backText: event.target.value })}
        />
        <input
          className="rounded-lg border border-outline-variant p-3 outline-none focus:border-primary"
          placeholder="Reading"
          value={form.reading}
          onChange={(event) => onChange({ ...form, reading: event.target.value })}
        />
        <input
          className="rounded-lg border border-outline-variant p-3 outline-none focus:border-primary"
          placeholder="Example sentence"
          value={form.exampleSentence}
          onChange={(event) => onChange({ ...form, exampleSentence: event.target.value })}
        />
        <FlashcardMediaField
          placeholder="Image URL"
          value={form.imageUrl}
          mediaKind="image"
          uploadingMedia={uploadingMedia}
          previewAlt="Flashcard preview"
          onChange={(imageUrl) => onChange({ ...form, imageUrl })}
          onUploadMedia={onUploadMedia}
        />
        <FlashcardMediaField
          placeholder="Audio URL"
          value={form.audioUrl}
          mediaKind="audio"
          uploadingMedia={uploadingMedia}
          previewAlt="Flashcard audio"
          onChange={(audioUrl) => onChange({ ...form, audioUrl })}
          onUploadMedia={onUploadMedia}
        />
      </div>
      {uploadingMedia && <p className="mt-3 text-label-md font-bold text-primary">Uploading {uploadingMedia}...</p>}
      <div className="mt-stack-md flex justify-end">
        <Button onClick={onSubmit} disabled={!form.frontText.trim() || !form.backText.trim() || saving}>
          {saving ? 'Adding...' : 'Add Card'}
        </Button>
      </div>
    </Card>
  );
}
