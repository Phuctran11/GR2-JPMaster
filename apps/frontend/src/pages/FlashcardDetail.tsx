import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header, Footer, Button, Card, Container, Icon, Breadcrumbs } from '../components';
import { Heading, Text } from '../components/ui/Typography';
import { assetAPI, flashcardAPI, type Flashcard, type FlashcardCollection } from '../services/api';
import { useToastMessages } from '../hooks/useToastMessages';
import { useAuth } from '../contexts/AuthContext';
import { AIAssistantPanel } from '../components/ai/AIAssistantPanel';

function FlashcardControlPanel({
  onPrevious,
  onNext,
  onFlip,
  canPrevious,
  canNext,
}: {
  onPrevious: () => void;
  onNext: () => void;
  onFlip: () => void;
  canPrevious: boolean;
  canNext: boolean;
}) {
  return (
    <div className="mt-stack-lg flex items-center gap-stack-md justify-center">
      <button
        disabled={!canPrevious}
        onClick={onPrevious}
        className="p-4 rounded-full border-2 border-outline hover:bg-surface-container-high transition-colors text-on-surface-variant disabled:opacity-40"
      >
        <Icon name="arrow_back_ios_new" />
      </button>
      <Button onClick={onFlip} className="flex items-center gap-stack-sm">
        <Icon name="flip_camera_android" filled />
        Flip Card
      </Button>
      <button
        disabled={!canNext}
        onClick={onNext}
        className="p-4 rounded-full border-2 border-outline hover:bg-surface-container-high transition-colors text-on-surface-variant disabled:opacity-40"
      >
        <Icon name="arrow_forward_ios" />
      </button>
    </div>
  );
}

function InfoBentoCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-stack-md border border-outline-variant rounded-xl flex flex-col gap-2">
      <div className="flex items-center gap-2 text-primary">
        <Icon name={icon} size="md" />
        <Heading level="h3" size="headline-sm">
          {title}
        </Heading>
      </div>
      {children}
    </Card>
  );
}

export default function FlashcardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToastMessages();
  const { user } = useAuth();
  const [collection, setCollection] = useState<FlashcardCollection | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [reading, setReading] = useState('');
  const [exampleSentence, setExampleSentence] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState<'image' | 'audio' | null>(null);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [editForm, setEditForm] = useState({
    frontText: '',
    backText: '',
    reading: '',
    exampleSentence: '',
    imageUrl: '',
    audioUrl: '',
    tags: '',
  });
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);

  const collectionId = Number(id);
  const currentCard = useMemo(() => cards[currentIndex] ?? null, [cards, currentIndex]);
  const isOwner = Boolean(collection && user && collection.user_id === user.user_id);
  const selectedCards = useMemo(
    () => cards.filter((card) => selectedCardIds.includes(card.flashcard_id)),
    [cards, selectedCardIds]
  );
  const selectedCardContext = useMemo(
    () =>
      selectedCards.map((card) =>
        [card.front_text, card.back_text, card.reading ? `reading: ${card.reading}` : null]
          .filter(Boolean)
          .join(' - ')
      ),
    [selectedCards]
  );

  useEffect(() => {
    if (!collectionId || Number.isNaN(collectionId)) {
      navigate('/flashcards');
      return;
    }

    let active = true;
    const loadCards = async () => {
      try {
        setLoading(true);
        const [collectionResult, cardResult] = await Promise.all([
          flashcardAPI.getCollection(collectionId),
          flashcardAPI.getCollectionCards(collectionId, 100, 0),
        ]);
        if (active) {
          setCollection(collectionResult.data);
          setCards(cardResult.data);
        }
      } catch (error) {
        if (active) toast.error(error instanceof Error ? error.message : 'Failed to load flashcards');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadCards();
    return () => {
      active = false;
    };
  }, [collectionId, navigate]);

  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Flashcards', path: '/flashcards' },
    { label: collection?.title || 'Review' },
  ];

  const goPrevious = () => {
    setCurrentIndex((index) => Math.max(0, index - 1));
    setShowBack(false);
  };

  const goNext = () => {
    setCurrentIndex((index) => Math.min(cards.length - 1, index + 1));
    setShowBack(false);
  };

  const handleCreateCard = async () => {
    if (!collectionId || Number.isNaN(collectionId) || !frontText.trim() || !backText.trim() || saving) return;

    try {
      setSaving(true);
      const result = await flashcardAPI.createCard({
        collection_id: collectionId,
        front_text: frontText.trim(),
        back_text: backText.trim(),
        reading: reading.trim() || null,
        example_sentence: exampleSentence.trim() || null,
        image_url: imageUrl.trim() || null,
        audio_url: audioUrl.trim() || null,
      });
      setCards((previous) => [result.data, ...previous]);
      setCurrentIndex(0);
      setShowBack(false);
      setFrontText('');
      setBackText('');
      setReading('');
      setExampleSentence('');
      setImageUrl('');
      setAudioUrl('');
      toast.success('Flashcard created.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create flashcard');
    } finally {
      setSaving(false);
    }
  };

  const uploadCardMedia = async (file: File, mediaKind: 'image' | 'audio') => {
    try {
      setUploadingMedia(mediaKind);
      const result = await assetAPI.upload({
        file,
        media_kind: mediaKind,
        scope: 'flashcards',
      });
      if (mediaKind === 'image') setImageUrl(result.data.secure_url);
      else setAudioUrl(result.data.secure_url);
      toast.success(`${mediaKind === 'image' ? 'Image' : 'Audio'} uploaded.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to upload ${mediaKind}`);
    } finally {
      setUploadingMedia(null);
    }
  };

  const openEditCard = (card: Flashcard) => {
    setEditingCard(card);
    setEditForm({
      frontText: card.front_text,
      backText: card.back_text,
      reading: card.reading ?? '',
      exampleSentence: card.example_sentence ?? '',
      imageUrl: card.image_url ?? '',
      audioUrl: card.audio_url ?? '',
      tags: card.tags?.join(', ') ?? '',
    });
  };

  const uploadEditCardMedia = async (file: File, mediaKind: 'image' | 'audio') => {
    try {
      setUploadingMedia(mediaKind);
      const result = await assetAPI.upload({
        file,
        media_kind: mediaKind,
        scope: 'flashcards',
      });
      setEditForm((previous) => mediaKind === 'image'
        ? { ...previous, imageUrl: result.data.secure_url }
        : { ...previous, audioUrl: result.data.secure_url }
      );
      toast.success(`${mediaKind === 'image' ? 'Image' : 'Audio'} uploaded.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to upload ${mediaKind}`);
    } finally {
      setUploadingMedia(null);
    }
  };

  const handleUpdateCard = async () => {
    if (!editingCard || saving) return;
    if (!editForm.frontText.trim() || !editForm.backText.trim()) {
      toast.error('Front and back text are required.');
      return;
    }

    try {
      setSaving(true);
      const result = await flashcardAPI.updateCard(editingCard.flashcard_id, {
        front_text: editForm.frontText.trim(),
        back_text: editForm.backText.trim(),
        reading: editForm.reading.trim() || null,
        example_sentence: editForm.exampleSentence.trim() || null,
        image_url: editForm.imageUrl.trim() || null,
        audio_url: editForm.audioUrl.trim() || null,
        tags: editForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      });

      setCards((previous) => previous.map((card) => card.flashcard_id === result.data.flashcard_id ? result.data : card));
      setEditingCard(null);
      toast.success('Flashcard updated.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update flashcard');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async (flashcardId: number) => {
    try {
      await flashcardAPI.deleteCard(flashcardId);
      setCards((previous) => previous.filter((card) => card.flashcard_id !== flashcardId));
      setSelectedCardIds((previous) => previous.filter((id) => id !== flashcardId));
      setCurrentIndex((index) => Math.max(0, Math.min(index, cards.length - 2)));
      setShowBack(false);
      toast.success('Flashcard deleted.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete flashcard');
    }
  };

  const toggleSelectedCard = (flashcardId: number) => {
    setSelectedCardIds((previous) =>
      previous.includes(flashcardId)
        ? previous.filter((id) => id !== flashcardId)
        : [...previous, flashcardId]
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <Breadcrumbs items={breadcrumbs} />
      <main className="flex-grow pt-24 pb-section-gap px-margin-mobile md:px-margin-desktop relative">
        <Container>
          {loading ? (
            <Card className="p-stack-lg text-center">Loading review...</Card>
          ) : (
            <div className="space-y-section-gap">
              <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <Heading level="h1" size="headline-lg">{collection?.title || 'Collection Cards'}</Heading>
                  <Text variant="body-md" color="on-surface-variant" className="mt-2">
                    {isOwner
                      ? 'Add cards to this collection, then review them below.'
                      : `Public reference collection${collection?.owner_username ? ` by ${collection.owner_username}` : ''}. Review only.`}
                  </Text>
                </div>
                <Button onClick={() => navigate('/flashcards')} variant="secondary">Back to Collections</Button>
              </section>

              {isOwner && (
                <Card className="rounded-xl border border-outline-variant p-stack-lg">
                  <div className="grid grid-cols-1 gap-stack-md md:grid-cols-2">
                    <input
                      className="rounded-lg border border-outline-variant p-3 outline-none focus:border-primary"
                      placeholder="Front text"
                      value={frontText}
                      onChange={(event) => setFrontText(event.target.value)}
                    />
                    <input
                      className="rounded-lg border border-outline-variant p-3 outline-none focus:border-primary"
                      placeholder="Back text"
                      value={backText}
                      onChange={(event) => setBackText(event.target.value)}
                    />
                    <input
                      className="rounded-lg border border-outline-variant p-3 outline-none focus:border-primary"
                      placeholder="Reading"
                      value={reading}
                      onChange={(event) => setReading(event.target.value)}
                    />
                    <input
                      className="rounded-lg border border-outline-variant p-3 outline-none focus:border-primary"
                      placeholder="Example sentence"
                      value={exampleSentence}
                      onChange={(event) => setExampleSentence(event.target.value)}
                    />
                    <div className="rounded-lg border border-outline-variant p-3">
                      <input
                        className="w-full outline-none"
                        placeholder="Image URL"
                        value={imageUrl}
                        onChange={(event) => setImageUrl(event.target.value)}
                      />
                      <input
                        className="mt-2 block w-full text-label-md text-on-surface-variant file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-label-md file:font-bold file:text-on-primary"
                        type="file"
                        accept="image/*"
                        disabled={uploadingMedia !== null}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void uploadCardMedia(file, 'image');
                          event.currentTarget.value = '';
                        }}
                      />
                      {imageUrl && <img src={imageUrl} alt="Flashcard preview" className="mt-3 max-h-32 w-full rounded-lg object-contain" />}
                    </div>
                    <div className="rounded-lg border border-outline-variant p-3">
                      <input
                        className="w-full outline-none"
                        placeholder="Audio URL"
                        value={audioUrl}
                        onChange={(event) => setAudioUrl(event.target.value)}
                      />
                      <input
                        className="mt-2 block w-full text-label-md text-on-surface-variant file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-label-md file:font-bold file:text-on-primary"
                        type="file"
                        accept="audio/*"
                        disabled={uploadingMedia !== null}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void uploadCardMedia(file, 'audio');
                          event.currentTarget.value = '';
                        }}
                      />
                      {audioUrl && (
                        <audio controls src={audioUrl} className="mt-3 w-full">
                          <track kind="captions" />
                        </audio>
                      )}
                    </div>
                  </div>
                  {uploadingMedia && <p className="mt-3 text-label-md font-bold text-primary">Uploading {uploadingMedia}...</p>}
                  <div className="mt-stack-md flex justify-end">
                    <Button onClick={handleCreateCard} disabled={!frontText.trim() || !backText.trim() || saving}>
                      {saving ? 'Adding...' : 'Add Card'}
                    </Button>
                  </div>
                </Card>
              )}

              {!currentCard ? (
                <Card className="p-stack-lg text-center">
                  <Heading level="h2" size="headline-md">No cards available</Heading>
                  <Text variant="body-md" color="on-surface-variant" className="mt-2">
                    Add your first flashcard above.
                  </Text>
                </Card>
              ) : (
                <section className="flex flex-col items-center">
                  <div className="w-full max-w-[600px] mb-stack-lg">
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-headline-sm text-on-surface-variant">
                        Card {currentIndex + 1} of {cards.length}
                      </span>
                      {currentCard.tags?.[0] && (
                        <span className="font-label-md text-primary-container bg-primary-fixed px-3 py-1 rounded-full uppercase">
                          {currentCard.tags[0]}
                        </span>
                      )}
                    </div>
                    <div className="w-full h-1 bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${((currentIndex + 1) / Math.max(cards.length, 1)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowBack((value) => !value)}
                    className="relative w-full max-w-[800px] min-h-[500px] group mb-stack-lg text-left"
                  >
                    <Card className="absolute inset-0 rounded-xl flex flex-col items-center justify-center p-stack-lg border border-outline-variant overflow-hidden z-10 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl">
                      <div className="relative flex max-h-full w-full flex-col items-center gap-4 overflow-y-auto text-center">
                        {currentCard.image_url && (
                          <img
                            src={currentCard.image_url}
                            alt={currentCard.front_text}
                            className="max-h-56 w-full max-w-md rounded-xl border border-outline-variant object-contain"
                          />
                        )}
                        <span className="text-[clamp(3rem,10vw,7rem)] font-headline-lg text-primary tracking-wide leading-none">
                          {showBack ? currentCard.back_text : currentCard.front_text}
                        </span>
                        {!showBack && currentCard.reading && (
                          <div className="mt-4 text-on-surface-variant font-headline-sm opacity-70">
                            {currentCard.reading}
                          </div>
                        )}
                        {currentCard.audio_url && (
                          <audio controls src={currentCard.audio_url} className="mt-2 w-full max-w-md" onClick={(event) => event.stopPropagation()}>
                            <track kind="captions" />
                          </audio>
                        )}
                      </div>
                      <Text variant="body-lg" color="on-surface-variant" className="mt-12 italic">
                        Click to reveal {showBack ? 'front' : 'answer'}
                      </Text>
                    </Card>
                  </button>

                  <FlashcardControlPanel
                    onPrevious={goPrevious}
                    onNext={goNext}
                    onFlip={() => setShowBack((value) => !value)}
                    canPrevious={currentIndex > 0}
                    canNext={currentIndex < cards.length - 1}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter w-full mt-section-gap">
                    <InfoBentoCard icon="school" title="Context">
                      <Text variant="body-md" color="on-surface-variant">
                        {currentCard.example_sentence || 'No example sentence saved for this card.'}
                      </Text>
                    </InfoBentoCard>
                    <InfoBentoCard icon="sell" title="Tags">
                      <Text variant="body-md" color="on-surface-variant">
                        {currentCard.tags?.length ? currentCard.tags.join(', ') : 'No tags'}
                      </Text>
                    </InfoBentoCard>
                    <InfoBentoCard icon="image" title="Media">
                      <div className="space-y-3">
                        {currentCard.image_url && (
                          <img src={currentCard.image_url} alt={currentCard.front_text} className="max-h-40 w-full rounded-lg border border-outline-variant object-contain" />
                        )}
                        {currentCard.audio_url && (
                          <audio controls src={currentCard.audio_url} className="w-full">
                            <track kind="captions" />
                          </audio>
                        )}
                        {!currentCard.audio_url && !currentCard.image_url && (
                          <Text variant="body-md" color="on-surface-variant">No media attached.</Text>
                        )}
                      </div>
                    </InfoBentoCard>
                  </div>

                </section>
              )}

              {cards.length > 0 && (
                <section>
                  <div className="mb-stack-md flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                      <Heading level="h2" size="headline-md">All Cards</Heading>
                      <Text variant="body-md" color="on-surface-variant" className="mt-1">
                        Select multiple cards to give AI more vocabulary context for passages and dialogues.
                      </Text>
                    </div>
                    {selectedCardIds.length > 0 && (
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-primary-fixed px-3 py-1 text-label-md font-bold text-on-primary-fixed">
                          {selectedCardIds.length} selected for AI
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedCardIds([])}
                          className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-label-md font-bold text-on-surface-variant hover:border-primary hover:text-primary"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAiAssistantOpen(true)}
                          className="rounded-lg bg-primary px-3 py-2 text-label-md font-bold text-on-primary"
                        >
                          Open AI
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-stack-md md:grid-cols-2">
                    {cards.map((card) => (
                      <Card key={card.flashcard_id} className="rounded-xl border border-outline-variant p-stack-md">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 gap-3">
                            <button
                              type="button"
                              onClick={() => toggleSelectedCard(card.flashcard_id)}
                              className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded border ${
                                selectedCardIds.includes(card.flashcard_id)
                                  ? 'border-primary bg-primary text-on-primary'
                                  : 'border-outline-variant bg-white text-transparent hover:border-primary'
                              }`}
                              aria-label={`Select ${card.front_text} for AI`}
                            >
                              <Icon name="check" size="sm" />
                            </button>
                            <div className="min-w-0">
                            <p className="text-title-md font-bold text-primary">{card.front_text}</p>
                            <p className="mt-1 text-body-md text-on-surface">{card.back_text}</p>
                            {card.reading && <p className="mt-1 text-body-md text-on-surface-variant">{card.reading}</p>}
                            {(card.image_url || card.audio_url) && (
                              <p className="mt-1 text-label-md text-on-surface-variant">
                                {[card.image_url ? 'Image' : null, card.audio_url ? 'Audio' : null].filter(Boolean).join(' + ')}
                              </p>
                            )}
                            </div>
                          </div>
                          {isOwner && (
                            <div className="flex shrink-0 gap-1">
                              <button
                                type="button"
                                onClick={() => openEditCard(card)}
                                className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container hover:text-primary"
                                title="Edit card"
                              >
                                <Icon name="edit" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCard(card.flashcard_id)}
                                className="rounded-lg p-2 text-red-700 hover:bg-red-50"
                                title="Delete card"
                              >
                                <Icon name="delete" />
                              </button>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </Container>
      </main>
      {currentCard && (
        <button
          type="button"
          onClick={() => setIsAiAssistantOpen(true)}
          className="fixed bottom-6 right-6 z-[80] inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-xl shadow-primary/25 transition hover:scale-105 hover:shadow-2xl"
          title="Open AI assistant"
          aria-label="Open AI assistant"
        >
          <span className="material-symbols-outlined text-[28px]">auto_awesome</span>
        </button>
      )}

      {editingCard && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-outline-variant px-5 py-4">
              <div className="min-w-0">
                <p className="text-label-md font-bold uppercase tracking-wide text-primary">Edit Flashcard</p>
                <h2 className="truncate text-title-lg font-bold text-on-surface">{editingCard.front_text}</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingCard(null)}
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
                    className="min-h-28 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary"
                    value={editForm.frontText}
                    onChange={(event) => setEditForm({ ...editForm, frontText: event.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-label-md font-bold text-on-surface">Back <span className="text-error">Required</span></span>
                  <textarea
                    className="min-h-28 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary"
                    value={editForm.backText}
                    onChange={(event) => setEditForm({ ...editForm, backText: event.target.value })}
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-label-md font-bold text-on-surface">Reading <span className="font-normal text-on-surface-variant">Optional</span></span>
                  <input
                    className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary"
                    value={editForm.reading}
                    onChange={(event) => setEditForm({ ...editForm, reading: event.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-label-md font-bold text-on-surface">Tags <span className="font-normal text-on-surface-variant">Optional</span></span>
                  <input
                    className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary"
                    value={editForm.tags}
                    onChange={(event) => setEditForm({ ...editForm, tags: event.target.value })}
                    placeholder="Comma separated tags"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-label-md font-bold text-on-surface">Example sentence <span className="font-normal text-on-surface-variant">Optional</span></span>
                <textarea
                  className="min-h-24 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary"
                  value={editForm.exampleSentence}
                  onChange={(event) => setEditForm({ ...editForm, exampleSentence: event.target.value })}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-label-md font-bold text-on-surface">Image <span className="font-normal text-on-surface-variant">Optional</span></span>
                  <input
                    className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary"
                    value={editForm.imageUrl}
                    onChange={(event) => setEditForm({ ...editForm, imageUrl: event.target.value })}
                    placeholder="https://..."
                  />
                  <input
                    className="mt-2 block w-full text-label-md text-on-surface-variant file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-label-md file:font-bold file:text-on-primary"
                    type="file"
                    accept="image/*"
                    disabled={uploadingMedia !== null}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadEditCardMedia(file, 'image');
                      event.currentTarget.value = '';
                    }}
                  />
                  {editForm.imageUrl && <img src={editForm.imageUrl} alt="Flashcard edit preview" className="mt-3 max-h-40 w-full rounded-lg border border-outline-variant object-contain" />}
                </label>

                <label className="block">
                  <span className="mb-1 block text-label-md font-bold text-on-surface">Audio <span className="font-normal text-on-surface-variant">Optional</span></span>
                  <input
                    className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary"
                    value={editForm.audioUrl}
                    onChange={(event) => setEditForm({ ...editForm, audioUrl: event.target.value })}
                    placeholder="https://..."
                  />
                  <input
                    className="mt-2 block w-full text-label-md text-on-surface-variant file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-label-md file:font-bold file:text-on-primary"
                    type="file"
                    accept="audio/*"
                    disabled={uploadingMedia !== null}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadEditCardMedia(file, 'audio');
                      event.currentTarget.value = '';
                    }}
                  />
                  {editForm.audioUrl && (
                    <audio controls src={editForm.audioUrl} className="mt-3 w-full">
                      <track kind="captions" />
                    </audio>
                  )}
                </label>
              </div>
              {uploadingMedia && <p className="rounded-lg bg-primary/10 px-3 py-2 text-label-md font-bold text-primary">Uploading {uploadingMedia}...</p>}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-outline-variant px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-lg border border-outline-variant px-4 py-2 font-bold text-on-surface hover:bg-surface-container disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleUpdateCard()}
                disabled={saving || uploadingMedia !== null}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-bold text-on-primary hover:bg-primary/90 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[18px]">{saving ? 'hourglass_empty' : 'save'}</span>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {currentCard && isAiAssistantOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/45 p-3 sm:p-5" role="dialog" aria-modal="true">
          <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-outline-variant px-5 py-4">
              <div className="min-w-0">
                <p className="text-label-md font-bold uppercase tracking-wide text-primary">Flashcard AI</p>
                <h2 className="truncate text-title-lg font-bold text-on-surface">{currentCard.front_text}</h2>
                {selectedCardIds.length > 0 && (
                  <p className="mt-1 text-body-sm text-on-surface-variant">
                    Using {selectedCardIds.length} selected card{selectedCardIds.length === 1 ? '' : 's'} as context
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsAiAssistantOpen(false)}
                className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container"
                aria-label="Close AI assistant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-surface-container-low p-4 sm:p-5">
              <AIAssistantPanel
                title="Practice these flashcards with AI"
                description="Generate a passage, create a dialogue, explain usage, or ask anything about the current card and selected vocabulary."
                className="shadow-none"
                context={{
                  type: 'flashcard',
                  word: currentCard.front_text,
                  meaning: currentCard.back_text,
                  reading: currentCard.reading,
                  exampleSentence: currentCard.example_sentence,
                  selectedWords: selectedCardContext.length > 0 ? selectedCardContext : currentCard.tags,
                }}
              />
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
