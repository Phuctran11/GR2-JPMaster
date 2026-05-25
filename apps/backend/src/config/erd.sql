CREATE TABLE "User" (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role VARCHAR(20) NOT NULL CHECK (role IN ('learner', 'owner', 'admin')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_status ON "User"(status);
CREATE INDEX idx_user_deleted_at ON "User"(deleted_at);

CREATE TABLE "CloudinaryAsset" (
    asset_id SERIAL PRIMARY KEY,
    public_id VARCHAR(255) UNIQUE NOT NULL,
    secure_url TEXT NOT NULL,
    resource_type VARCHAR(20) NOT NULL CHECK (resource_type IN ('image', 'video', 'raw')),
    media_kind VARCHAR(20) NOT NULL CHECK (media_kind IN ('image', 'video', 'audio')),
    format VARCHAR(30),
    bytes BIGINT,
    width INT,
    height INT,
    duration_seconds NUMERIC(10, 2),
    folder VARCHAR(255),
    original_filename VARCHAR(255),
    uploaded_by INT REFERENCES "User"(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cloudinary_asset_public_id ON "CloudinaryAsset"(public_id);
CREATE INDEX idx_cloudinary_asset_kind ON "CloudinaryAsset"(media_kind);
CREATE INDEX idx_cloudinary_asset_uploaded_by ON "CloudinaryAsset"(uploaded_by);

CREATE TABLE "Course" (
    course_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    level VARCHAR(50) NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    duration INT,
    price NUMERIC(10, 2) DEFAULT 0 NOT NULL,
    cover_asset_id INT REFERENCES "CloudinaryAsset"(asset_id) ON DELETE SET NULL,
    image_url TEXT,
    created_by INT NOT NULL REFERENCES "User"(user_id),
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_course_cover_asset ON "Course"(cover_asset_id);
CREATE INDEX idx_course_deleted_at ON "Course"(deleted_at);
CREATE INDEX idx_course_created_by ON "Course"(created_by);
CREATE INDEX idx_course_level ON "Course"(level);

CREATE TABLE "BlogCategory" (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Blog" (
    blog_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT,
    category_id INT REFERENCES "BlogCategory"(category_id) ON DELETE SET NULL,
    cover_asset_id INT REFERENCES "CloudinaryAsset"(asset_id) ON DELETE SET NULL,
    image_url TEXT,
    video_asset_id INT REFERENCES "CloudinaryAsset"(asset_id) ON DELETE SET NULL,
    video_url TEXT,
    status VARCHAR(20) CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
    author_id INT NOT NULL REFERENCES "User"(user_id),
    published_at TIMESTAMP,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (status <> 'published' OR published_at IS NOT NULL)
);

CREATE INDEX idx_blog_status ON "Blog"(status);
CREATE INDEX idx_blog_author ON "Blog"(author_id);
CREATE INDEX idx_blog_category ON "Blog"(category_id);
CREATE INDEX idx_blog_cover_asset ON "Blog"(cover_asset_id);
CREATE INDEX idx_blog_video_asset ON "Blog"(video_asset_id);
CREATE INDEX idx_blog_deleted_at ON "Blog"(deleted_at);
CREATE INDEX idx_blog_public_published ON "Blog"(status, deleted_at, published_at DESC);

CREATE TABLE "BlogTag" (
    tag_id SERIAL PRIMARY KEY,
    name VARCHAR(80) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    tag_type VARCHAR(30) CHECK (tag_type IN ('skill', 'jlpt_level', 'topic')) DEFAULT 'topic',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "BlogTagMap" (
    blog_id INT NOT NULL REFERENCES "Blog"(blog_id) ON DELETE CASCADE,
    tag_id INT NOT NULL REFERENCES "BlogTag"(tag_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (blog_id, tag_id)
);

CREATE INDEX idx_blog_tag_type ON "BlogTag"(tag_type);
CREATE INDEX idx_blog_tag_map_blog ON "BlogTagMap"(blog_id);
CREATE INDEX idx_blog_tag_map_tag ON "BlogTagMap"(tag_id);

CREATE TABLE "Lesson" (
    lesson_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES "Course"(course_id),
    title VARCHAR(255) NOT NULL,
    content_text TEXT,
    video_asset_id INT REFERENCES "CloudinaryAsset"(asset_id) ON DELETE SET NULL,
    video_url TEXT,
    audio_asset_id INT REFERENCES "CloudinaryAsset"(asset_id) ON DELETE SET NULL,
    audio_url TEXT,
    order_index INT NOT NULL,
    duration INT,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lesson_video_asset ON "Lesson"(video_asset_id);
CREATE INDEX idx_lesson_audio_asset ON "Lesson"(audio_asset_id);
CREATE INDEX idx_lesson_deleted_at ON "Lesson"(deleted_at);
CREATE INDEX idx_lesson_course_order ON "Lesson"(course_id, order_index);
CREATE INDEX idx_lesson_active_course ON "Lesson"(course_id)
WHERE deleted_at IS NULL;

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
    image_asset_id INT REFERENCES "CloudinaryAsset"(asset_id) ON DELETE SET NULL,
    image_url TEXT,
    audio_asset_id INT REFERENCES "CloudinaryAsset"(asset_id) ON DELETE SET NULL,
    audio_url TEXT,
    tags TEXT[],
    order_index INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_flashcard_collection_user ON "FlashcardCollection"(user_id);
CREATE INDEX idx_flashcard_collection ON "Flashcard"(collection_id);
CREATE INDEX idx_flashcard_lesson ON "Flashcard"(lesson_id);
CREATE INDEX idx_flashcard_image_asset ON "Flashcard"(image_asset_id);
CREATE INDEX idx_flashcard_audio_asset ON "Flashcard"(audio_asset_id);

CREATE TABLE "Quiz" (
    quiz_id SERIAL PRIMARY KEY,
    lesson_id INT REFERENCES "Lesson"(lesson_id),
    course_id INT REFERENCES "Course"(course_id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    quiz_type VARCHAR(30) CHECK (quiz_type IN ('lesson_quiz', 'practice_test', 'final_test')),
    passing_score NUMERIC(5, 2) DEFAULT 70,
    total_marks NUMERIC(5, 2) DEFAULT 0,
    time_limit_minutes INT,
    deleted_at TIMESTAMP,
    created_by INT NOT NULL REFERENCES "User"(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quiz_deleted_at ON "Quiz"(deleted_at);
CREATE INDEX idx_quiz_lesson ON "Quiz"(lesson_id);
CREATE INDEX idx_quiz_course ON "Quiz"(course_id);
CREATE INDEX idx_quiz_type ON "Quiz"(quiz_type);

CREATE TABLE "ReadingPassage" (
    passage_id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    jlpt_level VARCHAR(10) CHECK (jlpt_level IN ('N5', 'N4', 'N3', 'N2', 'N1')),
    passage_text TEXT,
    image_asset_id INT REFERENCES "CloudinaryAsset"(asset_id) ON DELETE SET NULL,
    image_url TEXT,
    created_by INT REFERENCES "User"(user_id) ON DELETE SET NULL,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reading_passage_deleted_at ON "ReadingPassage"(deleted_at);
CREATE INDEX idx_reading_passage_level ON "ReadingPassage"(jlpt_level);
CREATE INDEX idx_reading_passage_created_by ON "ReadingPassage"(created_by);
CREATE INDEX idx_reading_passage_image_asset ON "ReadingPassage"(image_asset_id);

CREATE TABLE "Question" (
    question_id SERIAL PRIMARY KEY,
    question_text TEXT NOT NULL,
    question_type VARCHAR(30) NOT NULL CHECK (question_type IN ('single_choice', 'multiple_choice', 'true_false', 'fill_in_blank')),
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'expert')),
    explanation TEXT,
    points NUMERIC(5, 2) DEFAULT 1,
    jlpt_level VARCHAR(10) CHECK (jlpt_level IN ('N5', 'N4', 'N3', 'N2', 'N1')),
    section_type VARCHAR(30) CHECK (section_type IN ('vocabulary', 'grammar', 'reading', 'listening')),
    reading_passage_id INT REFERENCES "ReadingPassage"(passage_id) ON DELETE SET NULL,
    image_asset_id INT REFERENCES "CloudinaryAsset"(asset_id) ON DELETE SET NULL,
    image_url TEXT,
    audio_asset_id INT REFERENCES "CloudinaryAsset"(asset_id) ON DELETE SET NULL,
    audio_url TEXT,
    created_by INT REFERENCES "User"(user_id),
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_question_deleted_at ON "Question"(deleted_at);
CREATE INDEX idx_question_image_asset ON "Question"(image_asset_id);
CREATE INDEX idx_question_audio_asset ON "Question"(audio_asset_id);
CREATE INDEX idx_question_created_by ON "Question"(created_by);
CREATE INDEX idx_question_jlpt_section ON "Question"(jlpt_level, section_type);
CREATE INDEX idx_question_auto_jlpt_bank ON "Question"(section_type, jlpt_level, difficulty_level, created_by, question_id)
WHERE deleted_at IS NULL;
CREATE INDEX idx_question_reading_passage ON "Question"(reading_passage_id);

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

CREATE INDEX idx_option_question ON "Option"(question_id);

CREATE TABLE "QuizQuestion" (
    quiz_question_id SERIAL PRIMARY KEY,
    quiz_id INT NOT NULL REFERENCES "Quiz"(quiz_id) ON DELETE CASCADE,
    question_id INT NOT NULL REFERENCES "Question"(question_id) ON DELETE CASCADE,
    order_index INT,
    marks NUMERIC(5, 2) DEFAULT 1,
    deleted_at TIMESTAMP,
    UNIQUE (quiz_id, question_id)
);

CREATE INDEX idx_quiz_question_deleted_at ON "QuizQuestion"(deleted_at);
CREATE INDEX idx_quiz_question_quiz_order ON "QuizQuestion"(quiz_id, order_index);
CREATE INDEX idx_quiz_question_question ON "QuizQuestion"(question_id);

CREATE TABLE "QuizAttempt" (
    attempt_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "User"(user_id),
    quiz_id INT REFERENCES "Quiz"(quiz_id),
    jlpt_exam_id INT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    score NUMERIC(5, 2),
    total_marks NUMERIC(5, 2),
    status VARCHAR(20) CHECK (status IN ('in_progress', 'submitted', 'graded')) DEFAULT 'in_progress',
    CHECK (
        (quiz_id IS NOT NULL AND jlpt_exam_id IS NULL)
        OR
        (quiz_id IS NULL AND jlpt_exam_id IS NOT NULL)
    )
);

CREATE INDEX idx_quiz_attempt_user_quiz ON "QuizAttempt"(user_id, quiz_id);
CREATE INDEX idx_quiz_attempt_user_jlpt_exam ON "QuizAttempt"(user_id, jlpt_exam_id);
CREATE INDEX idx_quiz_attempt_status ON "QuizAttempt"(status);
CREATE INDEX idx_quiz_attempt_user_quiz_status_submitted
ON "QuizAttempt"(user_id, quiz_id, status, submitted_at DESC, attempt_id DESC);

CREATE TABLE "UserAnswer" (
    user_answer_id SERIAL PRIMARY KEY,
    attempt_id INT NOT NULL REFERENCES "QuizAttempt"(attempt_id) ON DELETE CASCADE,
    question_id INT NOT NULL REFERENCES "Question"(question_id),
    jlpt_section_id INT,
    option_id INT REFERENCES "Option"(option_id),
    answer_text TEXT,
    is_correct BOOLEAN,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_answer_attempt ON "UserAnswer"(attempt_id);
CREATE INDEX idx_user_answer_question ON "UserAnswer"(question_id);
CREATE INDEX idx_user_answer_jlpt_section ON "UserAnswer"(jlpt_section_id);
CREATE INDEX idx_user_answer_option ON "UserAnswer"(option_id);

CREATE TABLE "JLPTExam" (
    exam_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    jlpt_level VARCHAR(10) CHECK (jlpt_level IN ('N5', 'N4', 'N3', 'N2', 'N1')),
    year INT,
    duration_minutes INT,
    created_by INT REFERENCES "User"(user_id),
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jlpt_exam_deleted_at ON "JLPTExam"(deleted_at);
CREATE INDEX idx_jlpt_exam_level ON "JLPTExam"(jlpt_level);

CREATE TABLE "JLPTSection" (
    section_id SERIAL PRIMARY KEY,
    exam_id INT NOT NULL REFERENCES "JLPTExam"(exam_id) ON DELETE CASCADE,
    title VARCHAR(100),
    section_type VARCHAR(30) CHECK (section_type IN ('vocabulary', 'grammar', 'reading', 'listening')),
    section_order INT,
    duration_minutes INT,
    audio_asset_id INT REFERENCES "CloudinaryAsset"(asset_id) ON DELETE SET NULL,
    audio_url TEXT,
    deleted_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jlpt_section_audio_asset ON "JLPTSection"(audio_asset_id);
CREATE INDEX idx_jlpt_section_type ON "JLPTSection"(section_type);
CREATE INDEX idx_jlpt_section_deleted_at ON "JLPTSection"(deleted_at);
CREATE INDEX idx_jlpt_section_exam_order ON "JLPTSection"(exam_id, section_order);

CREATE TABLE "JLPTSectionQuestion" (
    id SERIAL PRIMARY KEY,
    section_id INT NOT NULL REFERENCES "JLPTSection"(section_id) ON DELETE CASCADE,
    question_id INT NOT NULL REFERENCES "Question"(question_id),
    order_index INT,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_jlpt_section_question_deleted_at ON "JLPTSectionQuestion"(deleted_at);
CREATE INDEX idx_jlpt_section_question_section_order ON "JLPTSectionQuestion"(section_id, order_index);
CREATE INDEX idx_jlpt_section_question_question ON "JLPTSectionQuestion"(question_id);
CREATE INDEX idx_jlpt_section_question_active_question ON "JLPTSectionQuestion"(question_id, section_id)
WHERE deleted_at IS NULL;

ALTER TABLE "QuizAttempt"
ADD CONSTRAINT fk_quiz_attempt_jlpt_exam
FOREIGN KEY (jlpt_exam_id) REFERENCES "JLPTExam"(exam_id);

ALTER TABLE "UserAnswer"
ADD CONSTRAINT fk_user_answer_jlpt_section
FOREIGN KEY (jlpt_section_id) REFERENCES "JLPTSection"(section_id) ON DELETE SET NULL;

CREATE TABLE "Purchase" (
    purchase_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "User"(user_id),
    course_id INT NOT NULL REFERENCES "Course"(course_id),
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    price_paid NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'canceled'))
);

CREATE INDEX idx_purchase_user ON "Purchase"(user_id);
CREATE INDEX idx_purchase_course ON "Purchase"(course_id);
CREATE INDEX idx_purchase_status ON "Purchase"(status);
CREATE INDEX idx_purchase_user_course_status ON "Purchase"(user_id, course_id, status);

CREATE TABLE "PaymentTransaction" (
    payment_transaction_id SERIAL PRIMARY KEY,
    purchase_id INT NOT NULL REFERENCES "Purchase"(purchase_id) ON DELETE CASCADE,
    provider VARCHAR(30) NOT NULL CHECK (provider IN ('payos')),
    provider_order_id VARCHAR(100) UNIQUE NOT NULL,
    order_code BIGINT UNIQUE,
    provider_payment_link_id VARCHAR(120),
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'VND',
    payment_content VARCHAR(100) NOT NULL,
    qr_image_url TEXT NOT NULL,
    checkout_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'paid', 'failed', 'canceled', 'expired')
    ),
    paid_at TIMESTAMP,
    expired_at TIMESTAMP,
    raw_response JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_transaction_purchase ON "PaymentTransaction"(purchase_id);
CREATE INDEX idx_payment_transaction_provider_order ON "PaymentTransaction"(provider, provider_order_id);
CREATE INDEX idx_payment_transaction_order_code ON "PaymentTransaction"(order_code);
CREATE INDEX idx_payment_transaction_status ON "PaymentTransaction"(status);
CREATE INDEX idx_payment_transaction_expired_at ON "PaymentTransaction"(expired_at);

CREATE TABLE "CourseEnrollment" (
    enrollment_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "User"(user_id),
    course_id INT NOT NULL REFERENCES "Course"(course_id),
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('active', 'completed', 'dropped')),
    UNIQUE (user_id, course_id)
);

CREATE INDEX idx_course_enrollment_user_status ON "CourseEnrollment"(user_id, status);
CREATE INDEX idx_course_enrollment_course ON "CourseEnrollment"(course_id);

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
CREATE INDEX idx_course_rating_course_created ON "CourseRating"(course_id, created_at DESC);

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

CREATE INDEX idx_user_lesson_progress_user_status ON "UserLessonProgress"(user_id, status);
CREATE INDEX idx_user_lesson_progress_lesson ON "UserLessonProgress"(lesson_id);
CREATE INDEX idx_user_lesson_progress_user_completed_at ON "UserLessonProgress"(user_id, completed_at);
CREATE INDEX idx_user_lesson_progress_user_completed ON "UserLessonProgress"(user_id, completed);
CREATE INDEX idx_user_lesson_progress_completed_at
    ON "UserLessonProgress"(completed_at)
    WHERE completed = TRUE OR status = 'completed';

CREATE TABLE "StudySession" (
    session_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "User"(user_id) ON DELETE CASCADE,
    course_id INT REFERENCES "Course"(course_id) ON DELETE SET NULL,
    lesson_id INT REFERENCES "Lesson"(lesson_id) ON DELETE SET NULL,
    quiz_id INT REFERENCES "Quiz"(quiz_id) ON DELETE SET NULL,
    jlpt_exam_id INT REFERENCES "JLPTExam"(exam_id) ON DELETE SET NULL,
    activity_type VARCHAR(30) NOT NULL CHECK (
        activity_type IN ('lesson', 'quiz', 'jlpt_test', 'flashcard', 'review')
    ),
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    duration_seconds INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_study_session_user_time ON "StudySession"(user_id, started_at);
CREATE INDEX idx_study_session_user_type ON "StudySession"(user_id, activity_type);
CREATE INDEX idx_study_session_course ON "StudySession"(course_id);
CREATE INDEX idx_study_session_lesson ON "StudySession"(lesson_id);
CREATE INDEX idx_study_session_quiz ON "StudySession"(quiz_id);
CREATE INDEX idx_study_session_jlpt_exam ON "StudySession"(jlpt_exam_id);

CREATE TABLE "LearningGoal" (
    goal_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "User"(user_id) ON DELETE CASCADE,
    goal_type VARCHAR(30) NOT NULL CHECK (
        goal_type IN (
            'lessons_per_day',
            'quizzes_per_day',
            'study_minutes_per_day',
            'jlpt_tests_per_week'
        )
    ),
    target_value INT NOT NULL CHECK (target_value > 0),
    period VARCHAR(20) NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_learning_goal_user_active ON "LearningGoal"(user_id, is_active);
CREATE INDEX idx_learning_goal_user_type ON "LearningGoal"(user_id, goal_type);
CREATE INDEX idx_learning_goal_active_window ON "LearningGoal"(user_id, goal_type, start_date, end_date)
    WHERE is_active = TRUE;
CREATE INDEX idx_learning_goal_user_period ON "LearningGoal"(user_id, period);

CREATE TABLE "GoalProgress" (
    progress_id SERIAL PRIMARY KEY,
    goal_id INT NOT NULL REFERENCES "LearningGoal"(goal_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES "User"(user_id) ON DELETE CASCADE,
    progress_date DATE NOT NULL,
    actual_value INT DEFAULT 0 CHECK (actual_value >= 0),
    target_value INT NOT NULL CHECK (target_value > 0),
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (goal_id, progress_date)
);

CREATE INDEX idx_goal_progress_user_date ON "GoalProgress"(user_id, progress_date);
CREATE INDEX idx_goal_progress_goal_date ON "GoalProgress"(goal_id, progress_date);
CREATE INDEX idx_goal_progress_completed ON "GoalProgress"(completed);
CREATE INDEX idx_goal_progress_user_completed_date ON "GoalProgress"(user_id, completed, progress_date);

CREATE TABLE "Achievement" (
    achievement_id SERIAL PRIMARY KEY,
    code VARCHAR(80) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    badge_icon VARCHAR(80),
    badge_color VARCHAR(30),
    achievement_type VARCHAR(30) NOT NULL CHECK (
        achievement_type IN ('streak', 'lesson', 'quiz', 'score', 'time', 'goal', 'jlpt', 'course')
    ),
    tier VARCHAR(20) NOT NULL DEFAULT 'bronze' CHECK (
        tier IN ('bronze', 'silver', 'gold', 'platinum')
    ),
    condition_key VARCHAR(80) NOT NULL,
    condition_value INT NOT NULL CHECK (condition_value > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_achievement_type ON "Achievement"(achievement_type);
CREATE INDEX idx_achievement_tier ON "Achievement"(tier);
CREATE INDEX idx_achievement_condition ON "Achievement"(condition_key, condition_value);
CREATE INDEX idx_achievement_type_condition ON "Achievement"(achievement_type, condition_key, condition_value);

CREATE TABLE "UserAchievement" (
    user_achievement_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "User"(user_id) ON DELETE CASCADE,
    achievement_id INT NOT NULL REFERENCES "Achievement"(achievement_id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    UNIQUE (user_id, achievement_id)
);

CREATE INDEX idx_user_achievement_user ON "UserAchievement"(user_id);
CREATE INDEX idx_user_achievement_achievement ON "UserAchievement"(achievement_id);
CREATE INDEX idx_user_achievement_earned_at ON "UserAchievement"(earned_at);
