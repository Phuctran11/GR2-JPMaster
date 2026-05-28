import type { Flashcard } from '../../services/api';
import type { FlashcardFormState } from '../../hooks/flashcards/flashcardFormUtils';
import { FlashcardMediaField } from './FlashcardMediaField';

export function FlashcardEditDialog({
  card,
  form,
  saving,
  uploadingMedia,
  onChange,
  onClose,
  onSubmit,
  onUploadMedia,
}: {
  card: Flashcard;
  form: FlashcardFormState;
  saving: boolean;
  uploadingMedia: 'image' | 'audio' | null;
  onChange: (form: FlashcardFormState) => void;
  onClose: () => void;
  onSubmit: () => void;
  onUploadMedia: (file: File, mediaKind: 'image' | 'audio') => void;
}) {
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant px-5 py-4">
          <div className="min-w-0">
            <p className="text-label-md font-bold uppercase tracking-wide text-primary">Edit Flashcard</p>
            <h2 className="truncate text-title-lg font-bold text-on-surface">{card.front_text}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container"
            aria-label="Close edit dialog"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-label-md font-bold text-on-surface">Front <span className="text-error">Required</span></span>
              <textarea
                className="min-h-28 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary"
                value={form.frontText}
                onChange={(event) => onChange({ ...form, frontText: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-label-md font-bold text-on-surface">Back <span className="text-error">Required</span></span>
              <textarea
                className="min-h-28 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary"
                value={form.backText}
                onChange={(event) => onChange({ ...form, backText: event.target.value })}
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-label-md font-bold text-on-surface">Reading <span className="font-normal text-on-surface-variant">Optional</span></span>
              <input
                className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary"
                value={form.reading}
                onChange={(event) => onChange({ ...form, reading: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-label-md font-bold text-on-surface">Tags <span className="font-normal text-on-surface-variant">Optional</span></span>
              <input
                className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary"
                value={form.tags}
                onChange={(event) => onChange({ ...form, tags: event.target.value })}
                placeholder="Comma separated tags"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-label-md font-bold text-on-surface">Example sentence <span className="font-normal text-on-surface-variant">Optional</span></span>
            <textarea
              className="min-h-24 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary"
              value={form.exampleSentence}
              onChange={(event) => onChange({ ...form, exampleSentence: event.target.value })}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <FlashcardMediaField
              label="Image"
              placeholder="https://..."
              value={form.imageUrl}
              mediaKind="image"
              uploadingMedia={uploadingMedia}
              previewAlt="Flashcard edit preview"
              onChange={(imageUrl) => onChange({ ...form, imageUrl })}
              onUploadMedia={onUploadMedia}
            />
            <FlashcardMediaField
              label="Audio"
              placeholder="https://..."
              value={form.audioUrl}
              mediaKind="audio"
              uploadingMedia={uploadingMedia}
              previewAlt="Flashcard audio"
              onChange={(audioUrl) => onChange({ ...form, audioUrl })}
              onUploadMedia={onUploadMedia}
            />
          </div>
          {uploadingMedia && <p className="rounded-lg bg-primary/10 px-3 py-2 text-label-md font-bold text-primary">Uploading {uploadingMedia}...</p>}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-outline-variant px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-lg border border-outline-variant px-4 py-2 font-bold text-on-surface hover:bg-surface-container disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving || uploadingMedia !== null}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-on-primary hover:bg-primary/90 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">{saving ? 'hourglass_empty' : 'save'}</span>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
