import { Icon } from '../index';
import { Heading, Text } from '../ui/Typography';
import type { FlashcardCollection } from '../../services/api';
import { CollectionCard } from './CollectionCard';

export function MyCollectionsSection({
  collections,
  onCreate,
  onEdit,
  onOpen,
}: {
  collections: FlashcardCollection[];
  onCreate: () => void;
  onEdit: (collection: FlashcardCollection) => void;
  onOpen: (collectionId: number) => void;
}) {
  return (
    <section>
      <div className="mb-stack-lg flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <Heading level="h2" size="headline-lg">My Collections</Heading>
          <Text variant="body-md" color="on-surface-variant" className="mt-1">
            Collections you own. Public collections can be referenced by other learners.
          </Text>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {collections.map((collection) => (
          <CollectionCard
            key={collection.collection_id}
            collection={collection}
            onEdit={() => onEdit(collection)}
            onOpen={() => onOpen(collection.collection_id)}
          />
        ))}
        <button
          type="button"
          onClick={onCreate}
          className="min-h-[220px] rounded-lg border-2 border-dashed border-outline-variant bg-transparent p-stack-lg text-center transition hover:bg-surface-container"
        >
          <Icon name="add_circle" size="lg" />
          <Heading level="h3" size="headline-sm" className="mt-3 text-on-surface-variant">
            New Collection
          </Heading>
          <Text variant="body-md" color="on-surface-variant" className="mt-2">
            Create a collection and add cards on the next page.
          </Text>
        </button>
      </div>
    </section>
  );
}
