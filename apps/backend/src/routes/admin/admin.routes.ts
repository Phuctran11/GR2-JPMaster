import { Router } from "express";
import adminStatsController from "../../controllers/admin/stats.controller.js";
import adminMiddleware from "../../middlewares/admin.middleware.js";
import { asyncHandler } from "../../utils/http.js";
import assetsRoutes from "./assets.routes.js";
import blogsRoutes from "./blogs.routes.js";
import coursesRoutes from "./courses.routes.js";
import jlptRoutes from "./jlpt.routes.js";
import lessonsRoutes from "./lessons.routes.js";
import paymentsRoutes from "./payments.routes.js";
import testsRoutes from "./tests.routes.js";
import usersRoutes from "./users.routes.js";

const router = Router();

router.use(adminMiddleware);

router.get("/stats", asyncHandler(adminStatsController.getStats));
router.use("/assets", assetsRoutes);
router.use("/users", usersRoutes);
router.use("/courses", coursesRoutes);
router.use("/lessons", lessonsRoutes);
router.use("/tests", testsRoutes);
router.use(jlptRoutes);
router.use("/blogs", blogsRoutes);
router.use("/payments", paymentsRoutes);

export default router;
