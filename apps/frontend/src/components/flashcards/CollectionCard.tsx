import { Card, Icon } from '../index';
import { InteractiveHoverCard } from '../ui';
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
    <InteractiveHoverCard className="group h-full rounded-lg" tone={readonly ? 'secondary' : 'primary'} maxTilt={6}>
      <Card className="h-full p-stack-lg rounded-lg shadow-sm transition">
        <button type="button" onClick={readonly ? onOpen : onEdit} className="w-full text-left">
          <div className="flex justify-between items-start mb-stack-md">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary">
              <Icon name="folder" size="md" />
            </span>
            <span className="font-label-md text-label-md bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full">
              {collection.card_count ?? 0} Cards
            </span>
          </div>
          <Heading level="h3" size="headline-sm" className="mb-stack-sm transition-colors group-hover:text-primary">
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
    </InteractiveHoverCard>
  );
}
