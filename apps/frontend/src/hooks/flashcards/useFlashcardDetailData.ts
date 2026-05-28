import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { flashcardAPI, type Flashcard, type FlashcardCollection } from '../../services/api';

interface ToastMessages {
  error: (message: string) => void;
}

const FLASHCARD_DETAIL_PAGE_SIZE = 100;

export function useFlashcardDetailData({
  collectionId,
  navigate,
  toast,
}: {
  collectionId: number;
  navigate: NavigateFunction;
  toast: ToastMessages;
}) {
  const [collection, setCollection] = useState<FlashcardCollection | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [cardsPage, setCardsPage] = useState(1);
  const [cardTotalCount, setCardTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const currentCard = useMemo(() => cards[currentIndex] ?? null, [cards, currentIndex]);
  const fetchCardsPage = useCallback(async () => {
    if (!collectionId || Number.isNaN(collectionId)) {
      navigate('/flashcards');
      return null;
    }

    const [collectionResult, firstCardResult] = await Promise.all([
      flashcardAPI.getCollection(collectionId),
      flashcardAPI.getCollectionCards(collectionId, FLASHCARD_DETAIL_PAGE_SIZE, 0),
    ]);
    const totalCount = firstCardResult.total_count ?? firstCardResult.count;
    const allCards = [...firstCardResult.data];

    for (let offset = FLASHCARD_DETAIL_PAGE_SIZE; offset < totalCount; offset += FLASHCARD_DETAIL_PAGE_SIZE) {
      const cardResult = await flashcardAPI.getCollectionCards(collectionId, FLASHCARD_DETAIL_PAGE_SIZE, offset);
      allCards.push(...cardResult.data);
    }

    return {
      collection: collectionResult.data,
      cards: allCards,
      totalCount,
    };
  }, [collectionId, navigate]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const result = await fetchCardsPage();
        if (active && result) {
          setCollection(result.collection);
          setCards(result.cards);
          setCardTotalCount(result.totalCount);
          setCurrentIndex(0);
          setShowBack(false);
        }
      } catch (error) {
        if (active) toast.error(error instanceof Error ? error.message : 'Failed to load flashcards');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [fetchCardsPage, toast]);

  const goPrevious = () => {
    setCurrentIndex((index) => Math.max(0, index - 1));
    setShowBack(false);
  };

  const goNext = () => {
    setCurrentIndex((index) => Math.min(cards.length - 1, index + 1));
    setShowBack(false);
  };

  return {
    collection,
    cards,
    setCards,
    cardsPage,
    setCardsPage,
    cardPageSize: FLASHCARD_DETAIL_PAGE_SIZE,
    cardTotalCount,
    setCardTotalCount,
    currentIndex,
    setCurrentIndex,
    showBack,
    setShowBack,
    currentCard,
    loading,
    goPrevious,
    goNext,
  };
}
