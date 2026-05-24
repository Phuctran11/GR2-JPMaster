const API_BASE_URL = 'http://localhost:5000/api';

interface LoginRequest {
  email: string;
  password: string;
}

interface SignupRequest {
  username: string;
  email: string;
  password: string;
  level?: string;
}

interface GoogleLoginRequest {
  token: string;
}

interface AuthResponse {
  message: string;
  data: {
    user_id: number;
    username: string;
    email: string;
    avatar_url?: string | null;
    role: string;
  };
  token?: string;
}

export interface UserProfile {
  user_id: number;
  username: string;
  email: string;
  avatar_url?: string | null;
  role: string;
  status?: 'active' | 'suspended' | 'deleted';
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Helper to get authorization header
const getAuthHeader = (): { Authorization?: string } => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper to make authenticated requests
const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
};

export const authAPI = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    return response.json();
  },

  async signup(data: SignupRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: data.username,
        email: data.email,
        password: data.password,
        role: 'learner',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    return response.json();
  },

  async googleLogin(tokenData: GoogleLoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/users/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokenData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Google login failed');
    }

    return response.json();
  },
};

export const userAPI = {
  async getMe(): Promise<{ data: UserProfile }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/users/me`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login first');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch profile');
    }

    return response.json();
  },

  async updateMe(data: Pick<UserProfile, 'username' | 'email'> & { avatar_url?: string | null }): Promise<{ message: string; data: UserProfile }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/users/me`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login first');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to update profile');
    }

    return response.json();
  },
};

// Course API endpoints
export interface Course {
  course_id: number;
  title: string;
  description: string | null;
  price: number;
  level?: string | null;
  is_free?: boolean;
  duration?: number | null;
  cover_asset_id?: number | null;
  image_url?: string | null;
  created_by: number;
  final_quiz_id?: number | null;
  creator_username?: string;
  created_at: string;
  updated_at: string;
  lessons?: Lesson[];
}

export interface Lesson {
  lesson_id: number;
  course_id: number;
  title: string;
  content_text: string | null;
  video_asset_id?: number | null;
  video_url: string | null;
  audio_asset_id?: number | null;
  audio_url?: string | null;
  order_index: number;
  duration?: number | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  is_completed?: boolean;
}

export interface CourseRating {
  rating_id: number;
  user_id: number;
  username?: string;
  rating: number;
  review: string | null;
  created_at: string;
}

export interface BlogTag {
  tag_id: number;
  name: string;
  slug: string;
  tag_type: 'skill' | 'jlpt_level' | 'topic';
}

export interface Blog {
  blog_id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  category_id: number | null;
  category: string | null;
  category_slug: string | null;
  cover_asset_id?: number | null;
  image_url: string | null;
  video_asset_id?: number | null;
  video_url?: string | null;
  status: 'draft' | 'published' | 'archived';
  author_id: number;
  author_username?: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  tags: BlogTag[];
}

export interface BlogCategory {
  category_id: number;
  name: string;
  slug: string;
  blog_count: number;
}

export interface QuizOption {
  option_id: number;
  question_id: number;
  option_text: string;
  explanation: string | null;
}

export interface QuizQuestion {
  question_id: number;
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_in_blank';
  difficulty_level: string | null;
  explanation: string | null;
  points: number;
  jlpt_level: string | null;
  section_type: string | null;
  image_asset_id?: number | null;
  image_url?: string | null;
  audio_asset_id?: number | null;
  audio_url?: string | null;
  order_index: number | null;
  marks: number;
  options: QuizOption[];
}

export interface QuizAttemptSummary {
  attempt_id: number;
  quiz_id: number;
  score: number | null;
  total_marks: number | null;
  status: 'in_progress' | 'submitted' | 'graded';
  started_at: string;
  submitted_at: string | null;
  passed: boolean;
}

export interface Quiz {
  quiz_id: number;
  lesson_id: number | null;
  course_id: number | null;
  title: string;
  description: string | null;
  quiz_type: 'lesson_quiz' | 'practice_test' | 'final_test' | null;
  passing_score: number;
  total_marks: number;
  time_limit_minutes: number | null;
  questions: QuizQuestion[];
  latest_attempt?: QuizAttemptSummary | null;
  has_passed?: boolean;
}

export interface QuizAnswerPayload {
  question_id: number;
  option_id?: number;
  option_ids?: number[];
  answer_text?: string;
}

export interface QuizSubmitResult {
  attempt_id: number;
  quiz_id: number;
  score: number;
  total_marks: number;
  earned_marks: number;
  passing_score: number;
  passed: boolean;
  submitted_at: string;
  question_results: Array<{
    question_id: number;
    is_correct: boolean;
    explanation: string | null;
    selected_option_ids: number[];
    correct_option_ids: number[];
    answer_text: string | null;
  }>;
}

export type JlptSectionType = 'vocabulary' | 'grammar' | 'reading' | 'listening';

export interface JlptExamSummary {
  exam_id: number;
  title: string;
  jlpt_level: 'N1' | 'N2' | 'N3' | 'N4' | 'N5';
  year: number | null;
  duration_minutes: number | null;
  section_count: number;
  question_count: number;
  section_types: JlptSectionType[];
  created_at: string;
}

export interface JlptExamQuestionOption {
  option_id: number;
  question_id: number;
  option_text: string;
  explanation: string | null;
}

export interface JlptExamQuestion {
  section_id: number;
  question_id: number;
  question_text: string;
  question_type: 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_in_blank';
  difficulty_level: string | null;
  explanation: string | null;
  points: number;
  marks: number;
  jlpt_level: string | null;
  section_type: JlptSectionType;
  reading_passage_id: number | null;
  reading_passage_title: string | null;
  reading_passage_text: string | null;
  reading_passage_image_url: string | null;
  image_url: string | null;
  audio_url: string | null;
  order_index: number | null;
  options: JlptExamQuestionOption[];
}

export interface JlptExamSection {
  section_id: number;
  exam_id: number;
  title: string | null;
  section_type: JlptSectionType;
  section_order: number | null;
  duration_minutes: number | null;
  audio_url: string | null;
  questions: JlptExamQuestion[];
}

export interface JlptExamDetail extends Omit<JlptExamSummary, 'section_count' | 'question_count' | 'section_types'> {
  sections: JlptExamSection[];
}

export interface JlptExamAnswerPayload {
  question_id: number;
  option_id?: number;
  option_ids?: number[];
  answer_text?: string;
}

export interface JlptExamSubmitResult {
  attempt_id: number;
  exam_id: number;
  score: number;
  total_marks: number;
  earned_marks: number;
  passed: boolean;
  submitted_at: string;
  question_results: Array<{
    question_id: number;
    section_id: number;
    is_correct: boolean;
    explanation: string | null;
    selected_option_ids: number[];
    correct_option_ids: number[];
    answer_text: string | null;
    marks: number;
    earned_marks: number;
  }>;
}

export interface Certificate {
  certificate_id: number;
  certificate_code: string;
  user_id: number;
  username: string;
  course_id: number;
  course_title: string;
  course_duration: number | null;
  lesson_count: number;
  enrollment_id: number | null;
  issued_at: string;
  created_at: string;
  updated_at: string;
}

export type LessonNoteType = 'text_note' | 'video_note' | 'highlight' | 'question_note' | 'ai_summary';

export interface LessonNote {
  note_id: number;
  user_id: number;
  lesson_id: number | null;
  question_id: number | null;
  note_type: LessonNoteType;
  note_content: string;
  selected_text: string | null;
  video_timestamp_seconds: number | null;
  is_pinned: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  lesson_title?: string | null;
  course_id?: number | null;
  course_title?: string | null;
  quiz_type?: 'lesson_quiz' | 'practice_test' | 'final_test' | null;
  question_text?: string | null;
}

export interface CreateLessonNotePayload {
  lesson_id?: number | null;
  question_id?: number | null;
  note_type: LessonNoteType;
  note_content: string;
  selected_text?: string | null;
  video_timestamp_seconds?: number | null;
  is_pinned?: boolean;
}

export interface LessonNoteFilters {
  note_type?: LessonNoteType | 'all';
  lesson_id?: number;
  question_id?: number;
  pinned?: boolean | 'all';
  search?: string;
  limit?: number;
  offset?: number;
}

export type FlashcardVisibility = 'private' | 'public';

export interface FlashcardCollection {
  collection_id: number;
  user_id: number;
  owner_username?: string;
  title: string;
  description: string | null;
  visibility: FlashcardVisibility;
  card_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Flashcard {
  flashcard_id: number;
  collection_id: number;
  lesson_id: number | null;
  front_text: string;
  back_text: string;
  reading: string | null;
  example_sentence: string | null;
  image_url: string | null;
  audio_url: string | null;
  tags: string[] | null;
  order_index: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFlashcardPayload {
  collection_id: number;
  lesson_id?: number | null;
  front_text: string;
  back_text: string;
  reading?: string | null;
  example_sentence?: string | null;
  image_url?: string | null;
  audio_url?: string | null;
  tags?: string[] | null;
  order_index?: number | null;
}

export type UploadedAssetMediaKind = 'image' | 'video' | 'audio';

export interface UploadedAsset {
  asset_id: number;
  public_id: string;
  secure_url: string;
  resource_type: 'image' | 'video' | 'raw';
  media_kind: UploadedAssetMediaKind;
  format: string | null;
  bytes: number | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  folder: string | null;
  original_filename: string | null;
  uploaded_by: number | null;
  created_at: string;
  updated_at: string;
}

export type FlashcardAiMode = 'paragraph' | 'dialogue' | 'explain' | 'ask';
export type LessonAiMode = 'explain' | 'grammar' | 'summary' | 'ask';

export interface FlashcardAiPayload {
  mode: FlashcardAiMode;
  word: string;
  meaning?: string | null;
  reading?: string | null;
  exampleSentence?: string | null;
  selectedWords?: string[] | null;
  question?: string | null;
}

export interface LessonAiPayload {
  mode: LessonAiMode;
  lessonTitle: string;
  lessonContent?: string | null;
  selectedText?: string | null;
  question?: string | null;
}

export interface AiResponse {
  text: string;
  model: string;
}

const getApiErrorMessage = async (response: Response, fallback: string) => {
  try {
    const error = await response.json();
    const shortageMessage = Array.isArray(error.shortages)
      ? error.shortages
          .map((item: { difficulty?: string; requested?: number; available?: number }) => {
            const requested = Number(item.requested) || 0;
            const available = Number(item.available) || 0;
            const missing = Math.max(requested - available, 0);
            return `${item.difficulty || 'unknown'}: need ${requested}, available ${available}, missing ${missing}`;
          })
          .join('; ')
      : '';
    if (typeof error.error === 'string') return shortageMessage ? `${error.error}. ${shortageMessage}` : error.error;
    if (typeof error.error?.message === 'string') return error.error.message;
    if (typeof error.message === 'string') return error.message;
  } catch {
    // Keep the fallback when the server does not return JSON.
  }

  return fallback;
};

/**
 * Enrolled course with enrollment details
 * Returned by getMyCourses endpoint
 */
export interface EnrolledCourse {
  enrollment_id: number;
  user_id: number;
  course_id: number;
  enrollment_date: string;
  status: 'active' | 'completed' | 'dropped';
  course: Course;
  progress_percent?: number;
  completed_lessons?: number;
  total_lessons?: number;
}

export interface Course {
  course_id: number;
  title: string;
  description: string | null;
  price: number;
  level?: string | null;
  is_free?: boolean;
  duration?: number | null;
  cover_asset_id?: number | null;
  image_url?: string | null;
  created_by: number;
  final_quiz_id?: number | null;
  creator_username?: string;
  created_at: string;
  updated_at: string;
  lessons?: Lesson[];
  ratings?: CourseRating[];
  average_rating?: number;
  rating_count?: number;
  enroll_count?: number;
}

export interface Purchase {
  purchase_id: number;
  user_id: number;
  course_id: number;
  purchase_date: string;
  price_paid: number;
  status: 'pending' | 'completed' | 'canceled';
}

export interface PaymentTransaction {
  payment_transaction_id: number;
  purchase_id: number;
  course_id?: number;
  provider?: 'payos';
  provider_order_id?: string;
  amount: number;
  currency: string;
  payment_content: string;
  qr_image_url: string;
  checkout_url: string | null;
  status: 'pending' | 'paid' | 'failed' | 'canceled' | 'expired';
  purchase_status?: Purchase['status'];
  paid_at: string | null;
  expired_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export const courseAPI = {
  async getAllCourses(limit = 10, offset = 0, withLessons = false): Promise<{ data: Course[]; count: number }> {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
      ...(withLessons && { withLessons: 'true' }),
    });

    const response = await fetch(`${API_BASE_URL}/courses?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch courses');
    }

    return response.json();
  },

  async getPopularCourses(limit = 4): Promise<{ data: Course[]; count: number }> {
    const params = new URLSearchParams({ limit: String(limit) });
    const response = await fetch(`${API_BASE_URL}/courses/popular?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch popular courses');
    }

    return response.json();
  },

  async getCourseById(courseId: number): Promise<{ data: Course }> {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch course');
    }

    return response.json();
  },
};

export const purchaseAPI = {
  async getPurchase(purchaseId: number): Promise<{ data: Purchase }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/purchases/${purchaseId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login first');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch purchase');
    }

    return response.json();
  },
};

export const quizAPI = {
  async getLessonQuiz(lessonId: number): Promise<{ data: Quiz | null }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/quizzes/lessons/${lessonId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login first');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch lesson quiz');
    }

    return response.json();
  },

  async getFinalQuiz(courseId: number): Promise<{ data: Quiz | null }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/quizzes/courses/${courseId}/final`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login first');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch final quiz');
    }

    return response.json();
  },

  async startQuiz(quizId: number): Promise<{ data: QuizAttemptSummary }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/quizzes/${quizId}/start`, {
      method: 'POST',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login first');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to start quiz');
    }

    return response.json();
  },

  async submitQuiz(quizId: number, answers: QuizAnswerPayload[], attemptId?: number): Promise<{ message: string; data: QuizSubmitResult }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/quizzes/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers, attempt_id: attemptId }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login first');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit quiz');
    }

    return response.json();
  },
};

export const jlptExamAPI = {
  async getExams(filters: { level?: string; section_type?: string } = {}): Promise<{ data: JlptExamSummary[]; count: number }> {
    const params = new URLSearchParams();
    if (filters.level && filters.level !== 'All') params.set('level', filters.level);
    if (filters.section_type && filters.section_type !== 'all') params.set('section_type', filters.section_type);

    const response = await fetch(`${API_BASE_URL}/jlpt-exams?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Failed to fetch JLPT tests'));
    return response.json();
  },

  async getExam(examId: number): Promise<{ data: JlptExamDetail }> {
    const response = await fetch(`${API_BASE_URL}/jlpt-exams/${examId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Failed to fetch JLPT test'));
    return response.json();
  },

  async submitExam(examId: number, answers: JlptExamAnswerPayload[]): Promise<{ message: string; data: JlptExamSubmitResult }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/jlpt-exams/${examId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });

    if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Failed to submit JLPT test'));
    return response.json();
  },
};

export const certificateAPI = {
  async getCourseCertificate(courseId: number): Promise<{ data: Certificate }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/certificates/courses/${courseId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login first');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch certificate');
    }

    return response.json();
  },
};

export const lessonNoteAPI = {
  async getMyNotes(filters: LessonNoteFilters = {}): Promise<{ data: LessonNote[]; count: number }> {
    const params = new URLSearchParams();
    if (filters.note_type && filters.note_type !== 'all') params.set('note_type', filters.note_type);
    if (filters.lesson_id) params.set('lesson_id', String(filters.lesson_id));
    if (filters.question_id) params.set('question_id', String(filters.question_id));
    if (filters.pinned !== undefined && filters.pinned !== 'all') params.set('pinned', String(filters.pinned));
    if (filters.search?.trim()) params.set('search', filters.search.trim());
    params.set('limit', String(filters.limit ?? 20));
    params.set('offset', String(filters.offset ?? 0));

    const response = await authenticatedFetch(`${API_BASE_URL}/lesson-notes?${params}`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login first');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch notes');
    }

    return response.json();
  },

  async createNote(payload: CreateLessonNotePayload): Promise<{ message: string; data: LessonNote }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/lesson-notes`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login first');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to create note');
    }

    return response.json();
  },

  async updateNote(noteId: number, payload: Partial<CreateLessonNotePayload>): Promise<{ message: string; data: LessonNote }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/lesson-notes/${noteId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login first');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to update note');
    }

    return response.json();
  },

  async setPinned(noteId: number, isPinned: boolean): Promise<{ message: string; data: LessonNote }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/lesson-notes/${noteId}/pin`, {
      method: 'PATCH',
      body: JSON.stringify({ is_pinned: isPinned }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login first');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to update pinned note');
    }

    return response.json();
  },

  async deleteNote(noteId: number): Promise<{ message: string }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/lesson-notes/${noteId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login first');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete note');
    }

    return response.json();
  },
};

export const flashcardAPI = {
  async getCollections(limit = 20, offset = 0): Promise<{ data: FlashcardCollection[]; count: number }> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    const response = await authenticatedFetch(`${API_BASE_URL}/flashcards/collections?${params}`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Unauthorized - Please login first');
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch flashcard collections');
    }

    return response.json();
  },

  async getPublicCollections(limit = 20, offset = 0): Promise<{ data: FlashcardCollection[]; count: number }> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    const response = await authenticatedFetch(`${API_BASE_URL}/flashcards/collections/public?${params}`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Unauthorized - Please login first');
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch public flashcard collections');
    }

    return response.json();
  },

  async getCollection(collectionId: number): Promise<{ data: FlashcardCollection }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/flashcards/collections/${collectionId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Unauthorized - Please login first');
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch flashcard collection');
    }

    return response.json();
  },

  async createCollection(payload: {
    title: string;
    description?: string | null;
    visibility?: FlashcardVisibility;
  }): Promise<{ message: string; data: FlashcardCollection }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/flashcards/collections`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Unauthorized - Please login first');
      const error = await response.json();
      throw new Error(error.error || 'Failed to create flashcard collection');
    }

    return response.json();
  },

  async updateCollection(
    collectionId: number,
    payload: {
      title: string;
      description?: string | null;
      visibility?: FlashcardVisibility;
    }
  ): Promise<{ message: string; data: FlashcardCollection }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/flashcards/collections/${collectionId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Unauthorized - Please login first');
      const error = await response.json();
      throw new Error(error.error || 'Failed to update flashcard collection');
    }

    return response.json();
  },

  async deleteCollection(collectionId: number): Promise<{ message: string }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/flashcards/collections/${collectionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Unauthorized - Please login first');
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete flashcard collection');
    }

    return response.json();
  },

  async getCollectionCards(collectionId: number, limit = 50, offset = 0): Promise<{ data: Flashcard[]; count: number }> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    const response = await authenticatedFetch(`${API_BASE_URL}/flashcards/collections/${collectionId}/cards?${params}`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Unauthorized - Please login first');
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch flashcards');
    }

    return response.json();
  },

  async createCard(payload: CreateFlashcardPayload): Promise<{ message: string; data: Flashcard }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/flashcards`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Unauthorized - Please login first');
      const error = await response.json();
      throw new Error(error.error || 'Failed to create flashcard');
    }

    return response.json();
  },

  async updateCard(flashcardId: number, payload: Partial<CreateFlashcardPayload>): Promise<{ message: string; data: Flashcard }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/flashcards/${flashcardId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Unauthorized - Please login first');
      const error = await response.json();
      throw new Error(error.error || 'Failed to update flashcard');
    }

    return response.json();
  },

  async deleteCard(flashcardId: number): Promise<{ message: string }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/flashcards/${flashcardId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Unauthorized - Please login first');
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete flashcard');
    }

    return response.json();
  },
};

export const assetAPI = {
  async upload(payload: { file: File; media_kind: UploadedAssetMediaKind; scope: string }): Promise<{ message: string; data: UploadedAsset }> {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('media_kind', payload.media_kind);
    formData.append('scope', payload.scope);

    const response = await authenticatedFetch(`${API_BASE_URL}/assets/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Unauthorized - Please login first');
      throw new Error(await getApiErrorMessage(response, 'Failed to upload asset'));
    }

    return response.json();
  },
};

export const aiAPI = {
  async askFlashcard(payload: FlashcardAiPayload): Promise<{ data: AiResponse }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/ai/flashcard`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Unauthorized - Please login first');
      throw new Error(await getApiErrorMessage(response, 'Failed to ask AI about flashcard'));
    }

    return response.json();
  },

  async askLesson(payload: LessonAiPayload): Promise<{ data: AiResponse }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/ai/lesson`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Unauthorized - Please login first');
      throw new Error(await getApiErrorMessage(response, 'Failed to ask AI about lesson'));
    }

    return response.json();
  },
};

export type AdminRole = 'learner' | 'owner' | 'admin';
export type AdminUserStatus = 'active' | 'suspended';
export type AdminQuizType = 'lesson_quiz' | 'practice_test' | 'final_test';
export type AdminBlogStatus = 'draft' | 'published' | 'archived';
export type AdminJlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type AdminSectionType = 'vocabulary' | 'grammar' | 'reading' | 'listening';
export type AdminSortOrder = 'desc' | 'asc';

export interface AdminStats {
  totals: {
    users: number;
    courses: number;
    lessons: number;
    tests: number;
    blogs: number;
  };
  usersByRole: Array<{ role: AdminRole; count: number }>;
  testsByType: Array<{ quiz_type: AdminQuizType | null; count: number }>;
  recentUsers: Array<Pick<UserProfile, 'user_id' | 'username' | 'email' | 'role' | 'status' | 'created_at'>>;
  recentCourses: Array<Pick<Course, 'course_id' | 'title' | 'price' | 'level' | 'created_at'>>;
}

export interface AdminCourse extends Course {
  lesson_count?: number;
  cover_asset_id?: number | null;
  image_url?: string | null;
}

export interface AdminLesson extends Omit<Lesson, 'created_by'> {
  created_by?: number;
  course_title?: string;
  video_asset_id?: number | null;
  audio_asset_id?: number | null;
  audio_url?: string | null;
}

export interface AdminTest {
  quiz_id: number;
  lesson_id: number | null;
  course_id: number | null;
  course_title?: string | null;
  title: string;
  description: string | null;
  quiz_type: AdminQuizType;
  passing_score: number;
  total_marks: number;
  time_limit_minutes: number | null;
  question_count?: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface AdminJlptExam {
  exam_id: number;
  title: string;
  jlpt_level: AdminJlptLevel;
  year: number | null;
  duration_minutes: number | null;
  section_count?: number;
  question_count?: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface AdminJlptSection {
  section_id: number;
  exam_id: number;
  title: string | null;
  section_type: AdminSectionType;
  section_order: number | null;
  duration_minutes: number | null;
  audio_asset_id?: number | null;
  audio_url?: string | null;
  question_count?: number;
  deleted_at?: string | null;
  updated_at?: string;
}

export interface AdminJlptSectionPayload {
  title: string;
  section_type: AdminSectionType;
  section_order: number;
  duration_minutes?: number | null;
  audio_asset_id?: number | null;
  audio_url?: string | null;
}

export interface AdminAutoJlptQuestionsPayload {
  jlpt_level?: AdminJlptLevel;
  difficulty_counts: Partial<Record<'easy' | 'medium' | 'hard' | 'expert', number>>;
}

export interface AdminReadingPassage {
  passage_id: number;
  title: string | null;
  jlpt_level: AdminJlptLevel;
  passage_text: string | null;
  image_asset_id?: number | null;
  image_url?: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface AdminReadingPassagePayload {
  title?: string | null;
  jlpt_level: AdminJlptLevel;
  passage_text?: string | null;
  image_asset_id?: number | null;
  image_url?: string | null;
}

export type AdminQuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_in_blank';

export interface AdminQuestionOption {
  option_id?: number;
  question_id?: number;
  option_text: string;
  is_correct: boolean;
  explanation?: string | null;
}

export interface AdminQuizQuestion {
  question_id: number;
  question_text: string;
  question_type: AdminQuestionType;
  difficulty_level: string | null;
  explanation: string | null;
  points: number;
  jlpt_level: string | null;
  section_type: string | null;
  reading_passage_id?: number | null;
  reading_passage_title?: string | null;
  reading_passage_text?: string | null;
  reading_passage_image_url?: string | null;
  image_asset_id?: number | null;
  image_url?: string | null;
  audio_asset_id?: number | null;
  audio_url?: string | null;
  order_index: number | null;
  marks: number;
  options: AdminQuestionOption[];
}

export type AdminQuizQuestionPayload = Omit<AdminQuizQuestion, 'question_id' | 'options'> & {
  options: AdminQuestionOption[];
};

export interface AdminBlog {
  blog_id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  category_id?: number | null;
  category: string | null;
  category_slug?: string | null;
  tags?: BlogTag[];
  cover_asset_id?: number | null;
  image_url: string | null;
  video_asset_id?: number | null;
  video_url?: string | null;
  status: AdminBlogStatus;
  author_id: number;
  author_username?: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export type AdminMediaKind = 'image' | 'video' | 'audio';

export interface AdminCloudinaryAsset {
  asset_id: number;
  public_id: string;
  secure_url: string;
  resource_type: 'image' | 'video' | 'raw';
  media_kind: AdminMediaKind;
  format: string | null;
  bytes: number | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  folder: string | null;
  original_filename: string | null;
  uploaded_by: number | null;
  created_at: string;
  updated_at: string;
}

const adminParams = (filters: Record<string, string | number | undefined | null>) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      params.set(key, String(value));
    }
  });
  return params.toString();
};

const adminRequest = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await authenticatedFetch(`${API_BASE_URL}/admin${path}`, options);

  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized - Please login first');
    if (response.status === 403) throw new Error('Admin access is required');
    throw new Error(await getApiErrorMessage(response, 'Admin request failed'));
  }

  return response.json();
};

export const adminAPI = {
  getStats: () => adminRequest<{ data: AdminStats }>('/stats'),

  getUsers: (filters: { search?: string; role?: AdminRole | 'all'; sort_order?: AdminSortOrder; limit?: number; offset?: number } = {}) =>
    adminRequest<{ data: UserProfile[]; count: number }>(`/users?${adminParams({ limit: 50, ...filters })}`),
  createUser: (payload: { username: string; email: string; password: string; role: AdminRole }) =>
    adminRequest<{ message: string; data: UserProfile }>('/users', { method: 'POST', body: JSON.stringify(payload) }),
  updateUser: (userId: number, payload: { username: string; email: string; role: AdminRole; status: AdminUserStatus }) =>
    adminRequest<{ message: string; data: UserProfile }>(`/users/${userId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteUser: (userId: number) =>
    adminRequest<{ message: string }>(`/users/${userId}`, { method: 'DELETE' }),

  getCourses: (filters: { search?: string; level?: string; sort_order?: AdminSortOrder; limit?: number; offset?: number } = {}) =>
    adminRequest<{ data: AdminCourse[]; count: number }>(`/courses?${adminParams({ limit: 50, ...filters })}`),
  uploadAsset: (payload: { file: File; media_kind: AdminMediaKind; scope: string }) => {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('media_kind', payload.media_kind);
    formData.append('scope', payload.scope);
    return adminRequest<{ message: string; data: AdminCloudinaryAsset }>('/assets/upload', {
      method: 'POST',
      body: formData,
    });
  },
  createCourse: (payload: { title: string; description?: string | null; price: number; level?: string | null; duration?: number | null; cover_asset_id?: number | null; image_url?: string | null; created_by?: number }) =>
    adminRequest<{ message: string; data: AdminCourse }>('/courses', { method: 'POST', body: JSON.stringify(payload) }),
  updateCourse: (courseId: number, payload: Partial<{ title: string; description: string | null; price: number; level: string | null; duration: number | null; cover_asset_id: number | null; image_url: string | null }>) =>
    adminRequest<{ message: string; data: AdminCourse }>(`/courses/${courseId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCourse: (courseId: number) =>
    adminRequest<{ message: string }>(`/courses/${courseId}`, { method: 'DELETE' }),

  getLessons: (filters: { search?: string; course_id?: number | string; limit?: number; offset?: number } = {}) =>
    adminRequest<{ data: AdminLesson[]; count: number }>(`/lessons?${adminParams({ limit: 50, ...filters })}`),
  createLesson: (payload: { course_id: number; title: string; content_text?: string | null; video_asset_id?: number | null; video_url?: string | null; audio_asset_id?: number | null; audio_url?: string | null; order_index: number; duration?: number | null }) =>
    adminRequest<{ message: string; data: AdminLesson }>('/lessons', { method: 'POST', body: JSON.stringify(payload) }),
  updateLesson: (lessonId: number, payload: Partial<{ title: string; content_text: string | null; video_asset_id: number | null; video_url: string | null; audio_asset_id: number | null; audio_url: string | null; order_index: number; duration: number | null }>) =>
    adminRequest<{ message: string; data: AdminLesson }>(`/lessons/${lessonId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteLesson: (lessonId: number) =>
    adminRequest<{ message: string }>(`/lessons/${lessonId}`, { method: 'DELETE' }),

  getTests: (filters: { search?: string; quiz_type?: AdminQuizType | 'all'; sort_order?: AdminSortOrder; limit?: number; offset?: number } = {}) =>
    adminRequest<{ data: AdminTest[]; count: number }>(`/tests?${adminParams({ limit: 50, ...filters })}`),
  createTest: (payload: { title: string; description?: string | null; quiz_type: AdminQuizType; lesson_id?: number | null; course_id?: number | null; passing_score: number; total_marks: number; time_limit_minutes?: number | null; created_by?: number }) =>
    adminRequest<{ message: string; data: AdminTest }>('/tests', { method: 'POST', body: JSON.stringify(payload) }),
  updateTest: (quizId: number, payload: Partial<{ title: string; description: string | null; quiz_type: AdminQuizType; lesson_id: number | null; course_id: number | null; passing_score: number; total_marks: number; time_limit_minutes: number | null }>) =>
    adminRequest<{ message: string; data: AdminTest }>(`/tests/${quizId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteTest: (quizId: number) =>
    adminRequest<{ message: string }>(`/tests/${quizId}`, { method: 'DELETE' }),
  getQuizQuestions: (quizId: number) =>
    adminRequest<{ data: AdminQuizQuestion[]; count: number }>(`/tests/${quizId}/questions`),
  createQuizQuestion: (quizId: number, payload: AdminQuizQuestionPayload) =>
    adminRequest<{ message: string; data: AdminQuizQuestion }>(`/tests/${quizId}/questions`, { method: 'POST', body: JSON.stringify(payload) }),
  updateQuizQuestion: (quizId: number, questionId: number, payload: AdminQuizQuestionPayload) =>
    adminRequest<{ message: string; data: AdminQuizQuestion }>(`/tests/${quizId}/questions/${questionId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  updateQuizQuestionOrder: (quizId: number, questionId: number, orderIndex: number | null) =>
    adminRequest<{ message: string }>(`/tests/${quizId}/questions/${questionId}/order`, { method: 'PATCH', body: JSON.stringify({ order_index: orderIndex }) }),
  deleteQuizQuestion: (quizId: number, questionId: number) =>
    adminRequest<{ message: string }>(`/tests/${quizId}/questions/${questionId}`, { method: 'DELETE' }),

  getJlptExams: (filters: { search?: string; sort_order?: AdminSortOrder; limit?: number; offset?: number } = {}) =>
    adminRequest<{ data: AdminJlptExam[]; count: number }>(`/jlpt-exams?${adminParams({ limit: 50, ...filters })}`),
  createJlptExam: (payload: { title: string; jlpt_level: AdminJlptLevel; year?: number | null; duration_minutes?: number | null; sections: AdminJlptSectionPayload[] }) =>
    adminRequest<{ message: string; data: AdminJlptExam }>('/jlpt-exams', { method: 'POST', body: JSON.stringify(payload) }),
  updateJlptExam: (examId: number, payload: Partial<{ title: string; jlpt_level: AdminJlptLevel; year: number | null; duration_minutes: number | null }>) =>
    adminRequest<{ message: string; data: AdminJlptExam }>(`/jlpt-exams/${examId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteJlptExam: (examId: number) =>
    adminRequest<{ message: string }>(`/jlpt-exams/${examId}`, { method: 'DELETE' }),
  getReadingPassages: (filters: { jlpt_level?: AdminJlptLevel } = {}) =>
    adminRequest<{ data: AdminReadingPassage[]; count: number }>(`/reading-passages?${adminParams(filters)}`),
  createReadingPassage: (payload: AdminReadingPassagePayload) =>
    adminRequest<{ message: string; data: AdminReadingPassage }>('/reading-passages', { method: 'POST', body: JSON.stringify(payload) }),
  updateReadingPassage: (passageId: number, payload: AdminReadingPassagePayload) =>
    adminRequest<{ message: string; data: AdminReadingPassage }>(`/reading-passages/${passageId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteReadingPassage: (passageId: number) =>
    adminRequest<{ message: string }>(`/reading-passages/${passageId}`, { method: 'DELETE' }),
  getJlptSections: (examId: number) =>
    adminRequest<{ data: AdminJlptSection[]; count: number }>(`/jlpt-exams/${examId}/sections`),
  createJlptSection: (examId: number, payload: AdminJlptSectionPayload) =>
    adminRequest<{ message: string; data: AdminJlptSection }>(`/jlpt-exams/${examId}/sections`, { method: 'POST', body: JSON.stringify(payload) }),
  updateJlptSection: (sectionId: number, payload: Partial<AdminJlptSectionPayload>) =>
    adminRequest<{ message: string; data: AdminJlptSection }>(`/jlpt-sections/${sectionId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteJlptSection: (sectionId: number) =>
    adminRequest<{ message: string }>(`/jlpt-sections/${sectionId}`, { method: 'DELETE' }),
  getJlptSectionQuestions: (sectionId: number) =>
    adminRequest<{ data: AdminQuizQuestion[]; count: number }>(`/jlpt-sections/${sectionId}/questions`),
  createJlptSectionQuestion: (sectionId: number, payload: AdminQuizQuestionPayload) =>
    adminRequest<{ message: string; data: AdminQuizQuestion }>(`/jlpt-sections/${sectionId}/questions`, { method: 'POST', body: JSON.stringify(payload) }),
  autoAddJlptSectionQuestions: (sectionId: number, payload: AdminAutoJlptQuestionsPayload) =>
    adminRequest<{ message: string; data: AdminQuizQuestion[]; added_count: number; requested_count: number }>(`/jlpt-sections/${sectionId}/questions/auto`, { method: 'POST', body: JSON.stringify(payload) }),
  updateJlptSectionQuestion: (sectionId: number, questionId: number, payload: AdminQuizQuestionPayload) =>
    adminRequest<{ message: string; data: AdminQuizQuestion }>(`/jlpt-sections/${sectionId}/questions/${questionId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  updateJlptSectionQuestionOrder: (sectionId: number, questionId: number, orderIndex: number | null) =>
    adminRequest<{ message: string }>(`/jlpt-sections/${sectionId}/questions/${questionId}/order`, { method: 'PATCH', body: JSON.stringify({ order_index: orderIndex }) }),
  deleteJlptSectionQuestion: (sectionId: number, questionId: number) =>
    adminRequest<{ message: string }>(`/jlpt-sections/${sectionId}/questions/${questionId}`, { method: 'DELETE' }),

  getBlogs: (filters: { search?: string; status?: AdminBlogStatus | 'all'; sort_order?: AdminSortOrder; limit?: number; offset?: number } = {}) =>
    adminRequest<{ data: AdminBlog[]; count: number }>(`/blogs?${adminParams({ limit: 50, ...filters })}`),
  createBlog: (payload: { title: string; slug?: string; excerpt?: string | null; content?: string | null; category?: string | null; category_name?: string | null; tags?: string[]; cover_asset_id?: number | null; image_url?: string | null; video_asset_id?: number | null; video_url?: string | null; status: AdminBlogStatus }) =>
    adminRequest<{ message: string; data: AdminBlog }>('/blogs', { method: 'POST', body: JSON.stringify(payload) }),
  updateBlog: (blogId: number, payload: Partial<{ title: string; slug: string; excerpt: string | null; content: string | null; category: string | null; category_name: string | null; tags: string[]; cover_asset_id: number | null; image_url: string | null; video_asset_id: number | null; video_url: string | null; status: AdminBlogStatus }>) =>
    adminRequest<{ message: string; data: AdminBlog }>(`/blogs/${blogId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteBlog: (blogId: number) =>
    adminRequest<{ message: string }>(`/blogs/${blogId}`, { method: 'DELETE' }),
};

export const blogAPI = {
  async getBlogs(filters: { search?: string; category?: string; tag?: string; published_after?: string; sort_order?: AdminSortOrder; limit?: number; offset?: number } = {}): Promise<{ data: Blog[]; count: number }> {
    const params = adminParams({ limit: 20, ...filters });
    const response = await fetch(`${API_BASE_URL}/blogs?${params}`);
    if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Failed to fetch blogs'));
    return response.json();
  },

  async getBlog(identifier: string): Promise<{ data: Blog }> {
    const response = await fetch(`${API_BASE_URL}/blogs/${encodeURIComponent(identifier)}`);
    if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Failed to fetch blog'));
    return response.json();
  },

  async getCategories(): Promise<{ data: BlogCategory[]; count: number }> {
    const response = await fetch(`${API_BASE_URL}/blogs/categories`);
    if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Failed to fetch blog categories'));
    return response.json();
  },
};

export interface AnalyticsSummary {
  active_courses: number;
  completed_courses: number;
  completed_lessons: number;
  quiz_attempts: number;
  jlpt_attempts: number;
  average_quiz_score: number;
  average_jlpt_score: number;
  total_study_seconds: number;
  study_seconds_this_week: number;
  study_seconds_this_month: number;
}

export interface StudyTimePoint {
  study_date: string;
  duration_seconds: number;
}

export interface AnalyticsAttempt {
  attempt_id: number;
  quiz_id?: number;
  exam_id?: number;
  title: string;
  quiz_type?: string | null;
  jlpt_level?: string | null;
  score: number | null;
  total_marks: number | null;
  status: string;
  started_at: string;
  submitted_at: string | null;
}

export type LearningGoalType = 'lessons_per_day' | 'quizzes_per_day' | 'study_minutes_per_day' | 'jlpt_tests_per_week';
export type LearningGoalPeriod = 'daily' | 'weekly' | 'monthly';

export interface LearningGoal {
  goal_id: number;
  user_id: number;
  goal_type: LearningGoalType;
  target_value: number;
  period: LearningGoalPeriod;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  current_value?: number;
  completed_today?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  achievement_id: number;
  code: string;
  name: string;
  description: string | null;
  badge_icon: string | null;
  badge_color: string | null;
  achievement_type: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  condition_key: string;
  condition_value: number;
  earned_at: string | null;
  current_value: number;
}

const authJsonRequest = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await authenticatedFetch(`${API_BASE_URL}${path}`, options);
  if (!response.ok) {
    if (response.status === 401) throw new Error('Unauthorized - Please login first');
    throw new Error(await getApiErrorMessage(response, 'Request failed'));
  }
  return response.json();
};

export const analyticsAPI = {
  getSummary: () => authJsonRequest<{ data: AnalyticsSummary }>('/analytics/me/summary'),
  getStudyTime: (range: '7d' | '30d' | '90d' = '30d') => authJsonRequest<{ data: StudyTimePoint[] }>(`/analytics/me/study-time?range=${range}`),
  getQuizPerformance: () => authJsonRequest<{ data: AnalyticsAttempt[] }>('/analytics/me/quiz-performance'),
  getJlptPerformance: () => authJsonRequest<{ data: AnalyticsAttempt[] }>('/analytics/me/jlpt-performance'),
};

export const goalAPI = {
  getGoals: () => authJsonRequest<{ data: LearningGoal[] }>('/goals/me'),
  createGoal: (payload: { goal_type: LearningGoalType; target_value: number; period: LearningGoalPeriod }) =>
    authJsonRequest<{ message: string; data: LearningGoal }>('/goals', { method: 'POST', body: JSON.stringify(payload) }),
  updateGoal: (goalId: number, payload: Partial<{ goal_type: LearningGoalType; target_value: number; period: LearningGoalPeriod; is_active: boolean }>) =>
    authJsonRequest<{ message: string; data: LearningGoal }>(`/goals/${goalId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteGoal: (goalId: number) =>
    authJsonRequest<{ message: string }>(`/goals/${goalId}`, { method: 'DELETE' }),
};

export const achievementAPI = {
  getMine: () => authJsonRequest<{ data: Achievement[] }>('/achievements/me'),
};

export const paymentAPI = {
  async createPayOsCoursePayment(courseId: number): Promise<{
    message: string;
    data: {
      payment_required: boolean;
      purchase: Purchase;
      transaction?: PaymentTransaction;
      enrollment?: any;
      course?: {
        course_id: number;
        title: string;
        price: number;
      };
    };
  }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/payments/courses/${courseId}/payos`, {
      method: 'POST',
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Unauthorized - Please login first');
      const error = await response.json();
      throw new Error(error.error || 'Failed to create payment');
    }

    return response.json();
  },

  async getPaymentStatus(transactionId: number): Promise<{ data: PaymentTransaction }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/payments/${transactionId}/status`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Unauthorized - Please login first');
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch payment status');
    }

    return response.json();
  },
};

/**
 * Enrollment API endpoints
 * Handles course enrollment, access tracking, and enrollment status
 */
export const enrollmentAPI = {
  /**
   * Get all user's enrolled courses (all statuses)
   */
  async getMyCourses(limit = 10, offset = 0): Promise<{ data: EnrolledCourse[]; count: number }> {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });

    const response = await authenticatedFetch(`${API_BASE_URL}/enrollments/my-courses?${params}`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login first');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch your courses');
    }

    return response.json();
  },

  /**
   * Get enrolled courses by status
   * Status: 'active' | 'completed' | 'dropped'
   */
  async getMyCoursesByStatus(
    status: 'active' | 'completed' | 'dropped',
    limit = 10,
    offset = 0
  ): Promise<{ data: EnrolledCourse[]; count: number; status: string }> {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });

    const response = await authenticatedFetch(`${API_BASE_URL}/enrollments/my-courses/${status}?${params}`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login first');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch your courses');
    }

    return response.json();
  },

  /**
   * Enroll user in a course
   * Creates both CourseEnrollment (access) and Purchase (payment) records
   */
  async enrollCourse(courseId: number, pricePaid = 0): Promise<{ message: string; data: { enrollment: any; purchase: Purchase } }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/enrollments/enroll`, {
      method: 'POST',
      body: JSON.stringify({
        course_id: courseId,
        price_paid: pricePaid,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login first');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to enroll in course');
    }

    return response.json();
  },

  /**
   * Get enrolled course detail with lessons and ratings
   */
  async getEnrolledCourseDetail(courseId: number): Promise<{ data: Course & { enrollment_status: string; enrollment_date: string } }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/enrollments/course/${courseId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login first');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch course detail');
    }

    return response.json();
  },

  /**
   * Update enrollment status
   */
  async updateEnrollmentStatus(
    enrollmentId: number,
    status: 'active' | 'completed' | 'dropped'
  ): Promise<{ message: string; data: any }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/enrollments/${enrollmentId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login first');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to update enrollment');
    }

    return response.json();
  },

  /**
   * Drop course / delete enrollment
   */
  async dropCourse(enrollmentId: number): Promise<{ message: string }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/enrollments/${enrollmentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login first');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to drop course');
    }

    return response.json();
  },

  /**
   * Get next unfinished lesson for enrolled course
   */
  async getNextLesson(courseId: number): Promise<{ data: Lesson }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/enrollments/course/${courseId}/next-lesson`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login first');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch next lesson');
    }

    return response.json();
  },

  /**
   * Mark a lesson as started
   */
  async markLessonStarted(
    courseId: number,
    lessonId: number
  ): Promise<{
    message: string;
    data: {
      lesson_id: number;
      started: boolean;
    };
  }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/enrollments/course/${courseId}/lessons/${lessonId}/start`, {
      method: 'PUT',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login first');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to start lesson progress');
    }

    return response.json();
  },

  /**
   * Mark a lesson as completed
   */
  async markLessonCompleted(
    courseId: number,
    lessonId: number
  ): Promise<{
    message: string;
    data: {
      lesson_id: number;
      completed: boolean;
      course_completed?: boolean;
      needs_final_quiz?: boolean;
      final_quiz?: Quiz | null;
      enrollment_status?: 'active' | 'completed' | 'dropped';
      progress_percent?: number;
      completed_lessons?: number;
      total_lessons?: number;
    };
  }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/enrollments/course/${courseId}/lessons/${lessonId}/complete`, {
      method: 'PUT',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login first');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark lesson as completed');
    }

    return response.json();
  },
};

// Rating API endpoints
export const ratingAPI = {
  async getCourseRatings(
    courseId: number,
    limit = 5,
    offset = 0
  ): Promise<{ data: CourseRating[]; average_rating: number; rating_count: number }> {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });

    const response = await fetch(`${API_BASE_URL}/ratings/courses/${courseId}?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch course ratings');
    }

    return response.json();
  },

  async getTopRatedCourses(limit = 3): Promise<{ data: any[]; count: number }> {
    const params = new URLSearchParams({ limit: String(limit) });
    const response = await fetch(`${API_BASE_URL}/ratings/top-rated/courses?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch top-rated courses');
    }

    return response.json();
  },

  async createRating(
    courseId: number,
    rating: number,
    review?: string
  ): Promise<{ message: string; data: CourseRating }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/ratings/courses/${courseId}`, {
      method: 'POST',
      body: JSON.stringify({
        rating,
        review,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login first');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to create rating');
    }

    return response.json();
  },

  async updateRating(
    ratingId: number,
    rating: number,
    review?: string
  ): Promise<{ message: string; data: CourseRating }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/ratings/${ratingId}`, {
      method: 'PUT',
      body: JSON.stringify({
        rating,
        review,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login first');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to update rating');
    }

    return response.json();
  },

  async deleteRating(ratingId: number): Promise<{ message: string }> {
    const response = await authenticatedFetch(`${API_BASE_URL}/ratings/${ratingId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Please login first');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete rating');
    }

    return response.json();
  },
};
