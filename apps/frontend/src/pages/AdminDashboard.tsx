import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Header } from '../components';
import { getYouTubeEmbedUrl } from '../components/lesson/lessonUtils';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  adminAPI,
  type AdminBlog,
  type AdminBlogStatus,
  type AdminCloudinaryAsset,
  type AdminCourse,
  type AdminJlptExam,
  type AdminJlptLevel,
  type AdminJlptSection,
  type AdminLesson,
  type AdminQuestionType,
  type AdminQuizQuestion,
  type AdminQuizType,
  type AdminReadingPassage,
  type AdminRole,
  type AdminSortOrder,
  type AdminStats,
  type AdminTest,
  type AdminUserStatus,
  type UserProfile,
  type AdminSectionType,
} from '../services/api';

type AdminTab = 'overview' | 'users' | 'courses' | 'tests' | 'jlpt' | 'blogs';
type ModalName = 'user' | 'course' | 'lessons' | 'lesson' | 'test' | 'questions' | 'question' | 'jlptExam' | 'jlptSections' | 'jlptSection' | 'readingPassage' | 'autoJlptQuestions' | 'blog' | null;

const tabs: Array<{ id: AdminTab; label: string; icon: string }> = [
  { id: 'overview', label: 'Overview', icon: 'monitoring' },
  { id: 'users', label: 'Users', icon: 'group' },
  { id: 'courses', label: 'Courses & Lessons', icon: 'school' },
  { id: 'tests', label: 'Tests', icon: 'quiz' },
  { id: 'jlpt', label: 'JLPT Tests', icon: 'assignment' },
  { id: 'blogs', label: 'Blogs', icon: 'article' },
];

const courseLevelOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];
const quizTypeOptions: Array<{ value: AdminQuizType; label: string }> = [
  { value: 'practice_test', label: 'Practice test' },
  { value: 'lesson_quiz', label: 'Lesson quiz' },
  { value: 'final_test', label: 'Final test' },
];
const questionTypeOptions: Array<{ value: AdminQuestionType; label: string }> = [
  { value: 'single_choice', label: 'Single choice' },
  { value: 'multiple_choice', label: 'Multiple choice' },
  { value: 'true_false', label: 'True / false' },
  { value: 'fill_in_blank', label: 'Fill in blank' },
];
const difficultyOptions = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'expert', label: 'Expert' },
];
const jlptLevelOptions = [
  { value: 'N5' as AdminJlptLevel, label: 'N5' },
  { value: 'N4' as AdminJlptLevel, label: 'N4' },
  { value: 'N3' as AdminJlptLevel, label: 'N3' },
  { value: 'N2' as AdminJlptLevel, label: 'N2' },
  { value: 'N1' as AdminJlptLevel, label: 'N1' },
];
const sectionTypeOptions = [
  { value: 'vocabulary' as AdminSectionType, label: 'Vocabulary' },
  { value: 'grammar' as AdminSectionType, label: 'Grammar' },
  { value: 'reading' as AdminSectionType, label: 'Reading' },
  { value: 'listening' as AdminSectionType, label: 'Listening' },
];
const sortOrderOptions: Array<{ value: AdminSortOrder; label: string }> = [
  { value: 'desc', label: 'Newest ID' },
  { value: 'asc', label: 'Oldest ID' },
];

const emptyUser = { username: '', email: '', password: '', role: 'learner' as AdminRole, status: 'active' as AdminUserStatus };
const emptyCourse = { title: '', description: '', price: 0, level: 'beginner', duration: '', cover_asset_id: null as number | null, image_url: '' };
const emptyLesson = {
  course_id: '',
  title: '',
  content_text: '',
  video_asset_id: null as number | null,
  video_url: '',
  audio_asset_id: null as number | null,
  audio_url: '',
  order_index: 1,
  duration: '',
};
const emptyTest = {
  title: '',
  description: '',
  quiz_type: 'practice_test' as AdminQuizType,
  course_id: '',
  lesson_id: '',
  passing_score: 70,
  total_marks: 0,
  time_limit_minutes: '',
};
const emptyJlptExam = {
  title: '',
  jlpt_level: 'N5' as AdminJlptLevel,
  year: '',
  duration_minutes: '',
  sections: ['vocabulary', 'grammar', 'reading', 'listening'] as AdminSectionType[],
};
const emptyJlptSection = {
  title: '',
  section_type: 'vocabulary' as AdminSectionType,
  section_order: 1,
  duration_minutes: '',
  audio_asset_id: null as number | null,
  audio_url: '',
};
const emptyQuestion = {
  question_text: '',
  question_type: 'single_choice' as AdminQuestionType,
  difficulty_level: 'easy',
  explanation: '',
  points: 1,
  jlpt_level: 'N5',
  section_type: 'vocabulary',
  reading_passage_id: '',
  image_asset_id: null as number | null,
  image_url: '',
  audio_asset_id: null as number | null,
  audio_url: '',
  order_index: '',
  marks: 1,
  options: [
    { option_id: undefined as number | undefined, option_text: '', is_correct: true, explanation: '' },
    { option_id: undefined as number | undefined, option_text: '', is_correct: false, explanation: '' },
  ],
};
const emptyReadingPassage = {
  title: '',
  jlpt_level: 'N5' as AdminJlptLevel,
  passage_text: '',
  image_asset_id: null as number | null,
  image_url: '',
};
const emptyAutoJlptQuestions = {
  jlpt_level: 'N5' as AdminJlptLevel,
  easy: 0,
  medium: 0,
  hard: 0,
  expert: 0,
};
const emptyBlog = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: '',
  tags: '',
  cover_asset_id: null as number | null,
  image_url: '',
  video_asset_id: null as number | null,
  video_url: '',
  status: 'draft' as AdminBlogStatus,
};

const inputClass =
  'w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-body-md text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-surface-container-low disabled:text-on-surface-variant';
const actionButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-label-md font-semibold text-on-primary hover:bg-primary/90 disabled:opacity-60';
const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface px-4 py-2 text-label-md text-on-surface hover:bg-surface-container disabled:opacity-60';
const dangerButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-error/30 bg-error/10 px-4 py-2 text-label-md font-semibold text-error hover:bg-error/15 disabled:opacity-60';

const toNullableNumber = (value: string | number) => {
  if (value === '' || value === null || value === undefined) return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const optionLabel = (options: Array<{ value: string; label: string }>, value?: string | null) =>
  options.find((option) => option.value === value)?.label ?? value ?? '-';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1 text-label-md text-on-surface-variant">
      <span>{label}</span>
      {children}
    </label>
  );
}

function AssetUploader({
  label,
  accept,
  previewUrl,
  mediaKind,
  scope,
  fieldKey,
  uploadingField,
  onUpload,
  onUploaded,
}: {
  label: string;
  accept: string;
  previewUrl?: string | null;
  mediaKind: 'image' | 'video' | 'audio';
  scope: string;
  fieldKey: string;
  uploadingField: string | null;
  onUpload: (file: File, mediaKind: 'image' | 'video' | 'audio', scope: string, fieldKey: string) => Promise<AdminCloudinaryAsset>;
  onUploaded: (asset: AdminCloudinaryAsset) => void;
}) {
  const isUploading = uploadingField === fieldKey;
  const youtubeEmbedUrl = mediaKind === 'video' ? getYouTubeEmbedUrl(previewUrl ?? null) : null;

  return (
    <div className="space-y-2 rounded-lg border border-outline-variant bg-surface-container-low p-3">
      <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
        <div>
          <p className="text-label-md font-semibold text-on-surface">{label}</p>
          <p className="text-label-md text-on-surface-variant">Upload from your computer to Cloudinary.</p>
        </div>
        <label className={`${secondaryButtonClass} cursor-pointer`}>
          <span className="material-symbols-outlined text-[18px]">upload</span>
          {isUploading ? 'Uploading...' : 'Choose File'}
          <input
            type="file"
            accept={accept}
            disabled={isUploading}
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (!file) return;
              void onUpload(file, mediaKind, scope, fieldKey).then(onUploaded);
            }}
          />
        </label>
      </div>
      {previewUrl && (
        <div className="overflow-hidden rounded border border-outline-variant bg-surface p-2">
          {mediaKind === 'image' && <img src={previewUrl} alt={label} className="max-h-40 w-full object-cover" />}
          {mediaKind === 'video' && (
            youtubeEmbedUrl ? (
              <div className="aspect-video w-full overflow-hidden rounded bg-inverse-surface">
                <iframe
                  className="h-full w-full"
                  src={youtubeEmbedUrl}
                  title={label}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              <video src={previewUrl} controls className="max-h-52 w-full" />
            )
          )}
          {mediaKind === 'audio' && <audio src={previewUrl} controls className="w-full" />}
          <p className="mt-2 break-all text-label-md text-on-surface-variant">{previewUrl}</p>
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-label-md text-on-surface-variant">{label}</span>
        <span className="material-symbols-outlined text-primary">{icon}</span>
      </div>
      <p className="mt-3 text-headline-lg font-bold text-on-surface">{value}</p>
    </div>
  );
}

function Modal({
  title,
  subtitle,
  children,
  onClose,
  size = 'md',
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  size?: 'md' | 'lg' | 'xl';
}) {
  const sizeClass = size === 'xl' ? 'max-w-5xl' : size === 'lg' ? 'max-w-4xl' : 'max-w-2xl';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4 py-6">
      <div className={`max-h-[90vh] w-full ${sizeClass} overflow-y-auto rounded-lg border border-outline-variant bg-surface shadow-xl`}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-outline-variant bg-surface px-5 py-4">
          <div>
            <h2 className="text-headline-sm font-semibold text-on-surface">{title}</h2>
            {subtitle && <p className="mt-1 text-label-md text-on-surface-variant">{subtitle}</p>}
          </div>
          <button className={secondaryButtonClass} onClick={onClose} type="button" aria-label="Close modal">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isAdminNavOpen, setIsAdminNavOpen] = useState(() => (typeof window === 'undefined' ? true : window.innerWidth >= 768));
  const [activeModal, setActiveModal] = useState<ModalName>(null);
  const [busy, setBusy] = useState(false);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [tests, setTests] = useState<AdminTest[]>([]);
  const [lessonQuizzes, setLessonQuizzes] = useState<AdminTest[]>([]);
  const [jlptExams, setJlptExams] = useState<AdminJlptExam[]>([]);
  const [jlptSections, setJlptSections] = useState<AdminJlptSection[]>([]);
  const [blogs, setBlogs] = useState<AdminBlog[]>([]);

  const [userFilter, setUserFilter] = useState({ search: '', role: 'all' as AdminRole | 'all', sort_order: 'desc' as AdminSortOrder });
  const [courseFilter, setCourseFilter] = useState({ search: '', level: '', sort_order: 'desc' as AdminSortOrder });
  const [testFilter, setTestFilter] = useState({ search: '', quiz_type: 'all' as AdminQuizType | 'all', sort_order: 'desc' as AdminSortOrder });
  const [jlptFilter, setJlptFilter] = useState({ search: '', sort_order: 'desc' as AdminSortOrder });
  const [blogFilter, setBlogFilter] = useState({ search: '', status: 'all' as AdminBlogStatus | 'all', sort_order: 'desc' as AdminSortOrder });

  const [userForm, setUserForm] = useState(emptyUser);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [courseForm, setCourseForm] = useState(emptyCourse);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [lessonForm, setLessonForm] = useState(emptyLesson);
  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [managingLessonsCourseId, setManagingLessonsCourseId] = useState<number | null>(null);
  const [testForm, setTestForm] = useState(emptyTest);
  const [editingTestId, setEditingTestId] = useState<number | null>(null);
  const [returnModalAfterTest, setReturnModalAfterTest] = useState<ModalName>(null);
  const [managingQuestionsQuizId, setManagingQuestionsQuizId] = useState<number | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<AdminQuizQuestion[]>([]);
  const [questionForm, setQuestionForm] = useState(emptyQuestion);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [jlptExamForm, setJlptExamForm] = useState(emptyJlptExam);
  const [editingJlptExamId, setEditingJlptExamId] = useState<number | null>(null);
  const [managingJlptExamId, setManagingJlptExamId] = useState<number | null>(null);
  const [jlptSectionForm, setJlptSectionForm] = useState(emptyJlptSection);
  const [editingJlptSectionId, setEditingJlptSectionId] = useState<number | null>(null);
  const [managingJlptSectionId, setManagingJlptSectionId] = useState<number | null>(null);
  const [jlptQuestions, setJlptQuestions] = useState<AdminQuizQuestion[]>([]);
  const [readingPassages, setReadingPassages] = useState<AdminReadingPassage[]>([]);
  const [readingPassageForm, setReadingPassageForm] = useState(emptyReadingPassage);
  const [editingReadingPassageId, setEditingReadingPassageId] = useState<number | null>(null);
  const [autoJlptQuestionsForm, setAutoJlptQuestionsForm] = useState(emptyAutoJlptQuestions);
  const [blogForm, setBlogForm] = useState(emptyBlog);
  const [editingBlogId, setEditingBlogId] = useState<number | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const lessonCourseId = toNullableNumber(lessonForm.course_id);
  const selectedCourseId = activeModal === 'course'
    ? editingCourseId
    : activeModal === 'lessons'
      ? managingLessonsCourseId
      : lessonCourseId ?? managingLessonsCourseId;
  const selectedCourse = useMemo(
    () => courses.find((course) => course.course_id === selectedCourseId) ?? null,
    [courses, selectedCourseId]
  );
  const courseLessons = useMemo(
    () => lessons.filter((lesson) => lesson.course_id === selectedCourseId),
    [lessons, selectedCourseId]
  );
  const sortedCourseLessons = useMemo(
    () => [...courseLessons].sort((a, b) => a.order_index - b.order_index || a.lesson_id - b.lesson_id),
    [courseLessons]
  );
  const currentLessonQuiz = useMemo(
    () =>
      editingLessonId
        ? lessonQuizzes.find((quiz) => quiz.lesson_id === editingLessonId && quiz.quiz_type === 'lesson_quiz') ?? null
        : null,
    [editingLessonId, lessonQuizzes]
  );
  const managingQuestionsQuiz = useMemo(
    () => tests.find((test) => test.quiz_id === managingQuestionsQuizId) ?? lessonQuizzes.find((test) => test.quiz_id === managingQuestionsQuizId) ?? null,
    [lessonQuizzes, managingQuestionsQuizId, tests]
  );
  const visibleQuizQuestions = quizQuestions;
  const selectedJlptExam = useMemo(
    () => jlptExams.find((exam) => exam.exam_id === (editingJlptExamId ?? managingJlptExamId)) ?? null,
    [editingJlptExamId, jlptExams, managingJlptExamId]
  );
  const managingJlptSection = useMemo(
    () => jlptSections.find((section) => section.section_id === managingJlptSectionId) ?? null,
    [jlptSections, managingJlptSectionId]
  );
  const sortedJlptSections = useMemo(
    () => [...jlptSections].sort((a, b) => (a.section_order ?? 0) - (b.section_order ?? 0) || a.section_id - b.section_id),
    [jlptSections]
  );
  const sortedJlptQuestions = useMemo(
    () => [...jlptQuestions].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0) || a.question_id - b.question_id),
    [jlptQuestions]
  );
  const visibleTabs = useMemo(
    () => tabs.filter((tab) => user?.role === 'admin' || tab.id !== 'users'),
    [user?.role]
  );

  useEffect(() => {
    if (user?.role !== 'admin' && activeTab === 'users') {
      setActiveTab('overview');
    }
  }, [activeTab, user?.role]);

  const run = async (task: () => Promise<void>, success?: string) => {
    setBusy(true);
    try {
      await task();
      if (success) addToast(success, 'success', 2500);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Something went wrong', 'error');
    } finally {
      setBusy(false);
    }
  };

  const loadStats = () => run(async () => setStats((await adminAPI.getStats()).data));
  const loadUsers = () => run(async () => {
    if (user?.role !== 'admin') {
      setUsers([]);
      return;
    }
    setUsers((await adminAPI.getUsers(userFilter)).data);
  });
  const loadCourses = () => run(async () => setCourses((await adminAPI.getCourses(courseFilter)).data));
  const loadLessons = () => run(async () => setLessons((await adminAPI.getLessons()).data));
  const loadTests = () => run(async () => setTests((await adminAPI.getTests(testFilter)).data));
  const loadLessonQuizzes = () => run(async () => setLessonQuizzes((await adminAPI.getTests({ quiz_type: 'lesson_quiz', limit: 200 })).data));
  const loadQuizQuestions = (quizId: number) => run(async () => setQuizQuestions((await adminAPI.getQuizQuestions(quizId)).data));
  const loadJlptExams = () => run(async () => setJlptExams((await adminAPI.getJlptExams(jlptFilter)).data));
  const loadJlptSections = (examId: number) => run(async () => setJlptSections((await adminAPI.getJlptSections(examId)).data));
  const loadJlptQuestions = (sectionId: number) => run(async () => setJlptQuestions((await adminAPI.getJlptSectionQuestions(sectionId)).data));
  const loadReadingPassages = (level?: AdminJlptLevel) => run(async () => setReadingPassages((await adminAPI.getReadingPassages(level ? { jlpt_level: level } : {})).data));
  const loadBlogs = () => run(async () => setBlogs((await adminAPI.getBlogs(blogFilter)).data));

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'owner') return;
    void loadStats();
    if (user.role === 'admin') void loadUsers();
    void loadCourses();
    void loadLessons();
    void loadTests();
    void loadLessonQuizzes();
    void loadJlptExams();
    void loadBlogs();
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    const timer = window.setTimeout(() => void loadUsers(), 350);
    return () => window.clearTimeout(timer);
  }, [userFilter.search, userFilter.role, userFilter.sort_order]);

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'owner') return;
    const timer = window.setTimeout(() => void loadCourses(), 350);
    return () => window.clearTimeout(timer);
  }, [courseFilter.search, courseFilter.level, courseFilter.sort_order]);

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'owner') return;
    const timer = window.setTimeout(() => void loadTests(), 350);
    return () => window.clearTimeout(timer);
  }, [testFilter.search, testFilter.quiz_type, testFilter.sort_order]);

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'owner') return;
    const timer = window.setTimeout(() => void loadJlptExams(), 350);
    return () => window.clearTimeout(timer);
  }, [jlptFilter.search, jlptFilter.sort_order]);

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'owner') return;
    const timer = window.setTimeout(() => void loadBlogs(), 350);
    return () => window.clearTimeout(timer);
  }, [blogFilter.search, blogFilter.status, blogFilter.sort_order]);

  if (loading) return <div className="min-h-screen bg-background p-8 text-on-surface">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin' && user.role !== 'owner') return <Navigate to="/" replace />;

  const refreshAll = async () => {
    await Promise.all([
      loadStats(),
      user.role === 'admin' ? loadUsers() : Promise.resolve(),
      loadCourses(),
      loadLessons(),
      loadTests(),
      loadLessonQuizzes(),
      loadJlptExams(),
      loadBlogs(),
    ]);
  };

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

  const openCreateUser = () => {
    setEditingUserId(null);
    setUserForm(emptyUser);
    setActiveModal('user');
  };

  const openEditUser = (item: UserProfile) => {
    setEditingUserId(item.user_id);
    setUserForm({ username: item.username, email: item.email, password: '', role: item.role as AdminRole, status: (item.status === 'suspended' ? 'suspended' : 'active') as AdminUserStatus });
    setActiveModal('user');
  };

  const deleteUser = (item: UserProfile) => {
    if (user?.user_id === item.user_id) {
      addToast('Cannot delete current account', 'error');
      return;
    }

    const confirmed = window.confirm(`Soft delete user "${item.username}"? The account will be marked deleted and blocked from signing in, while related history is kept.`);
    if (!confirmed) return;

    void run(async () => {
      await adminAPI.deleteUser(item.user_id);
      if (editingUserId === item.user_id) {
        setEditingUserId(null);
        closeModal();
      }
      await Promise.all([loadUsers(), loadStats()]);
    }, 'User deleted successfully');
  };

  const openCreateCourse = () => {
    setEditingCourseId(null);
    setCourseForm(emptyCourse);
    setActiveModal('course');
  };

  const openEditCourse = (item: AdminCourse) => {
    setEditingCourseId(item.course_id);
    setCourseForm({
      title: item.title,
      description: item.description || '',
      price: item.price,
      level: courseLevelOptions.some((option) => option.value === item.level) ? item.level || 'beginner' : 'beginner',
      duration: item.duration?.toString() || '',
      cover_asset_id: item.cover_asset_id ?? null,
      image_url: item.image_url || '',
    });
    setActiveModal('course');
  };

  const openManageLessons = (courseId: number) => {
    setManagingLessonsCourseId(courseId);
    setEditingLessonId(null);
    setActiveModal('lessons');
  };

  const moveLesson = (lessonId: number, direction: 'up' | 'down') => {
    const currentIndex = sortedCourseLessons.findIndex((lesson) => lesson.lesson_id === lessonId);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentLesson = sortedCourseLessons[currentIndex];
    const targetLesson = sortedCourseLessons[targetIndex];

    if (!currentLesson || !targetLesson) return;

    void run(async () => {
      await Promise.all([
        adminAPI.updateLesson(currentLesson.lesson_id, { order_index: targetLesson.order_index }),
        adminAPI.updateLesson(targetLesson.lesson_id, { order_index: currentLesson.order_index }),
      ]);
      await Promise.all([loadLessons(), loadCourses()]);
    }, 'Lesson order updated successfully');
  };

  const deleteCourse = (course: AdminCourse) => {
    const confirmed = window.confirm(`Hide course "${course.title}" from learners and admin lists? Lessons and quizzes will be hidden, but learner history is kept.`);
    if (!confirmed) return;

    void run(async () => {
      await adminAPI.deleteCourse(course.course_id);
      if (editingCourseId === course.course_id || managingLessonsCourseId === course.course_id) {
        setEditingCourseId(null);
        setManagingLessonsCourseId(null);
        closeModal();
      }
      await Promise.all([loadCourses(), loadLessons(), loadTests(), loadLessonQuizzes(), loadStats()]);
    }, 'Course hidden successfully');
  };

  const deleteLesson = (lesson: AdminLesson) => {
    const confirmed = window.confirm(`Hide lesson "${lesson.title}" from learners and admin lists? Lesson quizzes will be hidden, but learner progress and answers are kept.`);
    if (!confirmed) return;

    void run(async () => {
      await adminAPI.deleteLesson(lesson.lesson_id);
      if (editingLessonId === lesson.lesson_id) {
        setEditingLessonId(null);
        setActiveModal(managingLessonsCourseId ? 'lessons' : null);
      }
      await Promise.all([loadLessons(), loadCourses(), loadTests(), loadLessonQuizzes(), loadStats()]);
    }, 'Lesson hidden successfully');
  };

  const openCreateLesson = (courseId?: number | null) => {
    const targetCourseId = courseId ?? managingLessonsCourseId;
    if (targetCourseId) setManagingLessonsCourseId(targetCourseId);
    setEditingLessonId(null);
    setLessonForm({
      ...emptyLesson,
      course_id: targetCourseId ? String(targetCourseId) : '',
      order_index:
        targetCourseId
          ? lessons.filter((lesson) => lesson.course_id === targetCourseId).length + 1
          : emptyLesson.order_index,
    });
    setActiveModal('lesson');
  };

  const openEditLesson = (item: AdminLesson) => {
    setEditingLessonId(item.lesson_id);
    setLessonForm({
      course_id: String(item.course_id),
      title: item.title,
      content_text: item.content_text || '',
      video_asset_id: item.video_asset_id ?? null,
      video_url: item.video_url || '',
      audio_asset_id: item.audio_asset_id ?? null,
      audio_url: item.audio_url || '',
      order_index: item.order_index,
      duration: item.duration?.toString() || '',
    });
    setManagingLessonsCourseId(item.course_id);
    setActiveModal('lesson');
  };

  const openCreateTest = () => {
    setEditingTestId(null);
    setTestForm(emptyTest);
    setReturnModalAfterTest(null);
    setActiveModal('test');
  };

  const openEditTest = (item: AdminTest) => {
    setEditingTestId(item.quiz_id);
    setTestForm({
      title: item.title,
      description: item.description || '',
      quiz_type: item.quiz_type,
      course_id: item.course_id?.toString() || '',
      lesson_id: item.lesson_id?.toString() || '',
      passing_score: item.passing_score,
      total_marks: item.total_marks,
      time_limit_minutes: item.time_limit_minutes?.toString() || '',
    });
    setReturnModalAfterTest(null);
    setActiveModal('test');
  };

  const openCreateLessonQuiz = () => {
    if (!editingLessonId) return;
    setEditingTestId(null);
    setTestForm({
      ...emptyTest,
      title: lessonForm.title ? `${lessonForm.title} Quiz` : 'Lesson Quiz',
      quiz_type: 'lesson_quiz',
      course_id: lessonForm.course_id,
      lesson_id: String(editingLessonId),
      passing_score: 70,
    });
    setReturnModalAfterTest('lesson');
    setActiveModal('test');
  };

  const openEditLessonQuiz = (quiz: AdminTest) => {
    setEditingTestId(quiz.quiz_id);
    setTestForm({
      title: quiz.title,
      description: quiz.description || '',
      quiz_type: quiz.quiz_type,
      course_id: quiz.course_id?.toString() || lessonForm.course_id,
      lesson_id: quiz.lesson_id?.toString() || (editingLessonId ? String(editingLessonId) : ''),
      passing_score: quiz.passing_score,
      total_marks: quiz.total_marks,
      time_limit_minutes: quiz.time_limit_minutes?.toString() || '',
    });
    setReturnModalAfterTest('lesson');
    setActiveModal('test');
  };

  const openManageQuestions = (quizId: number) => {
    setManagingQuestionsQuizId(quizId);
    setManagingJlptSectionId(null);
    setJlptQuestions([]);
    setEditingQuestionId(null);
    setQuizQuestions([]);
    void loadQuizQuestions(quizId);
    setActiveModal('questions');
  };

  const openCreateQuestion = () => {
    setEditingQuestionId(null);
    const section = managingJlptSection?.section_type ?? emptyQuestion.section_type;
    const sectionQuestionCount = managingJlptSectionId ? jlptQuestions.length : quizQuestions.filter((question) => question.section_type === section).length;
    setQuestionForm({
      ...emptyQuestion,
      jlpt_level: selectedJlptExam?.jlpt_level ?? emptyQuestion.jlpt_level,
      section_type: section,
      reading_passage_id: '',
      order_index: String(sectionQuestionCount + 1),
    });
    if (section === 'reading') void loadReadingPassages(selectedJlptExam?.jlpt_level);
    setActiveModal('question');
  };

  const openAutoJlptQuestions = () => {
    if (!managingJlptSection || !['vocabulary', 'grammar'].includes(managingJlptSection.section_type)) return;
    setAutoJlptQuestionsForm({
      ...emptyAutoJlptQuestions,
      jlpt_level: selectedJlptExam?.jlpt_level ?? emptyAutoJlptQuestions.jlpt_level,
    });
    setActiveModal('autoJlptQuestions');
  };

  const openEditQuestion = (question: AdminQuizQuestion) => {
    setEditingQuestionId(question.question_id);
    setQuestionForm({
      question_text: question.question_text,
      question_type: question.question_type,
      difficulty_level: difficultyOptions.some((option) => option.value === question.difficulty_level) ? question.difficulty_level || 'easy' : 'easy',
      explanation: question.explanation || '',
      points: question.points,
      jlpt_level: jlptLevelOptions.some((option) => option.value === question.jlpt_level) ? question.jlpt_level || 'N5' : 'N5',
      section_type: sectionTypeOptions.some((option) => option.value === question.section_type) ? question.section_type || 'vocabulary' : 'vocabulary',
      reading_passage_id: question.reading_passage_id?.toString() || '',
      image_asset_id: question.image_asset_id ?? null,
      image_url: question.image_url || '',
      audio_asset_id: question.audio_asset_id ?? null,
      audio_url: question.audio_url || '',
      order_index: question.order_index?.toString() || '',
      marks: question.marks,
      options: question.options.length
        ? question.options.map((option) => ({
            option_id: option.option_id,
            option_text: option.option_text,
            is_correct: option.is_correct,
            explanation: option.explanation || '',
          }))
        : emptyQuestion.options,
    });
    setActiveModal('question');
  };

  const moveQuestion = (questionId: number, direction: 'up' | 'down') => {
    if (!managingQuestionsQuizId && !managingJlptSectionId) return;
    const sourceQuestions = managingJlptSectionId ? jlptQuestions : quizQuestions;
    const sortedQuestions = [...sourceQuestions].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0) || a.question_id - b.question_id);
    const currentIndex = sortedQuestions.findIndex((question) => question.question_id === questionId);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentQuestion = sortedQuestions[currentIndex];
    const targetQuestion = sortedQuestions[targetIndex];

    if (!currentQuestion || !targetQuestion) return;

    void run(async () => {
      if (managingJlptSectionId) {
        await Promise.all([
          adminAPI.updateJlptSectionQuestionOrder(managingJlptSectionId, currentQuestion.question_id, targetQuestion.order_index ?? targetIndex + 1),
          adminAPI.updateJlptSectionQuestionOrder(managingJlptSectionId, targetQuestion.question_id, currentQuestion.order_index ?? currentIndex + 1),
        ]);
        await Promise.all([loadJlptQuestions(managingJlptSectionId), managingJlptExamId ? loadJlptSections(managingJlptExamId) : Promise.resolve(), loadJlptExams()]);
        return;
      }

      if (managingQuestionsQuizId) {
        await Promise.all([
          adminAPI.updateQuizQuestionOrder(managingQuestionsQuizId, currentQuestion.question_id, targetQuestion.order_index ?? targetIndex + 1),
          adminAPI.updateQuizQuestionOrder(managingQuestionsQuizId, targetQuestion.question_id, currentQuestion.order_index ?? currentIndex + 1),
        ]);
        await Promise.all([loadQuizQuestions(managingQuestionsQuizId), loadTests(), loadLessonQuizzes()]);
      }
    }, 'Question order updated successfully');
  };

  const deleteQuestion = (question: AdminQuizQuestion) => {
    if (!managingQuestionsQuizId && !managingJlptSectionId) return;
    const confirmed = window.confirm(`Hide question "${question.question_text}" from this ${managingJlptSectionId ? 'JLPT section' : 'quiz'}? Existing learner answers are kept.`);
    if (!confirmed) return;

    void run(async () => {
      if (managingJlptSectionId) {
        await adminAPI.deleteJlptSectionQuestion(managingJlptSectionId, question.question_id);
        await Promise.all([loadJlptQuestions(managingJlptSectionId), managingJlptExamId ? loadJlptSections(managingJlptExamId) : Promise.resolve(), loadJlptExams()]);
        return;
      }

      if (managingQuestionsQuizId) {
        await adminAPI.deleteQuizQuestion(managingQuestionsQuizId, question.question_id);
        await Promise.all([loadQuizQuestions(managingQuestionsQuizId), loadTests(), loadLessonQuizzes(), loadStats()]);
      }
    }, 'Question hidden successfully');
  };

  const deleteTest = (test: AdminTest) => {
    const confirmed = window.confirm(`Hide quiz/test "${test.title}" from learners and admin lists? Learner attempts and answers will be kept.`);
    if (!confirmed) return;

    void run(async () => {
      await adminAPI.deleteTest(test.quiz_id);
      if (editingTestId === test.quiz_id || managingQuestionsQuizId === test.quiz_id) {
        setEditingTestId(null);
        setManagingQuestionsQuizId(null);
        setQuizQuestions([]);
        closeModal();
      }
      await Promise.all([loadTests(), loadLessonQuizzes(), loadStats()]);
    }, 'Test hidden successfully');
  };

  const openCreateJlptExam = () => {
    setEditingJlptExamId(null);
    setManagingJlptExamId(null);
    setJlptExamForm(emptyJlptExam);
    setJlptSections([]);
    setJlptQuestions([]);
    setActiveModal('jlptExam');
  };

  const openEditJlptExam = (exam: AdminJlptExam) => {
    setEditingJlptExamId(exam.exam_id);
    setManagingJlptExamId(null);
    setJlptExamForm({
      title: exam.title,
      jlpt_level: exam.jlpt_level,
      year: exam.year?.toString() || '',
      duration_minutes: exam.duration_minutes?.toString() || '',
      sections: emptyJlptExam.sections,
    });
    setActiveModal('jlptExam');
  };

  const openManageJlptSections = (examId: number) => {
    setManagingJlptExamId(examId);
    setManagingQuestionsQuizId(null);
    setEditingJlptExamId(null);
    setEditingJlptSectionId(null);
    setManagingJlptSectionId(null);
    setQuizQuestions([]);
    setJlptQuestions([]);
    void loadJlptSections(examId);
    setActiveModal('jlptSections');
  };

  const openEditJlptSection = (section: AdminJlptSection) => {
    setEditingJlptSectionId(section.section_id);
    setJlptSectionForm({
      title: section.title || '',
      section_type: section.section_type,
      section_order: section.section_order ?? 1,
      duration_minutes: section.duration_minutes?.toString() || '',
      audio_asset_id: section.audio_asset_id ?? null,
      audio_url: section.audio_url || '',
    });
    setActiveModal('jlptSection');
  };

  const openCreateJlptSection = () => {
    if (!managingJlptExamId) return;
    const existingTypes = new Set(jlptSections.map((section) => section.section_type));
    const nextType = sectionTypeOptions.find((option) => !existingTypes.has(option.value))?.value ?? 'vocabulary';
    setEditingJlptSectionId(null);
    setJlptSectionForm({
      ...emptyJlptSection,
      title: optionLabel(sectionTypeOptions, nextType),
      section_type: nextType,
      section_order: sortedJlptSections.length + 1,
    });
    setActiveModal('jlptSection');
  };

  const openManageJlptQuestions = (section: AdminJlptSection) => {
    setManagingJlptSectionId(section.section_id);
    setManagingQuestionsQuizId(null);
    setQuizQuestions([]);
    setEditingJlptSectionId(null);
    setEditingQuestionId(null);
    setJlptQuestions([]);
    void loadJlptQuestions(section.section_id);
    if (section.section_type === 'reading') void loadReadingPassages(selectedJlptExam?.jlpt_level);
    setActiveModal('jlptSections');
  };

  const openCreateReadingPassage = () => {
    setEditingReadingPassageId(null);
    setReadingPassageForm({
      ...emptyReadingPassage,
      jlpt_level: selectedJlptExam?.jlpt_level ?? emptyReadingPassage.jlpt_level,
    });
    setActiveModal('readingPassage');
  };

  const openEditReadingPassage = (passage: AdminReadingPassage) => {
    setEditingReadingPassageId(passage.passage_id);
    setReadingPassageForm({
      title: passage.title || '',
      jlpt_level: passage.jlpt_level,
      passage_text: passage.passage_text || '',
      image_asset_id: passage.image_asset_id ?? null,
      image_url: passage.image_url || '',
    });
    setActiveModal('readingPassage');
  };

  const submitJlptExam = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      const payload = {
        title: jlptExamForm.title,
        jlpt_level: jlptExamForm.jlpt_level,
        year: toNullableNumber(jlptExamForm.year),
        duration_minutes: toNullableNumber(jlptExamForm.duration_minutes),
      };

      if (editingJlptExamId) {
        await adminAPI.updateJlptExam(editingJlptExamId, payload);
      } else {
        const sections = jlptExamForm.sections.map((sectionType, index) => ({
          title: optionLabel(sectionTypeOptions, sectionType),
          section_type: sectionType,
          section_order: index + 1,
          duration_minutes: null,
          audio_asset_id: null,
          audio_url: null,
        }));
        const created = await adminAPI.createJlptExam({ ...payload, sections });
        setEditingJlptExamId(created.data.exam_id);
        setManagingJlptExamId(created.data.exam_id);
        await loadJlptSections(created.data.exam_id);
      }
      await loadJlptExams();
      setActiveModal('jlptExam');
    }, editingJlptExamId ? 'JLPT test updated successfully' : 'JLPT test created successfully');
  };

  const submitJlptSection = (event: FormEvent) => {
    event.preventDefault();
    if (!editingJlptSectionId && !managingJlptExamId) return;

    void run(async () => {
      const sectionType = jlptSectionForm.section_type;
      const payload = {
        title: jlptSectionForm.title || optionLabel(sectionTypeOptions, sectionType),
        section_type: sectionType,
        section_order: Number(jlptSectionForm.section_order),
        duration_minutes: toNullableNumber(jlptSectionForm.duration_minutes),
        audio_asset_id: sectionType === 'listening' ? jlptSectionForm.audio_asset_id : null,
        audio_url: sectionType === 'listening' ? jlptSectionForm.audio_url || null : null,
      };

      if (editingJlptSectionId) await adminAPI.updateJlptSection(editingJlptSectionId, payload);
      else if (managingJlptExamId) await adminAPI.createJlptSection(managingJlptExamId, payload);

      if (managingJlptExamId) await loadJlptSections(managingJlptExamId);
      await loadJlptExams();
      setActiveModal('jlptSections');
    }, editingJlptSectionId ? 'JLPT section updated successfully' : 'JLPT section created successfully');
  };

  const deleteJlptSection = (section: AdminJlptSection) => {
    const confirmed = window.confirm(`Hide section "${section.title || optionLabel(sectionTypeOptions, section.section_type)}"? Its question links will be hidden, while question records remain available.`);
    if (!confirmed) return;

    void run(async () => {
      await adminAPI.deleteJlptSection(section.section_id);
      if (managingJlptSectionId === section.section_id) {
        setManagingJlptSectionId(null);
        setJlptQuestions([]);
      }
      if (editingJlptSectionId === section.section_id) {
        setEditingJlptSectionId(null);
        setActiveModal('jlptSections');
      }
      if (managingJlptExamId) await loadJlptSections(managingJlptExamId);
      await loadJlptExams();
    }, 'JLPT section hidden successfully');
  };

  const deleteJlptExam = (exam: AdminJlptExam) => {
    const confirmed = window.confirm(`Hide JLPT test "${exam.title}"? Sections and section-question links will be hidden, while question records remain available for history.`);
    if (!confirmed) return;

    void run(async () => {
      await adminAPI.deleteJlptExam(exam.exam_id);
      if (editingJlptExamId === exam.exam_id || managingJlptExamId === exam.exam_id) {
        setEditingJlptExamId(null);
        setManagingJlptExamId(null);
        setManagingJlptSectionId(null);
        setJlptSections([]);
        setJlptQuestions([]);
        closeModal();
      }
      await loadJlptExams();
    }, 'JLPT test hidden successfully');
  };

  const openCreateBlog = () => {
    setEditingBlogId(null);
    setBlogForm(emptyBlog);
    setActiveModal('blog');
  };

  const openEditBlog = (item: AdminBlog) => {
    setEditingBlogId(item.blog_id);
    setBlogForm({
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt || '',
      content: item.content || '',
      category: item.category || '',
      tags: item.tags?.map((tag) => tag.name).join(', ') || '',
      cover_asset_id: item.cover_asset_id ?? null,
      image_url: item.image_url || '',
      video_asset_id: item.video_asset_id ?? null,
      video_url: item.video_url || '',
      status: item.status,
    });
    setActiveModal('blog');
  };

  const deleteBlog = (item: AdminBlog) => {
    const confirmed = window.confirm(`Hide blog "${item.title}"?`);
    if (!confirmed) return;

    void run(async () => {
      await adminAPI.deleteBlog(item.blog_id);
      if (editingBlogId === item.blog_id) {
        setEditingBlogId(null);
        closeModal();
      }
      await Promise.all([loadBlogs(), loadStats()]);
    }, 'Blog hidden successfully');
  };

  const uploadAsset = async (
    file: File,
    mediaKind: 'image' | 'video' | 'audio',
    scope: string,
    fieldKey: string
  ): Promise<AdminCloudinaryAsset> => {
    setUploadingField(fieldKey);
    try {
      const response = await adminAPI.uploadAsset({ file, media_kind: mediaKind, scope });
      addToast('Asset uploaded successfully', 'success', 2500);
      return response.data;
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Upload failed', 'error');
      throw err;
    } finally {
      setUploadingField(null);
    }
  };

  const submitUser = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      if (editingUserId) {
        await adminAPI.updateUser(editingUserId, {
          username: userForm.username,
          email: userForm.email,
          role: userForm.role,
          status: userForm.status,
        });
      } else {
        const created = await adminAPI.createUser(userForm);
        setEditingUserId(created.data.user_id);
        setUserForm({ username: created.data.username, email: created.data.email, password: '', role: created.data.role as AdminRole, status: 'active' });
      }
      await Promise.all([loadUsers(), loadStats()]);
    }, editingUserId ? 'User updated successfully' : 'User created successfully');
  };

  const submitCourse = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      const payload = {
        title: courseForm.title,
        description: courseForm.description || null,
        price: Number(courseForm.price),
        level: courseForm.level,
        duration: toNullableNumber(courseForm.duration),
        cover_asset_id: courseForm.cover_asset_id,
        image_url: courseForm.image_url || null,
      };
      if (editingCourseId) {
        await adminAPI.updateCourse(editingCourseId, payload);
      } else {
        const created = await adminAPI.createCourse(payload);
        setEditingCourseId(created.data.course_id);
        setLessonForm({ ...emptyLesson, course_id: String(created.data.course_id) });
      }
      await Promise.all([loadCourses(), loadStats()]);
    }, editingCourseId ? 'Course updated successfully' : 'Course created successfully');
  };

  const submitLesson = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      const courseId = Number(lessonForm.course_id || editingCourseId);
      if (!Number.isFinite(courseId) || courseId <= 0) throw new Error('Select a course before adding a lesson');
      const payload = {
        course_id: courseId,
        title: lessonForm.title,
        content_text: lessonForm.content_text || null,
        video_asset_id: lessonForm.video_asset_id,
        video_url: lessonForm.video_url || null,
        audio_asset_id: lessonForm.audio_asset_id,
        audio_url: lessonForm.audio_url || null,
        order_index: Number(lessonForm.order_index),
        duration: toNullableNumber(lessonForm.duration),
      };
      if (editingLessonId) {
        await adminAPI.updateLesson(editingLessonId, payload);
      } else {
        const created = await adminAPI.createLesson(payload);
        setEditingLessonId(created.data.lesson_id);
        setManagingLessonsCourseId(courseId);
      }
      await Promise.all([loadLessons(), loadCourses(), loadStats()]);
      setActiveModal('lesson');
    }, editingLessonId ? 'Lesson updated successfully' : 'Lesson created successfully');
  };

  const submitTest = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      const payload = {
        title: testForm.title,
        description: testForm.description || null,
        quiz_type: testForm.quiz_type,
        course_id: toNullableNumber(testForm.course_id),
        lesson_id: toNullableNumber(testForm.lesson_id),
        passing_score: Number(testForm.passing_score),
        total_marks: Number(testForm.total_marks),
        time_limit_minutes: toNullableNumber(testForm.time_limit_minutes),
      };
      if (editingTestId) await adminAPI.updateTest(editingTestId, payload);
      else {
        const created = await adminAPI.createTest(payload);
        setEditingTestId(created.data.quiz_id);
      }
      await Promise.all([loadTests(), loadLessonQuizzes(), loadStats()]);
      setActiveModal('test');
    }, editingTestId ? 'Test updated successfully' : 'Test created successfully');
  };

  const submitQuestion = (event: FormEvent) => {
    event.preventDefault();
    if (!managingQuestionsQuizId && !managingJlptSectionId) return;

    void run(async () => {
      const sectionType = managingJlptSection?.section_type ?? questionForm.section_type;
      const allowQuestionAudio = !managingJlptSectionId && sectionType === 'listening';
      const payload = {
        question_text: questionForm.question_text,
        question_type: questionForm.question_type,
        difficulty_level: questionForm.difficulty_level,
        explanation: questionForm.explanation || null,
        points: Number(questionForm.points),
        jlpt_level: questionForm.jlpt_level,
        section_type: sectionType,
        reading_passage_id: sectionType === 'reading' ? toNullableNumber(questionForm.reading_passage_id) : null,
        image_asset_id: questionForm.image_asset_id,
        image_url: questionForm.image_url || null,
        audio_asset_id: allowQuestionAudio ? questionForm.audio_asset_id : null,
        audio_url: allowQuestionAudio ? questionForm.audio_url || null : null,
        order_index: toNullableNumber(questionForm.order_index),
        marks: Number(questionForm.marks),
        options: questionForm.options
          .filter((option) => option.option_text.trim())
          .map((option) => ({
            option_id: option.option_id,
            option_text: option.option_text,
            is_correct: option.is_correct,
            explanation: option.explanation || null,
          })),
      };

      if (managingJlptSectionId) {
        if (editingQuestionId) await adminAPI.updateJlptSectionQuestion(managingJlptSectionId, editingQuestionId, payload);
        else await adminAPI.createJlptSectionQuestion(managingJlptSectionId, payload);
        await Promise.all([loadJlptQuestions(managingJlptSectionId), managingJlptExamId ? loadJlptSections(managingJlptExamId) : Promise.resolve(), loadJlptExams()]);
        setActiveModal('jlptSections');
        return;
      }

      if (managingQuestionsQuizId) {
        if (editingQuestionId) await adminAPI.updateQuizQuestion(managingQuestionsQuizId, editingQuestionId, payload);
        else await adminAPI.createQuizQuestion(managingQuestionsQuizId, payload);
        await Promise.all([loadQuizQuestions(managingQuestionsQuizId), loadTests(), loadLessonQuizzes(), loadStats()]);
        setActiveModal('questions');
      }
    }, editingQuestionId ? 'Question updated successfully' : 'Question created successfully');
  };

  const submitAutoJlptQuestions = (event: FormEvent) => {
    event.preventDefault();
    if (!managingJlptSectionId) return;

    void run(async () => {
      const result = await adminAPI.autoAddJlptSectionQuestions(managingJlptSectionId, {
        jlpt_level: autoJlptQuestionsForm.jlpt_level,
        difficulty_counts: {
          easy: Number(autoJlptQuestionsForm.easy) || 0,
          medium: Number(autoJlptQuestionsForm.medium) || 0,
          hard: Number(autoJlptQuestionsForm.hard) || 0,
          expert: Number(autoJlptQuestionsForm.expert) || 0,
        },
      });
      setJlptQuestions(result.data);
      await Promise.all([managingJlptExamId ? loadJlptSections(managingJlptExamId) : Promise.resolve(), loadJlptExams(), loadStats()]);
      setActiveModal('jlptSections');
    }, 'Questions added from bank successfully');
  };

  const submitReadingPassage = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      const payload = {
        title: readingPassageForm.title || null,
        jlpt_level: readingPassageForm.jlpt_level,
        passage_text: readingPassageForm.passage_text || null,
        image_asset_id: readingPassageForm.image_asset_id,
        image_url: readingPassageForm.image_url || null,
      };

      if (editingReadingPassageId) await adminAPI.updateReadingPassage(editingReadingPassageId, payload);
      else await adminAPI.createReadingPassage(payload);

      await loadReadingPassages(selectedJlptExam?.jlpt_level);
      setActiveModal('jlptSections');
    }, editingReadingPassageId ? 'Reading passage updated successfully' : 'Reading passage created successfully');
  };

  const submitBlog = (event: FormEvent) => {
    event.preventDefault();
    void run(async () => {
      const payload = {
        title: blogForm.title,
        slug: blogForm.slug || undefined,
        excerpt: blogForm.excerpt || null,
        content: blogForm.content || null,
        category_name: blogForm.category || null,
        tags: blogForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        cover_asset_id: blogForm.cover_asset_id,
        image_url: blogForm.image_url || null,
        video_asset_id: blogForm.video_asset_id,
        video_url: blogForm.video_url || null,
        status: blogForm.status,
      };
      if (editingBlogId) await adminAPI.updateBlog(editingBlogId, payload);
      else {
        const created = await adminAPI.createBlog(payload);
        setEditingBlogId(created.data.blog_id);
      }
      await Promise.all([loadBlogs(), loadStats()]);
    }, editingBlogId ? 'Blog updated successfully' : 'Blog created successfully');
  };

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
          <section className="space-y-6">
            <div className={`grid grid-cols-1 gap-4 ${user.role === 'admin' ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
              {user.role === 'admin' && <StatTile label="Users" value={stats.totals.users} icon="group" />}
              <StatTile label="Courses" value={stats.totals.courses} icon="school" />
              <StatTile label="Lessons" value={stats.totals.lessons} icon="menu_book" />
              <StatTile label="Tests" value={stats.totals.tests} icon="quiz" />
              <StatTile label="Blogs" value={stats.totals.blogs} icon="article" />
            </div>
            <div className={`grid gap-4 ${user.role === 'admin' ? 'lg:grid-cols-2' : ''}`}>
              {user.role === 'admin' && <SummaryPanel title="Users by Role" rows={stats.usersByRole.map((item) => [item.role, item.count])} />}
              <SummaryPanel title="Tests by Type" rows={stats.testsByType.map((item) => [item.quiz_type || 'Uncategorized', item.count])} />
            </div>
          </section>
        )}

        {activeTab === 'users' && user.role === 'admin' && (
          <section className="space-y-4">
            <SectionToolbar title="Users" actionLabel="New User" onAction={openCreateUser}>
              <input className={inputClass} placeholder="Search by name or email" value={userFilter.search} onChange={(e) => setUserFilter({ ...userFilter, search: e.target.value })} />
              <select className={inputClass} value={userFilter.role} onChange={(e) => setUserFilter({ ...userFilter, role: e.target.value as AdminRole | 'all' })}>
                <option value="all">All roles</option>
                <option value="learner">Learner</option>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
              </select>
              <select className={inputClass} value={userFilter.sort_order} onChange={(e) => setUserFilter({ ...userFilter, sort_order: e.target.value as AdminSortOrder })}>
                {sortOrderOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </SectionToolbar>
            <AdminTable
              headers={['ID', 'Username', 'Email', 'Role', 'Status', 'Actions']}
              rows={users.map((item) => [
                item.user_id,
                item.username,
                item.email,
                item.role,
                item.status || 'active',
                <div className="flex flex-wrap gap-2">
                  <button className={secondaryButtonClass} onClick={() => openEditUser(item)}>Edit</button>
                  <button className={dangerButtonClass} disabled={busy || user?.user_id === item.user_id} onClick={() => deleteUser(item)}>
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>,
              ])}
            />
          </section>
        )}

        {activeTab === 'courses' && (
          <section className="space-y-4">
            <SectionToolbar title="Courses & Lessons" actionLabel="New Course" onAction={openCreateCourse}>
              <input className={inputClass} placeholder="Search courses" value={courseFilter.search} onChange={(e) => setCourseFilter({ ...courseFilter, search: e.target.value })} />
              <select className={inputClass} value={courseFilter.level} onChange={(e) => setCourseFilter({ ...courseFilter, level: e.target.value })}>
                <option value="">All levels</option>
                {courseLevelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select className={inputClass} value={courseFilter.sort_order} onChange={(e) => setCourseFilter({ ...courseFilter, sort_order: e.target.value as AdminSortOrder })}>
                {sortOrderOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </SectionToolbar>
            <AdminTable
              headers={['ID', 'Title', 'Level', 'Price', 'Lessons', 'Actions']}
              rows={courses.map((item) => [
                item.course_id,
                item.title,
                optionLabel(courseLevelOptions, item.level),
                Number(item.price).toLocaleString('en-US'),
                item.lesson_count || 0,
                <div className="flex flex-wrap gap-2">
                  <button className={secondaryButtonClass} onClick={() => openEditCourse(item)}>Edit</button>
                  <button className={secondaryButtonClass} onClick={() => openManageLessons(item.course_id)}>Manage Lessons</button>
                  <button className={actionButtonClass} onClick={() => openCreateLesson(item.course_id)}>
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Add Lesson
                  </button>
                  <button className={dangerButtonClass} onClick={() => deleteCourse(item)} disabled={busy}>
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>,
              ])}
            />
          </section>
        )}

        {activeTab === 'tests' && (
          <section className="space-y-4">
            <SectionToolbar title="Tests" actionLabel="New Test" onAction={openCreateTest}>
              <input className={inputClass} placeholder="Search tests" value={testFilter.search} onChange={(e) => setTestFilter({ ...testFilter, search: e.target.value })} />
              <select className={inputClass} value={testFilter.quiz_type} onChange={(e) => setTestFilter({ ...testFilter, quiz_type: e.target.value as AdminQuizType | 'all' })}>
                <option value="all">All types</option>
                {quizTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select className={inputClass} value={testFilter.sort_order} onChange={(e) => setTestFilter({ ...testFilter, sort_order: e.target.value as AdminSortOrder })}>
                {sortOrderOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </SectionToolbar>
            <AdminTable
              headers={['ID', 'Title', 'Type', 'Course', 'Questions', 'Actions']}
              rows={tests.map((item) => [
                item.quiz_id,
                item.title,
                optionLabel(quizTypeOptions, item.quiz_type),
                item.course_title || item.course_id || '-',
                item.question_count || 0,
                <div className="flex flex-wrap gap-2">
                  <button className={secondaryButtonClass} onClick={() => openEditTest(item)}>Edit</button>
                  <button className={secondaryButtonClass} onClick={() => openManageQuestions(item.quiz_id)}>
                    <span className="material-symbols-outlined text-[18px]">quiz</span>
                    Questions
                  </button>
                  <button className={dangerButtonClass} disabled={busy} onClick={() => deleteTest(item)}>
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>,
              ])}
            />
          </section>
        )}

        {activeTab === 'jlpt' && (
          <section className="space-y-4">
            <SectionToolbar title="JLPT Tests" actionLabel="New JLPT Test" onAction={openCreateJlptExam}>
              <input className={inputClass} placeholder="Search JLPT tests" value={jlptFilter.search} onChange={(e) => setJlptFilter({ ...jlptFilter, search: e.target.value })} />
              <select className={inputClass} value={jlptFilter.sort_order} onChange={(e) => setJlptFilter({ ...jlptFilter, sort_order: e.target.value as AdminSortOrder })}>
                {sortOrderOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </SectionToolbar>
            <AdminTable
              headers={['ID', 'Title', 'Level', 'Year', 'Sections', 'Questions', 'Actions']}
              rows={jlptExams.map((exam) => [
                exam.exam_id,
                exam.title,
                exam.jlpt_level,
                exam.year || '-',
                exam.section_count || 0,
                exam.question_count || 0,
                <div className="flex flex-wrap gap-2">
                  <button className={secondaryButtonClass} onClick={() => openEditJlptExam(exam)}>Edit</button>
                  <button className={secondaryButtonClass} onClick={() => openManageJlptSections(exam.exam_id)}>
                    <span className="material-symbols-outlined text-[18px]">view_list</span>
                    Sections
                  </button>
                  <button className={dangerButtonClass} disabled={busy} onClick={() => deleteJlptExam(exam)}>
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>,
              ])}
            />
          </section>
        )}

        {activeTab === 'blogs' && (
          <section className="space-y-4">
            <SectionToolbar title="Blogs" actionLabel="New Blog" onAction={openCreateBlog}>
              <input className={inputClass} placeholder="Search blogs" value={blogFilter.search} onChange={(e) => setBlogFilter({ ...blogFilter, search: e.target.value })} />
              <select className={inputClass} value={blogFilter.status} onChange={(e) => setBlogFilter({ ...blogFilter, status: e.target.value as AdminBlogStatus | 'all' })}>
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <select className={inputClass} value={blogFilter.sort_order} onChange={(e) => setBlogFilter({ ...blogFilter, sort_order: e.target.value as AdminSortOrder })}>
                {sortOrderOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </SectionToolbar>
            <AdminTable
              headers={['ID', 'Title', 'Category', 'Status', 'Author', 'Slug', 'Actions']}
              rows={blogs.map((item) => [
                item.blog_id,
                item.title,
                item.category || '-',
                item.status,
                item.author_username || item.author_id,
                item.slug,
                <div className="flex flex-wrap gap-2">
                  <button className={secondaryButtonClass} onClick={() => openEditBlog(item)}>Edit</button>
                  <button className={dangerButtonClass} disabled={busy} onClick={() => deleteBlog(item)}>
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>,
              ])}
            />
          </section>
        )}
          </div>
      </main>
      </div>

      {activeModal === 'user' && (
        <Modal title={editingUserId ? 'Edit User' : 'Create User'} subtitle="Manage account identity and access role." onClose={closeModal}>
          <form onSubmit={submitUser} className="space-y-4">
            <Field label="Username"><input className={inputClass} required value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} /></Field>
            <Field label="Email"><input className={inputClass} required type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} /></Field>
            {!editingUserId && <Field label="Password"><input className={inputClass} required type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} /></Field>}
            <Field label="Role">
              <select className={inputClass} value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value as AdminRole })}>
                <option value="learner">Learner</option>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <Field label="Status">
              <select
                className={inputClass}
                value={userForm.status}
                disabled={!editingUserId}
                onChange={(e) => setUserForm({ ...userForm, status: e.target.value as AdminUserStatus })}
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </Field>
            {editingUserId && (
              <div className="rounded-lg border border-error/30 bg-error/5 p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <p className="text-label-md text-on-surface-variant">This marks the user as deleted and blocks sign-in. Related learning and payment history is kept.</p>
                  </div>
                  <button
                    type="button"
                    className={dangerButtonClass}
                    disabled={busy || user?.user_id === editingUserId}
                    onClick={() => {
                      const currentUser = users.find((item) => item.user_id === editingUserId);
                      if (currentUser) deleteUser(currentUser);
                    }}
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            )}
            <ModalActions busy={busy} submitLabel={editingUserId ? 'Save Changes' : 'Create User'} onCancel={closeModal} />
          </form>
        </Modal>
      )}

      {activeModal === 'course' && (
        <Modal title={editingCourseId ? 'Edit Course' : 'Create Course'} subtitle="Course metadata is owned by the course creator." onClose={closeModal}>
          <form onSubmit={submitCourse} className="space-y-4">
            <Field label="Title"><input className={inputClass} required value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} /></Field>
            <Field label="Description"><textarea className={inputClass} rows={4} value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} /></Field>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Field label="Price"><input className={inputClass} type="number" min="0" value={courseForm.price} onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })} /></Field>
              <Field label="Level">
                <select className={inputClass} value={courseForm.level} onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}>
                  {courseLevelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Duration"><input className={inputClass} type="number" value={courseForm.duration} onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })} /></Field>
            </div>
            <AssetUploader
              label="Course Cover Image"
              accept="image/*"
              previewUrl={courseForm.image_url}
              mediaKind="image"
              scope="courses"
              fieldKey="course-cover"
              uploadingField={uploadingField}
              onUpload={uploadAsset}
              onUploaded={(asset) => setCourseForm({ ...courseForm, cover_asset_id: asset.asset_id, image_url: asset.secure_url })}
            />
            <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <p className="text-label-md font-semibold text-on-surface">Lessons</p>
                  <p className="text-label-md text-on-surface-variant">
                    {editingCourseId ? 'Open lesson management for this course.' : 'Create the course before managing lessons.'}
                  </p>
                </div>
                <button
                  type="button"
                  className={secondaryButtonClass}
                  disabled={!editingCourseId}
                  onClick={() => editingCourseId && openManageLessons(editingCourseId)}
                >
                  <span className="material-symbols-outlined text-[18px]">menu_book</span>
                  Manage Lessons
                </button>
              </div>
            </div>
            {editingCourseId && selectedCourse && (
              <div className="rounded-lg border border-error/30 bg-error/5 p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <p className="text-label-md font-semibold text-error">Hide Course</p>
                    <p className="text-label-md text-on-surface-variant">This hides the course, its lessons, and related quizzes. Learner enrollments, purchases, ratings, attempts, and answers are kept.</p>
                  </div>
                  <button type="button" className={dangerButtonClass} disabled={busy} onClick={() => deleteCourse(selectedCourse)}>
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            )}
            <ModalActions busy={busy} submitLabel={editingCourseId ? 'Save Changes' : 'Create Course'} onCancel={closeModal} />
          </form>
        </Modal>
      )}

      {activeModal === 'lessons' && (
        <Modal
          title="Manage Lessons"
          subtitle={selectedCourse ? selectedCourse.title : 'Choose a course from the Courses table.'}
          onClose={closeModal}
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex flex-col justify-between gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-4 md:flex-row md:items-center">
              <div className="grid grid-cols-2 gap-3 text-label-md text-on-surface-variant md:grid-cols-4">
                <div>
                  <p className="font-semibold text-on-surface">{optionLabel(courseLevelOptions, selectedCourse?.level)}</p>
                  <p>Level</p>
                </div>
                <div>
                  <p className="font-semibold text-on-surface">{sortedCourseLessons.length}</p>
                  <p>Lessons</p>
                </div>
                <div>
                  <p className="font-semibold text-on-surface">{selectedCourse?.duration || '-'}</p>
                  <p>Minutes</p>
                </div>
                <div>
                  <p className="font-semibold text-on-surface">{selectedCourse ? Number(selectedCourse.price).toLocaleString('en-US') : '-'}</p>
                  <p>Price</p>
                </div>
              </div>
              <button className={actionButtonClass} onClick={() => openCreateLesson(selectedCourseId)} disabled={!selectedCourseId}>
                <span className="material-symbols-outlined text-[18px]">add</span>
                New Lesson
              </button>
            </div>
            <AdminTable
              headers={['Order', 'Title', 'Content', 'Quiz', 'Duration', 'Actions']}
              rows={sortedCourseLessons
                .map((item, index) => [
                  item.order_index,
                  <div>
                    <p className="font-semibold text-on-surface">{item.title}</p>
                    <p className="text-label-md text-on-surface-variant">ID #{item.lesson_id}</p>
                  </div>,
                  <div className="flex flex-wrap gap-1">
                    {item.video_url && <span className="rounded bg-primary/10 px-2 py-1 text-label-md text-primary">Video</span>}
                    {item.content_text && <span className="rounded bg-secondary/10 px-2 py-1 text-label-md text-secondary">Text</span>}
                    {item.audio_url && <span className="rounded bg-tertiary/10 px-2 py-1 text-label-md text-tertiary">Audio</span>}
                    {!item.video_url && !item.content_text && !item.audio_url && <span className="text-on-surface-variant">Empty</span>}
                  </div>,
                  lessonQuizzes.some((quiz) => quiz.lesson_id === item.lesson_id) ? (
                    <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-label-md font-semibold text-primary">
                      <span className="material-symbols-outlined text-[16px]">quiz</span>
                      Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded bg-surface-container-low px-2 py-1 text-label-md text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">quiz</span>
                      None
                    </span>
                  ),
                  item.duration || '-',
                  <div className="flex flex-wrap gap-2">
                    <button
                      className={secondaryButtonClass}
                      disabled={busy || index === 0}
                      onClick={() => moveLesson(item.lesson_id, 'up')}
                    >
                      <span className="material-symbols-outlined text-[18px]">keyboard_arrow_up</span>
                    </button>
                    <button
                      className={secondaryButtonClass}
                      disabled={busy || index === sortedCourseLessons.length - 1}
                      onClick={() => moveLesson(item.lesson_id, 'down')}
                    >
                      <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
                    </button>
                    <button className={secondaryButtonClass} onClick={() => openEditLesson(item)}>
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button className={dangerButtonClass} disabled={busy} onClick={() => deleteLesson(item)}>
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>,
                ])}
            />
          </div>
        </Modal>
      )}

      {activeModal === 'lesson' && (
        <Modal
          title={editingLessonId ? 'Edit Lesson' : 'Create Lesson'}
          subtitle={selectedCourse ? `Course: ${selectedCourse.title}` : 'Attach this lesson to a course.'}
          onClose={closeLessonForm}
          size="xl"
        >
          <form onSubmit={submitLesson} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
              <div className="space-y-4">
                <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">article</span>
                    <h3 className="text-title-md font-semibold text-on-surface">Lesson Details</h3>
                  </div>
                  <div className="space-y-4">
                    <Field label="Course">
                      <select
                        className={inputClass}
                        required
                        value={lessonForm.course_id}
                        onChange={(e) => {
                          setLessonForm({ ...lessonForm, course_id: e.target.value });
                          setManagingLessonsCourseId(toNullableNumber(e.target.value));
                        }}
                      >
                        <option value="">Select course</option>
                        {courses.map((course) => <option key={course.course_id} value={course.course_id}>{course.title}</option>)}
                      </select>
                    </Field>
                    <Field label="Title"><input className={inputClass} required value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} /></Field>
                    <Field label="Content"><textarea className={inputClass} rows={8} value={lessonForm.content_text} onChange={(e) => setLessonForm({ ...lessonForm, content_text: e.target.value })} /></Field>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <AssetUploader
                    label="Lesson Video"
                    accept="video/*"
                    previewUrl={lessonForm.video_url}
                    mediaKind="video"
                    scope="lessons"
                    fieldKey="lesson-video"
                    uploadingField={uploadingField}
                    onUpload={uploadAsset}
                    onUploaded={(asset) => setLessonForm({ ...lessonForm, video_asset_id: asset.asset_id, video_url: asset.secure_url })}
                  />
                  <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
                    <div className="mb-3 flex items-start gap-2">
                      <span className="material-symbols-outlined text-[20px] text-primary">link</span>
                      <div>
                        <p className="text-label-md font-semibold text-on-surface">External Video Link</p>
                        <p className="text-label-md text-on-surface-variant">Paste a YouTube, youtu.be, embed, or direct video URL.</p>
                      </div>
                    </div>
                    <input
                      className={inputClass}
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={lessonForm.video_url}
                      onChange={(e) => setLessonForm({ ...lessonForm, video_asset_id: null, video_url: e.target.value })}
                    />
                  </div>
                  <AssetUploader
                    label="Lesson Narration Audio"
                    accept="audio/*"
                    previewUrl={lessonForm.audio_url}
                    mediaKind="audio"
                    scope="lessons"
                    fieldKey="lesson-audio"
                    uploadingField={uploadingField}
                    onUpload={uploadAsset}
                    onUploaded={(asset) => setLessonForm({ ...lessonForm, audio_asset_id: asset.asset_id, audio_url: asset.secure_url })}
                  />
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">tune</span>
                    <h3 className="text-title-md font-semibold text-on-surface">Settings</h3>
                  </div>
                  <div className="space-y-4">
                    <Field label="Order"><input className={inputClass} type="number" min="1" value={lessonForm.order_index} onChange={(e) => setLessonForm({ ...lessonForm, order_index: Number(e.target.value) })} /></Field>
                    <Field label="Duration"><input className={inputClass} type="number" min="0" value={lessonForm.duration} onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })} /></Field>
                  </div>
                </div>
                <div className="rounded-lg border border-outline-variant bg-surface p-4 text-label-md text-on-surface-variant">
                  <p className="mb-2 font-semibold text-on-surface">Current Course</p>
                  <p>{selectedCourse?.title || 'No course selected'}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <span className="rounded bg-surface-container-low px-2 py-1">Lessons: {courseLessons.length}</span>
                    <span className="rounded bg-surface-container-low px-2 py-1">Level: {optionLabel(courseLevelOptions, selectedCourse?.level)}</span>
                  </div>
                </div>
                <div className="rounded-lg border border-outline-variant bg-surface p-4">
                  <div className="mb-3 flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary">quiz</span>
                    <div>
                      <h3 className="text-title-md font-semibold text-on-surface">Lesson Quiz</h3>
                      <p className="text-label-md text-on-surface-variant">
                        {editingLessonId
                          ? currentLessonQuiz
                            ? `${currentLessonQuiz.question_count || 0} questions`
                            : 'No quiz attached'
                          : 'Save the lesson before creating a quiz'}
                      </p>
                    </div>
                  </div>
                  {currentLessonQuiz && (
                    <div className="mb-3 rounded bg-surface-container-low p-3 text-label-md text-on-surface-variant">
                      <p className="font-semibold text-on-surface">{currentLessonQuiz.title}</p>
                      <p>Passing score: {currentLessonQuiz.passing_score}</p>
                      <p>Total marks: {currentLessonQuiz.total_marks}</p>
                    </div>
                  )}
                  <button
                    type="button"
                    className={currentLessonQuiz ? secondaryButtonClass : actionButtonClass}
                    disabled={!editingLessonId}
                    onClick={() => (currentLessonQuiz ? openEditLessonQuiz(currentLessonQuiz) : openCreateLessonQuiz())}
                  >
                    <span className="material-symbols-outlined text-[18px]">{currentLessonQuiz ? 'edit' : 'add'}</span>
                    {currentLessonQuiz ? 'Edit Quiz' : 'Create Quiz'}
                  </button>
                </div>
              </aside>
            </div>
            <ModalActions busy={busy} submitLabel={editingLessonId ? 'Save Changes' : 'Create Lesson'} onCancel={closeLessonForm} />
          </form>
        </Modal>
      )}

      {activeModal === 'test' && (
        <Modal
          title={editingTestId ? 'Edit Test' : 'Create Test'}
          subtitle={returnModalAfterTest === 'lesson' ? 'This quiz is attached to the current lesson.' : 'Configure test metadata and scoring settings.'}
          onClose={closeTestForm}
        >
          <form onSubmit={submitTest} className="space-y-4">
            <Field label="Title"><input className={inputClass} required value={testForm.title} onChange={(e) => setTestForm({ ...testForm, title: e.target.value })} /></Field>
            <Field label="Description"><textarea className={inputClass} rows={3} value={testForm.description} onChange={(e) => setTestForm({ ...testForm, description: e.target.value })} /></Field>
            <Field label="Type">
              <select
                className={inputClass}
                value={testForm.quiz_type}
                onChange={(e) => {
                  const nextType = e.target.value as AdminQuizType;
                  setTestForm({
                    ...testForm,
                    quiz_type: nextType,
                  });
                }}
              >
                {quizTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Course">
                <select className={inputClass} value={testForm.course_id} onChange={(e) => setTestForm({ ...testForm, course_id: e.target.value, lesson_id: '' })}>
                  <option value="">No course</option>
                  {courses.map((course) => (
                    <option key={course.course_id} value={course.course_id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Lesson">
                <select className={inputClass} value={testForm.lesson_id} onChange={(e) => setTestForm({ ...testForm, lesson_id: e.target.value })}>
                  <option value="">No lesson</option>
                  {lessons
                    .filter((lesson) => !testForm.course_id || String(lesson.course_id) === String(testForm.course_id))
                    .map((lesson) => (
                      <option key={lesson.lesson_id} value={lesson.lesson_id}>
                        {lesson.title}
                      </option>
                    ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Field label="Passing Score"><input className={inputClass} type="number" value={testForm.passing_score} onChange={(e) => setTestForm({ ...testForm, passing_score: Number(e.target.value) })} /></Field>
              <Field label="Total Marks"><input className={inputClass} type="number" value={testForm.total_marks} onChange={(e) => setTestForm({ ...testForm, total_marks: Number(e.target.value) })} /></Field>
              <Field label="Time Limit"><input className={inputClass} type="number" value={testForm.time_limit_minutes} onChange={(e) => setTestForm({ ...testForm, time_limit_minutes: e.target.value })} /></Field>
            </div>
            {editingTestId && (
              <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <p className="text-label-md font-semibold text-on-surface">Questions</p>
                    <p className="text-label-md text-on-surface-variant">Create and edit questions for this quiz.</p>
                  </div>
                  <button type="button" className={secondaryButtonClass} onClick={() => openManageQuestions(editingTestId)}>
                    <span className="material-symbols-outlined text-[18px]">quiz</span>
                    Manage Questions
                  </button>
                </div>
              </div>
            )}
            {editingTestId && (
              <div className="rounded-lg border border-error/30 bg-error/5 p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <p className="text-label-md font-semibold text-error">Hide Test</p>
                    <p className="text-label-md text-on-surface-variant">This hides the quiz/test from learners and admin lists. Learner attempts and answers are kept.</p>
                  </div>
                  <button
                    type="button"
                    className={dangerButtonClass}
                    disabled={busy}
                    onClick={() => {
                      const currentTest = tests.find((test) => test.quiz_id === editingTestId) ?? lessonQuizzes.find((test) => test.quiz_id === editingTestId);
                      if (currentTest) deleteTest(currentTest);
                    }}
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            )}
            <ModalActions busy={busy} submitLabel={editingTestId ? 'Save Changes' : 'Create Test'} onCancel={closeTestForm} />
          </form>
        </Modal>
      )}

      {activeModal === 'jlptExam' && (
        <Modal
          title={editingJlptExamId ? 'Edit JLPT Test' : 'Create JLPT Test'}
          subtitle="JLPT tests are managed separately from course quizzes."
          onClose={closeModal}
        >
          <form onSubmit={submitJlptExam} className="space-y-4">
            <Field label="Title"><input className={inputClass} required value={jlptExamForm.title} onChange={(e) => setJlptExamForm({ ...jlptExamForm, title: e.target.value })} /></Field>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Field label="JLPT Level">
                <select className={inputClass} value={jlptExamForm.jlpt_level} onChange={(e) => setJlptExamForm({ ...jlptExamForm, jlpt_level: e.target.value as AdminJlptLevel })}>
                  {jlptLevelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Year"><input className={inputClass} type="number" min="1984" value={jlptExamForm.year} onChange={(e) => setJlptExamForm({ ...jlptExamForm, year: e.target.value })} /></Field>
              <Field label="Duration"><input className={inputClass} type="number" min="0" value={jlptExamForm.duration_minutes} onChange={(e) => setJlptExamForm({ ...jlptExamForm, duration_minutes: e.target.value })} /></Field>
            </div>
            {!editingJlptExamId && (
              <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                <p className="mb-3 text-label-md font-semibold text-on-surface">Sections</p>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                  {sectionTypeOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-label-md text-on-surface">
                      <input
                        type="checkbox"
                        checked={jlptExamForm.sections.includes(option.value)}
                        onChange={(e) => {
                          const nextSections = e.target.checked
                            ? [...jlptExamForm.sections, option.value]
                            : jlptExamForm.sections.filter((section) => section !== option.value);
                          setJlptExamForm({ ...jlptExamForm, sections: sectionTypeOptions.map((item) => item.value).filter((section) => nextSections.includes(section)) });
                        }}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {editingJlptExamId && selectedJlptExam && (
              <div className="space-y-3">
                <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                      <p className="text-label-md font-semibold text-on-surface">Sections and Questions</p>
                      <p className="text-label-md text-on-surface-variant">{selectedJlptExam.section_count || 0} sections, {selectedJlptExam.question_count || 0} questions</p>
                    </div>
                    <button type="button" className={secondaryButtonClass} onClick={() => openManageJlptSections(selectedJlptExam.exam_id)}>
                      <span className="material-symbols-outlined text-[18px]">view_list</span>
                      Manage Sections
                    </button>
                  </div>
                </div>
                <div className="rounded-lg border border-error/30 bg-error/5 p-4">
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                    <div>
                      <p className="text-label-md font-semibold text-error">Hide JLPT Test</p>
                      <p className="text-label-md text-on-surface-variant">This hides the test and its section links without removing question records.</p>
                    </div>
                    <button type="button" className={dangerButtonClass} disabled={busy} onClick={() => deleteJlptExam(selectedJlptExam)}>
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            <ModalActions busy={busy} submitLabel={editingJlptExamId ? 'Save Changes' : 'Create JLPT Test'} onCancel={closeModal} />
          </form>
        </Modal>
      )}

      {activeModal === 'jlptSections' && (
        <Modal
          title="Manage JLPT Sections"
          subtitle={selectedJlptExam ? `${selectedJlptExam.title} (${selectedJlptExam.jlpt_level})` : 'JLPT sections'}
          onClose={closeModal}
          size="xl"
        >
          <div className="space-y-5">
            <div className="space-y-4">
              <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <p className="text-label-md font-semibold text-on-surface">{sortedJlptSections.length} sections</p>
                    <p className="text-label-md text-on-surface-variant">Add, edit, hide sections, or select one to manage questions.</p>
                  </div>
                  <button type="button" className={actionButtonClass} onClick={openCreateJlptSection} disabled={!managingJlptExamId}>
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Add Section
                  </button>
                </div>
              </div>
              <AdminTable
                headers={['Order', 'Section', 'Duration', 'Questions', 'Actions']}
                rows={sortedJlptSections.map((section) => [
                  section.section_order || '-',
                  <div>
                    <p className="font-semibold text-on-surface">{section.title || optionLabel(sectionTypeOptions, section.section_type)}</p>
                    <p className="text-label-md text-on-surface-variant">{optionLabel(sectionTypeOptions, section.section_type)}</p>
                  </div>,
                  section.duration_minutes || '-',
                  section.question_count || 0,
                  <div className="flex flex-wrap gap-2">
                    <button className={secondaryButtonClass} onClick={() => openManageJlptQuestions(section)}>
                      <span className="material-symbols-outlined text-[18px]">quiz</span>
                    </button>
                    <button className={secondaryButtonClass} onClick={() => openEditJlptSection(section)}>
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button className={dangerButtonClass} disabled={busy} onClick={() => deleteJlptSection(section)}>
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>,
                ])}
              />
            </div>
            <div className="space-y-4 rounded-lg border border-outline-variant bg-surface p-4">
              <div className="flex flex-col justify-between gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-4 md:flex-row md:items-center">
                <div>
                  <p className="text-label-md font-semibold text-on-surface">
                    {managingJlptSection ? `${optionLabel(sectionTypeOptions, managingJlptSection.section_type)} Questions` : 'Questions'}
                  </p>
                  <p className="text-label-md text-on-surface-variant">
                    {managingJlptSection ? `${jlptQuestions.length} questions in this section` : 'Select a section first'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {managingJlptSection?.section_type === 'reading' && (
                    <button className={secondaryButtonClass} onClick={openCreateReadingPassage}>
                      <span className="material-symbols-outlined text-[18px]">article</span>
                      New Passage
                    </button>
                  )}
                  <button
                    className={secondaryButtonClass}
                    onClick={openAutoJlptQuestions}
                    disabled={!managingJlptSectionId || !managingJlptSection || !['vocabulary', 'grammar'].includes(managingJlptSection.section_type)}
                  >
                    <span className="material-symbols-outlined text-[18px]">shuffle</span>
                    Auto Add
                  </button>
                  <button className={actionButtonClass} onClick={openCreateQuestion} disabled={!managingJlptSectionId}>
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    New Question
                  </button>
                </div>
              </div>
              {managingJlptSection?.section_type === 'reading' && (
                <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-label-md font-semibold text-on-surface">{readingPassages.length} reading passages</p>
                    <button type="button" className={secondaryButtonClass} onClick={() => void loadReadingPassages(selectedJlptExam?.jlpt_level)}>
                      <span className="material-symbols-outlined text-[18px]">refresh</span>
                    </button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {readingPassages.map((passage) => (
                      <button
                        key={passage.passage_id}
                        type="button"
                        className="rounded-lg border border-outline-variant bg-surface p-3 text-left hover:border-primary"
                        onClick={() => openEditReadingPassage(passage)}
                      >
                        <p className="truncate font-semibold text-on-surface">{passage.title || `Passage #${passage.passage_id}`}</p>
                        <p className="mt-1 line-clamp-2 text-label-md text-on-surface-variant">{passage.passage_text || passage.image_url || 'Image passage'}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {!managingJlptSectionId ? (
                <div className="rounded-lg border border-dashed border-outline-variant bg-surface-container-lowest p-6 text-center text-on-surface-variant">
                  Select a section to view and manage its questions.
                </div>
              ) : sortedJlptQuestions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-outline-variant bg-surface-container-lowest p-6 text-center text-on-surface-variant">
                  No questions in this section yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedJlptQuestions.map((question, index) => (
                    <article key={question.question_id} className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="rounded bg-primary/10 px-2 py-1 text-label-sm font-semibold text-primary">
                              #{question.order_index || index + 1}
                            </span>
                            <span className="rounded bg-surface-container px-2 py-1 text-label-sm text-on-surface-variant">
                              {optionLabel(questionTypeOptions, question.question_type)}
                            </span>
                            <span className="rounded bg-surface-container px-2 py-1 text-label-sm text-on-surface-variant">
                              {question.options.length} options
                            </span>
                            {question.image_url && (
                              <span className="rounded bg-surface-container px-2 py-1 text-label-sm text-on-surface-variant">Image</span>
                            )}
                            {question.audio_url && (
                              <span className="rounded bg-surface-container px-2 py-1 text-label-sm text-on-surface-variant">Audio</span>
                            )}
                          </div>
                          <p className="break-words text-body-md font-semibold text-on-surface">{question.question_text}</p>
                          {question.explanation && <p className="mt-1 break-words text-label-md text-on-surface-variant">{question.explanation}</p>}
                        </div>
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <button className={secondaryButtonClass} disabled={busy || index === 0} onClick={() => moveQuestion(question.question_id, 'up')}>
                            <span className="material-symbols-outlined text-[18px]">keyboard_arrow_up</span>
                          </button>
                          <button className={secondaryButtonClass} disabled={busy || index === sortedJlptQuestions.length - 1} onClick={() => moveQuestion(question.question_id, 'down')}>
                            <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
                          </button>
                          <button className={secondaryButtonClass} onClick={() => openEditQuestion(question)}>
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button className={dangerButtonClass} disabled={busy} onClick={() => deleteQuestion(question)}>
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {activeModal === 'jlptSection' && (
        <Modal title={editingJlptSectionId ? 'Edit JLPT Section' : 'Create JLPT Section'} subtitle={selectedJlptExam ? selectedJlptExam.title : 'Section settings'} onClose={() => setActiveModal('jlptSections')}>
          <form onSubmit={submitJlptSection} className="space-y-4">
            <Field label="Title"><input className={inputClass} required value={jlptSectionForm.title} onChange={(e) => setJlptSectionForm({ ...jlptSectionForm, title: e.target.value })} /></Field>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <Field label="Section Type">
                <select
                  className={inputClass}
                  value={jlptSectionForm.section_type}
                  onChange={(e) => {
                    const nextType = e.target.value as AdminSectionType;
                    setJlptSectionForm({
                      ...jlptSectionForm,
                      section_type: nextType,
                      audio_asset_id: nextType === 'listening' ? jlptSectionForm.audio_asset_id : null,
                      audio_url: nextType === 'listening' ? jlptSectionForm.audio_url : '',
                    });
                  }}
                >
                  {sectionTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Order"><input className={inputClass} type="number" min="1" value={jlptSectionForm.section_order} onChange={(e) => setJlptSectionForm({ ...jlptSectionForm, section_order: Number(e.target.value) })} /></Field>
              <Field label="Duration"><input className={inputClass} type="number" min="0" value={jlptSectionForm.duration_minutes} onChange={(e) => setJlptSectionForm({ ...jlptSectionForm, duration_minutes: e.target.value })} /></Field>
            </div>
            {jlptSectionForm.section_type === 'listening' && (
              <AssetUploader
                label="Section Listening Audio"
                accept="audio/*"
                previewUrl={jlptSectionForm.audio_url}
                mediaKind="audio"
                scope="jlpt-sections"
                fieldKey="jlpt-section-audio"
                uploadingField={uploadingField}
                onUpload={uploadAsset}
                onUploaded={(asset) => setJlptSectionForm({ ...jlptSectionForm, audio_asset_id: asset.asset_id, audio_url: asset.secure_url })}
              />
            )}
            {editingJlptSectionId && (
              <div className="rounded-lg border border-error/30 bg-error/5 p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <p className="text-label-md font-semibold text-error">Hide Section</p>
                    <p className="text-label-md text-on-surface-variant">This hides the section from learners and hides its question links.</p>
                  </div>
                  <button
                    type="button"
                    className={dangerButtonClass}
                    disabled={busy}
                    onClick={() => {
                      const section = jlptSections.find((item) => item.section_id === editingJlptSectionId);
                      if (section) deleteJlptSection(section);
                    }}
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            )}
            <ModalActions busy={busy} submitLabel={editingJlptSectionId ? 'Save Section' : 'Create Section'} onCancel={() => setActiveModal('jlptSections')} />
          </form>
        </Modal>
      )}

      {activeModal === 'autoJlptQuestions' && (
        <Modal
          title="Auto Add Questions"
          subtitle={managingJlptSection ? `${optionLabel(sectionTypeOptions, managingJlptSection.section_type)} - ${selectedJlptExam?.title || 'JLPT test'}` : 'JLPT section'}
          onClose={() => setActiveModal('jlptSections')}
        >
          <form onSubmit={submitAutoJlptQuestions} className="space-y-4">
            <Field label="JLPT Level">
              <select
                className={inputClass}
                value={autoJlptQuestionsForm.jlpt_level}
                onChange={(e) => setAutoJlptQuestionsForm({ ...autoJlptQuestionsForm, jlpt_level: e.target.value as AdminJlptLevel })}
              >
                {jlptLevelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {difficultyOptions.map((option) => {
                const key = option.value as 'easy' | 'medium' | 'hard' | 'expert';
                return (
                  <Field key={option.value} label={option.label}>
                    <input
                      className={inputClass}
                      type="number"
                      min="0"
                      value={autoJlptQuestionsForm[key]}
                      onChange={(e) => setAutoJlptQuestionsForm({ ...autoJlptQuestionsForm, [key]: Number(e.target.value) })}
                    />
                  </Field>
                );
              })}
            </div>
            <ModalActions busy={busy} submitLabel="Auto Add Questions" onCancel={() => setActiveModal('jlptSections')} />
          </form>
        </Modal>
      )}

      {activeModal === 'readingPassage' && (
        <Modal title={editingReadingPassageId ? 'Edit Reading Passage' : 'Create Reading Passage'} subtitle={selectedJlptExam?.title || 'JLPT reading'} onClose={() => setActiveModal('jlptSections')} size="lg">
          <form onSubmit={submitReadingPassage} className="space-y-4">
            <Field label="Title">
              <input className={inputClass} value={readingPassageForm.title} onChange={(e) => setReadingPassageForm({ ...readingPassageForm, title: e.target.value })} />
            </Field>
            <Field label="JLPT Level">
              <select className={inputClass} value={readingPassageForm.jlpt_level} onChange={(e) => setReadingPassageForm({ ...readingPassageForm, jlpt_level: e.target.value as AdminJlptLevel })}>
                {jlptLevelOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Passage Text">
              <textarea className={inputClass} rows={8} value={readingPassageForm.passage_text} onChange={(e) => setReadingPassageForm({ ...readingPassageForm, passage_text: e.target.value })} />
            </Field>
            <AssetUploader
              label="Passage Image"
              accept="image/*"
              previewUrl={readingPassageForm.image_url}
              mediaKind="image"
              scope="reading-passages"
              fieldKey="reading-passage-image"
              uploadingField={uploadingField}
              onUpload={uploadAsset}
              onUploaded={(asset) => setReadingPassageForm({ ...readingPassageForm, image_asset_id: asset.asset_id, image_url: asset.secure_url })}
            />
            <ModalActions busy={busy} submitLabel={editingReadingPassageId ? 'Save Passage' : 'Create Passage'} onCancel={() => setActiveModal('jlptSections')} />
          </form>
        </Modal>
      )}

      {activeModal === 'questions' && (
        <Modal
          title="Manage Questions"
          subtitle={managingQuestionsQuiz ? managingQuestionsQuiz.title : 'Quiz questions'}
          onClose={closeModal}
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex flex-col justify-between gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-4 md:flex-row md:items-center">
              <div>
                <p className="text-label-md font-semibold text-on-surface">{quizQuestions.length} questions</p>
                <p className="text-label-md text-on-surface-variant">Total marks are recalculated from question marks.</p>
              </div>
              <button className={actionButtonClass} onClick={openCreateQuestion} disabled={!managingQuestionsQuizId}>
                <span className="material-symbols-outlined text-[18px]">add</span>
                New Question
              </button>
            </div>
            <AdminTable
              headers={['Order', 'Question', 'Section', 'Type', 'Marks', 'Options', 'Actions']}
              rows={[...visibleQuizQuestions]
                .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0) || a.question_id - b.question_id)
                .map((question, index, sortedQuestions) => [
                  question.order_index || '-',
                  <div>
                    <p className="font-semibold text-on-surface">{question.question_text}</p>
                    {question.explanation && <p className="text-label-md text-on-surface-variant">{question.explanation}</p>}
                  </div>,
                  optionLabel(sectionTypeOptions, question.section_type),
                  optionLabel(questionTypeOptions, question.question_type),
                  question.marks,
                  question.options.length,
                  <div className="flex flex-wrap gap-2">
                    <button
                      className={secondaryButtonClass}
                      disabled={busy || index === 0}
                      onClick={() => moveQuestion(question.question_id, 'up')}
                    >
                      <span className="material-symbols-outlined text-[18px]">keyboard_arrow_up</span>
                    </button>
                    <button
                      className={secondaryButtonClass}
                      disabled={busy || index === sortedQuestions.length - 1}
                      onClick={() => moveQuestion(question.question_id, 'down')}
                    >
                      <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
                    </button>
                    <button className={secondaryButtonClass} onClick={() => openEditQuestion(question)}>
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button className={dangerButtonClass} disabled={busy} onClick={() => deleteQuestion(question)}>
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>,
                ])}
            />
          </div>
        </Modal>
      )}

      {activeModal === 'question' && (
        <Modal
          title={editingQuestionId ? 'Edit Question' : 'Create Question'}
          subtitle={
            managingJlptSection
              ? `${selectedJlptExam?.title || 'JLPT test'} - ${optionLabel(sectionTypeOptions, managingJlptSection.section_type)}`
              : managingQuestionsQuiz
                ? managingQuestionsQuiz.title
                : 'Question'
          }
          onClose={closeQuestionForm}
          size="xl"
        >
          <form onSubmit={submitQuestion} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
              <div className="space-y-4">
                <Field label="Question Text">
                  <textarea className={inputClass} required rows={5} value={questionForm.question_text} onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })} />
                </Field>
                <Field label="Explanation">
                  <textarea className={inputClass} rows={3} value={questionForm.explanation} onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })} />
                </Field>
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <AssetUploader
                    label="Question Image"
                    accept="image/*"
                    previewUrl={questionForm.image_url}
                    mediaKind="image"
                    scope="questions"
                    fieldKey="question-image"
                    uploadingField={uploadingField}
                    onUpload={uploadAsset}
                    onUploaded={(asset) => setQuestionForm({ ...questionForm, image_asset_id: asset.asset_id, image_url: asset.secure_url })}
                  />
                  {questionForm.section_type === 'listening' && !managingJlptSectionId && (
                    <AssetUploader
                      label="Listening Audio"
                      accept="audio/*"
                      previewUrl={questionForm.audio_url}
                      mediaKind="audio"
                      scope="questions"
                      fieldKey="question-audio"
                      uploadingField={uploadingField}
                      onUpload={uploadAsset}
                      onUploaded={(asset) => setQuestionForm({ ...questionForm, audio_asset_id: asset.asset_id, audio_url: asset.secure_url })}
                    />
                  )}
                </div>
                <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-title-md font-semibold text-on-surface">Options</h3>
                    <button
                      type="button"
                      className={secondaryButtonClass}
                      onClick={() => setQuestionForm({ ...questionForm, options: [...questionForm.options, { option_id: undefined, option_text: '', is_correct: false, explanation: '' }] })}
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Add Option
                    </button>
                  </div>
                  <div className="space-y-3">
                    {questionForm.options.map((option, index) => (
                      <div key={index} className="grid grid-cols-1 gap-2 rounded border border-outline-variant bg-surface p-3 md:grid-cols-[1fr_auto_auto] md:items-start">
                        <input
                          className={inputClass}
                          placeholder={questionForm.question_type === 'fill_in_blank' ? 'Accepted answer' : `Option ${index + 1}`}
                          value={option.option_text}
                          onChange={(e) => {
                            const next = [...questionForm.options];
                            next[index] = { ...option, option_text: e.target.value };
                            setQuestionForm({ ...questionForm, options: next });
                          }}
                        />
                        <label className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-3 py-2 text-label-md text-on-surface">
                          <input
                            type="checkbox"
                            checked={option.is_correct}
                            onChange={(e) => {
                              const next = questionForm.options.map((item, itemIndex) => ({
                                ...item,
                                is_correct:
                                  questionForm.question_type === 'multiple_choice'
                                    ? itemIndex === index
                                      ? e.target.checked
                                      : item.is_correct
                                    : itemIndex === index
                                      ? e.target.checked
                                      : false,
                              }));
                              setQuestionForm({ ...questionForm, options: next });
                            }}
                          />
                          Correct
                        </label>
                        <button
                          type="button"
                          className={dangerButtonClass}
                          disabled={questionForm.options.length <= 1}
                          onClick={() => setQuestionForm({ ...questionForm, options: questionForm.options.filter((_, itemIndex) => itemIndex !== index) })}
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <aside className="space-y-4 rounded-lg border border-outline-variant bg-surface-container-low p-4">
                <Field label="Type">
                  <select
                    className={inputClass}
                    value={questionForm.question_type}
                    onChange={(e) => {
                      const nextType = e.target.value as AdminQuestionType;
                      const nextOptions = nextType === 'true_false'
                        ? [
                            { option_id: undefined, option_text: 'True', is_correct: true, explanation: '' },
                            { option_id: undefined, option_text: 'False', is_correct: false, explanation: '' },
                          ]
                        : questionForm.options;
                      setQuestionForm({ ...questionForm, question_type: nextType, options: nextOptions });
                    }}
                  >
                    {questionTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Order"><input className={inputClass} type="number" min="1" value={questionForm.order_index} onChange={(e) => setQuestionForm({ ...questionForm, order_index: e.target.value })} /></Field>
                  <Field label="Marks"><input className={inputClass} type="number" min="0" step="0.5" value={questionForm.marks} onChange={(e) => setQuestionForm({ ...questionForm, marks: Number(e.target.value) })} /></Field>
                </div>
                <Field label="Points"><input className={inputClass} type="number" min="0" step="0.5" value={questionForm.points} onChange={(e) => setQuestionForm({ ...questionForm, points: Number(e.target.value) })} /></Field>
                <Field label="Difficulty">
                  <select className={inputClass} value={questionForm.difficulty_level} onChange={(e) => setQuestionForm({ ...questionForm, difficulty_level: e.target.value })}>
                    {difficultyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="JLPT Level">
                  <select className={inputClass} value={questionForm.jlpt_level} onChange={(e) => setQuestionForm({ ...questionForm, jlpt_level: e.target.value })}>
                    {jlptLevelOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Section">
                  <select
                    className={inputClass}
                    disabled={Boolean(managingJlptSectionId)}
                    value={questionForm.section_type}
                    onChange={(e) => {
                      const nextSection = e.target.value as AdminSectionType;
                      setQuestionForm({
                        ...questionForm,
                        section_type: nextSection,
                        audio_asset_id: nextSection === 'listening' ? questionForm.audio_asset_id : null,
                        audio_url: nextSection === 'listening' ? questionForm.audio_url : '',
                      });
                    }}
                  >
                    {sectionTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
                {questionForm.section_type === 'reading' && (
                  <Field label="Reading Passage">
                    <select
                      className={inputClass}
                      required
                      value={questionForm.reading_passage_id}
                      onChange={(e) => setQuestionForm({ ...questionForm, reading_passage_id: e.target.value })}
                    >
                      <option value="">Select passage</option>
                      {readingPassages.map((passage) => (
                        <option key={passage.passage_id} value={passage.passage_id}>
                          {passage.title || `Passage #${passage.passage_id}`}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
              </aside>
            </div>
            <ModalActions busy={busy} submitLabel={editingQuestionId ? 'Save Question' : 'Create Question'} onCancel={closeQuestionForm} />
          </form>
        </Modal>
      )}

      {activeModal === 'blog' && (
        <Modal title={editingBlogId ? 'Edit Blog' : 'Create Blog'} subtitle="Manage article metadata, content, and publication status." onClose={closeModal}>
          <form onSubmit={submitBlog} className="space-y-4">
            <Field label="Title"><input className={inputClass} required value={blogForm.title} onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })} /></Field>
            <Field label="Slug"><input className={inputClass} value={blogForm.slug} onChange={(e) => setBlogForm({ ...blogForm, slug: e.target.value })} /></Field>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Category"><input className={inputClass} value={blogForm.category} onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })} /></Field>
              <Field label="Status">
                <select className={inputClass} value={blogForm.status} onChange={(e) => setBlogForm({ ...blogForm, status: e.target.value as AdminBlogStatus })}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>
            </div>
            <Field label="Tags"><input className={inputClass} placeholder="grammar, N5, vocabulary" value={blogForm.tags} onChange={(e) => setBlogForm({ ...blogForm, tags: e.target.value })} /></Field>
            <Field label="Excerpt"><textarea className={inputClass} rows={3} value={blogForm.excerpt} onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })} /></Field>
            <Field label="Content"><textarea className={inputClass} rows={7} value={blogForm.content} onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })} /></Field>
            <AssetUploader
              label="Blog Cover Image"
              accept="image/*"
              previewUrl={blogForm.image_url}
              mediaKind="image"
              scope="blog"
              fieldKey="blog-cover"
              uploadingField={uploadingField}
              onUpload={uploadAsset}
              onUploaded={(asset) => setBlogForm({ ...blogForm, cover_asset_id: asset.asset_id, image_url: asset.secure_url })}
            />
            <AssetUploader
              label="Blog Video"
              accept="video/*"
              previewUrl={blogForm.video_url}
              mediaKind="video"
              scope="blog"
              fieldKey="blog-video"
              uploadingField={uploadingField}
              onUpload={uploadAsset}
              onUploaded={(asset) => setBlogForm({ ...blogForm, video_asset_id: asset.asset_id, video_url: asset.secure_url })}
            />
            <ModalActions busy={busy} submitLabel={editingBlogId ? 'Save Changes' : 'Create Blog'} onCancel={closeModal} />
          </form>
        </Modal>
      )}
    </div>
  );
}

function SectionToolbar({
  title,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  actionLabel: string;
  onAction: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-headline-sm font-semibold text-on-surface">{title}</h2>
        <div className="flex flex-1 flex-col gap-3 md:flex-row lg:max-w-2xl">{children}</div>
        <button className={actionButtonClass} onClick={onAction}>
          <span className="material-symbols-outlined text-[18px]">add</span>
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

function SummaryPanel({ title, rows }: { title: string; rows: Array<[string, number]> }) {
  return (
    <div className="rounded-lg border border-outline-variant bg-surface p-4 shadow-sm">
      <h2 className="mb-3 text-headline-sm font-semibold text-on-surface">{title}</h2>
      <div className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between rounded bg-surface-container-low px-3 py-2">
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModalActions({ busy, submitLabel, onCancel }: { busy: boolean; submitLabel: string; onCancel: () => void }) {
  return (
    <div className="flex justify-end gap-2 border-t border-outline-variant pt-4">
      <button type="button" className={secondaryButtonClass} onClick={onCancel}>
        Cancel
      </button>
      <button className={actionButtonClass} disabled={busy}>
        {submitLabel}
      </button>
    </div>
  );
}

function AdminSidebar({
  tabs,
  activeTab,
  isOpen,
  onToggle,
  onSelect,
}: {
  tabs: Array<{ id: AdminTab; label: string; icon: string }>;
  activeTab: AdminTab;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (tab: AdminTab) => void;
}) {
  return (
    <aside
      className={`fixed left-0 top-[73px] z-40 flex h-[calc(100vh-73px)] flex-shrink-0 flex-col overflow-y-auto border-r border-outline-variant bg-surface-container-low transition-all duration-300 md:sticky ${
        isOpen ? 'w-72' : 'w-16'
      }`}
    >
      <div className={`flex min-h-14 flex-shrink-0 items-center border-b border-outline-variant bg-surface-container ${isOpen ? 'justify-between px-4' : 'justify-center px-2'}`}>
        {isOpen && (
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-label-sm font-semibold uppercase text-on-surface">Admin panel</h3>
            <p className="truncate text-label-sm text-on-surface-variant">{tabs.length} sections</p>
          </div>
        )}
        <button
          type="button"
          className={`inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-outline-variant bg-surface text-on-surface shadow-sm transition-colors hover:border-primary hover:text-primary ${isOpen ? 'ml-3' : ''}`}
          onClick={onToggle}
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <span className="material-symbols-outlined text-[20px]">{isOpen ? 'menu_open' : 'menu'}</span>
        </button>
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              className={`flex gap-2 border-b border-outline-variant/20 px-3 py-3 transition-colors hover:bg-surface-container ${
                isOpen ? 'items-center justify-start text-left' : 'items-center justify-center text-center'
              } ${isActive ? 'bg-primary/5 font-bold text-primary' : 'text-on-surface-variant hover:text-primary'}`}
              onClick={() => onSelect(tab.id)}
              title={tab.label}
            >
              <span className="flex-shrink-0">
                <span className="material-symbols-outlined text-[22px]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  {tab.icon}
                </span>
              </span>
              <span className={`truncate text-label-sm font-label-sm ${isOpen ? 'inline' : 'hidden'}`}>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function AdminTable({ headers, rows }: { headers: string[]; rows: Array<Array<ReactNode>> }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-outline-variant bg-surface shadow-sm">
      <table className="w-full min-w-[720px] text-left text-body-md">
        <thead className="bg-surface-container-low text-label-md text-on-surface-variant">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-semibold">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-8 text-center text-on-surface-variant">
                No data available
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-outline-variant hover:bg-surface-container-low/60">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-3 align-top text-on-surface">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
