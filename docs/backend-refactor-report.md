# Backend Refactor Report

Last updated: 2026-05-27

## Muc Dich

Tai lieu nay la ban tong quan de doc hieu backend nhanh:

- Backend dang to chuc theo kieu gi.
- Request di qua nhung layer nao.
- Moi folder/file chiu trach nhiem gi.
- Cac rule nghiep vu quan trong nam o dau.
- Cac convention can giu khi tiep tuc refactor.
- Cach chay typecheck/test de dam bao khong vo logic.

Tai lieu nay dong thoi ghi lai cac dot refactor da lam de lan lam viec tiep theo co the tiep tuc dung mach ma khong phai review lai tu dau.

## Kien Truc Tong Quan

Backend hien di theo **layered MVC + domain subfolders**:

```text
routes -> controllers -> services -> models -> database
```

Vai tro tung layer:

- `routes/<domain>/`: khai bao endpoint, gan middleware/auth, boc handler bang `asyncHandler`.
- `controllers/<domain>/`: parse `params/query/body`, lay user tu request neu can, goi service, tra HTTP response bang helper `ok/created/paginated/message`.
- `services/<domain>/`: chua business logic, validate nghiep vu, check quyen, map loi sang `ApiError`.
- `models/<domain>/`: chua SQL/query DB, transaction, format row, tra `data/null/boolean`.
- `validators/`: parse/validate input co the tai su dung.
- `utils/`: helper HTTP, logger, admin context.
- `config/`: DB config, env/runtime config, `erd.sql`.

Nguyen tac quan trong:

- Controller khong nen query DB truc tiep.
- Model khong nen biet HTTP status hay nem `ApiError` cho business case thong thuong.
- Service la noi quyet dinh 400/403/404/409.
- Transaction chi di qua `databaseService.withTransaction`.
- Dynamic SQL phai dung helper/whitelist, khong noi chuoi input client vao SQL.

## Cau Truc Folder Hien Tai

Source chinh nam tai `apps/backend/src`.

```text
src/
  app.ts
  config/
  constants/
  middlewares/
  utils/
  validators/

  routes/
    admin/
    courses/
    enrollments/
    jlpt/
    ...

  controllers/
    admin/
    courses/
    enrollments/
    jlpt/
    ...

  services/
    admin/
    courses/
    enrollments/
    jlpt/
    payments/
    users/
    database.service.ts
    ...

  models/
    admin/
    courses/
    enrollments/
    jlpt/
    payments/
    users/
    admin.model.ts
    sqlHelpers.ts
    modelAssertions.ts
    integrationTest.helpers.ts
    ...
```

`controllers/` va `routes/` khong con file le top-level. `services/` chi giu `database.service.ts` o root vi day la ha tang dung chung. `models/` giu mot so file shared/root:

- `admin.model.ts`: type dung chung cho admin domain.
- `sqlHelpers.ts`: helper SQL chung.
- `modelAssertions.ts`: helper invariant insert/update phai tra row.
- `integrationTest.helpers.ts`: guard va wrapper cho integration test.

## Flow Request Chuan

Vi du public course list:

```text
GET /api/courses
  -> routes/courses/course.routes.ts
  -> controllers/courses/course.controller.ts
  -> services/courses/course.service.ts
  -> models/courses/course.model.ts facade
  -> models/courses/courseCatalog.list.model.ts / courseExplore.model.ts
  -> services/database.service.ts
  -> PostgreSQL
```

Vi du admin JLPT auto add question:

```text
POST /api/admin/jlpt-sections/:sectionId/questions/auto
  -> routes/admin/jlpt.routes.ts
  -> controllers/admin/jlpt.controller.ts
  -> services/admin/jlpt.service.ts facade
  -> services/admin/jlptQuestion.service.ts
  -> models/admin/jlpt.model.ts facade
  -> models/admin/jlptQuestions.auto.model.ts
  -> models/admin/jlptQuestions.autoCandidates.model.ts
  -> databaseService.withTransaction
```

Vi du enrollment lesson completion:

```text
POST /api/enrollments/courses/:courseId/lessons/:lessonId/complete
  -> routes/enrollments/enrollment.routes.ts
  -> controllers/enrollments/enrollment.controller.ts
  -> services/enrollments/enrollment.service.ts
  -> services/enrollments/enrollmentCompletion.service.ts
  -> models/enrollments/*
  -> models/courses/*
  -> models/quizzes/*
```

## Domain Chinh Va Logic Nghiep Vu

### Users/Auth

Vi tri:

- `controllers/users`
- `routes/users`
- `services/users`
- `models/users`

Logic chinh:

- Public register tao role `learner`, khong nhan role tu client.
- Public user reads/update khong tra `password_hash`.
- Auth lookup moi duoc lay `UserWithPassword`.
- JWT secret bat buoc, khong fallback secret mac dinh.

### Courses

Vi tri:

- `controllers/courses`
- `routes/courses`
- `services/courses`
- `models/courses`

Logic chinh:

- Public/user-facing course reads chi hien course co it nhat mot lesson active.
- Admin/dashboard course list van thay course chua co lesson.
- Rule visibility dung helper `models/courses/courseVisibility.helpers.ts`.
- `course.model.ts` va `course.read.model.ts` la facade, bind sang detail/list/write/progress/lesson models.
- Public course detail khong tra course neu course chua co lesson active.

### Enrollments

Vi tri:

- `controllers/enrollments`
- `routes/enrollments`
- `services/enrollments`
- `models/enrollments`

Logic chinh:

- `enrollmentAccess.service.ts`: access guard va effective status.
- `enrollmentCompletion.service.ts`: lesson completion, lesson quiz gate, final quiz gate, update completion.
- Enrollment `completed` nhung final quiz chua pass duoc tinh effective la `active`.
- Course da xoa hoac khong public-visible se khong con hien trong user-facing enrollment list.

### Quizzes

Vi tri:

- `controllers/quizzes`
- `routes/quizzes`
- `services/quizzes`
- `models/quizzes`

Logic chinh:

- Submit quiz tach grading pure helper:
  - `quiz.grading.ts`
  - `quizAnswerRows.ts`
  - `quizSubmit.persistence.ts`
- Lesson quiz/final quiz lookup va attempt state tach trong read/state/lookup models.
- Grading co regression test khong dung DB.

### JLPT

Vi tri:

- Public JLPT: `controllers/jlpt`, `routes/jlpt`, `services/jlpt`, `models/jlpt`.
- Admin JLPT: `controllers/admin`, `routes/admin`, `services/admin`, `models/admin`.

Logic chinh:

- JLPT submit tach grading pure helper:
  - `jlptExam.grading.ts`
  - `jlptAnswerRows.ts`
  - `jlptExamSubmit.persistence.ts`
- Admin JLPT service la facade:
  - `jlptExam.service.ts`
  - `jlptReadingPassage.service.ts`
  - `jlptSection.service.ts`
  - `jlptQuestion.service.ts`
- Auto add JLPT question:
  - Chi support `vocabulary` va `grammar`.
  - Giu filter owner, section type, JLPT level, difficulty, question chua co trong section, co correct option, it nhat 2 options.
  - Khong dung `ORDER BY RANDOM()`.
  - Uu tien cau hoi it duoc dung hon qua `jlptQuestions.autoCandidates.model.ts`.

### Payments/Purchases

Vi tri:

- `controllers/payments`, `routes/payments`, `services/payments`, `models/payments`.
- `controllers/purchases`, `routes/purchases`, `services/purchases`, `models/purchases`.

Logic chinh:

- Payment service tach checkout/status/webhook/helper.
- Webhook payment dam bao idempotent qua transaction/model state helpers.
- Paid webhook tao enrollment/purchase theo flow da test.
- Amount mismatch khong complete purchase.

### Flashcards

Vi tri:

- `controllers/flashcards`
- `routes/flashcards`
- `services/flashcards`
- `models/flashcards`

Logic chinh:

- Collection public cho user khac doc.
- Create/update/delete card bat buoc owner collection.
- Card model tach read/write/facade.

### Lesson Notes

Vi tri:

- `controllers/lesson-notes`
- `routes/lesson-notes`
- `services/lesson-notes`
- `models/lesson-notes`

Logic chinh:

- Duplicate scoped note dung `INSERT ... ON CONFLICT ... DO UPDATE`.
- Text note/AI summary/question note/video timestamp/highlight co unique partial index trong `erd.sql`.

### Assets/Cloudinary

Vi tri:

- `controllers/assets`
- `routes/assets`
- `services/assets`
- `models/assets`

Logic chinh:

- Cloudinary service la facade.
- Upload/delete/helper da tach:
  - `cloudinaryUpload.service.ts`
  - `cloudinaryDelete.service.ts`
  - `cloudinary.helpers.ts`
- Upload route co limit runtime config.

## Quy Tac Query Va Database

- Dung PostgreSQL qua `pg`.
- Query thuong di qua `databaseService.executeQuery`.
- Transaction di qua `databaseService.withTransaction`.
- Khong dung transaction primitive ngoai `database.service.ts`.
- Dynamic filter/sort nen dung:
  - `WhereBuilder`
  - `buildUpdateSet`
  - `orderByWhitelist`
  - `withLimitOffset`
- Public query khong SELECT `password_hash`.
- Query user-facing course phai ton trong rule active lesson.

Index da them gan day:

- `idx_blog_public_published`
- `idx_course_rating_course_created`
- `idx_quiz_attempt_user_quiz_status_submitted`
- `idx_question_auto_jlpt_bank`
- `idx_jlpt_section_question_active_question`
- `idx_lesson_active_course`

Neu DB that da ton tai, can chay `CREATE INDEX IF NOT EXISTS ...` rieng; sua `erd.sql` khong tu migrate DB that.

## Error, Logging, Runtime Config

- `utils/http.ts` gom:
  - `ApiError`
  - `asyncHandler`
  - response helpers: `ok`, `created`, `message`, `paginated`
  - `requireUser`
- Error middleware an loi 5xx trong production nhung van log raw error server-side.
- Logger duy nhat la `utils/logger.ts`; khong dung `console.*` truc tiep ngoai logger.
- Runtime config nam trong `config/runtime.ts`:
  - CORS origins
  - frontend URL
  - JSON body limit
  - upload file size
  - request/header timeout
  - JWT expires in

## Test Va Lenh Can Biet

Chay trong `apps/backend`.

Typecheck:

```bash
pnpm exec tsc --noEmit
```

Regression test khong dung DB:

```bash
pnpm run test:regression
```

Integration test mac dinh skip neu khong set env:

```bash
pnpm run test:integration
```

Chay integration that voi PostgreSQL test DB tren PowerShell:

```powershell
$env:DB_NAME="DATN_JPMaster_test"
$env:RUN_INTEGRATION_TESTS="1"
pnpm run test:integration
```

Guard integration test:

- Mac dinh tu choi chay neu `DB_NAME` khong co chu `test`.
- Chi set `ALLOW_NON_TEST_DB_INTEGRATION=1` khi co chu y ro rang.

Trang thai gan nhat:

- `pnpm exec tsc --noEmit`: pass.
- `pnpm run test:regression`: pass 14/14.
- Integration voi `DB_NAME=DATN_JPMaster_test`, `RUN_INTEGRATION_TESTS=1`: pass 37/37.

## Checklist Khi Sua Backend

1. Xac dinh domain va layer can sua.
2. Controller chi parse request/response.
3. Service xu ly business rule va `ApiError`.
4. Model chi query DB, tra `data/null/boolean`.
5. Neu them dynamic SQL, dung helper/whitelist.
6. Neu them transaction, dung `databaseService.withTransaction`.
7. Neu query public user, khong tra `password_hash`.
8. Neu query course cho user, can ap dung visibility rule co active lesson.
9. Chay:

```bash
pnpm exec tsc --noEmit
pnpm run test:regression
```

10. Neu doi query/logic DB, chay integration test that voi DB test.

## Nguyen Tac Refactor Dang Ap Dung

- Giu nguyen logic nghiep vu va public API hien co.
- Uu tien refactor an toan: tach file lon thanh facade + model/service con, khong doi import cua service/controller neu khong can.
- Cau truc source hien giu layered MVC, nhung moi layer chia subfolder theo domain de de review:
  - `controllers/<domain>/`
  - `routes/<domain>/`
  - `services/<domain>/`
  - `models/<domain>/`
  - Cac file ha tang/shared nhu `database.service.ts`, `admin.model.ts`, `modelAssertions.ts`, `sqlHelpers.ts`, `integrationTest.helpers.ts` van o root layer.
- Controller chi parse request, goi service va tra response.
- Service chiu trach nhiem business decision va map loi nghiep vu sang `ApiError`.
- Model chiu trach nhiem truy van DB, tra `data/null/boolean`; han che nem loi nghiep vu.
- Transaction chi nen di qua `databaseService.withTransaction`.
- Dynamic SQL phai qua helper/whitelist nhu `WhereBuilder`, `buildUpdateSet`, `orderByWhitelist`.
- Logging di qua `utils/logger.ts`, khong dung `console.*` truc tiep ngoai logger.
- Sau moi dot refactor chay `npm exec tsc -- --noEmit` trong `apps/backend`.

## Cong Viec Da Refactor

### Cau Truc Folder Theo Domain

- Da gom file trong cac layer lon theo domain:
  - `controllers/achievements`, `controllers/courses`, `controllers/enrollments`, `controllers/jlpt`, ...
  - `routes/achievements`, `routes/courses`, `routes/enrollments`, `routes/jlpt`, ...
  - `services/achievements`, `services/courses`, `services/enrollments`, `services/jlpt`, ...
  - `models/achievements`, `models/courses`, `models/enrollments`, `models/jlpt`, ...
- `controllers/` va `routes/` khong con file le top-level.
- `services/` chi con `database.service.ts` o top-level vi day la ha tang dung chung.
- `models/` chi giu cac file shared/root:
  - `admin.model.ts`
  - `integrationTest.helpers.ts`
  - `modelAssertions.ts`
  - `sqlHelpers.ts`
- Logic nghiep vu khong doi; import relative da duoc update theo folder moi.

### Controller va Route Boundary

- Da chuyen nhieu controller sang pattern service + `asyncHandler`.
- Da bo phan lon `try/catch next(error)` lap lai trong controller.
- Cac route chinh va admin route da duoc boc `asyncHandler`.
- Controller hien tai mong hon, business decision da day sang service.

### Transaction

- Da gom transaction thu cong ve `database.service.ts`.
- Cac model/admin model truoc day co `pool.connect`, `BEGIN`, `ROLLBACK`, `COMMIT` da duoc refactor sang `databaseService.withTransaction`.
- Scan hien tai chi con transaction primitive trong `apps/backend/src/services/database.service.ts`, dung vai tro ha tang.

### Logging va HTTP Helper

- Them `apps/backend/src/utils/logger.ts`.
- Them `apps/backend/src/utils/http.ts` gom `ApiError`, `asyncHandler`, `ok`, `created`, `message`, `paginated`, `requireUser`.
- `console.*` chi con trong `utils/logger.ts`.

### SQL Helper

- Them `apps/backend/src/models/sqlHelpers.ts`:
  - `withLimitOffset`
  - `orderDirection`
  - `orderByWhitelist`
  - `buildUpdateSet`
  - `WhereBuilder`
- Admin helper `adminModelHelpers.ts` re-export cac helper can dung.
- Da thay nhieu dynamic `where.join` bang `WhereBuilder`.
- Da thay mot so manual update builder bang `buildUpdateSet`.

### Model Lon Da Tach Thanh Facade

Nhung file goc van ton tai de giu import cu, nhung chi con la facade bind sang cac model con.

- `enrollment.model.ts`
  - `enrollment.types.ts`
  - `enrollment.statusSql.ts`
  - `enrollment.read.model.ts`
  - `enrollmentList.model.ts`
  - `enrollmentLookup.model.ts`
  - `enrollmentEffectiveStatus.model.ts`
  - `enrollmentRead.helpers.ts`
  - `enrollment.write.model.ts`
  - `enrollment.progress.model.ts`

- `course.model.ts`
  - `course.types.ts`
  - `course.detail.model.ts`
  - `course.list.model.ts`
  - `courseLessons.list.model.ts`
  - `courseCatalog.list.model.ts`
  - `courseExplore.model.ts`
  - `courseCreator.model.ts`
  - `course.read.model.ts`
  - `course.write.model.ts`
  - `course.progress.model.ts`
  - `course.lesson.model.ts`

- `quiz.model.ts`
  - `quiz.types.ts`
  - `quiz.detail.model.ts`
  - `quiz.lookup.model.ts`
  - `quiz.state.model.ts`
  - `quiz.read.model.ts`
  - `quiz.attempt.model.ts`
  - `quiz.submit.model.ts`

- `flashcard.model.ts`
  - `flashcard.types.ts`
  - `flashcardCollection.model.ts`
  - `flashcardCollection.read.model.ts`
  - `flashcardCollection.write.model.ts`
  - `flashcardCollectionAccess.model.ts`
  - `flashcardCollection.helpers.ts`
  - `flashcardCard.model.ts`
  - `flashcardCard.read.model.ts`
  - `flashcardCard.write.model.ts`

- `jlptExam.model.ts`
  - `jlptExam.types.ts`
  - `jlptExam.read.model.ts`
  - `jlptExam.list.model.ts`
  - `jlptExam.detail.model.ts`
  - `jlptExam.submit.model.ts`

- `lessonNote.model.ts`
  - `lessonNote.types.ts`
  - `lessonNote.read.model.ts`
  - `lessonNote.write.model.ts`

- `payment.model.ts`
  - `payment.types.ts`
  - `payment.read.model.ts`
  - `payment.write.model.ts`

- `rating.model.ts`
  - `rating.types.ts`
  - `rating.read.model.ts`
  - `ratingCourse.read.model.ts`
  - `ratingLookup.model.ts`
  - `ratingMarketing.model.ts`
  - `rating.write.model.ts`

- `analytics.model.ts`
  - `analytics.summary.model.ts`
  - `analytics.study.model.ts`
  - `analytics.performance.model.ts`

- Admin question/blog model:
  - `admin/quizQuestions.model.ts`
  - `admin/quizQuestions.read.model.ts`
  - `admin/quizQuestions.write.model.ts`
  - `admin/jlptQuestions.model.ts`
  - `admin/jlptQuestions.read.model.ts`
  - `admin/jlptQuestions.write.model.ts`
  - `admin/jlptQuestions.auto.model.ts`
  - `admin/jlptQuestions.auto.types.ts`
  - `admin/jlptQuestions.auto.helpers.ts`
  - `admin/jlptQuestions.autoCandidates.model.ts`
  - `admin/blogs.model.ts`
  - `admin/blogs.read.model.ts`
  - `admin/blogs.write.model.ts`
  - `admin/blogs.helpers.ts`
  - `admin/quizzes.model.ts`
  - `admin/quizzes.read.model.ts`
  - `admin/quizzes.write.model.ts`
  - `admin/quizzes.helpers.ts`
  - `admin/jlptExams.model.ts`
  - `admin/jlptExams.read.model.ts`
  - `admin/jlptExams.write.model.ts`
  - `admin/jlptExams.helpers.ts`
  - `admin/lessons.model.ts`
  - `admin/lessons.read.model.ts`
  - `admin/lessons.write.model.ts`
  - `admin/lessons.delete.model.ts`
  - `admin/lessons.helpers.ts`
  - `admin/courses.model.ts`
  - `admin/courses.read.model.ts`
  - `admin/courses.write.model.ts`
  - `admin/courses.delete.model.ts`
  - `admin/courses.helpers.ts`
  - `admin/questionMutation.helpers.ts`

### Helper/Service Tach Them

- Them `models/modelAssertions.ts` voi `assertReturnedRow` de chuan hoa invariant insert/upsert bat buoc tra row.
- `purchase.model.ts`, `enrollment.write.model.ts`, `certificate.model.ts` da dung `assertReturnedRow`.
- Them `services/enrollmentAccess.service.ts` cho access guard/effective status.
- Them `services/enrollmentEnrichment.service.ts` cho enrichment enrollment list.
- Them `services/enrollmentCompletion.service.ts` cho lesson quiz gate/final quiz gate/record learning activity.
- `enrollment.service.ts` van giu public method/facade hien co, nhung da mong hon.
- `services/admin/jlpt.service.ts` da thanh facade cho:
  - `services/admin/jlptExam.service.ts`
  - `services/admin/jlptReadingPassage.service.ts`
  - `services/admin/jlptSection.service.ts`
  - `services/admin/jlptQuestion.service.ts`
- `services/user.service.ts` da thanh facade cho:
  - `services/userAuth.service.ts`
  - `services/userProfile.service.ts`
  - `services/user.helpers.ts`
  - Public facade hien chi expose auth va `/me`; cac method admin-like da bo khoi `user.service.ts`, `user.controller.ts`, `userProfile.service.ts`.
- `user.model.ts` da thanh facade cho:
  - `user.types.ts`
  - `userAuth.model.ts`
  - `userPublic.model.ts`
  - Cac read public khong SELECT `password_hash`; chi auth email lookup/create moi tra `UserWithPassword`.
- `services/flashcard.service.ts` da thanh facade cho:
  - `services/flashcardCollection.service.ts`
  - `services/flashcardCard.service.ts`
  - `services/flashcard.helpers.ts`
- `services/cloudinary.service.ts` da tach helper:
  - `services/cloudinary.helpers.ts`
  - `services/cloudinaryUpload.service.ts`
  - `services/cloudinaryDelete.service.ts`
  - File goc van la facade, giu export `uploadBufferToCloudinary`, `deleteCloudinaryAsset`, `MediaKind`.
- `services/ai.service.ts` da thanh facade cho:
  - `services/ai.types.ts`
  - `services/aiPrompts.service.ts`
  - `services/geminiClient.service.ts`
- `services/learningActivity.service.ts` da tach:
  - `services/goalProgress.service.ts`
  - `services/achievementEvaluation.service.ts`
- `blog.model.ts` da thanh facade cho:
  - `blog.types.ts`
  - `blog.read.model.ts`
  - `blogCategory.model.ts`
- `services/payment.service.ts` da thanh facade cho:
  - `services/paymentCheckout.service.ts`
  - `services/paymentStatus.service.ts`
  - `services/paymentWebhook.service.ts`
  - `services/payment.helpers.ts`
- `purchase.model.ts` da thanh facade cho:
  - `purchase.types.ts`
  - `purchase.read.model.ts`
  - `purchase.write.model.ts`
  - `purchase.revenue.model.ts`
- `quiz.submit.model.ts` da tach grading pure helper:
  - `quiz.grading.ts`
  - `quizAnswerRows.ts`
  - `quizSubmit.persistence.ts`
  - `quiz.grading.test.ts`
- `jlptExam.submit.model.ts` da tach grading pure helper:
  - `jlptExam.grading.ts`
  - `jlptAnswerRows.ts`
  - `jlptExamSubmit.persistence.ts`
  - `jlptExam.grading.test.ts`
- `payment.write.model.ts` da thanh facade cho:
  - `payment.create.model.ts`
  - `payment.expiry.model.ts`
  - `payment.confirm.model.ts`
  - `payment.webhook.model.ts`
  - `paymentState.helpers.ts`
- Them script `pnpm run test:regression`, compile sang `dist-test` roi chay `node --test` cho `*.grading.test.ts` va `*.regression.test.ts`.
- Them regression test khong dung DB:
  - `services/admin/courses.service.regression.test.ts`
  - Check update course reject price am/khong phai so truoc khi goi DB.
  - `services/user.helpers.regression.test.ts`
  - Check `toPublicUser` loai bo `password_hash`.
- Them integration test scaffold skip mac dinh:
  - `integrationTest.helpers.ts`
  - `payment.integration.test.ts`
  - `quizSubmit.integration.test.ts`
  - `jlptExamSubmit.integration.test.ts`
  - `adminCourses.integration.test.ts`
    - Owner khong update duoc course cua owner khac.
    - Delete course soft-delete lessons/quizzes lien quan.
    - Owner khong tao duoc quiz tren course cua owner khac.
    - Owner khong reassign duoc quiz sang course cua owner khac.
    - Owner khong tao duoc lesson tren course cua owner khac.
    - Owner khong update duoc lesson cua owner khac.
    - Owner khong delete duoc lesson cua owner khac.
  - `adminJlpt.integration.test.ts`
    - Owner khong update duoc JLPT exam cua owner khac.
    - Owner khong delete duoc JLPT exam cua owner khac.
    - Owner khong tao duoc JLPT section tren exam cua owner khac.
    - Owner khong tao duoc question trong JLPT section cua owner khac.
    - Owner khong update/delete duoc reading passage cua owner khac.
    - Owner khong dung duoc reading passage cua owner khac de tao reading question.
    - Auto add JLPT questions khong dung `ORDER BY RANDOM()`; uu tien cau it duoc dung hon, van giu filter owner/section/level/difficulty/options.
  - `adminBlog.integration.test.ts`
    - Owner khong update duoc blog cua author khac.
    - Owner khong delete duoc blog cua author khac.
  - `userPublic.integration.test.ts`
  - `enrollmentAccess.integration.test.ts`
    - Access cua enrollment tren course da xoa.
    - Effective status cua enrollment completed nhung final quiz chua pass.
    - `markLessonCompleted` giu enrollment active khi final quiz chua pass.
    - `markLessonCompleted` complete enrollment khi da hoan thanh lesson va pass final quiz.
  - `lessonNote.integration.test.ts`
  - `flashcardCard.integration.test.ts`
    - Owner tao duoc flashcard trong collection cua minh.
    - User khong tao duoc flashcard trong collection cua user khac.
    - Public collection cho user khac doc flashcard.
    - User khong update duoc flashcard cua user khac.
    - Owner delete duoc flashcard cua minh.
  - `courseVisibility.integration.test.ts`
    - User-facing course reads an course khong co lesson active.
    - Course co lesson active van hien trong list/detail/creator list.
  - `services/admin/numericValidation.regression.test.ts`
    - Reject input numeric khong hop le truoc khi goi DB.
  - `pnpm run test:integration`
  - Chay that DB integration test bang cach set `RUN_INTEGRATION_TESTS=1`.
  - Guard mac dinh tu choi chay khi `DB_NAME` khong co chu `test`; chi override bang `ALLOW_NON_TEST_DB_INTEGRATION=1` khi co chu y ro rang.

### Security/Boundary Fix Da Lam

- `routes/user.routes.ts` da khoa lai public user surface:
  - Public chi con `google-login`, `login`, `me`, `update me`, `create learner`.
  - Public `GET/PUT/DELETE /api/users/:id` va `GET /api/users` da bi go khoi public route.
- Public register trong `userAuth.service.ts` luon tao role `learner`, khong nhan role tu client.
- `userProfile.service.ts` tra public user, khong tra `password_hash`.
- `userPublic.model.ts` khong SELECT `password_hash` cho `getUserById`, `getAllUsers`, update profile/admin update.
- `admin/users.service.ts` dung chung `toPublicUser` va check trung email khi update.
- `token.service.ts` da bo fallback `your_secret_key_here`; thieu `JWT_SECRET` se loi thay vi dung secret mac dinh.
- `app.ts` da them `express.json({ limit })` voi `JSON_BODY_LIMIT`, va CORS whitelist tu `CORS_ORIGINS`/`FRONTEND_URL` fallback localhost dev.
- Upload limit chuyen sang `MAX_UPLOAD_FILE_SIZE_MB`, default 50MB thay vi hard-code 200MB.
- Admin asset upload route da boc `asyncHandler`.
- Error middleware an message loi 5xx khi `NODE_ENV=production`, van log raw error server-side.
- `PaymentService` tao `orderCode` giam collision bang millisecond * 1000 + random suffix.
- Them `config/runtime.ts` de gom runtime config:
  - Them `config/env.ts` de load dotenv mot noi; `database.ts` va `runtime.ts` import env truc tiep thay vi phu thuoc thu tu import trong `app.ts`.
  - `CORS_ORIGINS`/`FRONTEND_URL` bat buoc trong production.
  - `FRONTEND_URL` bat buoc trong production cho payment redirect fallback.
  - `MAX_UPLOAD_FILE_SIZE_MB` phai la so duong.
  - `SERVER_REQUEST_TIMEOUT_MS` va `SERVER_HEADERS_TIMEOUT_MS` cau hinh duoc; headers timeout phai nho hon request timeout.
  - `JWT_EXPIRES_IN` cau hinh duoc, fallback `24h`.
- Admin course update da validate `price` la so khong am, dong nhat voi create.
- `lessonNote.write.model.ts` da doi create duplicate-scope tu read-before-insert sang `INSERT ... ON CONFLICT ... DO UPDATE`, giam race condition khi tao note dong thoi.
- Them integration scaffold cho LessonNote duplicate-scope upsert, bao ve case tao text note dong thoi chi con mot scoped row.
- `app.ts` da bo hard-code global timeout 10 phut; API thuong dung timeout ngan hon qua runtime config, upload route van giu timeout rieng 10 phut truoc `multer`.
- `erd.sql` da them composite index cho public blog listing va course rating listing:
  - `idx_blog_public_published`
  - `idx_course_rating_course_created`
- `erd.sql` da them composite index cho quiz attempt state/pass checks:
  - `idx_quiz_attempt_user_quiz_status_submitted`
  - Luu y DB da ton tai can chay lenh `CREATE INDEX` rieng hoac recreate schema tu `erd.sql`.
- `erd.sql` da them index ho tro auto add JLPT question thay cho `ORDER BY RANDOM()`:
  - `idx_question_auto_jlpt_bank`
  - `idx_jlpt_section_question_active_question`
  - Luu y DB that can chay `CREATE INDEX` rieng neu khong recreate schema.
- Public/user-facing course reads da chi hien course co it nhat mot lesson active:
  - Them `models/courseVisibility.helpers.ts` voi `activeCourseLessonExistsSql`.
  - Ap dung cho course catalog/explore/popular/detail/creator/enrollment list.
  - Admin/dashboard course list khong bi loc theo rule nay.
  - Them index `idx_lesson_active_course` trong `erd.sql`.
- Admin numeric validation da chuan hoa hon:
  - Them `requireFiniteNumber`, `optionalFiniteNumber`, `requirePositiveFiniteNumber`.
  - Ap dung cho quiz score/marks, lesson order index, JLPT section order.
- Blog schema da duoc coi la bat buoc theo `erd.sql`; da bo `hasBlogTable()` va bo behavior read tra `[]` khi thieu bang. Neu schema thieu, query se fail ro rang thay vi che loi deploy.

### Service Refactor Da Lam

- Da them service layer cho nhieu controller public/admin.
- `EnrollmentService.markLessonCompleted` da duoc tach helper:
  - `getLessonCompletionContext`
  - `getCourseCompletionState`
  - `completeEnrollmentIfEligible`
- Giu nguyen logic lesson quiz gate, final quiz gate, update enrollment completed va record learning activity.

### Mot So Fix Nghiep Vu Da Lam

- `quizService.getLessonQuiz` da check lesson/course access truoc khi tra quiz.
- `quiz.model` submit/start tra `null` khi quiz khong ton tai, service map thanh `ApiError`.
- Admin question option replace logic da gom vao helper rieng, giu behavior check learner answer.

## Trang Thai Hien Tai

### Typecheck

Lenh da dung truoc day:

```bash
cd apps/backend
npm exec tsc -- --noEmit
```

Lenh hien dang uu tien:

```bash
cd apps/backend
pnpm exec tsc --noEmit
```

Trang thai hien tai: pass.

Integration test that voi PostgreSQL test DB:

```bash
cd apps/backend
$env:DB_NAME="DATN_JPMaster_test"
$env:RUN_INTEGRATION_TESTS="1"
pnpm run test:integration
```

Trang thai gan nhat: pass 37/37, khong skip. Da sua integration seed de khop `erd.sql`:

- `Lesson` khong co cot `created_by`.
- `JLPTSection` khong co cot `created_at`.
- Username seed test phai ngan hon `VARCHAR(50)`.

Da xu ly loi thieu `apps/backend/src/controllers/enrollment.controller.ts`. File nay da duoc khoi phuc theo contract cua `enrollment.routes.ts` va `enrollment.service.ts`.

### Cac File Model Lon Hien Con

Theo scan gan nhat sau dot refactor 2026-05-27, cac file lon nhat con lai:

- `course.list.model.ts` da tach thanh facade/lessons/catalog/explore/creator.
- `rating.read.model.ts` da tach thanh facade/course lookup/marketing reviews.
- `admin/jlptExams.model.ts` da tach thanh facade/read/write/helper.
- `payment.write.model.ts` da tach thanh facade; state metadata da tach helper.
- `quiz.submit.model.ts` da dung `quiz.grading.ts`, `quizAnswerRows.ts` va `quizSubmit.persistence.ts`.
- `flashcardCollection.model.ts` ~5.7KB
- `payment.service.ts` da tach thanh facade.
- `jlptExam.submit.model.ts` da tach persistence helper.

Nhung file da giam dang ke:

- `admin/jlpt.service.ts` da tach thanh facade/service con.
- `admin/jlptExams.model.ts` da tach thanh facade/read/write/helper.
- `rating.read.model.ts` da tach thanh facade va cac model con:
  - `ratingCourse.read.model.ts`
  - `ratingLookup.model.ts`
  - `ratingMarketing.model.ts`
- `course.list.model.ts` da tach thanh facade va cac model con:
  - `courseLessons.list.model.ts`
  - `courseCatalog.list.model.ts`
  - `courseExplore.model.ts`
  - `courseCreator.model.ts`
- `flashcardCollection.model.ts` da tach thanh facade va cac model con:
  - `flashcardCollection.read.model.ts`
  - `flashcardCollection.write.model.ts`
  - `flashcardCollectionAccess.model.ts`
  - `flashcardCollection.helpers.ts`
- `admin/lessons.model.ts` da tach thanh facade va cac model con:
  - `admin/lessons.read.model.ts`
  - `admin/lessons.write.model.ts`
  - `admin/lessons.delete.model.ts`
  - `admin/lessons.helpers.ts`
- `admin/courses.model.ts` da tach thanh facade va cac model con:
  - `admin/courses.read.model.ts`
  - `admin/courses.write.model.ts`
  - `admin/courses.delete.model.ts`
  - `admin/courses.helpers.ts`
- `enrollment.read.model.ts` da tach thanh facade va cac model con:
  - `enrollmentList.model.ts`
  - `enrollmentLookup.model.ts`
  - `enrollmentEffectiveStatus.model.ts`
  - `enrollmentRead.helpers.ts`
- `enrollment.service.ts` con ~5.3KB.
- `user.service.ts` da tach thanh facade/service con.
- `flashcard.service.ts` va `flashcardCollection.model.ts` da tach thanh facade/module con.
- `flashcardCard.model.ts` da tach thanh facade/read/write:
  - `flashcardCard.read.model.ts`
  - `flashcardCard.write.model.ts`
- `jlptExam.read.model.ts` da tach thanh facade/list/detail:
  - `jlptExam.list.model.ts`
  - `jlptExam.detail.model.ts`
- `cloudinary.service.ts`, `ai.service.ts`, `learningActivity.service.ts`, `payment.service.ts`, `purchase.model.ts` da tach thanh module nho hon.

Trang thai cu truoc do:

- `admin/quizQuestions.write.model.ts` ~4-5KB sau khi tach helper
- `admin/jlptQuestions.write.model.ts` ~4-5KB sau khi tach helper
- `admin/quizzes.write.model.ts` thay cho `admin/quizzes.model.ts`
- `purchase.model.ts` ~6.7KB
- `course.list.model.ts` ~6.4KB
- `rating.read.model.ts` ~6.4KB
- `admin/jlptExams.model.ts` ~6.2KB
- `payment.write.model.ts` ~6KB
- `quiz.submit.model.ts` ~6KB

Trong do cac model write admin da nho hon file goc va typecheck pass. Neu muon tiep tuc, nen uu tien cac domain co test/regression ro hon thay vi tach qua manh.

### Worktree

Worktree hien co rat nhieu file modified/untracked do qua trinh refactor. Khong duoc revert hang loat. Neu can tiep tuc, doc file hien tai va lam viec tren state dang co.

## Van De Chua Giai Quyet

### 1. Model Write Con Co The Tach Helper Them

Mot so huong co the tiep tuc neu can:

Huong tiep theo:

- `payment.write.model.ts`, `quiz.submit.model.ts`, `jlptExam.submit.model.ts` da tach helper/persistence va co test scaffold bao ve.
- `admin/jlptExams.model.ts` da tach read/write/helper, giu nguyen ownership/delete behavior.
- `course.list.model.ts`, `flashcardCollection.model.ts`, `admin/lessons.model.ts`, `admin/courses.model.ts`, `enrollment.read.model.ts` da tach thanh facade/module con.
- Nen uu tien bo sung integration test cho enrollment/access/admin ownership thay vi tiep tuc tach file nho.
- Da hardening mot phan production config va validate admin course price.
- Da them coverage cho admin course price validation va admin course owner-scope/delete cascade scaffold.
- Da them coverage cho user public read/update khong tra `password_hash`.
- Da them integration scaffold cho enrollment access/effective status/completion:
  - Enrollment cua course da xoa khong con access.
  - Enrollment `completed` nhung final quiz chua pass duoc tinh effective la `active`.
  - Mark lesson completed khong complete enrollment neu final quiz chua pass.
  - Mark lesson completed complete enrollment khi da pass final quiz.

### 2. `purchase.model.ts` Con Generic Internal Error

Da bo nhieu `try/catch` wrap DB error trong `purchase.model.ts`.

Con lai:

- `throw new Error("Failed to create purchase record")` khi INSERT khong return row.

Huong tiep theo:

- Co the de lai vi day la invariant/internal error.
- Neu muon chuan hoa hon, tao helper `assertInserted(row, message)` dung chung cho model write.

### 3. Service Lon

Service/model lon con lai:

- Khong con file model/service qua lon trong nhom da review gan day; cac file con lon hon chu yeu la SQL/doc/test hoac domain doc.

Huong tiep theo:

- Payment service/model state, quiz submit va JLPT submit da co facade/helper rieng va typecheck pass.
- Neu muon tiep tuc, nen chuyen trong tam sang test coverage va production config hardening.

### 4. Error Boundary Chua Hoan Toan Dong Nhat

Con `try/catch` hop ly trong:

- auth middleware
- token service
- user service verify Google
- payment service webhook/payment flow
- cloudinary service
- ai service
- database service

Can phan biet:

- `try/catch` co business mapping sang `ApiError`: co the giu.
- `try/catch` chi wrap lai DB error/generic error: nen bo hoac chuan hoa.

### 5. Index DB Can Can Nhac

`erd.sql` da co nhieu index. Da them:

- `CourseRating(course_id, created_at DESC)`
- `Blog(status, deleted_at, published_at DESC)`

Van co the can nhac them neu workload thuc te can:

- `QuizAttempt(user_id, quiz_id, status, submitted_at)`
- `CourseEnrollment(user_id, course_id, status)`

Can xem workload thuc te truoc khi them migration/index.

## Huong Lam Viec Tiep Theo De Xuat

1. Chay typecheck de xac nhan state truoc khi sua:

```bash
cd apps/backend
pnpm exec tsc --noEmit
pnpm run test:regression
pnpm run test:integration
```

Neu can chay integration test that voi DB:

```bash
cd apps/backend
RUN_INTEGRATION_TESTS=1 pnpm run test:integration
```

Database nen la DB test rieng co `DB_NAME` chua chu `test`. Neu bat buoc chay tren DB khac, set them `ALLOW_NON_TEST_DB_INTEGRATION=1` de xac nhan day la thao tac co chu y.

2. Neu tiep tuc:

- Bo sung integration test cho enrollment completion service gate neu can test side effect day du.
- Bo sung integration test cho admin ownership delete/update flow.
- Bo sung integration test cho enrollment completion/access gate.

3. Sau moi buoc:

```bash
cd apps/backend
pnpm exec tsc --noEmit
```

4. Quet nhanh:

```bash
rg -n "pool\.connect|BEGIN|ROLLBACK|COMMIT" apps/backend/src/models apps/backend/src/services
rg -n "console\." apps/backend/src
rg -n "where\.join|const where: string\[\]" apps/backend/src/models
rg -n "your_secret_key_here|app\.use\(cors\(\)\)|MAX_UPLOAD_FILE_SIZE_MB = 200" apps/backend/src
```

## Luu Y Cho AI Tiep Theo

- Khong revert cac file dirty neu khong duoc yeu cau.
- Khong doi import public cua service/controller neu co the giu facade.
- Khi tach model, copy logic y nguyen truoc, chay typecheck, sau do moi cleanup helper.
- Han che refactor dong thoi nhieu domain trong cung mot buoc.
- Neu them file moi, dung pattern facade nhu cac dot da lam.
- Moi thay doi nen giu behavior API/response nhu cu.
