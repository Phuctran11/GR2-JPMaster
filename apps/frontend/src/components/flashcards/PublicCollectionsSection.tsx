import { Card, Icon } from '../index';
import { Heading, Text } from '../ui/Typography';
import type { FlashcardCollection } from '../../services/api';
import { CollectionCard } from './CollectionCard';

export function PublicCollectionsSection({
  collections,
  totalCount,
  onOpen,
}: {
  collections: FlashcardCollection[];
  totalCount?: number;
  onOpen: (collectionId: number) => void;
}) {
  return (
    <section className="rounded-xl border border-outline-variant bg-surface p-stack-lg shadow-sm">
      <div className="mb-stack-lg flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-label-md font-bold uppercase tracking-wide text-secondary">Reference Collections</p>
          <Heading level="h2" size="headline-lg" className="mt-1">Public collections from learners</Heading>
          <Text variant="body-md" color="on-surface-variant" className="mt-1">
            Explore collections that other users marked public. These are read-only references for study and review.
          </Text>
        </div>
        <span className="inline-flex rounded-full bg-secondary-container px-3 py-1 text-label-md font-bold text-on-secondary-container">
          {totalCount ?? collections.length} public
        </span>
      </div>

      {collections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {collections.map((collection) => (
            <CollectionCard
              key={collection.collection_id}
              collection={collection}
              readonly
              onEdit={() => undefined}
              onOpen={() => onOpen(collection.collection_id)}
            />
          ))}
        </div>
      ) : (
        <Card className="rounded-lg border border-dashed border-outline-variant bg-surface-container-low p-stack-lg text-center">
          <Icon name="public" size="lg" />
          <Heading level="h3" size="headline-sm" className="mt-3">No public collections yet</Heading>
          <Text variant="body-md" color="on-surface-variant" className="mt-2">
            When learners set a collection to public, it will appear here as a reference.
          </Text>
        </Card>
      )}
    </section>
  );
}
