import { Request, Response, NextFunction } from "express";
import courseModel from "../models/course.model.js";
import userModel from "../models/user.model.js";

export class CourseController {
  async createCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, description, price, created_by } = req.body;

      if (!title || price === undefined || !created_by) {
        return res.status(400).json({ error: "title, price, and created_by are required" });
      }

      if (typeof price !== "number" || price < 0) {
        return res.status(400).json({ error: "price must be a non-negative number" });
      }

      if (typeof created_by !== "number") {
        return res.status(400).json({ error: "created_by must be a user ID" });
      }

      const creator = await userModel.getUserById(created_by);
      if (!creator) {
        return res.status(404).json({ error: "Creator user not found" });
      }

      const course = await courseModel.createCourse(title, description || null, price, created_by);
      return res.status(201).json({ message: "Course created successfully", data: course });
    } catch (error) {
      next(error);
    }
  }

  async getAllCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = Math.min(Number(req.query.limit) || 10, 100);
      const offset = Number(req.query.offset) || 0;
      const withLessons = req.query.withLessons === 'true';

      let courses;
      if (withLessons) {
        // Get courses with lessons
        const allCourses = await courseModel.getAllCourses(limit, offset);
        courses = [];
        for (const course of allCourses) {
          const courseWithLessons = await courseModel.getCourseByIdWithLessons(course.course_id);
          if (courseWithLessons) {
            courses.push(courseWithLessons);
          }
        }
      } else {
        courses = await courseModel.getAllCourses(limit, offset);
        // Add is_free flag to each course
        courses = courses.map(course => ({
          ...course,
          is_free: course.price === 0,
        }));
      }

      return res.status(200).json({ data: courses, count: courses.length });
    } catch (error) {
      next(error);
    }
  }

  async getPopularCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = Math.min(Number(req.query.limit) || 4, 20);
      const courses = await courseModel.getPopularCourses(limit);
      const withFreeFlag = courses.map(course => ({ ...course, is_free: course.price === 0 }));
      return res.status(200).json({ data: withFreeFlag, count: withFreeFlag.length });
    } catch (error) {
      next(error);
    }
  }

  async getCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: "Invalid course ID" });
      }

      // Always fetch with lessons and ratings for detail view
      const course = await courseModel.getCourseByIdWithDetail(Number(id));

      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      return res.status(200).json({ data: course });
    } catch (error) {
      next(error);
    }
  }

  async getCoursesByCreator(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const limit = Math.min(Number(req.query.limit) || 10, 100);
      const offset = Number(req.query.offset) || 0;

      if (!userId || isNaN(Number(userId))) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const user = await userModel.getUserById(Number(userId));
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const courses = await courseModel.getCoursesByCreator(Number(userId), limit, offset);
      return res.status(200).json({ data: courses, count: courses.length });
    } catch (error) {
      next(error);
    }
  }

  async updateCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { title, description, price } = req.body;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: "Invalid course ID" });
      }

      if (!title || price === undefined) {
        return res.status(400).json({ error: "title and price are required" });
      }

      if (typeof price !== "number" || price < 0) {
        return res.status(400).json({ error: "price must be a non-negative number" });
      }

      const existingCourse = await courseModel.getCourseById(Number(id));
      if (!existingCourse) {
        return res.status(404).json({ error: "Course not found" });
      }

      const course = await courseModel.updateCourse(Number(id), title, description || null, price);
      return res.status(200).json({ message: "Course updated successfully", data: course });
    } catch (error) {
      next(error);
    }
  }

  async deleteCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: "Invalid course ID" });
      }

      const success = await courseModel.deleteCourse(Number(id));

      if (!success) {
        return res.status(404).json({ error: "Course not found" });
      }

      return res.status(200).json({ message: "Course hidden successfully" });
    } catch (error) {
      next(error);
    }
  }
}

export default new CourseController();
