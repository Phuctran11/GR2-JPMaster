import { useEffect, useMemo, useState } from 'react';
import { Card, Icon, Pagination } from '../index';
import { Heading, Text } from '../ui/Typography';
import type { Flashcard } from '../../services/api';

const CARDS_LIST_PAGE_SIZE = 6;

export function FlashcardCardsList({
  cards,
  isOwner,
  selectedCardIds,
  onToggleSelected,
  onClearSelected,
  onOpenAi,
  onEdit,
  onDelete,
}: {
  cards: Flashcard[];
  isOwner: boolean;
  selectedCardIds: number[];
  onToggleSelected: (flashcardId: number) => void;
  onClearSelected: () => void;
  onOpenAi: () => void;
  onEdit: (card: Flashcard) => void;
  onDelete: (flashcardId: number) => void;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(cards.length / CARDS_LIST_PAGE_SIZE));
  const visibleCards = useMemo(() => {
    const start = (page - 1) * CARDS_LIST_PAGE_SIZE;
    return cards.slice(start, start + CARDS_LIST_PAGE_SIZE);
  }, [cards, page]);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  if (cards.length === 0) return null;

  return (
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
              onClick={onClearSelected}
              className="rounded-lg border border-outline-variant bg-surface px-3 py-2 text-label-md font-bold text-on-surface-variant hover:border-primary hover:text-primary"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onOpenAi}
              className="rounded-lg bg-primary px-3 py-2 text-label-md font-bold text-on-primary"
            >
              Open AI
            </button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 gap-stack-md md:grid-cols-2">
        {visibleCards.map((card) => (
          <Card key={card.flashcard_id} className="rounded-xl border border-outline-variant p-stack-md">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <button
                  type="button"
                  onClick={() => onToggleSelected(card.flashcard_id)}
                  className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded border ${
                    selectedCardIds.includes(card.flashcard_id)
                      ? 'border-primary bg-primary text-on-primary'
                      : 'border-outline-variant bg-surface text-transparent hover:border-primary'
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
                    onClick={() => onEdit(card)}
                    className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container hover:text-primary"
                    title="Edit card"
                  >
                    <Icon name="edit" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(card.flashcard_id)}
                    className="rounded-lg p-2 text-on-error-container hover:bg-error-container"
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
      <Pagination
        page={page}
        pageSize={CARDS_LIST_PAGE_SIZE}
        itemCount={visibleCards.length}
        totalCount={cards.length}
        onPageChange={setPage}
        className="mt-stack-md"
      />
    </section>
  );
}
