import assert from "node:assert/strict";
import test from "node:test";
import { buildJlptUserAnswerRows } from "./jlptAnswerRows.js";
import { gradeJlptExam, type JlptGradingOption, type JlptGradingQuestion } from "./jlptExam.grading.js";

const optionsByQuestion = (options: JlptGradingOption[]) => {
  const map = new Map<number, JlptGradingOption[]>();
  for (const option of options) {
    const items = map.get(option.question_id) ?? [];
    items.push(option);
    map.set(option.question_id, items);
  }
  return map;
};

const question = (overrides: Partial<JlptGradingQuestion>): JlptGradingQuestion => ({
  question_id: 1,
  section_id: 1,
  question_type: "single_choice",
  marks: 1,
  points: 1,
  explanation: null,
  ...overrides,
});

test("gradeJlptExam grades selected options and score", () => {
  const result = gradeJlptExam(
    [question({})],
    optionsByQuestion([
      { option_id: 1, question_id: 1, option_text: "A", is_correct: true },
      { option_id: 2, question_id: 1, option_text: "B", is_correct: false },
    ]),
    [{ question_id: 1, option_id: 1 }]
  );

  assert.equal(result.earnedMarks, 1);
  assert.equal(result.score, 100);
  assert.equal(result.passed, true);
});

test("gradeJlptExam requires exact multiple choice selections", () => {
  const questions = [question({ question_type: "multiple_choice", marks: 2 })];
  const options = optionsByQuestion([
    { option_id: 1, question_id: 1, option_text: "A", is_correct: true },
    { option_id: 2, question_id: 1, option_text: "B", is_correct: true },
    { option_id: 3, question_id: 1, option_text: "C", is_correct: false },
  ]);

  assert.equal(gradeJlptExam(questions, options, [{ question_id: 1, option_ids: [2, 1] }]).score, 100);
  assert.equal(gradeJlptExam(questions, options, [{ question_id: 1, option_ids: [1] }]).score, 0);
});

test("gradeJlptExam normalizes fill in blank answers", () => {
  const result = gradeJlptExam(
    [question({ question_type: "fill_in_blank" })],
    optionsByQuestion([{ option_id: 1, question_id: 1, option_text: "Nihongo", is_correct: true }]),
    [{ question_id: 1, answer_text: " nihongo " }]
  );

  assert.equal(result.score, 100);
});

test("buildJlptUserAnswerRows preserves section id and null option for text answers", () => {
  const result = gradeJlptExam(
    [question({ question_type: "fill_in_blank", section_id: 9 })],
    optionsByQuestion([{ option_id: 1, question_id: 1, option_text: "Nihongo", is_correct: true }]),
    [{ question_id: 1, answer_text: "nihongo" }]
  );

  assert.deepEqual(buildJlptUserAnswerRows(88, result.questionResults), [
    {
      attemptId: 88,
      questionId: 1,
      sectionId: 9,
      optionId: null,
      answerText: "nihongo",
      isCorrect: true,
    },
  ]);
});
