# JPMaster Frontend Architecture

Tài liệu này tóm tắt cấu trúc tổ chức và luồng logic chính của frontend sau các đợt refactor. Mục tiêu là giúp người mới đọc code nhanh hơn, đồng thời giữ các refactor tiếp theo nhất quán.

## Tổng quan

Frontend nằm tại `apps/frontend`, dùng React, TypeScript, Vite, Tailwind CSS và React Router. Một số form đã dùng `react-hook-form` kết hợp validation dùng lại trong `src/utils/formValidation.ts`.

Triết lý tổ chức hiện tại:

- `pages/`: chỉ nên đóng vai trò compose page, nối route params, hook và component.
- `components/`: chứa UI theo domain hoặc UI dùng chung.
- `hooks/`: chứa data loading, action handlers, derived state và orchestration.
- `services/`: chứa lớp gọi API và type response/request.
- `contexts/`: chứa state toàn cục như auth và toast.
- `utils/`: chứa helper thuần, validation, formatter dùng lại.

## Cấu trúc thư mục chính

```txt
src/
  assets/        Static assets.
  components/    UI components, chia theo domain và shared UI.
  contexts/      React contexts: auth, toast.
  hooks/         Custom hooks theo domain.
  layouts/       Layout-level components nếu cần.
  pages/         Route-level components.
  services/      API clients và shared API types.
  styles/        Global style modules.
  utils/         Validation/helper dùng chung.
```

## Quy ước phân tầng

### Page Layer

Page nằm trong `src/pages`. Sau refactor, nhiều page đã được rút gọn để chỉ:

1. Đọc route params hoặc navigate.
2. Gọi hook controller/data.
3. Xử lý loading/error guard cấp page.
4. Render các section/component theo domain.

Ví dụ kiểu tổ chức mong muốn:

```tsx
export default function SomePage() {
  const navigate = useNavigate();
  const controller = useSomePageController();

  return (
    <PageShell>
      <SomeHero />
      <SomeContent data={controller.data} onAction={controller.handleAction} />
    </PageShell>
  );
}
```

Page không nên chứa:

- Fetch API dài.
- Filter/sort phức tạp.
- Form state chi tiết.
- JSX section quá dài.
- Helper formatter dùng lại được.

### Component Layer

Component nằm trong `src/components`. Có hai nhóm chính:

- Shared UI: `ui/`, `cards/`, `questions/`, `Pagination`, `Header`, `Footer`.
- Domain UI: `admin/`, `lesson/`, `course/`, `courseExplore/`, `flashcards/`, `jlpt/`, `profile/`, `notes/`, `blog/`, `testList/`, `certificate/`, `quiz/`.

Component nên nhận props rõ ràng và hạn chế tự gọi API. Nếu component cần action, truyền callback từ hook/page xuống.

Ví dụ:

```tsx
<CourseExploreGrid
  courses={filteredCourses}
  onCourseClick={handleCourseClick}
/>
```

### Hook Layer

Hook nằm trong `src/hooks`, chia theo domain. Sau refactor, hook thường rơi vào 3 nhóm:

- Data hook: load dữ liệu, loading/error, refresh.
- Action hook: create/update/delete/submit/navigation side effects.
- Controller hook: compose nhiều hook nhỏ cho một page/feature.

Ví dụ:

```txt
hooks/course/
  useCourseDetailData.ts
  useCourseEnrollmentActions.ts
  useCourseExploreData.ts
  useCourseExploreFilters.ts
  useCoursePayment.ts
```

Quy tắc quan trọng:

- Dependency của `useEffect` phải ổn định. Tránh phụ thuộc vào object được tạo mới mỗi render.
- Nếu truyền toast/action object vào hook, ưu tiên truyền function memoized hoặc memoize object trong hook nguồn.
- Không đặt quá nhiều domain vào một hook nếu chúng có lifecycle/filter/action khác nhau.

### Service Layer

API client nằm trong `src/services/api.ts`. Đây là nơi chứa:

- Base URL.
- Authenticated fetch.
- Type API response.
- Các API object như `authAPI`, `courseAPI`, `enrollmentAPI`, `blogAPI`, `adminAPI`, `flashcardAPI`, `jlptExamAPI`.

Nên giữ service chỉ làm nhiệm vụ request/response. Không đưa UI toast, navigation hoặc derived UI state vào service.

## Luồng logic theo domain

### Auth

Files chính:

- `pages/Login.tsx`
- `pages/Signup.tsx`
- `contexts/AuthContext.tsx`
- `services/api.ts`
- `utils/formValidation.ts`

Luồng:

1. Form dùng `react-hook-form`.
2. Validation dùng `formRules`, `sameAs`, `getFieldError`.
3. Submit gọi `authAPI`.
4. Thành công thì lưu auth context hoặc điều hướng.
5. Toast thông báo qua `ToastContext`.

Nên refactor tiếp: tách UI auth vào `components/auth/` nếu Login/Signup phát triển thêm.

### Admin Dashboard

Files chính:

- `pages/AdminDashboard.tsx`
- `components/admin/`
- `components/admin/modals/`
- `components/admin/sections/`
- `hooks/admin/`

Luồng:

1. Page kiểm tra quyền qua `useAuth`.
2. `useAdminDashboardData` load stats và các list chính.
3. Các hook domain xử lý action:
   - `useAdminUsers`
   - `useAdminCoursesLessons`
   - `useAdminTests`
   - `useAdminJlpt`
   - `useAdminQuestions`
   - `useAdminBlogs`
4. Section render list/table theo tab.
5. `AdminDashboardModals` route modal theo `activeModal`.

Điểm cần lưu ý:

- Admin đã được tách nhiều nhưng `AdminDashboard.tsx` vẫn là file orchestration lớn.
- `useAdminDashboardData` còn gom nhiều domain data/filter trong một hook.
- Refactor tiếp nên tách `useAdminDashboardController`, `useAdminModalNavigation`, và data hooks theo domain.

### Course Explore

Files chính:

- `pages/CourseExplore.tsx`
- `components/courseExplore/`
- `hooks/course/useCourseExploreData.ts`
- `hooks/course/useCourseExploreFilters.ts`
- `components/courseExplore/courseExploreUtils.ts`

Luồng:

1. Data hook load popular course và all courses.
2. Helper sort course nổi bật trước, sau đó theo enrollment/newest.
3. Filter hook xử lý level/sort.
4. Page render hero, sidebar, grid và CTA.

Đây là pattern tốt để áp dụng cho các list page khác.

### My Learning

Files chính:

- `pages/CourseList.tsx`
- `components/cards/CourseCard.tsx`
- `services/api.ts`

Luồng hiện tại:

1. Page load enrolled courses từ `enrollmentAPI.getMyCourses`.
2. Page giữ status tab và pagination.
3. Action mở course, next lesson, final test, certificate nằm trong page.

Nên refactor tiếp:

- Tạo `hooks/course/useMyLearningCourses.ts`.
- Tạo `hooks/course/useMyLearningActions.ts`.
- Tách UI thành `components/course/MyLearningHeader`, `CourseStatusTabs`, `MyLearningListSection`.

### Course Detail

Files chính:

- `pages/CourseDetail.tsx`
- `components/course/`
- `hooks/course/useCourseDetailData.ts`
- `hooks/course/useCourseEnrollmentActions.ts`
- `hooks/course/useCoursePayment.ts`

Luồng:

1. Data hook load course, lessons, ratings, enrollment/purchase state.
2. Action hook xử lý enroll/open lesson.
3. Payment hook xử lý PayOS/payment modal.
4. Component render hero, content, reviews, payment modal.

Page này đã theo pattern compose tương đối tốt.

### Lesson

Files chính:

- `pages/Lesson.tsx`
- `components/lesson/`
- `components/notes/`
- `hooks/lesson/`

Luồng:

1. `useLessonData` load course lessons và current lesson.
2. `useLessonLayout` quản lý sidebar/study mode/layout refs.
3. `useLessonProgressActions` mark completed, next lesson.
4. `useLessonNotes` xử lý text/video/highlight notes.
5. `useLessonFlashcards` xử lý tạo flashcard từ selected text.
6. `useLessonAiAssistant` xử lý AI assistant theo selected text.
7. `useLessonQuiz` load quiz của lesson.

Nên refactor tiếp:

- Tách phần JSX main study content trong `Lesson.tsx` thành `LessonStudyArea`.
- Tách `LessonFlashcardDialog` thành form fields, media upload block, collection picker.
- Cân nhắc dùng `react-hook-form` cho dialog flashcard.

### Quiz

Files chính:

- `components/lesson/QuizPanel.tsx`
- `components/lesson/QuizQuestionItem.tsx`
- `components/questions/`
- `hooks/lesson/useQuizPanelController.ts`
- `pages/QuizFocus.tsx`
- `hooks/quiz/`

Luồng:

1. `useQuizPanelController` quản lý answer state, submit state, result state.
2. Shared question UI nằm trong `components/questions`.
3. `QuizFocus` dùng controller riêng cho mode focus/full quiz.

Phần này đã có reuse tốt hơn sau refactor.

### JLPT Tests

Files chính:

- `pages/TestList.tsx`
- `components/testList/`
- `hooks/jlpt/useJlptTestList.ts`
- `pages/JlptTest.tsx`
- `components/jlpt/`
- `hooks/jlpt/useJlptTestController.ts`

Luồng:

1. Test list load exams theo level/section/page.
2. Test detail/controller load exam sections/questions.
3. UI JLPT dùng `JlptQuestionCard` và shared question components.

Nên giữ phân biệt rõ:

- `TestList` là danh sách exam.
- `JlptTest` là màn làm bài JLPT.
- `QuizPanel` là quiz lesson/final test.

### Flashcards

Files chính:

- `pages/Flashcard.tsx`
- `pages/FlashcardDetail.tsx`
- `components/flashcards/`
- `hooks/flashcards/`

Luồng collection list:

1. `useFlashcardCollections` compose data/dialog/actions.
2. `useFlashcardCollectionsData` load my collections và public collections.
3. `useFlashcardCollectionDialog` quản lý create/edit dialog state.
4. `useFlashcardCollectionActions` xử lý save/delete và refresh list.

Lưu ý đã fix:

- `useToastMessages` đã được memoize để tránh object mới mỗi render.
- `useFlashcardCollectionsData` không nên phụ thuộc vào toàn bộ object `toast`, vì có thể gây load lại liên tục.

Luồng detail:

1. Data hook load collection/cards.
2. Study panel xử lý review/study.
3. Edit dialog xử lý tạo/sửa card.

### Notes

Files chính:

- `pages/Notes.tsx`
- `components/notes/`
- `hooks/notes/useNotesData.ts`
- `hooks/notes/useNotesFilters.ts`

Luồng:

1. Data hook load notes.
2. Filter hook xử lý search/type/date.
3. Components render hero, filter panel, result list.

Nên refactor tiếp:

- `NoteCard`, `NoteComposer`, `NotesFilterPanel` còn khá lớn.
- Tách `NoteMeta`, `NoteActions`, `NoteContentPreview`, `NoteFormFields`.

### Profile

Files chính:

- `pages/Profile.tsx`
- `components/profile/`
- `hooks/profile/`

Luồng:

1. `useProfilePageData` load profile, progress, goals, achievements, analytics.
2. `useProfileActions` xử lý update profile/goals/avatar.
3. Components chia theo tab: overview, progress, goals, achievements.

Nên duy trì:

- Chart/data transformation nên nằm trong helper hoặc hook, không để page xử lý.
- Achievement UI nên chỉ nhận state đã tính sẵn.

### Blog

Files chính:

- `pages/BlogDetail.tsx`
- `components/blog/`
- `hooks/blog/useBlogDetail.ts`
- `pages/BlogList.tsx`
- `components/sections/BlogFilterBar.tsx`

Blog detail đã được tách tốt:

1. Hook load detail.
2. Components render status, hero, content, sidebar, related posts.

Blog list vẫn nên refactor:

- Tách `useBlogList`.
- Tách `blogListUtils`.
- Tách `BlogListHero`, `BlogTimeFilter`, `BlogArticlesSection`, `BlogListSkeleton`.

### Certificate

Files chính:

- `pages/Certification.tsx`
- `components/certificate/`
- `hooks/certificate/`

Luồng:

1. Data hook load certificate eligibility/data.
2. Download hook xử lý tạo PDF.
3. Components render preview, actions, status page, print style.

Phần này đã tương đối rõ.

## Shared UI và reusable components

Các component dùng chung nên ưu tiên dùng lại trước khi tạo mới:

- `components/ui/`: `Card`, `Container`, `Section`, `Badge`, `Avatar`, `Icon`, typography.
- `components/Button.tsx`
- `components/FormInputs.tsx`
- `components/Pagination.tsx`
- `components/Breadcrumbs.tsx`
- `components/questions/`: media, options, feedback dùng cho quiz/JLPT.
- `components/cards/`: blog/course/test/rating cards.

Nếu một UI xuất hiện ở 2 domain trở lên, cân nhắc đưa vào:

- `components/ui` nếu là primitive.
- `components/questions`, `components/cards`, hoặc domain-neutral folder nếu có context nghiệp vụ.

## Form và validation

Form mới nên dùng `react-hook-form` khi:

- Có nhiều field.
- Cần validate.
- Có submit async.
- Form được mở trong modal/dialog.

Validation reusable nằm tại:

```txt
src/utils/formValidation.ts
```

Pattern đề xuất:

```tsx
const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<FormValues>({ mode: 'onBlur' });
```

Không nên tự quản lý nhiều `useState` field nếu form có thể dùng RHF rõ ràng hơn.

## Toast và side effects

Toast dùng qua:

- `contexts/ToastContext.tsx`
- `hooks/useToastMessages.ts`

Lưu ý:

- `useToastMessages` đã memoize object trả về.
- Khi hook data chỉ cần báo lỗi, ưu tiên destructure function cụ thể thay vì phụ thuộc vào cả object nếu object không chắc ổn định.

Ví dụ:

```tsx
const showError = toast.error;

useEffect(() => {
  // fetch
}, [showError]);
```

## Pagination

Pagination dùng chung nằm tại:

```txt
src/components/Pagination.tsx
```

Các list đã hoặc nên dùng pagination:

- Admin dashboard sections.
- Course list.
- Blog list.
- Test list.
- Course explore nếu cần mở rộng.

Khi filter thay đổi, page nên reset về `1`:

```tsx
useEffect(() => {
  setPage(1);
}, [filterA, filterB]);
```

## Quy ước refactor tiếp theo

Khi refactor một page lớn, đi theo thứ tự:

1. Xác định data state, UI state và actions.
2. Tách helper thuần vào `*Utils.ts` hoặc `*Data.ts`.
3. Tách data hook.
4. Tách action hook nếu action dài hoặc có nhiều side effect.
5. Tách UI section theo màn hình.
6. Rút page còn compose.
7. Chạy `npm run build`.

Checklist sau refactor:

- Page không còn fetch dài.
- Page không chứa helper format/filter lớn.
- Component không tự gọi API trừ khi là widget độc lập có lý do rõ.
- Props có tên rõ, không truyền object quá rộng nếu không cần.
- `useEffect` dependency ổn định.
- Không duplicate formatter/filter giữa các page.
- Build pass.

## Các điểm nên refactor tiếp

Ưu tiên cao:

1. `pages/BlogList.tsx`: tách hook data/filter và các section UI.
2. `pages/CourseList.tsx`: tách My Learning data/action/list UI.
3. `pages/AdminDashboard.tsx`: tách controller/layout/modal navigation.
4. `hooks/admin/useAdminDashboardData.ts`: chia data hook theo domain.

Ưu tiên trung bình:

1. `components/cards/CourseCard.tsx`: tách các card variant và hover logic.
2. `components/lesson/LessonFlashcardDialog.tsx`: tách form fields/media/collection picker, cân nhắc RHF.
3. `components/notes/NoteCard.tsx` và `NoteComposer.tsx`: tách meta/actions/form fields.
4. `pages/Login.tsx` và `Signup.tsx`: đưa auth UI vào `components/auth`.

Nợ kỹ thuật:

1. `services/api.ts` đang là file lớn, nên chia theo API domain khi có thời gian.
2. Base API URL nên đọc từ `import.meta.env`.
3. Kiểm tra và dọn các type bị khai báo trùng trong `api.ts`.

## Kết luận

Frontend hiện đã chuyển dần sang cấu trúc rõ hơn: page compose, hook xử lý logic, component render UI, service gọi API. Các refactor tiếp theo nên tiếp tục giảm file lớn, giảm dependency không ổn định trong hook, và tăng reuse ở các component form/list/card.
