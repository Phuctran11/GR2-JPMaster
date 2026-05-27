import { useMemo, useState } from 'react';
import type { Flashcard } from '../../services/api';
import { getSelectedCardContext } from './flashcardFormUtils';

export function useFlashcardSelection(cards: Flashcard[]) {
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);
  const selectedCards = useMemo(
    () => cards.filter((card) => selectedCardIds.includes(card.flashcard_id)),
    [cards, selectedCardIds]
  );
  const selectedCardContext = useMemo(() => getSelectedCardContext(selectedCards), [selectedCards]);

  const toggleSelectedCard = (flashcardId: number) => {
    setSelectedCardIds((previous) =>
      previous.includes(flashcardId)
        ? previous.filter((id) => id !== flashcardId)
        : [...previous, flashcardId]
    );
  };

  const clearSelectedCards = () => setSelectedCardIds([]);

  return {
    selectedCardIds,
    setSelectedCardIds,
    selectedCards,
    selectedCardContext,
    toggleSelectedCard,
    clearSelectedCards,
  };
}
