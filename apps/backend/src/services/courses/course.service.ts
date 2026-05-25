import courseModel from "../../models/courses/course.model.js";
import userModel from "../../models/users/user.model.js";
import { ApiError } from "../../utils/http.js";
import { BodyInput, requireString } from "../../validators/common.validator.js";

const withFreeFlag = <T extends { price: number }>(course: T) => ({
  ...course,
  is_free: course.price === 0,
});

export class CourseService {
  async createCourse(body: BodyInput) {
    const title = requireString(body.title);
    const description = requireString(body.description);
    const { price, created_by } = body;

    if (!title || price === undefined || !created_by) {
      throw new ApiError(400, "title, price, and created_by are required");
    }

    if (typeof price !== "number" || price < 0) {
      throw new ApiError(400, "price must be a non-negative number");
    }

    if (typeof created_by !== "number") {
      throw new ApiError(400, "created_by must be a user ID");
    }

    const creator = await userModel.getUserById(created_by);
    if (!creator) {
      throw new ApiError(404, "Creator user not found");
    }

    return courseModel.createCourse(title, description || null, price, created_by);
  }

  async getAllCourses(input: {
    limit: number;
    offset: number;
    withLessons: boolean;
    level: string;
    sort: string;
    hasExploreFilters: boolean;
  }) {
    if (!input.withLessons && input.hasExploreFilters) {
      const result = await courseModel.getExploreCourses({
        limit: input.limit,
        offset: input.offset,
        level: input.level,
        sort: input.sort,
      });

      return {
        courses: result.courses.map(withFreeFlag),
        totalCount: result.totalCount,
      };
    }

    if (input.withLessons) {
      const courses = await courseModel.getCoursesWithLessons(input.limit, input.offset);
      return { courses };
    }

    const courses = await courseModel.getAllCourses(input.limit, input.offset);
    return { courses: courses.map(withFreeFlag) };
  }

  async getPopularCourses(limit: number) {
    const courses = await courseModel.getPopularCourses(limit);
    return courses.map(withFreeFlag);
  }

  async getCourse(courseId: number) {
    const course = await courseModel.getCourseByIdWithDetail(courseId);
    if (!course) {
      throw new ApiError(404, "Course not found");
    }

    return course;
  }

  async getCoursesByCreator(userId: number, limit: number, offset: number) {
    const user = await userModel.getUserById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return courseModel.getCoursesByCreator(userId, limit, offset);
  }

  async updateCourse(courseId: number, body: BodyInput) {
    const title = requireString(body.title);
    const description = requireString(body.description);
    const { price } = body;

    if (!title || price === undefined) {
      throw new ApiError(400, "title and price are required");
    }

    if (typeof price !== "number" || price < 0) {
      throw new ApiError(400, "price must be a non-negative number");
    }

    const existingCourse = await courseModel.getCourseById(courseId);
    if (!existingCourse) {
      throw new ApiError(404, "Course not found");
    }

    return courseModel.updateCourse(courseId, title, description || null, price);
  }

  async deleteCourse(courseId: number) {
    const success = await courseModel.deleteCourse(courseId);
    if (!success) {
      throw new ApiError(404, "Course not found");
    }
  }
}

export default new CourseService();
