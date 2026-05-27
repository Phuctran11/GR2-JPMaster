import { Button } from '../Button';
import { Heading, Text } from '../ui/Typography';
import type { FlashcardCollection } from '../../services/api';

export function FlashcardDetailHeader({
  collection,
  isOwner,
  onBack,
}: {
  collection: FlashcardCollection | null;
  isOwner: boolean;
  onBack: () => void;
}) {
  return (
    <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <Heading level="h1" size="headline-lg">{collection?.title || 'Collection Cards'}</Heading>
        <Text variant="body-md" color="on-surface-variant" className="mt-2">
          {isOwner
            ? 'Add cards to this collection, then review them below.'
            : `Public reference collection${collection?.owner_username ? ` by ${collection.owner_username}` : ''}. Review only.`}
        </Text>
      </div>
      <Button onClick={onBack} variant="secondary">Back to Collections</Button>
    </section>
  );
}
