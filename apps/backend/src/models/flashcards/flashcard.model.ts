import flashcardCardModel from "./flashcardCard.model.js";
import flashcardCollectionModel from "./flashcardCollection.model.js";
import type {
  CreateFlashcardInput,
  Flashcard,
  FlashcardCollection,
  FlashcardVisibility,
  UpdateFlashcardInput,
} from "./flashcard.types.js";

export type {
  CreateFlashcardInput,
  Flashcard,
  FlashcardCollection,
  FlashcardVisibility,
  UpdateFlashcardInput,
};

export class FlashcardModel {
  createCollection = flashcardCollectionModel.createCollection.bind(flashcardCollectionModel);
  getCollectionsByUser = flashcardCollectionModel.getCollectionsByUser.bind(flashcardCollectionModel);
  countCollectionsByUser = flashcardCollectionModel.countCollectionsByUser.bind(flashcardCollectionModel);
  countCardsByUser = flashcardCollectionModel.countCardsByUser.bind(flashcardCollectionModel);
  getPublicCollections = flashcardCollectionModel.getPublicCollections.bind(flashcardCollectionModel);
  countPublicCollections = flashcardCollectionModel.countPublicCollections.bind(flashcardCollectionModel);
  getCollectionById = flashcardCollectionModel.getCollectionById.bind(flashcardCollectionModel);
  updateCollection = flashcardCollectionModel.updateCollection.bind(flashcardCollectionModel);
  deleteCollection = flashcardCollectionModel.deleteCollection.bind(flashcardCollectionModel);
  userCanAccessCollection = flashcardCollectionModel.userCanAccessCollection.bind(flashcardCollectionModel);

  createFlashcard = flashcardCardModel.createFlashcard.bind(flashcardCardModel);
  getFlashcardById = flashcardCardModel.getFlashcardById.bind(flashcardCardModel);
  getFlashcardsByCollection = flashcardCardModel.getFlashcardsByCollection.bind(flashcardCardModel);
  countFlashcardsByCollection = flashcardCardModel.countFlashcardsByCollection.bind(flashcardCardModel);
  getFlashcardsByLesson = flashcardCardModel.getFlashcardsByLesson.bind(flashcardCardModel);
  countFlashcardsByLesson = flashcardCardModel.countFlashcardsByLesson.bind(flashcardCardModel);
  updateFlashcard = flashcardCardModel.updateFlashcard.bind(flashcardCardModel);
  deleteFlashcard = flashcardCardModel.deleteFlashcard.bind(flashcardCardModel);
}

export default new FlashcardModel();

