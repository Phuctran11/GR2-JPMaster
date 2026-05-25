import adminJlptExamService from "./jlptExam.service.js";
import adminJlptQuestionService from "./jlptQuestion.service.js";
import adminJlptReadingPassageService from "./jlptReadingPassage.service.js";
import adminJlptSectionService from "./jlptSection.service.js";

export class AdminJlptService {
  listJlptExams = adminJlptExamService.listJlptExams.bind(adminJlptExamService);
  createJlptExam = adminJlptExamService.createJlptExam.bind(adminJlptExamService);
  updateJlptExam = adminJlptExamService.updateJlptExam.bind(adminJlptExamService);
  deleteJlptExam = adminJlptExamService.deleteJlptExam.bind(adminJlptExamService);

  listReadingPassages = adminJlptReadingPassageService.listReadingPassages.bind(adminJlptReadingPassageService);
  createReadingPassage = adminJlptReadingPassageService.createReadingPassage.bind(adminJlptReadingPassageService);
  updateReadingPassage = adminJlptReadingPassageService.updateReadingPassage.bind(adminJlptReadingPassageService);
  deleteReadingPassage = adminJlptReadingPassageService.deleteReadingPassage.bind(adminJlptReadingPassageService);

  listJlptSections = adminJlptSectionService.listJlptSections.bind(adminJlptSectionService);
  createJlptSection = adminJlptSectionService.createJlptSection.bind(adminJlptSectionService);
  updateJlptSection = adminJlptSectionService.updateJlptSection.bind(adminJlptSectionService);
  deleteJlptSection = adminJlptSectionService.deleteJlptSection.bind(adminJlptSectionService);

  listJlptSectionQuestions = adminJlptQuestionService.listJlptSectionQuestions.bind(adminJlptQuestionService);
  createJlptSectionQuestion = adminJlptQuestionService.createJlptSectionQuestion.bind(adminJlptQuestionService);
  autoAddJlptSectionQuestions = adminJlptQuestionService.autoAddJlptSectionQuestions.bind(adminJlptQuestionService);
  updateJlptSectionQuestion = adminJlptQuestionService.updateJlptSectionQuestion.bind(adminJlptQuestionService);
  updateJlptSectionQuestionOrder = adminJlptQuestionService.updateJlptSectionQuestionOrder.bind(adminJlptQuestionService);
  deleteJlptSectionQuestion = adminJlptQuestionService.deleteJlptSectionQuestion.bind(adminJlptQuestionService);
}

export default new AdminJlptService();
