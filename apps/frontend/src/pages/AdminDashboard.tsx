import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Header } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { type AdminRole } from '../services/api';
import { useAdminAssetUpload } from '../hooks/admin/useAdminAssetUpload';
import { useAdminBlogs } from '../hooks/admin/useAdminBlogs';
import { useAdminCoursesLessons } from '../hooks/admin/useAdminCoursesLessons';
import { useAdminDashboardData } from '../hooks/admin/useAdminDashboardData';
import { useAdminDashboardForms } from '../hooks/admin/useAdminDashboardForms';
import { useAdminJlpt } from '../hooks/admin/useAdminJlpt';
import { useAdminQuestions } from '../hooks/admin/useAdminQuestions';
import { useAdminTests } from '../hooks/admin/useAdminTests';
import { useAdminUsers } from '../hooks/admin/useAdminUsers';
import { AdminDashboardModals } from '../components/admin/AdminDashboardModals';
import { AdminSidebar } from '../components/admin/DashboardUi';
import { BlogsSection } from '../components/admin/sections/BlogsSection';
import { CoursesSection } from '../components/admin/sections/CoursesSection';
import { JlptSection } from '../components/admin/sections/JlptSection';
import { PaymentsSection } from '../components/admin/sections/PaymentsSection';
import { TestsSection } from '../components/admin/sections/TestsSection';
import { UsersSection } from '../components/admin/sections/UsersSection';
import { secondaryButtonClass } from '../components/admin/adminClasses';
import { tabs } from '../components/admin/adminOptions';
import type { AdminTab, ModalName } from '../components/admin/adminTypes';

const OverviewSection = lazy(() =>
  import('../components/admin/sections/OverviewSection').then((module) => ({ default: module.OverviewSection }))
);

function AdminSectionFallback() {
  return (
    <section className="rounded-lg border border-outline-variant bg-surface p-6 shadow-sm">
      <div className="h-5 w-40 animate-pulse rounded bg-surface-container-high" />
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="h-28 animate-pulse rounded-lg bg-surface-container-low" />
        <div className="h-28 animate-pulse rounded-lg bg-surface-container-low" />
        <div className="h-28 animate-pulse rounded-lg bg-surface-container-low" />
      </div>
    </section>
  );
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isAdminNavOpen, setIsAdminNavOpen] = useState(() => (typeof window === 'undefined' ? true : window.innerWidth >= 768));
  const [activeModal, setActiveModal] = useState<ModalName>(null);
  const {
    busy,
    stats,
    users,
    userTotalCount,
    courses,
    courseTotalCount,
    lessons,
    tests,
    testTotalCount,
    lessonQuizzes,
    jlptExams,
    jlptTotalCount,
    jlptSections,
    blogs,
    blogTotalCount,
    payments,
    paymentTotalCount,
    quizQuestions,
    jlptQuestions,
    readingPassages,
    userFilter,
    courseFilter,
    testFilter,
    jlptFilter,
    blogFilter,
    paymentFilter,
    setUserFilter,
    setCourseFilter,
    setTestFilter,
    setJlptFilter,
    setBlogFilter,
    setPaymentFilter,
    setQuizQuestions,
    setJlptSections,
    setJlptQuestions,
    run,
    loadStats,
    loadUsers,
    loadCourses,
    loadLessons,
    loadTests,
    loadLessonQuizzes,
    loadQuizQuestions,
    loadJlptExams,
    loadJlptSections,
    loadJlptQuestions,
    loadReadingPassages,
    loadBlogs,
    refreshAll,
  } = useAdminDashboardData(user?.role as AdminRole | undefined, activeTab);

  const {
    userForm,
    setUserForm,
    editingUserId,
    setEditingUserId,
    courseForm,
    setCourseForm,
    editingCourseId,
    setEditingCourseId,
    lessonForm,
    setLessonForm,
    editingLessonId,
    setEditingLessonId,
    managingLessonsCourseId,
    setManagingLessonsCourseId,
    testForm,
    setTestForm,
    editingTestId,
    setEditingTestId,
    returnModalAfterTest,
    setReturnModalAfterTest,
    managingQuestionsQuizId,
    setManagingQuestionsQuizId,
    questionForm,
    setQuestionForm,
    editingQuestionId,
    setEditingQuestionId,
    jlptExamForm,
    setJlptExamForm,
    editingJlptExamId,
    setEditingJlptExamId,
    managingJlptExamId,
    setManagingJlptExamId,
    jlptSectionForm,
    setJlptSectionForm,
    editingJlptSectionId,
    setEditingJlptSectionId,
    managingJlptSectionId,
    setManagingJlptSectionId,
    readingPassageForm,
    setReadingPassageForm,
    editingReadingPassageId,
    setEditingReadingPassageId,
    autoJlptQuestionsForm,
    setAutoJlptQuestionsForm,
    blogForm,
    setBlogForm,
    editingBlogId,
    setEditingBlogId,
  } = useAdminDashboardForms();
  const { uploadingField, uploadAsset } = useAdminAssetUpload();

  const visibleTabs = useMemo(
    () => tabs.filter((tab) => user?.role === 'admin' || tab.id !== 'users'),
    [user?.role]
  );

  useEffect(() => {
    if (user?.role !== 'admin' && activeTab === 'users') {
      setActiveTab('overview');
    }
  }, [activeTab, user?.role]);

  const closeModal = () => {
    setActiveModal(null);
    setReturnModalAfterTest(null);
    setManagingQuestionsQuizId(null);
    setManagingJlptExamId(null);
    setManagingJlptSectionId(null);
    setQuizQuestions([]);
    setJlptSections([]);
    setJlptQuestions([]);
  };

  const closeLessonForm = () => {
    if (managingLessonsCourseId) {
      setActiveModal('lessons');
      return;
    }
    closeModal();
  };

  const closeTestForm = () => {
    if (returnModalAfterTest) {
      setActiveModal(returnModalAfterTest);
      return;
    }
    closeModal();
  };

  const closeQuestionForm = () => {
    if (managingJlptSectionId) {
      setActiveModal('jlptSections');
      return;
    }
    if (managingQuestionsQuizId) {
      setActiveModal('questions');
      return;
    }
    closeModal();
  };

  const {
    selectedCourse,
    courseLessons,
    sortedCourseLessons,
    currentLessonQuiz,
    openCreateCourse,
    openEditCourse,
    openManageLessons,
    moveLesson,
    deleteCourse,
    deleteLesson,
    openCreateLesson,
    openEditLesson,
    openCreateLessonQuiz,
    openEditLessonQuiz,
    submitCourse,
    submitLesson,
  } = useAdminCoursesLessons({
    activeModal,
    courses,
    lessons,
    lessonQuizzes,
    lessonForm,
    setLessonForm,
    editingCourseId,
    setEditingCourseId,
    setCourseForm,
    editingLessonId,
    setEditingLessonId,
    managingLessonsCourseId,
    setManagingLessonsCourseId,
    setTestForm,
    setEditingTestId,
    setReturnModalAfterTest,
    setActiveModal,
    closeModal,
    run,
    loadCourses,
    loadLessons,
    loadTests,
    loadLessonQuizzes,
    loadStats,
  });

  const { openCreateUser, openEditUser, deleteUser, submitUser } = useAdminUsers({
    currentUserId: user?.user_id,
    editingUserId,
    setEditingUserId,
    setUserForm,
    setActiveModal,
    closeModal,
    run,
    loadUsers,
    loadStats,
  });

  const { openCreateTest, openEditTest, deleteTest, submitTest } = useAdminTests({
    editingTestId,
    setEditingTestId,
    setTestForm,
    setReturnModalAfterTest,
    managingQuestionsQuizId,
    setManagingQuestionsQuizId,
    setQuizQuestions,
    setActiveModal,
    closeModal,
    run,
    loadTests,
    loadLessonQuizzes,
    loadStats,
  });

  const {
    selectedJlptExam,
    managingJlptSection,
    sortedJlptSections,
    sortedJlptQuestions,
    openAutoJlptQuestions,
    openCreateJlptExam,
    openEditJlptExam,
    openManageJlptSections,
    openEditJlptSection,
    openCreateJlptSection,
    openCreateReadingPassage,
    openEditReadingPassage,
    submitJlptExam,
    submitJlptSection,
    deleteJlptSection,
    deleteJlptExam,
    submitAutoJlptQuestions,
    submitReadingPassage,
  } = useAdminJlpt({
    jlptExams,
    jlptSections,
    jlptQuestions,
    editingJlptExamId,
    setEditingJlptExamId,
    managingJlptExamId,
    setManagingJlptExamId,
    editingJlptSectionId,
    setEditingJlptSectionId,
    managingJlptSectionId,
    setManagingJlptSectionId,
    setJlptExamForm,
    setJlptSectionForm,
    setReadingPassageForm,
    editingReadingPassageId,
    setEditingReadingPassageId,
    autoJlptQuestionsForm,
    setAutoJlptQuestionsForm,
    setManagingQuestionsQuizId,
    setQuizQuestions,
    setJlptQuestions,
    setJlptSections,
    setActiveModal,
    closeModal,
    run,
    loadJlptExams,
    loadJlptSections,
    loadReadingPassages,
    loadStats,
  });

  const {
    managingQuestionsQuiz,
    visibleQuizQuestions,
    openManageQuestions,
    openCreateQuestion,
    openEditQuestion,
    moveQuestion,
    deleteQuestion,
    submitQuestion,
    openManageJlptQuestions,
  } = useAdminQuestions({
    tests,
    lessonQuizzes,
    quizQuestions,
    jlptQuestions,
    selectedJlptExam,
    managingJlptSection,
    managingJlptExamId,
    managingQuestionsQuizId,
    setManagingQuestionsQuizId,
    managingJlptSectionId,
    setManagingJlptSectionId,
    setQuizQuestions,
    setJlptQuestions,
    editingQuestionId,
    setEditingQuestionId,
    setEditingJlptSectionId,
    setQuestionForm,
    setActiveModal,
    run,
    loadQuizQuestions,
    loadTests,
    loadLessonQuizzes,
    loadStats,
    loadJlptQuestions,
    loadJlptSections,
    loadJlptExams,
    loadReadingPassages,
  });

  const { openCreateBlog, openEditBlog, deleteBlog, submitBlog } = useAdminBlogs({
    editingBlogId,
    setEditingBlogId,
    setBlogForm,
    setActiveModal,
    closeModal,
    run,
    loadBlogs,
    loadStats,
  });

  if (loading) return <div className="min-h-screen bg-background p-8 text-on-surface">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin' && user.role !== 'owner') return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <AdminSidebar
          tabs={visibleTabs}
          activeTab={activeTab}
          isOpen={isAdminNavOpen}
          onToggle={() => setIsAdminNavOpen((previous) => !previous)}
          onSelect={(tab) => {
            setActiveTab(tab);
            if (window.innerWidth < 768) setIsAdminNavOpen(false);
          }}
        />

        {isAdminNavOpen && (
          <div
            className="fixed inset-x-0 bottom-0 z-30 bg-black/50 md:hidden"
            style={{ top: '73px' }}
            onClick={() => setIsAdminNavOpen(false)}
            role="presentation"
          />
        )}

        <main className="min-w-0 flex-1 py-6 pl-20 pr-margin-mobile md:px-margin-desktop">
          <div className="mx-auto max-w-[1280px]">
        <section className="mb-6 rounded-lg border border-outline-variant bg-surface p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-label-md font-semibold uppercase text-primary">JPMaster Dashboard</p>
              <h1 className="mt-1 text-headline-lg font-bold text-on-surface">Dashboard</h1>
              <p className="mt-2 max-w-2xl text-body-md text-on-surface-variant">
                Track platform metrics and manage users, courses, lessons, tests, and blog content.
              </p>
            </div>
            <button className={secondaryButtonClass} disabled={busy} onClick={() => void refreshAll()}>
              <span className="material-symbols-outlined text-[20px]">refresh</span>
              Refresh
            </button>
          </div>
        </section>

        {activeTab === 'overview' && stats && (
          <Suspense fallback={<AdminSectionFallback />}>
            <OverviewSection stats={stats} role={user.role} />
          </Suspense>
        )}

        {activeTab === 'users' && user.role === 'admin' && (
          <UsersSection
            users={users}
            totalCount={userTotalCount}
            currentUserId={user.user_id}
            busy={busy}
            filter={userFilter}
            setFilter={setUserFilter}
            onCreate={openCreateUser}
            onEdit={openEditUser}
            onDelete={deleteUser}
          />
        )}

        {activeTab === 'courses' && (
          <CoursesSection
            courses={courses}
            totalCount={courseTotalCount}
            busy={busy}
            filter={courseFilter}
            setFilter={setCourseFilter}
            onCreateCourse={openCreateCourse}
            onEditCourse={openEditCourse}
            onManageLessons={openManageLessons}
            onCreateLesson={openCreateLesson}
            onDeleteCourse={deleteCourse}
          />
        )}

        {activeTab === 'tests' && (
          <TestsSection
            tests={tests}
            totalCount={testTotalCount}
            busy={busy}
            filter={testFilter}
            setFilter={setTestFilter}
            onCreate={openCreateTest}
            onEdit={openEditTest}
            onManageQuestions={openManageQuestions}
            onDelete={deleteTest}
          />
        )}

        {activeTab === 'jlpt' && (
          <JlptSection
            exams={jlptExams}
            totalCount={jlptTotalCount}
            busy={busy}
            filter={jlptFilter}
            setFilter={setJlptFilter}
            onCreate={openCreateJlptExam}
            onEdit={openEditJlptExam}
            onManageSections={openManageJlptSections}
            onDelete={deleteJlptExam}
          />
        )}

        {activeTab === 'blogs' && (
          <BlogsSection
            blogs={blogs}
            totalCount={blogTotalCount}
            busy={busy}
            filter={blogFilter}
            setFilter={setBlogFilter}
            onCreate={openCreateBlog}
            onEdit={openEditBlog}
            onDelete={deleteBlog}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentsSection
            payments={payments}
            totalCount={paymentTotalCount}
            filter={paymentFilter}
            setFilter={setPaymentFilter}
          />
        )}
          </div>
      </main>
      </div>

      <AdminDashboardModals
        common={{
          activeModal,
          setActiveModal,
          busy,
          uploadingField,
          uploadAsset,
          closeModal,
        }}
        users={{
          currentUserId: user.user_id,
          users,
          form: userForm,
          editingId: editingUserId,
          submit: submitUser,
          deleteItem: deleteUser,
        }}
        courseLessons={{
          courses,
          lessons,
          courseForm,
          lessonForm,
          editingCourseId,
          selectedCourse,
          submitCourse,
          openManageLessons,
          deleteCourse,
          sortedCourseLessons,
          lessonQuizzes,
          openCreateLesson,
          openEditLesson,
          moveLesson,
          deleteLesson,
          editingLessonId,
          courseLessons,
          currentLessonQuiz,
          submitLesson,
          closeLessonForm,
          setManagingLessonsCourseId,
          openCreateLessonQuiz,
          openEditLessonQuiz,
        }}
        tests={{
          form: testForm,
          editingId: editingTestId,
          returnModalAfterTest,
          tests,
          submit: submitTest,
          closeForm: closeTestForm,
          openManageQuestions,
          deleteItem: deleteTest,
        }}
        jlpt={{
          examForm: jlptExamForm,
          sectionForm: jlptSectionForm,
          autoQuestionsForm: autoJlptQuestionsForm,
          readingPassageForm,
          editingExamId: editingJlptExamId,
          selectedExam: selectedJlptExam,
          submitExam: submitJlptExam,
          openManageSections: openManageJlptSections,
          deleteExam: deleteJlptExam,
          sections: jlptSections,
          sortedSections: sortedJlptSections,
          sortedQuestions: sortedJlptQuestions,
          readingPassages,
          managingSectionId: managingJlptSectionId,
          managingSection: managingJlptSection,
          openCreateSection: openCreateJlptSection,
          openManageQuestions: openManageJlptQuestions,
          openEditSection: openEditJlptSection,
          deleteSection: deleteJlptSection,
          openCreateReadingPassage,
          refreshReadingPassages: () => void loadReadingPassages(selectedJlptExam?.jlpt_level),
          openEditReadingPassage,
          openAutoQuestions: openAutoJlptQuestions,
          editingSectionId: editingJlptSectionId,
          submitSection: submitJlptSection,
          submitAutoQuestions: submitAutoJlptQuestions,
          editingReadingPassageId,
          submitReadingPassage,
        }}
        questions={{
          form: questionForm,
          editingId: editingQuestionId,
          managingQuiz: managingQuestionsQuiz,
          visibleQuestions: visibleQuizQuestions,
          openCreate: openCreateQuestion,
          openEdit: openEditQuestion,
          move: moveQuestion,
          deleteItem: deleteQuestion,
          submit: submitQuestion,
          closeForm: closeQuestionForm,
        }}
        blog={{
          form: blogForm,
          editingId: editingBlogId,
          submit: submitBlog,
        }}
      />
    </div>
  );
}


