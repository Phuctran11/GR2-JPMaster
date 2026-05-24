import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import jlptExamModel from "../models/jlptExam.model.js";
import learningActivityService from "../services/learningActivity.service.js";

const validLevels = ["N1", "N2", "N3", "N4", "N5", "All"];
const validSections = ["all", "vocabulary", "grammar", "reading", "listening"];

export class JlptExamController {
  async listExams(req: Request, res: Response, next: NextFunction) {
    try {
      const level = String(req.query.level || "All");
      const sectionType = String(req.query.section_type || "all");

      const data = await jlptExamModel.listExams({
        level: validLevels.includes(level) ? level : "All",
        section_type: validSections.includes(sectionType) ? sectionType : "all",
      });
      return res.status(200).json({ data, count: data.length });
    } catch (error) {
      next(error);
    }
  }

  async getExam(req: Request, res: Response, next: NextFunction) {
    try {
      const examId = Number(req.params.examId);
      if (!Number.isFinite(examId)) return res.status(400).json({ error: "Invalid JLPT exam ID" });

      const data = await jlptExamModel.getExamById(examId);
      if (!data) return res.status(404).json({ error: "JLPT exam not found" });
      return res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  }

  async submitExam(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const examId = Number(req.params.examId);
      if (!Number.isFinite(examId)) return res.status(400).json({ error: "Invalid JLPT exam ID" });
      if (!Array.isArray(req.body.answers)) return res.status(400).json({ error: "answers must be an array" });

      const data = await jlptExamModel.submitExam(req.user.user_id, examId, req.body.answers);
      if (!data) return res.status(404).json({ error: "JLPT exam not found" });
      await learningActivityService.recordJlptSubmitted(req.user.user_id, examId, data.score);
      return res.status(201).json({ message: data.passed ? "JLPT test passed" : "JLPT test submitted", data });
    } catch (error) {
      next(error);
    }
  }
}

export default new JlptExamController();
