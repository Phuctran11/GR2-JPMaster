import { AIAssistantPanel } from '../ai/AIAssistantPanel';
import type { Flashcard } from '../../services/api';

export function FlashcardAiAssistantModal({
  currentCard,
  selectedCardIds,
  selectedCards,
  selectedCardContext,
  onClose,
}: {
  currentCard: Flashcard;
  selectedCardIds: number[];
  selectedCards: Flashcard[];
  selectedCardContext: string[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/45 p-3 sm:p-5" role="dialog" aria-modal="true">
      <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant px-5 py-4">
          <div className="min-w-0">
            <p className="text-label-md font-bold uppercase tracking-wide text-primary">Flashcard AI</p>
            <h2 className="truncate text-title-lg font-bold text-on-surface">{currentCard.front_text}</h2>
            {selectedCardIds.length > 0 && (
              <div className="mt-2">
                <p className="text-body-sm text-on-surface-variant">
                  Using {selectedCardIds.length} selected card{selectedCardIds.length === 1 ? '' : 's'} as context
                </p>
                <div className="mt-2 flex max-h-20 flex-wrap gap-2 overflow-y-auto pr-1">
                  {selectedCards.map((card) => (
                    <span
                      key={card.flashcard_id}
                      className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary/20 bg-primary-fixed/30 px-3 py-1 text-label-sm text-primary"
                      title={[card.front_text, card.back_text, card.reading].filter(Boolean).join(' - ')}
                    >
                      <span className="max-w-[180px] truncate font-bold">{card.front_text}</span>
                      <span className="text-primary/60">-</span>
                      <span className="max-w-[220px] truncate text-on-surface-variant">{card.back_text}</span>
                      {card.reading && <span className="max-w-[140px] truncate text-on-surface-variant">({card.reading})</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
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
  );
}
