import enrollmentEffectiveStatusModel from "./enrollmentEffectiveStatus.model.js";
import enrollmentListModel from "./enrollmentList.model.js";
import enrollmentLookupModel from "./enrollmentLookup.model.js";

export class CourseEnrollmentReadModel {
  getEnrolledCourses = enrollmentListModel.getEnrolledCourses.bind(enrollmentListModel);
  getEnrolledCoursesByStatus = enrollmentListModel.getEnrolledCoursesByStatus.bind(enrollmentListModel);
  getEnrolledCourseCountByStatus = enrollmentListModel.getEnrolledCourseCountByStatus.bind(enrollmentListModel);

  checkUserCourseAccess = enrollmentLookupModel.checkUserCourseAccess.bind(enrollmentLookupModel);
  getEnrollmentById = enrollmentLookupModel.getEnrollmentById.bind(enrollmentLookupModel);
  getEnrollmentByUserAndCourse = enrollmentLookupModel.getEnrollmentByUserAndCourse.bind(enrollmentLookupModel);

  getEnrolledCoursesByEffectiveStatus =
    enrollmentEffectiveStatusModel.getEnrolledCoursesByEffectiveStatus.bind(enrollmentEffectiveStatusModel);
  getEnrolledCourseCountByEffectiveStatus =
    enrollmentEffectiveStatusModel.getEnrolledCourseCountByEffectiveStatus.bind(enrollmentEffectiveStatusModel);
  getEffectiveStatusesByCourseIds =
    enrollmentEffectiveStatusModel.getEffectiveStatusesByCourseIds.bind(enrollmentEffectiveStatusModel);
}

export default new CourseEnrollmentReadModel();
