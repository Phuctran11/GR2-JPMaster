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

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  try {
    await pool.query("SELECT NOW()");
    console.log("Database connection successful");
  } catch (error) {
    console.error("Database connection failed:", error instanceof Error ? error.message : "Unknown error");
  }
});
