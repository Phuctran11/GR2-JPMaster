import { Button, Icon } from '../index';
import { Heading } from '../ui/Typography';
import type { FlashcardVisibility } from '../../services/api';
import type { CollectionFormState } from '../../hooks/flashcards/collectionFormUtils';

export function CollectionDialog({
  mode,
  form,
  saving,
  onChange,
  onClose,
  onSubmit,
  onDelete,
}: {
  mode: 'create' | 'edit';
  form: CollectionFormState;
  saving: boolean;
  onChange: (next: CollectionFormState) => void;
  onClose: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true">
      <section className="w-full max-w-lg rounded-xl border border-outline-variant bg-surface p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-label-md font-bold uppercase tracking-wide text-primary">
              {mode === 'create' ? 'New Collection' : 'Update Collection'}
            </p>
            <Heading level="h2" size="headline-sm" className="mt-1">
              {mode === 'create' ? 'Create flashcard collection' : 'Collection details'}
            </Heading>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container">
            <Icon name="close" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1 block text-label-md font-bold text-on-surface">Title</span>
            <input
              value={form.title}
              onChange={(event) => onChange({ ...form, title: event.target.value })}
              className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 outline-none focus:border-primary"
              placeholder="e.g. Daily Phrases"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-label-md font-bold text-on-surface">Description</span>
            <textarea
              value={form.description}
              onChange={(event) => onChange({ ...form, description: event.target.value })}
              rows={3}
              className="w-full resize-y rounded-lg border border-outline-variant bg-surface px-4 py-3 outline-none focus:border-primary"
              placeholder="What does this collection cover?"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-label-md font-bold text-on-surface">Visibility</span>
            <select
              value={form.visibility}
              onChange={(event) => onChange({ ...form, visibility: event.target.value as FlashcardVisibility })}
              className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 outline-none focus:border-primary"
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={saving}
              className="rounded-lg border border-error/40 bg-surface px-5 py-3 font-bold text-on-error-container hover:bg-error-container disabled:opacity-50"
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="rounded-lg border border-outline-variant bg-surface px-5 py-3 font-bold text-on-surface">
              Cancel
            </button>
            <Button onClick={onSubmit} disabled={!form.title.trim() || saving}>
              {saving ? 'Saving...' : mode === 'create' ? 'Create Collection' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
