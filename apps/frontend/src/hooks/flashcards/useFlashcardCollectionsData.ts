import { useCallback, useEffect, useMemo, useState } from 'react';
import { flashcardAPI, type FlashcardCollection } from '../../services/api';

const PUBLIC_COLLECTION_POLL_INTERVAL_MS = 10000;
const FLASHCARD_COLLECTION_PAGE_SIZE = 6;
const PUBLIC_FLASHCARD_COLLECTION_PAGE_SIZE = 6;

interface ToastMessages {
  error: (message: string) => void;
}

export function useFlashcardCollectionsData({ toast }: { toast: ToastMessages }) {
  const [collections, setCollections] = useState<FlashcardCollection[]>([]);
  const [publicCollections, setPublicCollections] = useState<FlashcardCollection[]>([]);
  const [collectionsPage, setCollectionsPage] = useState(1);
  const [publicCollectionsPage, setPublicCollectionsPage] = useState(1);
  const [collectionTotalCount, setCollectionTotalCount] = useState(0);
  const [publicCollectionTotalCount, setPublicCollectionTotalCount] = useState(0);
  const [totalCards, setTotalCards] = useState(0);
  const [loading, setLoading] = useState(true);
  const showError = toast.error;

  const collectionOffset = useMemo(
    () => (collectionsPage - 1) * FLASHCARD_COLLECTION_PAGE_SIZE,
    [collectionsPage]
  );
  const publicCollectionOffset = useMemo(
    () => (publicCollectionsPage - 1) * PUBLIC_FLASHCARD_COLLECTION_PAGE_SIZE,
    [publicCollectionsPage]
  );

  const loadCollections = useCallback(async () => {
    const [myResult, publicResult] = await Promise.all([
      flashcardAPI.getCollections(FLASHCARD_COLLECTION_PAGE_SIZE, collectionOffset),
      flashcardAPI.getPublicCollections(PUBLIC_FLASHCARD_COLLECTION_PAGE_SIZE, publicCollectionOffset),
    ]);
    setCollections(myResult.data);
    setPublicCollections(publicResult.data);
    setCollectionTotalCount(myResult.total_count ?? myResult.count);
    setPublicCollectionTotalCount(publicResult.total_count ?? publicResult.count);
    setTotalCards(myResult.total_cards ?? myResult.data.reduce((sum, collection) => sum + (collection.card_count ?? 0), 0));
  }, [collectionOffset, publicCollectionOffset]);

  const refreshPublicCollections = useCallback(async () => {
    const result = await flashcardAPI.getPublicCollections(PUBLIC_FLASHCARD_COLLECTION_PAGE_SIZE, publicCollectionOffset);
    setPublicCollections(result.data);
    setPublicCollectionTotalCount(result.total_count ?? result.count);
  }, [publicCollectionOffset]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const [myResult, publicResult] = await Promise.all([
          flashcardAPI.getCollections(FLASHCARD_COLLECTION_PAGE_SIZE, collectionOffset),
          flashcardAPI.getPublicCollections(PUBLIC_FLASHCARD_COLLECTION_PAGE_SIZE, publicCollectionOffset),
        ]);
        if (active) {
          setCollections(myResult.data);
          setPublicCollections(publicResult.data);
          setCollectionTotalCount(myResult.total_count ?? myResult.count);
          setPublicCollectionTotalCount(publicResult.total_count ?? publicResult.count);
          setTotalCards(myResult.total_cards ?? myResult.data.reduce((sum, collection) => sum + (collection.card_count ?? 0), 0));
        }
      } catch (error) {
        if (active) showError(error instanceof Error ? error.message : 'Failed to load flashcard collections');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [collectionOffset, publicCollectionOffset, showError]);

  useEffect(() => {
    let active = true;

    const pollPublicCollections = async () => {
      try {
        const result = await flashcardAPI.getPublicCollections(PUBLIC_FLASHCARD_COLLECTION_PAGE_SIZE, publicCollectionOffset);
        if (active) {
          setPublicCollections(result.data);
          setPublicCollectionTotalCount(result.total_count ?? result.count);
        }
      } catch {
        // Keep polling silent so transient network errors do not interrupt study.
      }
    };

    const intervalId = window.setInterval(pollPublicCollections, PUBLIC_COLLECTION_POLL_INTERVAL_MS);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [publicCollectionOffset]);

  return {
    collections,
    setCollections,
    publicCollections,
    collectionsPage,
    setCollectionsPage,
    publicCollectionsPage,
    setPublicCollectionsPage,
    collectionPageSize: FLASHCARD_COLLECTION_PAGE_SIZE,
    publicCollectionPageSize: PUBLIC_FLASHCARD_COLLECTION_PAGE_SIZE,
    collectionTotalCount,
    publicCollectionTotalCount,
    loading,
    totalCards,
    loadCollections,
    refreshPublicCollections,
  };
}
