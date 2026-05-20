CREATE TABLE "User" (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('guest', 'learner', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Course" (
    course_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    level VARCHAR(50),
    duration INT,
    price NUMERIC(10, 2) DEFAULT 0 NOT NULL,
    created_by INT NOT NULL REFERENCES "User"(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Lesson" (
    lesson_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES "Course"(course_id),
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('video', 'text', 'quiz')),
    content_text TEXT,
    video_url TEXT,
    order_index INT NOT NULL,
    duration INT,
    created_by INT NOT NULL REFERENCES "User"(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "FlashcardCollection" (
    collection_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "User"(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    visibility VARCHAR(20) CHECK (visibility IN ('private', 'public')) DEFAULT 'private',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Flashcard" (
    flashcard_id SERIAL PRIMARY KEY,
    collection_id INT NOT NULL REFERENCES "FlashcardCollection"(collection_id) ON DELETE CASCADE,
    lesson_id INT REFERENCES "Lesson"(lesson_id) ON DELETE SET NULL,
    front_text TEXT NOT NULL,
    back_text TEXT NOT NULL,
    reading TEXT,
    example_sentence TEXT,
    image_url TEXT,
    audio_url TEXT,
    tags TEXT[],
    order_index INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_flashcard_collection_user ON "FlashcardCollection"(user_id);
CREATE INDEX idx_flashcard_collection ON "Flashcard"(collection_id);
CREATE INDEX idx_flashcard_lesson ON "Flashcard"(lesson_id);

CREATE TABLE "Quiz" (
    quiz_id SERIAL PRIMARY KEY,
    lesson_id INT REFERENCES "Lesson"(lesson_id),
    course_id INT REFERENCES "Course"(course_id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    quiz_type VARCHAR(30) CHECK (quiz_type IN ('lesson_quiz', 'practice_test', 'final_test', 'jlpt_mock')),
    passing_score NUMERIC(5, 2) DEFAULT 70,
    total_marks NUMERIC(5, 2) DEFAULT 0,
    time_limit_minutes INT,
    created_by INT NOT NULL REFERENCES "User"(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Question" (
    question_id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    question_type VARCHAR(30) NOT NULL CHECK (question_type IN ('single_choice', 'multiple_choice', 'true_false', 'fill_in_blank')),
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')),
    explanation TEXT,
    points NUMERIC(5, 2) DEFAULT 1,
    jlpt_level VARCHAR(10) CHECK (jlpt_level IN ('N5', 'N4', 'N3', 'N2', 'N1')),
    section_type VARCHAR(30) CHECK (section_type IN ('vocabulary', 'grammar', 'reading', 'listening')),
    created_by INT REFERENCES "User"(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "LessonNote" (
    note_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "User"(user_id) ON DELETE CASCADE,
    lesson_id INT REFERENCES "Lesson"(lesson_id) ON DELETE CASCADE,
    question_id INT REFERENCES "Question"(question_id) ON DELETE CASCADE,
    note_type VARCHAR(30) NOT NULL CHECK (
        note_type IN ('text_note', 'video_note', 'highlight', 'question_note', 'ai_summary')
    ),
    note_content TEXT NOT NULL,
    selected_text TEXT,
    video_timestamp_seconds INT,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lesson_note_user ON "LessonNote"(user_id);
CREATE INDEX idx_lesson_note_lesson ON "LessonNote"(lesson_id);
CREATE INDEX idx_lesson_note_question ON "LessonNote"(question_id);
CREATE INDEX idx_lesson_note_user_lesson ON "LessonNote"(user_id, lesson_id);
CREATE UNIQUE INDEX uq_lesson_note_text_per_lesson
ON "LessonNote"(user_id, lesson_id, note_type)
WHERE is_deleted = FALSE AND note_type IN ('text_note', 'ai_summary');
CREATE UNIQUE INDEX uq_lesson_note_question
ON "LessonNote"(user_id, question_id)
WHERE is_deleted = FALSE AND note_type = 'question_note';
CREATE UNIQUE INDEX uq_lesson_note_video_timestamp
ON "LessonNote"(user_id, lesson_id, video_timestamp_seconds)
WHERE is_deleted = FALSE AND note_type = 'video_note';
CREATE UNIQUE INDEX uq_lesson_note_highlight_text
ON "LessonNote"(user_id, lesson_id, selected_text)
WHERE is_deleted = FALSE AND note_type = 'highlight';

CREATE TABLE "Option" (
    option_id SERIAL PRIMARY KEY,
    question_id INT NOT NULL REFERENCES "Question"(question_id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE NOT NULL,
    explanation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "QuizQuestion" (
    quiz_question_id SERIAL PRIMARY KEY,
    quiz_id INT NOT NULL REFERENCES "Quiz"(quiz_id) ON DELETE CASCADE,
    question_id INT NOT NULL REFERENCES "Question"(question_id) ON DELETE CASCADE,
    order_index INT,
    marks NUMERIC(5, 2) DEFAULT 1,
    UNIQUE (quiz_id, question_id)
);

CREATE TABLE "QuizAttempt" (
    attempt_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "User"(user_id),
    quiz_id INT NOT NULL REFERENCES "Quiz"(quiz_id),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    score NUMERIC(5, 2),
    total_marks NUMERIC(5, 2),
    status VARCHAR(20) CHECK (status IN ('in_progress', 'submitted', 'graded')) DEFAULT 'in_progress'
);

CREATE TABLE "UserAnswer" (
    user_answer_id SERIAL PRIMARY KEY,
    attempt_id INT NOT NULL REFERENCES "QuizAttempt"(attempt_id) ON DELETE CASCADE,
    question_id INT NOT NULL REFERENCES "Question"(question_id),
    option_id INT REFERENCES "Option"(option_id),
    answer_text TEXT,
    is_correct BOOLEAN,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "JLPTExam" (
    exam_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    jlpt_level VARCHAR(10) CHECK (jlpt_level IN ('N5', 'N4', 'N3', 'N2', 'N1')),
    year INT,
    duration_minutes INT,
    created_by INT REFERENCES "User"(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "JLPTSection" (
    section_id SERIAL PRIMARY KEY,
    exam_id INT NOT NULL REFERENCES "JLPTExam"(exam_id) ON DELETE CASCADE,
    title VARCHAR(100),
    section_order INT,
    duration_minutes INT
);

CREATE TABLE "JLPTSectionQuestion" (
    id SERIAL PRIMARY KEY,
    section_id INT NOT NULL REFERENCES "JLPTSection"(section_id) ON DELETE CASCADE,
    question_id INT NOT NULL REFERENCES "Question"(question_id),
    order_index INT
);

CREATE TABLE "Purchase" (
    purchase_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "User"(user_id),
    course_id INT NOT NULL REFERENCES "Course"(course_id),
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    price_paid NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'canceled'))
);

CREATE TABLE "CourseEnrollment" (
    enrollment_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "User"(user_id),
    course_id INT NOT NULL REFERENCES "Course"(course_id),
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('active', 'completed', 'dropped')),
    UNIQUE (user_id, course_id)
);

CREATE TABLE "Certificate" (
    certificate_id SERIAL PRIMARY KEY,
    certificate_code VARCHAR(80) UNIQUE NOT NULL,
    user_id INT NOT NULL REFERENCES "User"(user_id) ON DELETE CASCADE,
    course_id INT NOT NULL REFERENCES "Course"(course_id) ON DELETE CASCADE,
    enrollment_id INT REFERENCES "CourseEnrollment"(enrollment_id) ON DELETE SET NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, course_id)
);

CREATE INDEX idx_certificate_user ON "Certificate"(user_id);
CREATE INDEX idx_certificate_course ON "Certificate"(course_id);

CREATE TABLE "CourseRating" (
    rating_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL,
    user_id INT NOT NULL,
    rating NUMERIC(2, 1) CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (course_id, user_id),
    FOREIGN KEY (user_id, course_id) REFERENCES "CourseEnrollment"(user_id, course_id)
);

CREATE TABLE "UserLessonProgress" (
    user_lesson_progress_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "User"(user_id),
    lesson_id INT NOT NULL REFERENCES "Lesson"(lesson_id),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    video_watched_percent NUMERIC(5, 2) DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
    UNIQUE (user_id, lesson_id)
);
