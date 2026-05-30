import express from "express";
import cors from "cors";
import pool from "./config/database.js";
import userRoutes from "./routes/users/user.routes.js";
import courseRoutes from "./routes/courses/course.routes.js";
import flashcardRoutes from "./routes/flashcards/flashcard.routes.js";
import purchaseRoutes from "./routes/purchases/purchase.routes.js";
import enrollmentRoutes from "./routes/enrollments/enrollment.routes.js";
import ratingRoutes from "./routes/ratings/rating.routes.js";
import quizRoutes from "./routes/quizzes/quiz.routes.js";
import certificateRoutes from "./routes/certificates/certificate.routes.js";
import aiRoutes from "./routes/ai/ai.routes.js";
import adminRoutes from "./routes/admin/admin.routes.js";
import jlptExamRoutes from "./routes/jlpt/jlptExam.routes.js";
import assetRoutes from "./routes/assets/asset.routes.js";
import analyticsRoutes from "./routes/analytics/analytics.routes.js";
import goalRoutes from "./routes/goals/goal.routes.js";
import paymentRoutes from "./routes/payments/payment.routes.js";
import paymentModel from "./models/payments/payment.model.js";
import {
  getCorsOrigins,
  getJsonBodyLimit,
  getServerHeadersTimeoutMs,
  getServerRequestTimeoutMs,
} from "./config/runtime.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import { logger } from "./utils/logger.js";

const app = express();

app.use(express.json({ limit: getJsonBodyLimit() }));
app.use(cors({
  origin: getCorsOrigins(),
}));

app.get("/", (req, res) => {
  res.send("E-learning API running...");
});

app.get("/healthz", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/readyz", async (req, res, next) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ready" });
  } catch (error) {
    next(error);
  }
});

app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/jlpt-exams", jlptExamRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
  logger.info("Server started", { context: "app", port: PORT });

  try {
    await pool.query("SELECT NOW()");
    logger.info("Database connection successful", { context: "app" });
    await paymentModel.markExpiredTransactions();
  } catch (error) {
    logger.error("Database connection failed", { context: "app", error });
  }
});

const paymentExpirySweep = setInterval(() => {
  void paymentModel.markExpiredTransactions().catch((error) => {
    logger.error("Payment expiry sweep failed", { context: "app", error });
  });
}, 60 * 1000);

paymentExpirySweep.unref?.();

server.requestTimeout = getServerRequestTimeoutMs();
server.headersTimeout = getServerHeadersTimeoutMs();

const shutdown = () => {
  logger.info("Shutting down server", { context: "app" });
  clearInterval(paymentExpirySweep);
  server.close(() => {
    void pool.end().finally(() => {
      process.exit(0);
    });
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
