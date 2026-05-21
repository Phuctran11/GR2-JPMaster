import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Footer, Button, Card, Container, Section, Icon, Breadcrumbs } from '../components';
import { Heading, Text } from '../components/ui/Typography';
import { flashcardAPI, type FlashcardCollection, type FlashcardVisibility } from '../services/api';
import { useToastMessages } from '../hooks/useToastMessages';

interface CollectionFormState {
  title: string;
  description: string;
  visibility: FlashcardVisibility;
}

const emptyCollectionForm: CollectionFormState = {
  title: '',
  description: '',
  visibility: 'private',
};

const PUBLIC_COLLECTION_POLL_INTERVAL_MS = 10000;

function CollectionCard({
  collection,
  onEdit,
  onOpen,
  readonly = false,
}: {
  collection: FlashcardCollection;
  onEdit: () => void;
  onOpen: () => void;
  readonly?: boolean;
}) {
  return (
    <Card className="p-stack-lg rounded-lg shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <button type="button" onClick={readonly ? onOpen : onEdit} className="w-full text-left">
        <div className="flex justify-between items-start mb-stack-md">
          <Icon name="folder" size="md" />
          <span className="font-label-md text-label-md bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full">
            {collection.card_count ?? 0} Cards
          </span>
        </div>
        <Heading level="h3" size="headline-sm" className="mb-stack-sm">
          {collection.title}
        </Heading>
        {collection.description && (
          <Text variant="body-md" color="on-surface-variant" className="line-clamp-2">
            {collection.description}
          </Text>
        )}
        <div className="mt-stack-md inline-flex rounded-full bg-surface-container px-3 py-1 text-label-sm text-on-surface-variant">
          {readonly ? `By ${collection.owner_username ?? 'Learner'}` : collection.visibility}
        </div>
      </button>
      <div className="mt-stack-lg flex gap-stack-md">
        <button onClick={onOpen} className="font-label-md text-label-md text-primary flex items-center gap-1">
          {readonly ? 'Open Reference' : 'Manage Cards'} <Icon name="arrow_forward" size="md" />
        </button>
        {!readonly && (
          <button onClick={onEdit} className="font-label-md text-label-md text-on-surface-variant hover:text-secondary">
            Edit
          </button>
        )}
      </div>
    </Card>
  );
}

function CollectionDialog({
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
      <section className="w-full max-w-lg rounded-xl border border-outline-variant bg-white p-6 shadow-xl">
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
              className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 outline-none focus:border-primary"
              placeholder="e.g. Daily Phrases"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-label-md font-bold text-on-surface">Description</span>
            <textarea
              value={form.description}
              onChange={(event) => onChange({ ...form, description: event.target.value })}
              rows={3}
              className="w-full resize-y rounded-lg border border-outline-variant bg-white px-4 py-3 outline-none focus:border-primary"
              placeholder="What does this collection cover?"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-label-md font-bold text-on-surface">Visibility</span>
            <select
              value={form.visibility}
              onChange={(event) => onChange({ ...form, visibility: event.target.value as FlashcardVisibility })}
              className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 outline-none focus:border-primary"
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
              className="rounded-lg border border-red-200 bg-white px-5 py-3 font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="rounded-lg border border-outline-variant bg-white px-5 py-3 font-bold text-on-surface">
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

export default function Flashcard() {
  const navigate = useNavigate();
  const toast = useToastMessages();
  const [collections, setCollections] = useState<FlashcardCollection[]>([]);
  const [publicCollections, setPublicCollections] = useState<FlashcardCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingCollection, setEditingCollection] = useState<FlashcardCollection | null>(null);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null);
  const [form, setForm] = useState<CollectionFormState>(emptyCollectionForm);

  const totalCards = useMemo(
    () => collections.reduce((sum, collection) => sum + (collection.card_count ?? 0), 0),
    [collections]
  );

  const loadCollections = async () => {
    const [myResult, publicResult] = await Promise.all([
      flashcardAPI.getCollections(50, 0),
      flashcardAPI.getPublicCollections(12, 0),
    ]);
    setCollections(myResult.data);
    setPublicCollections(publicResult.data);
  };

  const refreshPublicCollections = async () => {
    const result = await flashcardAPI.getPublicCollections(12, 0);
    setPublicCollections(result.data);
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const [myResult, publicResult] = await Promise.all([
          flashcardAPI.getCollections(50, 0),
          flashcardAPI.getPublicCollections(12, 0),
        ]);
        if (active) {
          setCollections(myResult.data);
          setPublicCollections(publicResult.data);
        }
      } catch (error) {
        if (active) toast.error(error instanceof Error ? error.message : 'Failed to load flashcard collections');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const pollPublicCollections = async () => {
      try {
        const result = await flashcardAPI.getPublicCollections(12, 0);
        if (active) setPublicCollections(result.data);
      } catch {
        // Keep polling silent so the page does not distract users during transient network errors.
      }
    };

    const intervalId = window.setInterval(pollPublicCollections, PUBLIC_COLLECTION_POLL_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const openCreateDialog = () => {
    setEditingCollection(null);
    setForm(emptyCollectionForm);
    setDialogMode('create');
  };

  const openEditDialog = (collection: FlashcardCollection) => {
    setEditingCollection(collection);
    setForm({
      title: collection.title,
      description: collection.description ?? '',
      visibility: collection.visibility,
    });
    setDialogMode('edit');
  };

  const closeDialog = () => {
    setDialogMode(null);
    setEditingCollection(null);
    setForm(emptyCollectionForm);
  };

  const handleSaveCollection = async () => {
    if (!form.title.trim() || saving) return;

    try {
      setSaving(true);
      if (dialogMode === 'create') {
        const result = await flashcardAPI.createCollection({
          title: form.title.trim(),
          description: form.description.trim() || null,
          visibility: form.visibility,
        });
        await loadCollections();
        closeDialog();
        toast.success('Flashcard collection created.');
        navigate(`/flashcards/${result.data.collection_id}`);
        return;
      }

      if (editingCollection) {
        const result = await flashcardAPI.updateCollection(editingCollection.collection_id, {
          title: form.title.trim(),
          description: form.description.trim() || null,
          visibility: form.visibility,
        });
        setCollections((previous) =>
          previous.map((collection) =>
            collection.collection_id === result.data.collection_id
              ? { ...collection, ...result.data, card_count: collection.card_count }
              : collection
          )
        );
        await refreshPublicCollections();
        closeDialog();
        toast.success('Flashcard collection updated.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save collection');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCollection = async () => {
    if (!editingCollection || saving) return;

    try {
      setSaving(true);
      await flashcardAPI.deleteCollection(editingCollection.collection_id);
      setCollections((previous) => previous.filter((collection) => collection.collection_id !== editingCollection.collection_id));
      await refreshPublicCollections();
      closeDialog();
      toast.success('Flashcard collection deleted.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete collection');
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Flashcards' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <Breadcrumbs items={breadcrumbs} />
      <main className="flex-1">
        <Section bgColor="light">
          <Container>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-section-gap gap-stack-lg">
              <div>
                <Heading level="h1" size="display-lg" className="mb-2">
                  My Flashcards
                </Heading>
                <Text variant="body-lg" color="on-surface-variant" className="max-w-xl">
                  Organize vocabulary into collections. Open a collection to add cards and review.
                </Text>
              </div>
              <Card className="p-stack-lg rounded-xl flex flex-col items-center">
                <span className="font-label-md text-label-md text-secondary uppercase tracking-widest mb-1">
                  Total Cards
                </span>
                <div className="font-display-lg text-display-lg text-primary leading-none">{totalCards}</div>
                <span className="font-body-md text-body-md text-on-surface-variant">{collections.length} collections</span>
              </Card>
            </div>

            {loading ? (
              <Card className="p-stack-lg text-center">Loading flashcard collections...</Card>
            ) : (
              <div className="space-y-section-gap">
                <section>
                  <div className="mb-stack-lg flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                      <Heading level="h2" size="headline-lg">My Collections</Heading>
                      <Text variant="body-md" color="on-surface-variant" className="mt-1">
                        Collections you own. Public collections can be referenced by other learners.
                      </Text>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                    {collections.map((collection) => (
                      <CollectionCard
                        key={collection.collection_id}
                        collection={collection}
                        onEdit={() => openEditDialog(collection)}
                        onOpen={() => navigate(`/flashcards/${collection.collection_id}`)}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={openCreateDialog}
                      className="min-h-[220px] rounded-lg border-2 border-dashed border-outline-variant bg-transparent p-stack-lg text-center transition hover:bg-surface-container"
                    >
                      <Icon name="add_circle" size="lg" />
                      <Heading level="h3" size="headline-sm" className="mt-3 text-on-surface-variant">
                        New Collection
                      </Heading>
                      <Text variant="body-md" color="on-surface-variant" className="mt-2">
                        Create a collection and add cards on the next page.
                      </Text>
                    </button>
                  </div>
                </section>

                <section className="rounded-xl border border-outline-variant bg-white p-stack-lg shadow-sm">
                  <div className="mb-stack-lg flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-label-md font-bold uppercase tracking-wide text-secondary">Reference Collections</p>
                      <Heading level="h2" size="headline-lg" className="mt-1">Public collections from learners</Heading>
                      <Text variant="body-md" color="on-surface-variant" className="mt-1">
                        Explore collections that other users marked public. These are read-only references for study and review.
                      </Text>
                    </div>
                    <span className="inline-flex rounded-full bg-secondary-container px-3 py-1 text-label-md font-bold text-on-secondary-container">
                      {publicCollections.length} public
                    </span>
                  </div>

                  {publicCollections.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                      {publicCollections.map((collection) => (
                        <CollectionCard
                          key={collection.collection_id}
                          collection={collection}
                          readonly
                          onEdit={() => undefined}
                          onOpen={() => navigate(`/flashcards/${collection.collection_id}`)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-outline-variant bg-surface-container-low p-stack-lg text-center">
                      <Icon name="public" size="lg" />
                      <Heading level="h3" size="headline-sm" className="mt-3">No public collections yet</Heading>
                      <Text variant="body-md" color="on-surface-variant" className="mt-2">
                        When learners set a collection to public, it will appear here as a reference.
                      </Text>
                    </div>
                  )}
                </section>
              </div>
            )}
          </Container>
        </Section>
      </main>
      <Footer />

      {dialogMode && (
        <CollectionDialog
          mode={dialogMode}
          form={form}
          saving={saving}
          onChange={setForm}
          onClose={closeDialog}
          onSubmit={handleSaveCollection}
          onDelete={dialogMode === 'edit' ? handleDeleteCollection : undefined}
        />
      )}
    </div>
  );
}
