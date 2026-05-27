import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header, Footer, Card, Container, Breadcrumbs, Pagination } from '../components';
import { Heading, Text } from '../components/ui/Typography';
import {
  FlashcardAiAssistantModal,
  FlashcardCardsList,
  FlashcardCreateCardForm,
  FlashcardDetailHeader,
  FlashcardEditDialog,
  FlashcardStudyPanel,
} from '../components/flashcards';
import { useAuth } from '../contexts/AuthContext';
import { useToastMessages } from '../hooks/useToastMessages';
import { useFlashcardAiAssistant } from '../hooks/flashcards/useFlashcardAiAssistant';
import { useFlashcardCardActions } from '../hooks/flashcards/useFlashcardCardActions';
import { useFlashcardDetailData } from '../hooks/flashcards/useFlashcardDetailData';
import { useFlashcardSelection } from '../hooks/flashcards/useFlashcardSelection';

export default function FlashcardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToastMessages();
  const { user } = useAuth();
  const collectionId = Number(id);

  const {
    collection,
    cards,
    setCards,
    cardsPage,
    setCardsPage,
    cardPageSize,
    cardTotalCount,
    setCardTotalCount,
    currentIndex,
    setCurrentIndex,
    showBack,
    setShowBack,
    currentCard,
    loading,
    goPrevious,
    goNext,
  } = useFlashcardDetailData({ collectionId, navigate, toast });
  const {
    selectedCardIds,
    setSelectedCardIds,
    selectedCards,
    selectedCardContext,
    toggleSelectedCard,
    clearSelectedCards,
  } = useFlashcardSelection(cards);
  const {
    isAiAssistantOpen,
    openAiAssistant,
    closeAiAssistant,
  } = useFlashcardAiAssistant();
  const {
    saving,
    uploadingMedia,
    createForm,
    setCreateForm,
    editingCard,
    editForm,
    setEditForm,
    openEditCard,
    closeEditCard,
    uploadCreateCardMedia,
    uploadEditCardMedia,
    handleCreateCard,
    handleUpdateCard,
    handleDeleteCard,
  } = useFlashcardCardActions({
    collectionId,
    cards,
    setCards,
    setCardTotalCount,
    setCurrentIndex,
    setShowBack,
    setSelectedCardIds,
    toast,
  });

  const isOwner = Boolean(collection && user && collection.user_id === user.user_id);
  const breadcrumbs = useMemo(
    () => [
      { label: 'Home', path: '/' },
      { label: 'Flashcards', path: '/flashcards' },
      { label: collection?.title || 'Review' },
    ],
    [collection?.title]
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <Breadcrumbs items={breadcrumbs} />
      <main className="flex-grow pt-24 pb-section-gap px-margin-mobile md:px-margin-desktop relative">
        <Container>
          {loading ? (
            <Card className="p-stack-lg text-center">Loading review...</Card>
          ) : (
            <div className="space-y-section-gap">
              <FlashcardDetailHeader
                collection={collection}
                isOwner={isOwner}
                onBack={() => navigate('/flashcards')}
              />

              {isOwner && (
                <FlashcardCreateCardForm
                  form={createForm}
                  saving={saving}
                  uploadingMedia={uploadingMedia}
                  onChange={setCreateForm}
                  onSubmit={() => void handleCreateCard()}
                  onUploadMedia={(file, mediaKind) => void uploadCreateCardMedia(file, mediaKind)}
                />
              )}

              {!currentCard ? (
                <Card className="p-stack-lg text-center">
                  <Heading level="h2" size="headline-md">No cards available</Heading>
                  <Text variant="body-md" color="on-surface-variant" className="mt-2">
                    Add your first flashcard above.
                  </Text>
                </Card>
              ) : (
                <FlashcardStudyPanel
                  currentCard={currentCard}
                  currentIndex={currentIndex}
                  cardCount={cards.length}
                  showBack={showBack}
                  onToggleBack={() => setShowBack((value) => !value)}
                  onPrevious={goPrevious}
                  onNext={goNext}
                />
              )}

              <FlashcardCardsList
                cards={cards}
                isOwner={isOwner}
                selectedCardIds={selectedCardIds}
                onToggleSelected={toggleSelectedCard}
                onClearSelected={clearSelectedCards}
                onOpenAi={openAiAssistant}
                onEdit={openEditCard}
                onDelete={(flashcardId) => void handleDeleteCard(flashcardId)}
              />
              <Pagination
                page={cardsPage}
                pageSize={cardPageSize}
                itemCount={cards.length}
                totalCount={cardTotalCount}
                onPageChange={setCardsPage}
              />
            </div>
          )}
        </Container>
      </main>

      {editingCard && (
        <FlashcardEditDialog
          card={editingCard}
          form={editForm}
          saving={saving}
          uploadingMedia={uploadingMedia}
          onChange={setEditForm}
          onClose={closeEditCard}
          onSubmit={() => void handleUpdateCard()}
          onUploadMedia={(file, mediaKind) => void uploadEditCardMedia(file, mediaKind)}
        />
      )}

      {currentCard && isAiAssistantOpen && (
        <FlashcardAiAssistantModal
          currentCard={currentCard}
          selectedCardIds={selectedCardIds}
          selectedCards={selectedCards}
          selectedCardContext={selectedCardContext}
          onClose={closeAiAssistant}
        />
      )}
      <Footer />
    </div>
  );
}
