import flashcardCardReadModel from "./flashcardCard.read.model.js";
import flashcardCardWriteModel from "./flashcardCard.write.model.js";

export class FlashcardCardModel {
  createFlashcard = flashcardCardWriteModel.createFlashcard.bind(flashcardCardWriteModel);
  updateFlashcard = flashcardCardWriteModel.updateFlashcard.bind(flashcardCardWriteModel);
  deleteFlashcard = flashcardCardWriteModel.deleteFlashcard.bind(flashcardCardWriteModel);

  getFlashcardById = flashcardCardReadModel.getFlashcardById.bind(flashcardCardReadModel);
  getFlashcardsByCollection = flashcardCardReadModel.getFlashcardsByCollection.bind(flashcardCardReadModel);
  countFlashcardsByCollection = flashcardCardReadModel.countFlashcardsByCollection.bind(flashcardCardReadModel);
  getFlashcardsByLesson = flashcardCardReadModel.getFlashcardsByLesson.bind(flashcardCardReadModel);
  countFlashcardsByLesson = flashcardCardReadModel.countFlashcardsByLesson.bind(flashcardCardReadModel);
}

export default new FlashcardCardModel();
