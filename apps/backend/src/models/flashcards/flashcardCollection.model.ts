import flashcardCollectionAccessModel from "./flashcardCollectionAccess.model.js";
import flashcardCollectionReadModel from "./flashcardCollection.read.model.js";
import flashcardCollectionWriteModel from "./flashcardCollection.write.model.js";

export class FlashcardCollectionModel {
  createCollection = flashcardCollectionWriteModel.createCollection.bind(flashcardCollectionWriteModel);
  getCollectionsByUser = flashcardCollectionReadModel.getCollectionsByUser.bind(flashcardCollectionReadModel);
  countCollectionsByUser = flashcardCollectionReadModel.countCollectionsByUser.bind(flashcardCollectionReadModel);
  countCardsByUser = flashcardCollectionReadModel.countCardsByUser.bind(flashcardCollectionReadModel);
  getPublicCollections = flashcardCollectionReadModel.getPublicCollections.bind(flashcardCollectionReadModel);
  countPublicCollections = flashcardCollectionReadModel.countPublicCollections.bind(flashcardCollectionReadModel);
  getCollectionById = flashcardCollectionReadModel.getCollectionById.bind(flashcardCollectionReadModel);
  updateCollection = flashcardCollectionWriteModel.updateCollection.bind(flashcardCollectionWriteModel);
  deleteCollection = flashcardCollectionWriteModel.deleteCollection.bind(flashcardCollectionWriteModel);
  userCanAccessCollection = flashcardCollectionAccessModel.userCanAccessCollection.bind(flashcardCollectionAccessModel);
}

export default new FlashcardCollectionModel();
