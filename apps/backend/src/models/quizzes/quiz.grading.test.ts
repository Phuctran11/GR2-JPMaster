import assert from "node:assert/strict";
import test from "node:test";
import { buildQuizUserAnswerRows } from "./quizAnswerRows.js";
import { gradeQuiz } from "./quiz.grading.js";
import type { QuizDetail } from "./quiz.types.js";

const baseQuiz = (questions: QuizDetail["questions"], passingScore = 60): QuizDetail => ({
  quiz_id: 1,
  lesson_id: 1,
  course_id: 1,
  title: "Quiz",
  description: null,
  quiz_type: "lesson_quiz",
  passing_score: passingScore,
  total_marks: 0,
  time_limit_minutes: null,
  created_by: 1,
  created_at: new Date("2026-01-01"),
  updated_at: new Date("2026-01-01"),
  questions,
});

const question = (overrides: Partial<QuizDetail["questions"][number]>): QuizDetail["questions"][number] => ({
  question_id: 1,
  question_text: "Question",
  question_type: "single_choice",
  difficulty_level: null,
  explanation: null,
  points: 1,
  jlpt_level: null,
  section_type: null,
  image_asset_id: null,
  image_url: null,
  audio_asset_id: null,
  audio_url: null,
  order_index: null,
  marks: 1,
  options: [
    { option_id: 10, question_id: 1, option_text: "A", explanation: null, is_correct: true },
    { option_id: 11, question_id: 1, option_text: "B", explanation: null, is_correct: false },
  ],
  ...overrides,
});

test("gradeQuiz grades single choice and ignores invalid option ids", () => {
  const result = gradeQuiz(baseQuiz([question({})]), [{ question_id: 1, option_id: 999 }]);
  assert.equal(result.earnedMarks, 0);
  assert.equal(result.score, 0);
  assert.deepEqual(result.gradedAnswers[0].selectedOptionIds, []);
});

test("gradeQuiz requires exact set for multiple choice", () => {
  const quiz = baseQuiz([
    question({
      question_type: "multiple_choice",
      marks: 2,
      options: [
        { option_id: 10, question_id: 1, option_text: "A", explanation: null, is_correct: true },
        { option_id: 11, question_id: 1, option_text: "B", explanation: null, is_correct: true },
        { option_id: 12, question_id: 1, option_text: "C", explanation: null, is_correct: false },
      ],
    }),
  ]);

  assert.equal(gradeQuiz(quiz, [{ question_id: 1, option_ids: [11, 10] }]).score, 100);
  assert.equal(gradeQuiz(quiz, [{ question_id: 1, option_ids: [10] }]).score, 0);
  assert.equal(gradeQuiz(quiz, [{ question_id: 1, option_ids: [10, 11, 12] }]).score, 0);
});

test("gradeQuiz normalizes fill in blank answers", () => {
  const quiz = baseQuiz([
    question({
      question_type: "fill_in_blank",
      options: [
        { option_id: 10, question_id: 1, option_text: "お は よう", explanation: null, is_correct: true },
      ],
    }),
  ]);

  const result = gradeQuiz(quiz, [{ question_id: 1, answer_text: " お   は よう " }]);
  assert.equal(result.score, 100);
  assert.equal(result.passed, true);
});

test("buildQuizUserAnswerRows creates null option row when no option is selected", () => {
  const quiz = baseQuiz([question({ question_type: "fill_in_blank" })]);
  const result = gradeQuiz(quiz, [{ question_id: 1, answer_text: "A" }]);
  const rows = buildQuizUserAnswerRows(77, result.gradedAnswers);

  assert.deepEqual(rows, [
    {
      attemptId: 77,
      questionId: 1,
      optionId: null,
      answerText: "A",
      isCorrect: true,
    },
  ]);
});
