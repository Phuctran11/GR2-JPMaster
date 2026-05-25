import { Card, Icon } from '../index';
import { Heading, Text } from '../ui/Typography';
import type { FlashcardCollection } from '../../services/api';

export function CollectionCard({
  collection,
  onEdit,
  onOpen,
  readonly = false,
}: {
  collection: FlashcardCollection;
  onEdit: () => void;
  onOpen: () => void;
  readonly?: boolean;
}) {
  return (
    <Card className="p-stack-lg rounded-lg shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <button type="button" onClick={readonly ? onOpen : onEdit} className="w-full text-left">
        <div className="flex justify-between items-start mb-stack-md">
          <Icon name="folder" size="md" />
          <span className="font-label-md text-label-md bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full">
            {collection.card_count ?? 0} Cards
          </span>
        </div>
        <Heading level="h3" size="headline-sm" className="mb-stack-sm">
          {collection.title}
        </Heading>
        {collection.description && (
          <Text variant="body-md" color="on-surface-variant" className="line-clamp-2">
            {collection.description}
          </Text>
        )}
        <div className="mt-stack-md inline-flex rounded-full bg-surface-container px-3 py-1 text-label-sm text-on-surface-variant">
          {readonly ? `By ${collection.owner_username ?? 'Learner'}` : collection.visibility}
        </div>
      </button>
      <div className="mt-stack-lg flex gap-stack-md">
        <button onClick={onOpen} className="font-label-md text-label-md text-primary flex items-center gap-1">
          {readonly ? 'Open Reference' : 'Manage Cards'} <Icon name="arrow_forward" size="md" />
        </button>
        {!readonly && (
          <button onClick={onEdit} className="font-label-md text-label-md text-on-surface-variant hover:text-secondary">
            Edit
          </button>
        )}
      </div>
    </Card>
  );
}
