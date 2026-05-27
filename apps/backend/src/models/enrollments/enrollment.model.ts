import enrollmentProgressModel from "./enrollment.progress.model.js";
import enrollmentReadModel from "./enrollment.read.model.js";
import {
  ENROLLMENT_STATUSES,
  type CourseEnrollment,
  type EnrollmentStatus,
} from "./enrollment.types.js";
import enrollmentWriteModel from "./enrollment.write.model.js";

export { ENROLLMENT_STATUSES };
export type { CourseEnrollment, EnrollmentStatus };

export class CourseEnrollmentModel {
  getEnrolledCourses = enrollmentReadModel.getEnrolledCourses.bind(enrollmentReadModel);
  checkUserCourseAccess = enrollmentReadModel.checkUserCourseAccess.bind(enrollmentReadModel);
  getEnrollmentById = enrollmentReadModel.getEnrollmentById.bind(enrollmentReadModel);
  getEnrollmentByUserAndCourse = enrollmentReadModel.getEnrollmentByUserAndCourse.bind(enrollmentReadModel);
  getEnrolledCoursesByStatus = enrollmentReadModel.getEnrolledCoursesByStatus.bind(enrollmentReadModel);
  getEnrolledCourseCountByStatus = enrollmentReadModel.getEnrolledCourseCountByStatus.bind(enrollmentReadModel);
  getEnrolledCoursesByEffectiveStatus = enrollmentReadModel.getEnrolledCoursesByEffectiveStatus.bind(enrollmentReadModel);
  getEnrolledCourseCountByEffectiveStatus = enrollmentReadModel.getEnrolledCourseCountByEffectiveStatus.bind(enrollmentReadModel);
  getEffectiveStatusesByCourseIds = enrollmentReadModel.getEffectiveStatusesByCourseIds.bind(enrollmentReadModel);

  enrollUser = enrollmentWriteModel.enrollUser.bind(enrollmentWriteModel);
  enrollUserWithCompletedPurchase = enrollmentWriteModel.enrollUserWithCompletedPurchase.bind(enrollmentWriteModel);
  updateEnrollmentStatus = enrollmentWriteModel.updateEnrollmentStatus.bind(enrollmentWriteModel);
  updateEnrollmentStatusByUserAndCourse = enrollmentWriteModel.updateEnrollmentStatusByUserAndCourse.bind(enrollmentWriteModel);
  deleteEnrollment = enrollmentWriteModel.deleteEnrollment.bind(enrollmentWriteModel);

  markLessonStarted = enrollmentProgressModel.markLessonStarted.bind(enrollmentProgressModel);
  markLessonCompleted = enrollmentProgressModel.markLessonCompleted.bind(enrollmentProgressModel);
}

export default new CourseEnrollmentModel();

