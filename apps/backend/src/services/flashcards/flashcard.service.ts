import flashcardCardService from "./flashcardCard.service.js";
import flashcardCollectionService from "./flashcardCollection.service.js";

export class FlashcardService {
  createCollection = flashcardCollectionService.createCollection.bind(flashcardCollectionService);
  getMyCollections = flashcardCollectionService.getMyCollections.bind(flashcardCollectionService);
  getPublicCollections = flashcardCollectionService.getPublicCollections.bind(flashcardCollectionService);
  getCollection = flashcardCollectionService.getCollection.bind(flashcardCollectionService);
  updateCollection = flashcardCollectionService.updateCollection.bind(flashcardCollectionService);
  deleteCollection = flashcardCollectionService.deleteCollection.bind(flashcardCollectionService);

  createFlashcard = flashcardCardService.createFlashcard.bind(flashcardCardService);
  getFlashcard = flashcardCardService.getFlashcard.bind(flashcardCardService);
  getFlashcardsByCollection = flashcardCardService.getFlashcardsByCollection.bind(flashcardCardService);
  getFlashcardsByLesson = flashcardCardService.getFlashcardsByLesson.bind(flashcardCardService);
  updateFlashcard = flashcardCardService.updateFlashcard.bind(flashcardCardService);
  deleteFlashcard = flashcardCardService.deleteFlashcard.bind(flashcardCardService);
}

export default new FlashcardService();
