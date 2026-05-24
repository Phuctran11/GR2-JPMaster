import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/database.js";
import userRoutes from "./routes/user.routes.js";
import courseRoutes from "./routes/course.routes.js";
import flashcardRoutes from "./routes/flashcard.routes.js";
import purchaseRoutes from "./routes/purchase.routes.js";
import enrollmentRoutes from "./routes/enrollment.routes.js";
import ratingRoutes from "./routes/rating.routes.js";
import quizRoutes from "./routes/quiz.routes.js";
import lessonNoteRoutes from "./routes/lessonNote.routes.js";
import certificateRoutes from "./routes/certificate.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import jlptExamRoutes from "./routes/jlptExam.routes.js";
import assetRoutes from "./routes/asset.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import goalRoutes from "./routes/goal.routes.js";
import achievementRoutes from "./routes/achievement.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("E-learning API running...");
});

app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/lesson-notes", lessonNoteRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/jlpt-exams", jlptExamRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  try {
    await pool.query("SELECT NOW()");
    console.log("Database connection successful");
  } catch (error) {
    console.error("Database connection failed:", error instanceof Error ? error.message : "Unknown error");
  }
});

server.requestTimeout = 10 * 60 * 1000;
server.headersTimeout = 10 * 60 * 1000 + 5000;
