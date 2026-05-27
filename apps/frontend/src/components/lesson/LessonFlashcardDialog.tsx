import type { FlashcardCollection } from '../../services/api';
import type { LessonFlashcardDraft } from '../../hooks/lesson/useLessonFlashcards';

export function LessonFlashcardDialog({
  lessonTitle,
  draft,
  collections,
  collectionLoading,
  saving,
  uploadingMedia,
  onUpdateDraft,
  onUploadMedia,
  onSubmit,
  onClose,
}: {
  lessonTitle: string;
  draft: LessonFlashcardDraft;
  collections: FlashcardCollection[];
  collectionLoading: boolean;
  saving: boolean;
  uploadingMedia: 'image' | 'audio' | null;
  onUpdateDraft: (changes: Partial<LessonFlashcardDraft>) => void;
  onUploadMedia: (file: File, mediaKind: 'image' | 'audio') => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant px-5 py-4">
          <div className="min-w-0">
            <p className="text-label-md font-bold uppercase tracking-wide text-primary">Save Flashcard</p>
            <h2 className="truncate text-title-lg font-bold text-on-surface">{lessonTitle}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container"
            aria-label="Close flashcard dialog"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
            <p className="mb-2 text-label-md font-bold text-on-surface">Selected text</p>
            <p className="whitespace-pre-wrap text-body-md text-on-surface-variant">{draft.selectedText}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-label-md font-bold text-on-surface">Front <span className="text-error">Required</span></span>
              <textarea
                className="min-h-28 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                value={draft.frontText}
                onChange={(event) => onUpdateDraft({ frontText: event.target.value })}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-label-md font-bold text-on-surface">Back <span className="text-error">Required</span></span>
              <textarea
                className="min-h-28 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                value={draft.backText}
                onChange={(event) => onUpdateDraft({ backText: event.target.value })}
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-label-md font-bold text-on-surface">Reading <span className="font-normal text-on-surface-variant">Optional</span></span>
              <input
                className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                value={draft.reading}
                onChange={(event) => onUpdateDraft({ reading: event.target.value })}
                placeholder="Kana, romaji, or pronunciation note"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-label-md font-bold text-on-surface">Tags <span className="font-normal text-on-surface-variant">Optional</span></span>
              <input
                className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                value={draft.tags}
                onChange={(event) => onUpdateDraft({ tags: event.target.value })}
                placeholder="Comma separated tags"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-label-md font-bold text-on-surface">Example sentence <span className="font-normal text-on-surface-variant">Optional</span></span>
            <textarea
              className="min-h-24 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              value={draft.exampleSentence}
              onChange={(event) => onUpdateDraft({ exampleSentence: event.target.value })}
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-label-md font-bold text-on-surface">Image URL <span className="font-normal text-on-surface-variant">Optional</span></span>
              <input
                className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                value={draft.imageUrl}
                onChange={(event) => onUpdateDraft({ imageUrl: event.target.value })}
                placeholder="https://..."
              />
              <input
                className="mt-2 block w-full text-label-md text-on-surface-variant file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-label-md file:font-bold file:text-on-primary"
                type="file"
                accept="image/*"
                disabled={uploadingMedia !== null}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onUploadMedia(file, 'image');
                  event.currentTarget.value = '';
                }}
              />
              {draft.imageUrl && (
                <img src={draft.imageUrl} alt="Flashcard preview" className="mt-3 max-h-40 w-full rounded-lg border border-outline-variant object-contain" />
              )}
            </label>
            <label className="block">
              <span className="mb-1 block text-label-md font-bold text-on-surface">Audio URL <span className="font-normal text-on-surface-variant">Optional</span></span>
              <input
                className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                value={draft.audioUrl}
                onChange={(event) => onUpdateDraft({ audioUrl: event.target.value })}
                placeholder="https://..."
              />
              <input
                className="mt-2 block w-full text-label-md text-on-surface-variant file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-label-md file:font-bold file:text-on-primary"
                type="file"
                accept="audio/*"
                disabled={uploadingMedia !== null}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) onUploadMedia(file, 'audio');
                  event.currentTarget.value = '';
                }}
              />
              {draft.audioUrl && (
                <audio controls src={draft.audioUrl} className="mt-3 w-full">
                  <track kind="captions" />
                </audio>
              )}
            </label>
          </div>
          {uploadingMedia && (
            <p className="rounded-lg bg-primary/10 px-3 py-2 text-label-md font-bold text-primary">
              Uploading {uploadingMedia}...
            </p>
          )}

          <div className="rounded-lg border border-outline-variant p-4">
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onUpdateDraft({ isCreatingCollection: false })}
                disabled={collections.length === 0}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-label-md font-bold ${
                  !draft.isCreatingCollection ? 'bg-primary text-on-primary' : 'border border-outline-variant text-on-surface hover:bg-surface-container'
                } disabled:opacity-50`}
              >
                <span className="material-symbols-outlined text-[18px]">folder</span>
                Existing Collection
              </button>
              <button
                type="button"
                onClick={() => onUpdateDraft({ isCreatingCollection: true })}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-label-md font-bold ${
                  draft.isCreatingCollection ? 'bg-primary text-on-primary' : 'border border-outline-variant text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">create_new_folder</span>
                New Collection
              </button>
            </div>

            {draft.isCreatingCollection ? (
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-label-md font-bold text-on-surface">Collection title <span className="text-error">Required</span></span>
                  <input
                    className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                    value={draft.newCollectionTitle}
                    onChange={(event) => onUpdateDraft({ newCollectionTitle: event.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-label-md font-bold text-on-surface">Description <span className="font-normal text-on-surface-variant">Optional</span></span>
                  <textarea
                    className="min-h-20 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                    value={draft.newCollectionDescription}
                    onChange={(event) => onUpdateDraft({ newCollectionDescription: event.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-label-md font-bold text-on-surface">Visibility <span className="text-error">Required</span></span>
                  <select
                    className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                    value={draft.newCollectionVisibility}
                    onChange={(event) => onUpdateDraft({ newCollectionVisibility: event.target.value as 'private' | 'public' })}
                  >
                    <option value="private">Private</option>
                    <option value="public">Public</option>
                  </select>
                </label>
              </div>
            ) : collectionLoading ? (
              <div className="rounded-lg border border-dashed border-outline-variant bg-surface-container-low p-4 text-center text-on-surface-variant">
                Loading collections...
              </div>
            ) : collections.length > 0 ? (
              <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                {collections.map((collection) => (
                  <label
                    key={collection.collection_id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                      draft.collectionId === String(collection.collection_id)
                        ? 'border-primary bg-primary/5'
                        : 'border-outline-variant hover:bg-surface-container'
                    }`}
                  >
                    <input
                      type="radio"
                      className="mt-1"
                      checked={draft.collectionId === String(collection.collection_id)}
                      onChange={() => onUpdateDraft({ collectionId: String(collection.collection_id) })}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body-md font-bold text-on-surface">{collection.title}</span>
                      <span className="block text-label-md text-on-surface-variant">
                        {collection.card_count ?? 0} cards - {collection.visibility}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-outline-variant bg-surface-container-low p-4 text-center text-on-surface-variant">
                No collections yet. Create one to save this flashcard.
              </div>
            )}
          </div>
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
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-on-primary hover:bg-primary/90 disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">{saving ? 'hourglass_empty' : 'style'}</span>
            {saving ? 'Saving...' : 'Save Flashcard'}
          </button>
        </div>
      </div>
    </div>
  );
}
