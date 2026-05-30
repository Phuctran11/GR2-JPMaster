# DATN-JPMaster Project Overview

Tài liệu này là bản định hướng nhanh cho project `DATN-JPMaster` sau khi review lại toàn bộ repo. Nội dung tập trung vào cấu trúc thư mục, chức năng chính, nghiệp vụ của hệ thống và các điểm cần biết khi tiếp tục phát triển.

## 1. Tổng quan dự án

`DATN-JPMaster` là nền tảng e-learning học tiếng Nhật, tổ chức theo pnpm monorepo.

- Frontend: React/Vite/TypeScript tại `apps/frontend`.
- Backend: Express/TypeScript/PostgreSQL tại `apps/backend`.
- Database: PostgreSQL, schema tham khảo tại `apps/backend/src/config/erd.sql`, kèm các file dump/import ở root.
- Mục tiêu sản phẩm: quản lý khóa học tiếng Nhật, bài học, quiz, đề JLPT, flashcard, chứng chỉ, thanh toán, hồ sơ học tập và admin dashboard.

Workspace:

```text
.
  apps/
    backend/
    frontend/
  docs/
  full_dump.sql
  supabase_data_import_inserts_utf8_fixed.sql
  package.json
  pnpm-workspace.yaml
  pnpm-lock.yaml
  PROJECT_OVERVIEW.md
```

## 2. Cấu trúc thư mục cấp cao

- `apps/frontend`: ứng dụng web cho learner/admin.
- `apps/backend`: REST API, business logic, model SQL và tích hợp bên thứ ba.
- `docs/FRONTEND_ARCHITECTURE.md`: ghi chú refactor/kiến trúc frontend.
- `docs/backend-refactor-report.md`: ghi chú refactor/kiến trúc backend chi tiết.
- `apps/backend/src/config/erd.sql`: schema PostgreSQL chính.
- `full_dump.sql`: dump database cũ; hiện có thể còn dữ liệu/schema legacy của các tính năng đã xóa, không dùng làm schema nguồn.
- `supabase_data_import_inserts_utf8_fixed.sql`: script import dữ liệu cũ; hiện có thể còn insert legacy của các tính năng đã xóa, không dùng làm schema nguồn.
- `node_modules`: dependencies đã cài trong workspace.

`pnpm-workspace.yaml` khai báo workspace `apps/*` và `packages/*`; hiện repo có hai app chính trong `apps`.

## 3. Frontend

Path: `apps/frontend`

### Stack

- React 19
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Framer Motion
- React Hook Form
- Recharts
- React Icons

### Entry points

- `src/main.tsx`: bootstrap React app.
- `src/App.tsx`: khai báo provider toàn cục và routing.
- `src/services/api.ts`: API client tập trung, dùng `VITE_API_BASE_URL` hoặc fallback `http://localhost:5000/api`.

Provider/top-level UI trong `App.tsx`:

- `ThemeProvider`
- `AuthProvider`
- `ToastProvider`
- `ToastContainer`
- `ThemeTransitionOverlay`
- `JapaneseDictionaryWidget`

### Routing chính

Các route hiện có:

- `/`: trang chủ.
- `/courses`: khóa học của tôi.
- `/explore`: khám phá khóa học.
- `/courses/:id`: chi tiết khóa học.
- `/courses/:id/certificate`: chứng chỉ khóa học.
- `/courses/:id/lessons/:lessonId`: học bài.
- `/courses/:id/lessons/:lessonId/quiz`: quiz bài học dạng focus.
- `/courses/:id/final-test`: bài kiểm tra cuối khóa.
- `/profile`: hồ sơ, mục tiêu, thành tích, analytics.
- `/flashcards`: danh sách bộ flashcard.
- `/flashcards/:id`: chi tiết và luyện tập flashcard.
- `/tests`: danh sách đề JLPT.
- `/tests/:examId`: làm bài JLPT.
- `/admin`: admin dashboard.
- `/login`, `/signup`: xác thực.

### Cấu trúc frontend

```text
apps/frontend/src/
  assets/        Ảnh tĩnh dùng trong UI.
  components/    Component dùng chung và component theo domain.
  contexts/      Auth, theme, toast context.
  hooks/         Hook data/action/controller theo domain.
  pages/         Component cấp route.
  services/      API client và Google auth helper.
  styles/        Tailwind utility mở rộng.
  utils/         Validation/helper thuần.
  App.tsx
  main.tsx
```

Các nhóm component quan trọng:

- `components/ui`: primitive/shared UI như typography, badge, rating, progress, skeleton, icon button, frame.
- `components/cards`: card khóa học, test, testimonial, rating form.
- `components/header`: navigation, search, theme toggle, auth actions, user menu, mobile menu.
- `components/admin`: admin dashboard, sections, modals, modal groups, admin table/sidebar/form UI.
- `components/course`, `components/courseExplore`: chi tiết khóa học và khám phá khóa học.
- `components/lesson`: UI học bài, quiz panel và tạo flashcard từ text được bôi đen trong lesson.
- `components/questions`: UI câu hỏi dùng chung cho quiz và JLPT.
- `components/jlpt`, `components/testList`: danh sách đề và màn hình làm bài JLPT.
- `components/flashcards`: collection, card list, study panel, AI assistant.
- `components/profile`: overview, progress, goals, analytics chart.
- `components/certificate`: preview, PDF/download, print styles, status page.
- `components/ai`: panel AI assistant.

Các nhóm hook quan trọng:

- `hooks/admin`: load data và action cho users, courses, lessons, tests, JLPT, payments, assets.
- `hooks/course`: detail, explore, enrollment, payment.
- `hooks/lesson`: lesson data/layout/progress/flashcards/quiz.
- `hooks/quiz`: controller cho quiz focus.
- `hooks/jlpt`: test list và controller làm đề JLPT.
- `hooks/flashcards`: collection, card action, selection, AI assistant.
- `hooks/profile`: profile data, form, actions.
- `hooks/certificate`: certificate data và download.

### Frontend API client

`src/services/api.ts` đang gom nhiều API object:

- `authAPI`, `userAPI`
- `courseAPI`, `enrollmentAPI`, `purchaseAPI`, `paymentAPI`
- `quizAPI`, `jlptExamAPI`
- `flashcardAPI`
- `certificateAPI`
- `ratingAPI`
- `analyticsAPI`, `goalAPI`
- `assetAPI`, `aiAPI`
- `adminAPI`

Lưu ý: file này khá lớn; nếu refactor tiếp nên chia theo domain nhưng giữ contract response hiện tại.

### Lệnh frontend

Chạy trong `apps/frontend`:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm preview
```

## 4. Backend

Path: `apps/backend`

### Stack

- Express 5
- TypeScript ESM
- PostgreSQL qua `pg`
- JWT qua `jsonwebtoken`
- Password hashing qua `bcryptjs`
- Upload qua `multer`
- Cloudinary SDK
- PayOS/payment flow qua service nội bộ
- Gemini/AI service qua client riêng

### Entry points

- `src/app.ts`: tạo Express app, đăng ký middleware/routes, health checks, start server, sweep payment expired, graceful shutdown.
- `src/config/database.ts`: tạo PostgreSQL pool, đọc `DATABASE_URL` hoặc `DB_*`.
- `src/config/runtime.ts`: runtime config cho CORS, frontend URL, JSON body limit, upload size, timeout, JWT expiry.
- `src/config/env.ts`: load dotenv một lần.

Health/runtime endpoints:

- `GET /`: trả `"E-learning API running..."`.
- `GET /healthz`: liveness check.
- `GET /readyz`: kiểm tra kết nối database.

### Cấu trúc backend

```text
apps/backend/src/
  app.ts
  config/
    database.ts
    env.ts
    runtime.ts
    erd.sql
  constants/
  middlewares/
    auth.middleware.ts
    admin.middleware.ts
    error.middleware.ts
  utils/
    http.ts
    logger.ts
    adminContext.ts
  validators/
  routes/
  controllers/
  services/
  models/
```

Backend đang theo layered MVC + domain subfolders:

```text
routes -> controllers -> services -> models -> database
```

Quy ước layer:

- `routes/<domain>`: khai báo endpoint, middleware, `asyncHandler`.
- `controllers/<domain>`: parse request, gọi service, trả response.
- `services/<domain>`: business logic, kiểm tra quyền, validate nghiệp vụ, map lỗi sang `ApiError`.
- `models/<domain>`: SQL/query, transaction, format row, trả data/null/boolean.
- `validators`: validate input dùng lại.
- `utils/http.ts`: `ApiError`, `asyncHandler`, response helpers, `requireUser`.
- `utils/logger.ts`: logger tập trung; hạn chế dùng `console.*` trực tiếp.

### API routes chính

Public/authenticated API mount trong `app.ts`:

- `/api/users`: đăng ký, login, Google login, `/me`.
- `/api/courses`: list, popular, creator courses, detail.
- `/api/flashcards`: collection/card flashcard.
- `/api/enrollments`: khóa học đã ghi danh, tiến độ, start/complete lesson.
- `/api/purchases`: đọc purchase.
- `/api/ratings`: rating/review khóa học, top-rated, testimonial.
- `/api/quizzes`: lesson quiz, final quiz, start/submit attempt.
- `/api/certificates`: chứng chỉ khóa học.
- `/api/ai`: AI assistant cho flashcard.
- `/api/assets`: upload asset.
- `/api/analytics`: summary, study time, course progress, quiz/JLPT performance.
- `/api/goals`: mục tiêu học tập và progress.
- `/api/payments`: PayOS checkout/status/confirm/webhook.
- `/api/jlpt-exams`: danh sách đề, chi tiết đề, submit bài JLPT.
- `/api/admin`: admin dashboard và CRUD nội dung.

Admin routes dùng `adminMiddleware`, yêu cầu role `admin` hoặc `owner`:

- `/api/admin/stats`
- `/api/admin/assets/upload`
- `/api/admin/users`
- `/api/admin/courses`
- `/api/admin/lessons`
- `/api/admin/tests`
- `/api/admin/jlpt-exams`
- `/api/admin/reading-passages`
- `/api/admin/jlpt-sections`
- `/api/admin/payments`

### Auth và quyền

- JWT token lấy từ `Authorization: Bearer <token>`.
- `authMiddleware` verify token, load user active từ DB và gắn `req.user`.
- Public register luôn tạo learner ở service/model, không nên tin role gửi từ client.
- Admin middleware chỉ cho `admin` và `owner`.
- Public user API đã thu hẹp về login/register/google-login/me/update me.

### Lệnh backend

Chạy trong `apps/backend`:

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm format
pnpm run test:regression
pnpm run test:integration
```

Typecheck:

```bash
pnpm exec tsc --noEmit
```

Integration test mặc định có guard; khi chạy thật nên dùng DB test riêng:

```powershell
$env:DB_NAME="DATN_JPMaster_test"
$env:RUN_INTEGRATION_TESTS="1"
pnpm run test:integration
```

## 5. Database

Schema chính ở `apps/backend/src/config/erd.sql`. Các bảng nghiệp vụ chính:

- `User`: tài khoản, role, trạng thái.
- `CloudinaryAsset`: metadata file upload.
- `Course`: khóa học.
- `Lesson`: bài học thuộc khóa học.
- `Quiz`, `Question`, `Option`, `QuizQuestion`: ngân hàng câu hỏi và quiz.
- `QuizAttempt`, `UserAnswer`: lần làm bài và câu trả lời.
- `JLPTExam`, `JLPTSection`, `JLPTSectionQuestion`: đề JLPT và section.
- `ReadingPassage`: bài đọc dùng cho JLPT/reading question.
- `CourseEnrollment`, `UserLessonProgress`: ghi danh và tiến độ học.
- `Purchase`, `PaymentTransaction`: mua khóa học và giao dịch thanh toán.
- `CourseRating`: đánh giá khóa học.
- `FlashcardCollection`, `Flashcard`: bộ flashcard và thẻ.
- `Certificate`: chứng chỉ.
- `StudySession`: thời lượng học.
- `LearningGoal`, `GoalProgress`: mục tiêu học tập.

Database config:

- Ưu tiên `DATABASE_URL` nếu có.
- Nếu không có, dùng `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`.
- `DB_SSL=true|1|require` bật SSL với `rejectUnauthorized: false`.
- Fallback local: user/password `postgres`, host `localhost`, port `5432`, database `DATN_JPMaster`.

## 6. Nghiệp vụ chính

### Người dùng và xác thực

- Learner đăng ký bằng email/password hoặc Google login.
- User đăng nhập nhận JWT.
- User có thể xem/cập nhật profile của chính mình.
- Admin/owner quản lý user qua admin dashboard.
- User public read không được trả `password_hash`.

### Khóa học và bài học

- Public catalog/explore chỉ nên hiển thị course có ít nhất một lesson active.
- Admin vẫn thấy course chưa có lesson để biên tập.
- Course có lesson, cover asset/image, level, price, final quiz.
- Learner enroll khóa miễn phí trực tiếp hoặc mua khóa trả phí qua payment flow.
- Lesson page hỗ trợ học nội dung, media, tạo flashcard từ text được bôi đen và quiz của lesson.

### Ghi danh và tiến độ

- Enrollment có trạng thái `active`, `completed`, `dropped`.
- User có danh sách khóa đang học/đã hoàn thành/đã bỏ.
- Mark lesson started/completed cập nhật `UserLessonProgress`.
- Completion của khóa phụ thuộc hoàn thành lesson và điều kiện final quiz.
- Enrollment đã `completed` nhưng final quiz chưa pass được tính effective status là `active` trong logic access/completion.

### Quiz khóa học

- Có lesson quiz và final test.
- User start attempt rồi submit answers.
- Grading tách helper thuần trong backend để dễ test.
- Lesson completion có thể bị chặn bởi lesson quiz gate.
- Course completion có thể yêu cầu pass final quiz.

### JLPT

- Public list đề JLPT, xem chi tiết đề, làm bài và submit.
- Đề gồm nhiều section: vocabulary, grammar, reading, listening.
- Admin quản lý exam, section, reading passage, question.
- Admin có chức năng auto add JLPT questions cho vocabulary/grammar theo owner, level, difficulty, options hợp lệ và tránh chọn ngẫu nhiên bằng `ORDER BY RANDOM()`.

### Flashcards

- User tạo collection private/public.
- Public collection có thể cho user khác đọc.
- Card thuộc collection, có front/back, reading, example, image/audio, tags.
- Owner mới được tạo/sửa/xóa collection/card của mình.
- Lesson page có thể tạo flashcard từ selected text.
- Flashcard detail có study panel và AI assistant.

### Thanh toán và purchase

- PayOS flow tạo purchase/payment transaction cho khóa trả phí.
- Có checkout URL/QR, status polling, confirm và webhook.
- Webhook xử lý idempotent qua model/service state.
- Paid webhook tạo/hoàn tất purchase và enrollment.
- Amount mismatch không được complete purchase.
- Backend có sweep định kỳ để mark expired transactions.

### Chứng chỉ

- User lấy certificate theo course khi đủ điều kiện.
- Frontend có preview, print style và download PDF.
- Backend lưu certificate code, course/user/enrollment metadata.

### Analytics và goals

- Profile page hiển thị tổng quan học tập, thời gian học, hiệu suất quiz/JLPT, tiến độ course.
- User tạo/cập nhật/xóa learning goals.
- Learning activity được ghi nhận khi hoàn thành lesson/quiz/JLPT theo flow liên quan.

### AI và assets

- AI assistant hỗ trợ flashcard qua `aiAPI`.
- Backend tách prompt builder, Gemini client và facade AI service.
- Upload asset qua Cloudinary, có public và admin upload route, giới hạn size bằng runtime config.

## 7. Luồng request mẫu

Public course list:

```text
GET /api/courses
  -> routes/courses/course.routes.ts
  -> controllers/courses/course.controller.ts
  -> services/courses/course.service.ts
  -> models/courses/course.model.ts
  -> PostgreSQL
```

Lesson completion:

```text
PUT /api/enrollments/course/:courseId/lessons/:lessonId/complete
  -> authMiddleware
  -> enrollment.controller.ts
  -> enrollment.service.ts
  -> enrollmentCompletion.service.ts
  -> enrollment/course/quiz/progress models
  -> PostgreSQL
```

Payment webhook:

```text
POST /api/payments/webhooks/payos
  -> payment.controller.ts
  -> paymentWebhook.service.ts
  -> payment/purchase/enrollment models
  -> transaction
```

Admin JLPT auto add:

```text
POST /api/admin/jlpt-sections/:sectionId/questions/auto
  -> adminMiddleware
  -> admin/jlpt.controller.ts
  -> admin/jlpt.service.ts
  -> admin/jlptQuestion.service.ts
  -> admin JLPT models
```

## 8. Quy ước phát triển

- Giữ phân tầng backend: controller không query DB trực tiếp, model không xử lý HTTP, service quyết định lỗi nghiệp vụ.
- Transaction chỉ nên đi qua `databaseService.withTransaction`.
- Dynamic SQL phải dùng helper/whitelist như `WhereBuilder`, `buildUpdateSet`, `orderByWhitelist`.
- Public query user không được select/trả `password_hash`.
- Query course user-facing cần tôn trọng rule course có active lesson.
- Logging dùng `utils/logger.ts`.
- Frontend page nên chỉ compose route params, hook và component; logic data/action đặt trong hooks.
- Component không nên tự gọi API trừ widget độc lập có lý do rõ.
- API client frontend hiện tập trung trong `services/api.ts`; khi tách file phải giữ API object/contract hoặc cập nhật toàn bộ import.
- Không revert file dirty hoặc thay đổi không liên quan nếu không được yêu cầu.

## 9. Biến môi trường đáng chú ý

Backend:

- `DATABASE_URL`
- `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_SSL`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `CORS_ORIGINS`, `FRONTEND_URL`
- `JSON_BODY_LIMIT`
- `MAX_UPLOAD_FILE_SIZE_MB`
- `SERVER_REQUEST_TIMEOUT_MS`, `SERVER_HEADERS_TIMEOUT_MS`
- Cloudinary config theo service assets.
- PayOS config theo service payments.
- Gemini/AI config theo service AI.

Frontend:

- `VITE_API_BASE_URL`

Trong production, backend yêu cầu cấu hình CORS/frontend URL rõ ràng thay vì fallback localhost.

## 10. Suggested first reads

Nếu mới vào project, nên đọc theo thứ tự:

1. `PROJECT_OVERVIEW.md`
2. `apps/frontend/src/App.tsx`
3. `apps/frontend/src/services/api.ts`
4. `apps/backend/src/app.ts`
5. `apps/backend/src/config/runtime.ts`
6. `apps/backend/src/config/database.ts`
7. `apps/backend/src/config/erd.sql`
8. `docs/FRONTEND_ARCHITECTURE.md`
9. `docs/backend-refactor-report.md`

## 11. Điểm cần chú ý khi bảo trì

- `apps/frontend/src/services/api.ts` là file lớn và chứa nhiều type trùng/logic request; nên tách theo domain khi có thời gian.
- `AdminDashboard` và các hook admin vẫn là vùng orchestration lớn, cần cẩn thận khi sửa nhiều domain cùng lúc.
- Backend đã có nhiều facade model/service để giữ import cũ; khi tách tiếp nên giữ facade nếu có thể.
- Integration test cần DB test riêng và có guard chống chạy nhầm DB thật.
- Các file SQL dump ở root có dung lượng lớn; không sửa nếu không thật sự cần cập nhật dữ liệu/schema.
