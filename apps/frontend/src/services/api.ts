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
    role: string;
  };
  token?: string;
}

export interface UserProfile {
  user_id: number;
  username: string;
  email: string;
  role: string;
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
  const headers = {
    'Content-Type': 'application/json',
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

  async updateMe(data: Pick<UserProfile, 'username' | 'email'>): Promise<{ message: string; data: UserProfile }> {
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
  content_type: 'video' | 'text' | 'quiz';
  content_text: string | null;
  video_url: string | null;
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
  quiz_type: 'lesson_quiz' | 'practice_test' | 'final_test' | 'jlpt_mock' | null;
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
  quiz_type?: 'lesson_quiz' | 'practice_test' | 'final_test' | 'jlpt_mock' | null;
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
    if (typeof error.error === 'string') return error.error;
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
