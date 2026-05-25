import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "../../utils/http.js";
import adminJlptSectionService from "./jlptSection.service.js";
import adminLessonsService from "./lessons.service.js";
import adminTestsService from "./tests.service.js";

const isBadRequestFor = (field: string) => (error: unknown) =>
  error instanceof ApiError && error.status === 400 && error.message.includes(field);

test("createQuiz rejects non numeric passing_score before database update", async () => {
  await assert.rejects(
    () => adminTestsService.createQuiz(
      { title: "Quiz", quiz_type: "lesson_quiz", passing_score: "not-a-number" },
      { userId: 1, role: "owner" },
      1
    ),
    isBadRequestFor("passing_score")
  );
});

test("updateLesson rejects non numeric order_index before database update", async () => {
  await assert.rejects(
    () => adminLessonsService.updateLesson(1, { order_index: "not-a-number" }, 1),
    isBadRequestFor("order_index")
  );
});

test("createJlptSection rejects non numeric section_order before database update", async () => {
  await assert.rejects(
    () => adminJlptSectionService.createJlptSection(
      1,
      { section_type: "vocabulary", section_order: "not-a-number" },
      1
    ),
    isBadRequestFor("section_order")
  );
});
