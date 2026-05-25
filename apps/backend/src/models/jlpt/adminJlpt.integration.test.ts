import assert from "node:assert/strict";
import { after } from "node:test";
import pool from "../../config/database.js";
import databaseService from "../../services/database.service.js";
import adminJlptExamsModel from "../admin/jlptExams.model.js";
import adminJlptQuestionsModel from "../admin/jlptQuestions.model.js";
import adminReadingPassagesModel from "../admin/readingPassages.model.js";
import adminJlptSectionsModel from "../admin/jlptSections.model.js";
import { assertIntegrationDatabaseAllowed, integrationTest, runIntegrationTests } from "../integrationTest.helpers.js";

assertIntegrationDatabaseAllowed();

const testRunId = `ajit_${Math.floor(Math.random() * 100000).toString(36)}`;
const createdUserIds: number[] = [];
const createdExamIds: number[] = [];
const createdSectionIds: number[] = [];
const createdPassageIds: number[] = [];
const createdQuestionIds: number[] = [];

const createOwner = async (suffix: string) => {
  const result = await databaseService.executeQuery(
    `
      INSERT INTO "User" (username, email, password_hash, role, status, created_at, updated_at)
      VALUES ($1, $2, 'integration-test-password-hash', 'owner', 'active', NOW(), NOW())
      RETURNING user_id;
    `,
    [`${testRunId}_${suffix}`, `${testRunId}_${suffix}@example.test`]
  );
  const user = result.rows[0];
  createdUserIds.push(user.user_id);
  return user;
};

const createExam = async (ownerId: number, suffix: string) => {
  const result = await databaseService.executeQuery(
    `
      INSERT INTO "JLPTExam" (title, jlpt_level, year, duration_minutes, created_by, created_at, updated_at)
      VALUES ($1, 'N5', 2026, 90, $2, NOW(), NOW())
      RETURNING exam_id;
    `,
    [`${testRunId}_${suffix}`, ownerId]
  );
  const exam = result.rows[0];
  createdExamIds.push(exam.exam_id);
  return exam;
};

const createSection = async (examId: number, suffix: string) => {
  const result = await databaseService.executeQuery(
    `
      INSERT INTO "JLPTSection" (exam_id, title, section_type, section_order, duration_minutes, updated_at)
      VALUES ($1, $2, 'vocabulary', 1, 20, NOW())
      RETURNING section_id;
    `,
    [examId, `${testRunId}_${suffix}`]
  );
  const section = result.rows[0];
  createdSectionIds.push(section.section_id);
  return section;
};

const createBankQuestion = async (ownerId: number, suffix: string, difficulty = "easy") => {
  const questionResult = await databaseService.executeQuery(
    `
      INSERT INTO "Question" (
        question_text, question_type, difficulty_level, points,
        jlpt_level, section_type, created_by, created_at, updated_at
      )
      VALUES ($1, 'single_choice', $2, 1, 'N5', 'vocabulary', $3, NOW(), NOW())
      RETURNING question_id;
    `,
    [`${testRunId}_${suffix}`, difficulty, ownerId]
  );
  const question = questionResult.rows[0];
  createdQuestionIds.push(question.question_id);

  await databaseService.executeQuery(
    `
      INSERT INTO "Option" (question_id, option_text, is_correct, created_at, updated_at)
      VALUES
        ($1, 'Correct', TRUE, NOW(), NOW()),
        ($1, 'Wrong', FALSE, NOW(), NOW());
    `,
    [question.question_id]
  );

  return question;
};

const createReadingPassage = async (ownerId: number, suffix: string) => {
  const passage = await adminReadingPassagesModel.createReadingPassage({
    title: `${testRunId}_${suffix}`,
    jlpt_level: "N5",
    passage_text: "Integration reading passage",
    image_asset_id: null,
    image_url: null,
    created_by: ownerId,
  });
  createdPassageIds.push(passage.passage_id);
  return passage;
};

after(async () => {
  if (runIntegrationTests) {
    await databaseService.executeQuery(
      `DELETE FROM "JLPTSectionQuestion" WHERE section_id = ANY($1::int[])`,
      [createdSectionIds]
    );
    await databaseService.executeQuery(`DELETE FROM "Question" WHERE question_id = ANY($1::int[])`, [createdQuestionIds]);
    await databaseService.executeQuery(`DELETE FROM "ReadingPassage" WHERE passage_id = ANY($1::int[])`, [createdPassageIds]);
    await databaseService.executeQuery(`DELETE FROM "JLPTSection" WHERE section_id = ANY($1::int[])`, [createdSectionIds]);
    await databaseService.executeQuery(`DELETE FROM "JLPTExam" WHERE exam_id = ANY($1::int[])`, [createdExamIds]);
    await databaseService.executeQuery(`DELETE FROM "User" WHERE user_id = ANY($1::int[])`, [createdUserIds]);
  }

  await pool.end();
});

integrationTest("owner cannot update another owner's JLPT exam", async () => {
  const owner = await createOwner("exam_owner_a");
  const otherOwner = await createOwner("exam_owner_b");
  const exam = await createExam(otherOwner.user_id, "owned_by_other");

  const updated = await adminJlptExamsModel.updateJlptExam(exam.exam_id, { title: "blocked update" }, owner.user_id);

  assert.equal(updated, null);

  const stateResult = await databaseService.executeQuery(`SELECT title FROM "JLPTExam" WHERE exam_id = $1;`, [exam.exam_id]);
  assert.notEqual(stateResult.rows[0].title, "blocked update");
});

integrationTest("owner cannot delete another owner's JLPT exam", async () => {
  const owner = await createOwner("exam_delete_owner_a");
  const otherOwner = await createOwner("exam_delete_owner_b");
  const exam = await createExam(otherOwner.user_id, "delete_owned_by_other");

  const deleted = await adminJlptExamsModel.deleteJlptExam(exam.exam_id, owner.user_id);

  assert.equal(deleted, false);

  const stateResult = await databaseService.executeQuery(`SELECT deleted_at FROM "JLPTExam" WHERE exam_id = $1;`, [exam.exam_id]);
  assert.equal(stateResult.rows[0].deleted_at, null);
});

integrationTest("owner cannot create JLPT section for another owner's exam", async () => {
  const owner = await createOwner("section_owner_a");
  const otherOwner = await createOwner("section_owner_b");
  const exam = await createExam(otherOwner.user_id, "section_owned_by_other");

  const section = await adminJlptSectionsModel.createJlptSection(
    exam.exam_id,
    {
      title: "Blocked section",
      section_type: "vocabulary",
      section_order: 1,
      duration_minutes: 20,
    },
    owner.user_id
  );

  assert.equal(section, null);
});

integrationTest("owner cannot create question in another owner's JLPT section", async () => {
  const owner = await createOwner("question_owner_a");
  const otherOwner = await createOwner("question_owner_b");
  const exam = await createExam(otherOwner.user_id, "question_owned_by_other");
  const section = await createSection(exam.exam_id, "question_section");

  const question = await adminJlptQuestionsModel.createJlptSectionQuestion(
    section.section_id,
    {
      question_text: "Blocked question",
      question_type: "single_choice",
      difficulty_level: "easy",
      explanation: null,
      points: 1,
      marks: 1,
      jlpt_level: "N5",
      section_type: "vocabulary",
      reading_passage_id: null,
      image_asset_id: null,
      image_url: null,
      audio_asset_id: null,
      audio_url: null,
      order_index: 1,
      options: [
        { option_text: "Correct", is_correct: true },
        { option_text: "Wrong", is_correct: false },
      ],
    },
    owner.user_id,
    owner.user_id
  );

  assert.equal(question, null);
});

integrationTest("owner cannot update another owner's reading passage", async () => {
  const owner = await createOwner("passage_update_owner_a");
  const otherOwner = await createOwner("passage_update_owner_b");
  const passage = await createReadingPassage(otherOwner.user_id, "owned_passage");

  const updated = await adminReadingPassagesModel.updateReadingPassage(
    passage.passage_id,
    { title: "blocked passage update" },
    owner.user_id
  );

  assert.equal(updated, null);

  const stateResult = await databaseService.executeQuery(`SELECT title FROM "ReadingPassage" WHERE passage_id = $1;`, [
    passage.passage_id,
  ]);
  assert.notEqual(stateResult.rows[0].title, "blocked passage update");
});

integrationTest("owner cannot delete another owner's reading passage", async () => {
  const owner = await createOwner("passage_delete_owner_a");
  const otherOwner = await createOwner("passage_delete_owner_b");
  const passage = await createReadingPassage(otherOwner.user_id, "delete_owned_passage");

  const deleted = await adminReadingPassagesModel.deleteReadingPassage(passage.passage_id, owner.user_id);

  assert.equal(deleted, false);

  const stateResult = await databaseService.executeQuery(`SELECT deleted_at FROM "ReadingPassage" WHERE passage_id = $1;`, [
    passage.passage_id,
  ]);
  assert.equal(stateResult.rows[0].deleted_at, null);
});

integrationTest("owner cannot use another owner's reading passage for reading section question", async () => {
  const owner = await createOwner("passage_question_owner_a");
  const otherOwner = await createOwner("passage_question_owner_b");
  const exam = await createExam(owner.user_id, "reading_question_exam");
  const section = await adminJlptSectionsModel.createJlptSection(
    exam.exam_id,
    {
      title: "Reading",
      section_type: "reading",
      section_order: 1,
      duration_minutes: 30,
    },
    owner.user_id
  );
  assert.ok(section);
  createdSectionIds.push(section.section_id);
  const passage = await createReadingPassage(otherOwner.user_id, "other_reading_passage");

  const question = await adminJlptQuestionsModel.createJlptSectionQuestion(
    section.section_id,
    {
      question_text: "Blocked reading question",
      question_type: "single_choice",
      difficulty_level: "easy",
      explanation: null,
      points: 1,
      marks: 1,
      jlpt_level: "N5",
      section_type: "reading",
      reading_passage_id: passage.passage_id,
      image_asset_id: null,
      image_url: null,
      audio_asset_id: null,
      audio_url: null,
      order_index: 1,
      options: [
        { option_text: "Correct", is_correct: true },
        { option_text: "Wrong", is_correct: false },
      ],
    },
    owner.user_id,
    owner.user_id
  );

  assert.equal(question, null);
});

integrationTest("auto add JLPT questions prioritizes least-used matching questions", async () => {
  const owner = await createOwner("auto_owner");
  const targetExam = await createExam(owner.user_id, "auto_target_exam");
  const usedExam = await createExam(owner.user_id, "auto_used_exam");
  const targetSection = await createSection(targetExam.exam_id, "auto_target_section");
  const usedSection = await createSection(usedExam.exam_id, "auto_used_section");
  const firstQuestion = await createBankQuestion(owner.user_id, "auto_question_first");
  const secondQuestion = await createBankQuestion(owner.user_id, "auto_question_second");
  const alreadyUsedQuestion = await createBankQuestion(owner.user_id, "auto_question_used");

  await databaseService.executeQuery(
    `
      INSERT INTO "JLPTSectionQuestion" (section_id, question_id, order_index)
      VALUES ($1, $2, 1);
    `,
    [usedSection.section_id, alreadyUsedQuestion.question_id]
  );

  const result = await adminJlptQuestionsModel.autoAddJlptSectionQuestions(
    targetSection.section_id,
    { difficulty_counts: { easy: 2 } },
    owner.user_id
  );

  assert.equal(result.status, "created");
  if (result.status !== "created") return;

  const selectedQuestionIds = result.questions.map((question) => Number(question.question_id));
  assert.deepEqual(selectedQuestionIds, [firstQuestion.question_id, secondQuestion.question_id]);
});
