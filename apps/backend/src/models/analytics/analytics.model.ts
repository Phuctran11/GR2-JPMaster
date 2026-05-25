import analyticsPerformanceModel from "./analytics.performance.model.js";
import analyticsStudyModel from "./analytics.study.model.js";
import analyticsSummaryModel from "./analytics.summary.model.js";

export class AnalyticsModel {
  getSummary = analyticsSummaryModel.getSummary.bind(analyticsSummaryModel);

  getStudyTime = analyticsStudyModel.getStudyTime.bind(analyticsStudyModel);
  getCourseProgress = analyticsStudyModel.getCourseProgress.bind(analyticsStudyModel);

  getQuizPerformance = analyticsPerformanceModel.getQuizPerformance.bind(analyticsPerformanceModel);
  getJlptPerformance = analyticsPerformanceModel.getJlptPerformance.bind(analyticsPerformanceModel);
}

export default new AnalyticsModel();
