import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Icon } from '../index';
import { InteractiveHoverCard } from '../ui';
import { Heading, Text } from '../ui/Typography';
import type { Flashcard } from '../../services/api';

function getCardImage(card: Flashcard) {
  return card.image_url || null;
}

function FlashcardThumbnail({ card }: { card: Flashcard }) {
  const imageUrl = getCardImage(card);

  return (
    <div className="relative h-40 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low">
      {imageUrl ? (
        <img src={imageUrl} alt={card.front_text} className="h-full w-full object-cover" draggable={false} />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-fixed/40 to-secondary-fixed/20 text-primary">
          <span className="material-symbols-outlined text-[56px]">style</span>
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface/95 to-transparent" />
    </div>
  );
}

function FlashcardDetailModal({ card, onClose }: { card: Flashcard; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (target instanceof Node && dialogRef.current?.contains(target)) return;
      onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/45 p-4 backdrop-blur-md" role="dialog" aria-modal="true">
      <section
        ref={dialogRef}
        className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-outline-variant bg-surface shadow-2xl"
      >
        <div className="grid max-h-[90vh] overflow-y-auto lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="relative min-h-72 bg-surface-container-low">
            {card.image_url ? (
              <img src={card.image_url} alt={card.front_text} className="h-full min-h-72 w-full object-cover" />
            ) : (
              <div className="flex h-full min-h-72 w-full items-center justify-center bg-gradient-to-br from-primary-fixed/40 to-secondary-fixed/20 text-primary">
                <span className="material-symbols-outlined text-[96px]">style</span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-surface to-transparent" />
          </div>

          <div className="flex min-h-0 flex-col">
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-outline-variant bg-surface/95 px-6 py-5 backdrop-blur">
              <div className="min-w-0">
                <p className="text-label-md font-black uppercase tracking-wide text-primary">Flashcard detail</p>
                <h2 className="mt-1 break-words text-headline-lg font-bold text-on-surface">{card.front_text}</h2>
                {card.reading && <p className="mt-1 text-title-md font-semibold text-on-surface-variant">{card.reading}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface text-on-surface-variant transition hover:border-primary hover:text-primary"
                aria-label="Close flashcard detail"
              >
                <span className="material-symbols-outlined rotate-45">add</span>
              </button>
            </header>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-xl border border-primary/20 bg-primary-fixed/20 p-4">
                <p className="text-label-md font-black uppercase tracking-wide text-primary">Answer</p>
                <p className="mt-2 whitespace-pre-line text-headline-sm font-semibold leading-8 text-on-surface">{card.back_text}</p>
              </div>

              {card.example_sentence && (
                <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
                  <p className="text-label-md font-black uppercase tracking-wide text-on-surface-variant">Example</p>
                  <p className="mt-2 whitespace-pre-line text-body-lg leading-8 text-on-surface">{card.example_sentence}</p>
                </div>
              )}

              {card.tags?.length ? (
                <div className="flex flex-wrap gap-2">
                  {card.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-surface-container px-3 py-1 text-label-md font-semibold text-on-surface-variant">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}

              {card.audio_url && (
                <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
                  <p className="mb-3 text-label-md font-black uppercase tracking-wide text-on-surface-variant">Audio</p>
                  <audio controls src={card.audio_url} className="w-full">
                    <track kind="captions" />
                  </audio>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function FlashcardStudyPanel({
  cards,
  currentIndex,
  onSelectCard,
}: {
  cards: Flashcard[];
  currentIndex: number;
  onSelectCard: (index: number) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef({ isDragging: false, startX: 0, scrollLeft: 0, moved: false });
  const pendingOpenRef = useRef<{ card: Flashcard; index: number } | null>(null);
  const [activeCard, setActiveCard] = useState<Flashcard | null>(null);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    dragStateRef.current = {
      isDragging: true,
      startX: event.clientX,
      scrollLeft: scroller.scrollLeft,
      moved: false,
    };
    scroller.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const scroller = scrollerRef.current;
    const dragState = dragStateRef.current;
    if (!scroller || !dragState.isDragging) return;

    event.preventDefault();
    const delta = event.clientX - dragState.startX;
    if (Math.abs(delta) > 3) dragState.moved = true;
    scroller.scrollLeft = dragState.scrollLeft - delta;
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const scroller = scrollerRef.current;
    const dragState = dragStateRef.current;
    if (scroller?.hasPointerCapture(event.pointerId)) {
      scroller.releasePointerCapture(event.pointerId);
    }

    const pendingOpen = pendingOpenRef.current;
    if (!dragState.moved && pendingOpen) {
      openCard(pendingOpen.card, pendingOpen.index);
    }

    pendingOpenRef.current = null;
    dragStateRef.current.isDragging = false;
  };

  const openCard = (card: Flashcard, index: number) => {
    onSelectCard(index);
    setActiveCard(card);
  };

  const scrollCards = (direction: 'left' | 'right') => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const distance = Math.max(300, Math.floor(scroller.clientWidth * 0.72));
    scroller.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-label-md font-black uppercase tracking-wide text-primary">Review deck</p>
          <Heading level="h2" size="headline-lg" className="mt-1 text-on-surface">
            Flashcard Carousel
          </Heading>
          <Text variant="body-md" color="on-surface-variant" className="mt-2">
            Drag horizontally to browse all cards. Click a card to expand its full details.
          </Text>
        </div>
        <div className="rounded-full border border-outline-variant bg-surface px-4 py-2 text-label-md font-bold text-on-surface-variant">
          {Math.min(currentIndex + 1, cards.length)} / {cards.length}
        </div>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => scrollCards('left')}
          className="absolute left-0 top-1/2 z-10 hidden h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-outline-variant bg-surface/95 text-on-surface shadow-lg backdrop-blur transition hover:border-primary hover:text-primary md:inline-flex"
          aria-label="Scroll flashcards left"
        >
          <Icon name="chevron_left" size="sm" />
        </button>

        <div
          ref={scrollerRef}
          onPointerDownCapture={() => {
            pendingOpenRef.current = null;
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="flashcard-review-track flex cursor-grab select-none gap-5 overflow-x-auto overscroll-x-contain pb-6 pt-2 active:cursor-grabbing"
        >
          {cards.map((card, index) => (
            <InteractiveHoverCard
              key={card.flashcard_id}
              className="group w-[280px] shrink-0 rounded-2xl"
              tone={index === currentIndex ? 'primary' : 'secondary'}
              maxTilt={15}
              spotlightVariant={index}
            >
              <button
                type="button"
                onPointerDown={() => {
                  pendingOpenRef.current = { card, index };
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openCard(card, index);
                  }
                }}
                className={`flex h-full min-h-[300px] w-full flex-col rounded-2xl border bg-surface p-3 text-left shadow-sm transition ${
                  index === currentIndex ? 'border-primary/50 ring-2 ring-primary/10' : 'border-outline-variant'
                }`}
              >
                <FlashcardThumbnail card={card} />
                <div className="flex flex-1 flex-col px-2 py-4">
                  <p className="text-label-md font-black uppercase tracking-wide text-primary">Card {index + 1}</p>
                  <h3 className="mt-2 line-clamp-4 text-headline-sm font-bold leading-7 text-on-surface transition-colors group-hover:text-primary">
                    {card.front_text}
                  </h3>
                  <div className="mt-auto flex items-center justify-end pt-5">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary transition-transform group-hover:scale-105">
                      <Icon name="open_in_full" size="sm" />
                    </span>
                  </div>
                </div>
              </button>
            </InteractiveHoverCard>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollCards('right')}
          className="absolute right-0 top-1/2 z-10 hidden h-11 w-11 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-outline-variant bg-surface/95 text-on-surface shadow-lg backdrop-blur transition hover:border-primary hover:text-primary md:inline-flex"
          aria-label="Scroll flashcards right"
        >
          <Icon name="chevron_right" size="sm" />
        </button>
      </div>

      {activeCard && <FlashcardDetailModal card={activeCard} onClose={() => setActiveCard(null)} />}
    </section>
  );
}
