import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header, Footer, Button, Card, Container, Icon, Breadcrumbs } from '../components';
import { Heading, Text } from '../components/ui/Typography';
import { flashcardAPI, type Flashcard, type FlashcardCollection } from '../services/api';
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
      });
      setCards((previous) => [result.data, ...previous]);
      setCurrentIndex(0);
      setShowBack(false);
      setFrontText('');
      setBackText('');
      setReading('');
      setExampleSentence('');
      toast.success('Flashcard created.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create flashcard');
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
                  </div>
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
                      <div className="relative text-center">
                        <span className="text-[clamp(3rem,10vw,7rem)] font-headline-lg text-primary tracking-wide leading-none">
                          {showBack ? currentCard.back_text : currentCard.front_text}
                        </span>
                        {!showBack && currentCard.reading && (
                          <div className="mt-4 text-on-surface-variant font-headline-sm opacity-70">
                            {currentCard.reading}
                          </div>
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
                      <Text variant="body-md" color="on-surface-variant">
                        {currentCard.audio_url || currentCard.image_url ? 'Media links are attached to this card.' : 'No media attached.'}
                      </Text>
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
                            </div>
                          </div>
                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCard(card.flashcard_id)}
                              className="rounded-lg p-2 text-red-700 hover:bg-red-50"
                              title="Delete card"
                            >
                              <Icon name="delete" />
                            </button>
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
