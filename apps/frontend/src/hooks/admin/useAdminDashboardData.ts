import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import type { AdminTab } from '../../components/admin/adminTypes';
import {
  adminAPI,
  type AdminCourse,
  type AdminJlptExam,
  type AdminJlptLevel,
  type AdminJlptSection,
  type AdminLesson,
  type AdminPayment,
  type AdminPaymentStatus,
  type AdminQuizQuestion,
  type AdminQuizType,
  type AdminReadingPassage,
  type AdminRole,
  type AdminSortOrder,
  type AdminStats,
  type AdminTest,
  type UserProfile,
} from '../../services/api';

const canAccessAdminData = (role?: AdminRole) => role === 'admin' || role === 'owner';
const adminPageSize = 10;

export function useAdminDashboardData(role: AdminRole | undefined, activeTab: AdminTab) {
  const { addToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [loadedTabKeys, setLoadedTabKeys] = useState<Partial<Record<AdminTab, string>>>({});
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userTotalCount, setUserTotalCount] = useState(0);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [courseTotalCount, setCourseTotalCount] = useState(0);
  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [tests, setTests] = useState<AdminTest[]>([]);
  const [testTotalCount, setTestTotalCount] = useState(0);
  const [lessonQuizzes, setLessonQuizzes] = useState<AdminTest[]>([]);
  const [jlptExams, setJlptExams] = useState<AdminJlptExam[]>([]);
  const [jlptTotalCount, setJlptTotalCount] = useState(0);
  const [jlptSections, setJlptSections] = useState<AdminJlptSection[]>([]);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [paymentTotalCount, setPaymentTotalCount] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState<AdminQuizQuestion[]>([]);
  const [jlptQuestions, setJlptQuestions] = useState<AdminQuizQuestion[]>([]);
  const [readingPassages, setReadingPassages] = useState<AdminReadingPassage[]>([]);

  const [userFilter, setUserFilter] = useState({ search: '', role: 'all' as AdminRole | 'all', sort_order: 'desc' as AdminSortOrder, limit: adminPageSize, offset: 0 });
  const [courseFilter, setCourseFilter] = useState({ search: '', level: '', sort_order: 'desc' as AdminSortOrder, limit: adminPageSize, offset: 0 });
  const [testFilter, setTestFilter] = useState({ search: '', quiz_type: 'all' as AdminQuizType | 'all', sort_order: 'desc' as AdminSortOrder, limit: adminPageSize, offset: 0 });
  const [jlptFilter, setJlptFilter] = useState({ search: '', sort_order: 'desc' as AdminSortOrder, limit: adminPageSize, offset: 0 });
  const [paymentFilter, setPaymentFilter] = useState({ search: '', status: 'all' as AdminPaymentStatus, sort_order: 'desc' as AdminSortOrder, limit: adminPageSize, offset: 0 });

  const run = useCallback(async (task: () => Promise<void>, success?: string) => {
    setBusy(true);
    try {
      await task();
      if (success) addToast(success, 'success', 2500);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Something went wrong', 'error');
    } finally {
      setBusy(false);
    }
  }, [addToast]);

  const loadStats = useCallback(() => run(async () => setStats((await adminAPI.getStats()).data)), [run]);
  const loadUsers = useCallback(() => run(async () => {
    if (role !== 'admin') {
      setUsers([]);
      setUserTotalCount(0);
      return;
    }
    const result = await adminAPI.getUsers(userFilter);
    setUsers(result.data);
    setUserTotalCount(result.total_count ?? result.count);
  }), [role, run, userFilter]);
  const loadCourses = useCallback(() => run(async () => {
    const result = await adminAPI.getCourses(courseFilter);
    setCourses(result.data);
    setCourseTotalCount(result.total_count ?? result.count);
  }), [courseFilter, run]);
  const loadLessons = useCallback(() => run(async () => setLessons((await adminAPI.getLessons()).data)), [run]);
  const loadTests = useCallback(() => run(async () => {
    const result = await adminAPI.getTests(testFilter);
    setTests(result.data);
    setTestTotalCount(result.total_count ?? result.count);
  }), [run, testFilter]);
  const loadLessonQuizzes = useCallback(() => run(async () => setLessonQuizzes((await adminAPI.getTests({ quiz_type: 'lesson_quiz', limit: 200 })).data)), [run]);
  const loadQuizQuestions = useCallback((quizId: number) => run(async () => setQuizQuestions((await adminAPI.getQuizQuestions(quizId)).data)), [run]);
  const loadJlptExams = useCallback(() => run(async () => {
    const result = await adminAPI.getJlptExams(jlptFilter);
    setJlptExams(result.data);
    setJlptTotalCount(result.total_count ?? result.count);
  }), [jlptFilter, run]);
  const loadJlptSections = useCallback((examId: number) => run(async () => setJlptSections((await adminAPI.getJlptSections(examId)).data)), [run]);
  const loadJlptQuestions = useCallback((sectionId: number) => run(async () => setJlptQuestions((await adminAPI.getJlptSectionQuestions(sectionId)).data)), [run]);
  const loadReadingPassages = useCallback((level?: AdminJlptLevel) => run(async () => setReadingPassages((await adminAPI.getReadingPassages(level ? { jlpt_level: level } : {})).data)), [run]);
  const loadPayments = useCallback(() => run(async () => {
    const result = await adminAPI.getPayments(paymentFilter);
    setPayments(result.data);
    setPaymentTotalCount(result.total_count ?? result.count);
  }), [paymentFilter, run]);

  const getTabKey = useCallback((tab: AdminTab) => {
    switch (tab) {
      case 'users':
        return JSON.stringify(userFilter);
      case 'courses':
        return JSON.stringify(courseFilter);
      case 'tests':
        return JSON.stringify(testFilter);
      case 'jlpt':
        return JSON.stringify(jlptFilter);
      case 'payments':
        return JSON.stringify(paymentFilter);
      case 'overview':
      default:
        return 'stats';
    }
  }, [courseFilter, jlptFilter, paymentFilter, testFilter, userFilter]);

  const loadTab = useCallback(async (tab: AdminTab, force = false) => {
    if (!canAccessAdminData(role)) return;
    if (tab === 'users' && role !== 'admin') return;

    const tabKey = getTabKey(tab);
    if (!force && loadedTabKeys[tab] === tabKey) return;

    switch (tab) {
      case 'overview':
        await loadStats();
        break;
      case 'users':
        await loadUsers();
        break;
      case 'courses':
        await Promise.all([loadCourses(), loadLessons(), loadLessonQuizzes()]);
        break;
      case 'tests':
        await Promise.all([loadTests(), loadCourses(), loadLessons(), loadLessonQuizzes()]);
        break;
      case 'jlpt':
        await loadJlptExams();
        break;
      case 'payments':
        await loadPayments();
        break;
      default:
        break;
    }

    setLoadedTabKeys((previous) => ({ ...previous, [tab]: tabKey }));
  }, [
    getTabKey,
    loadCourses,
    loadJlptExams,
    loadLessonQuizzes,
    loadLessons,
    loadPayments,
    loadStats,
    loadTests,
    loadUsers,
    loadedTabKeys,
    role,
  ]);

  const refreshAll = useCallback(async () => {
    const tabsToRefresh = new Set<AdminTab>(['overview', activeTab]);
    (Object.keys(loadedTabKeys) as AdminTab[]).forEach((tab) => tabsToRefresh.add(tab));
    await Promise.all(Array.from(tabsToRefresh).map((tab) => loadTab(tab, true)));
  }, [activeTab, loadTab, loadedTabKeys]);

  useEffect(() => {
    if (!canAccessAdminData(role)) return;
    const timer = window.setTimeout(() => void loadTab(activeTab), activeTab === 'overview' ? 0 : 350);
    return () => window.clearTimeout(timer);
  }, [activeTab, loadTab, role]);

  return {
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
    payments,
    paymentTotalCount,
    quizQuestions,
    jlptQuestions,
    readingPassages,
    userFilter,
    courseFilter,
    testFilter,
    jlptFilter,
    paymentFilter,
    setUserFilter,
    setCourseFilter,
    setTestFilter,
    setJlptFilter,
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
    loadPayments,
    loadTab,
    refreshAll,
  };
}
