import { Card } from '../ui';

export function FlashcardCollectionStats({
  totalCards,
  collectionCount,
}: {
  totalCards: number;
  collectionCount: number;
}) {
  return (
    <Card className="p-stack-lg rounded-xl flex flex-col items-center">
      <span className="font-label-md text-label-md text-secondary uppercase tracking-widest mb-1">
        Total Cards
      </span>
      <div className="font-display-lg text-display-lg text-primary leading-none">{totalCards}</div>
      <span className="font-body-md text-body-md text-on-surface-variant">{collectionCount} collections</span>
    </Card>
  );
}
