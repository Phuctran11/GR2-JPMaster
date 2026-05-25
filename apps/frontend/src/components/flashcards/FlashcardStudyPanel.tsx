import { Button, Card, Icon } from '../index';
import { Heading, Text } from '../ui/Typography';
import type { Flashcard } from '../../services/api';
import type { ReactNode } from 'react';

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

function InfoBentoCard({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
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

export function FlashcardStudyPanel({
  currentCard,
  currentIndex,
  cardCount,
  showBack,
  onToggleBack,
  onPrevious,
  onNext,
}: {
  currentCard: Flashcard;
  currentIndex: number;
  cardCount: number;
  showBack: boolean;
  onToggleBack: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <section className="flex flex-col items-center">
      <div className="w-full max-w-[600px] mb-stack-lg">
        <div className="flex justify-between items-end mb-2">
          <span className="font-headline-sm text-on-surface-variant">
            Card {currentIndex + 1} of {cardCount}
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
            style={{ width: `${((currentIndex + 1) / Math.max(cardCount, 1)) * 100}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleBack}
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
        onPrevious={onPrevious}
        onNext={onNext}
        onFlip={onToggleBack}
        canPrevious={currentIndex > 0}
        canNext={currentIndex < cardCount - 1}
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
  );
}
