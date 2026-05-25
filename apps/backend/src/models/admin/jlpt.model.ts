import jlptExamsModel from "./jlptExams.model.js";
import jlptQuestionsModel from "./jlptQuestions.model.js";
import jlptSectionsModel from "./jlptSections.model.js";
import readingPassagesModel from "./readingPassages.model.js";

const adminJlptModel = {
  listJlptExams: jlptExamsModel.listJlptExams.bind(jlptExamsModel),
  countJlptExams: jlptExamsModel.countJlptExams.bind(jlptExamsModel),
  createJlptExam: jlptExamsModel.createJlptExam.bind(jlptExamsModel),
  updateJlptExam: jlptExamsModel.updateJlptExam.bind(jlptExamsModel),
  deleteJlptExam: jlptExamsModel.deleteJlptExam.bind(jlptExamsModel),

  listReadingPassages: readingPassagesModel.listReadingPassages.bind(readingPassagesModel),
  createReadingPassage: readingPassagesModel.createReadingPassage.bind(readingPassagesModel),
  updateReadingPassage: readingPassagesModel.updateReadingPassage.bind(readingPassagesModel),
  deleteReadingPassage: readingPassagesModel.deleteReadingPassage.bind(readingPassagesModel),

  listJlptSections: jlptSectionsModel.listJlptSections.bind(jlptSectionsModel),
  createJlptSection: jlptSectionsModel.createJlptSection.bind(jlptSectionsModel),
  updateJlptSection: jlptSectionsModel.updateJlptSection.bind(jlptSectionsModel),
  deleteJlptSection: jlptSectionsModel.deleteJlptSection.bind(jlptSectionsModel),

  listJlptSectionQuestions: jlptQuestionsModel.listJlptSectionQuestions.bind(jlptQuestionsModel),
  createJlptSectionQuestion: jlptQuestionsModel.createJlptSectionQuestion.bind(jlptQuestionsModel),
  autoAddJlptSectionQuestions: jlptQuestionsModel.autoAddJlptSectionQuestions.bind(jlptQuestionsModel),
  updateJlptSectionQuestion: jlptQuestionsModel.updateJlptSectionQuestion.bind(jlptQuestionsModel),
  updateJlptSectionQuestionOrder: jlptQuestionsModel.updateJlptSectionQuestionOrder.bind(jlptQuestionsModel),
  deleteJlptSectionQuestion: jlptQuestionsModel.deleteJlptSectionQuestion.bind(jlptQuestionsModel),
};

export default adminJlptModel;
