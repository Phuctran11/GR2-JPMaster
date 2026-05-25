import { useNavigate } from 'react-router-dom';
import { Header, Footer, Card, Container, Section, Breadcrumbs, Pagination } from '../components';
import { Heading, Text } from '../components/ui/Typography';
import {
  CollectionDialog,
  FlashcardCollectionStats,
  MyCollectionsSection,
  PublicCollectionsSection,
} from '../components/flashcards';
import { useToastMessages } from '../hooks/useToastMessages';
import { useFlashcardCollections } from '../hooks/flashcards/useFlashcardCollections';

export default function Flashcard() {
  const navigate = useNavigate();
  const toast = useToastMessages();
  const {
    collections,
    publicCollections,
    collectionsPage,
    setCollectionsPage,
    publicCollectionsPage,
    setPublicCollectionsPage,
    collectionPageSize,
    publicCollectionPageSize,
    collectionTotalCount,
    publicCollectionTotalCount,
    loading,
    saving,
    dialogMode,
    form,
    setForm,
    totalCards,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    handleSaveCollection,
    handleDeleteCollection,
  } = useFlashcardCollections({ navigate, toast });
  const breadcrumbs = [
    { label: 'Home', path: '/' },
    { label: 'Flashcards' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <Breadcrumbs items={breadcrumbs} />
      <main className="flex-1">
        <Section bgColor="light">
          <Container>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-section-gap gap-stack-lg">
              <div>
                <Heading level="h1" size="display-lg" className="mb-2">
                  My Flashcards
                </Heading>
                <Text variant="body-lg" color="on-surface-variant" className="max-w-xl">
                  Organize vocabulary into collections. Open a collection to add cards and review.
                </Text>
              </div>
              <FlashcardCollectionStats
                totalCards={totalCards}
                collectionCount={collectionTotalCount}
              />
            </div>

            {loading ? (
              <Card className="p-stack-lg text-center">Loading flashcard collections...</Card>
            ) : (
              <div className="space-y-section-gap">
                <MyCollectionsSection
                  collections={collections}
                  onCreate={openCreateDialog}
                  onEdit={openEditDialog}
                  onOpen={(collectionId) => navigate(`/flashcards/${collectionId}`)}
                />
                <Pagination
                  page={collectionsPage}
                  pageSize={collectionPageSize}
                  itemCount={collections.length}
                  totalCount={collectionTotalCount}
                  onPageChange={setCollectionsPage}
                />
                <PublicCollectionsSection
                  collections={publicCollections}
                  totalCount={publicCollectionTotalCount}
                  onOpen={(collectionId) => navigate(`/flashcards/${collectionId}`)}
                />
                <Pagination
                  page={publicCollectionsPage}
                  pageSize={publicCollectionPageSize}
                  itemCount={publicCollections.length}
                  totalCount={publicCollectionTotalCount}
                  onPageChange={setPublicCollectionsPage}
                />
              </div>
            )}
          </Container>
        </Section>
      </main>
      <Footer />

      {dialogMode && (
        <CollectionDialog
          mode={dialogMode}
          form={form}
          saving={saving}
          onChange={setForm}
          onClose={closeDialog}
          onSubmit={() => void handleSaveCollection()}
          onDelete={dialogMode === 'edit' ? () => void handleDeleteCollection() : undefined}
        />
      )}
    </div>
  );
}
