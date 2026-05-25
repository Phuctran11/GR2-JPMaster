import type { FlashcardCollection, FlashcardVisibility } from '../../services/api';

export interface CollectionFormState {
  title: string;
  description: string;
  visibility: FlashcardVisibility;
}

export const emptyCollectionForm: CollectionFormState = {
  title: '',
  description: '',
  visibility: 'private',
};

export const getCollectionFormFromCollection = (collection: FlashcardCollection): CollectionFormState => ({
  title: collection.title,
  description: collection.description ?? '',
  visibility: collection.visibility,
});

export const getCollectionPayload = (form: CollectionFormState) => ({
  title: form.title.trim(),
  description: form.description.trim() || null,
  visibility: form.visibility,
});
