import assert from "node:assert/strict";
import { after } from "node:test";
import pool from "../../config/database.js";
import databaseService from "../../services/database.service.js";
import flashcardCardService from "../../services/flashcards/flashcardCard.service.js";
import { ApiError } from "../../utils/http.js";
import flashcardModel from "./flashcard.model.js";
import { assertIntegrationDatabaseAllowed, integrationTest, runIntegrationTests } from "../integrationTest.helpers.js";

assertIntegrationDatabaseAllowed();

const testRunId = `fcit_${Math.floor(Math.random() * 100000).toString(36)}`;
const createdUserIds: number[] = [];
const createdCollectionIds: number[] = [];

const createUser = async (suffix: string) => {
  const result = await databaseService.executeQuery(
    `
      INSERT INTO "User" (username, email, password_hash, role, status, created_at, updated_at)
      VALUES ($1, $2, 'integration-test-password-hash', 'learner', 'active', NOW(), NOW())
      RETURNING user_id;
    `,
    [`${testRunId}_${suffix}`, `${testRunId}_${suffix}@example.test`]
  );
  const user = result.rows[0];
  createdUserIds.push(user.user_id);
  return user;
};

const createCollection = async (userId: number, suffix: string, visibility: "private" | "public" = "private") => {
  const collection = await flashcardModel.createCollection(
    userId,
    `${testRunId}_${suffix}`,
    "Flashcard card integration test",
    visibility
  );
  createdCollectionIds.push(collection.collection_id);
  return collection;
};

const assertApiErrorStatus = async (promise: Promise<unknown>, status: number) => {
  await assert.rejects(
    promise,
    (error) => error instanceof ApiError && error.status === status
  );
};

after(async () => {
  if (runIntegrationTests) {
    await databaseService.executeQuery(
      `DELETE FROM "Flashcard" WHERE collection_id = ANY($1::int[])`,
      [createdCollectionIds]
    );
    await databaseService.executeQuery(
      `DELETE FROM "FlashcardCollection" WHERE collection_id = ANY($1::int[])`,
      [createdCollectionIds]
    );
    await databaseService.executeQuery(`DELETE FROM "User" WHERE user_id = ANY($1::int[])`, [createdUserIds]);
  }

  await pool.end();
});

integrationTest("owner creates flashcard in owned collection", async () => {
  const owner = await createUser("create_owner");
  const collection = await createCollection(owner.user_id, "create_collection");

  const flashcard = await flashcardCardService.createFlashcard(owner.user_id, {
    collection_id: collection.collection_id,
    front_text: "日本語",
    back_text: "Japanese language",
    tags: ["language", "n5"],
    order_index: 1,
  });

  assert.equal(flashcard.collection_id, collection.collection_id);
  assert.equal(flashcard.front_text, "日本語");
  assert.deepEqual(flashcard.tags, ["language", "n5"]);
});

integrationTest("user cannot create flashcard in another user's collection", async () => {
  const owner = await createUser("blocked_create_owner");
  const otherUser = await createUser("blocked_create_other");
  const collection = await createCollection(owner.user_id, "blocked_create_collection");

  await assertApiErrorStatus(
    flashcardCardService.createFlashcard(otherUser.user_id, {
      collection_id: collection.collection_id,
      front_text: "front",
      back_text: "back",
    }),
    404
  );
});

integrationTest("public collection flashcards are readable by other users", async () => {
  const owner = await createUser("public_owner");
  const reader = await createUser("public_reader");
  const collection = await createCollection(owner.user_id, "public_collection", "public");
  const flashcard = await flashcardCardService.createFlashcard(owner.user_id, {
    collection_id: collection.collection_id,
    front_text: "公開",
    back_text: "public",
  });

  const fetched = await flashcardCardService.getFlashcard(reader.user_id, flashcard.flashcard_id);
  const listed = await flashcardCardService.getFlashcardsByCollection(reader.user_id, collection.collection_id, {
    limit: 10,
    offset: 0,
  });

  assert.equal(fetched.flashcard_id, flashcard.flashcard_id);
  assert.equal(listed.totalCount, 1);
  assert.equal(listed.flashcards[0]?.flashcard_id, flashcard.flashcard_id);
});

integrationTest("user cannot update another user's flashcard", async () => {
  const owner = await createUser("blocked_update_owner");
  const otherUser = await createUser("blocked_update_other");
  const collection = await createCollection(owner.user_id, "blocked_update_collection");
  const flashcard = await flashcardCardService.createFlashcard(owner.user_id, {
    collection_id: collection.collection_id,
    front_text: "original",
    back_text: "meaning",
  });

  await assertApiErrorStatus(
    flashcardCardService.updateFlashcard(otherUser.user_id, flashcard.flashcard_id, {
      front_text: "blocked",
    }),
    403
  );

  const unchanged = await flashcardModel.getFlashcardById(flashcard.flashcard_id);
  assert.equal(unchanged?.front_text, "original");
});

integrationTest("owner deletes owned flashcard", async () => {
  const owner = await createUser("delete_owner");
  const collection = await createCollection(owner.user_id, "delete_collection");
  const flashcard = await flashcardCardService.createFlashcard(owner.user_id, {
    collection_id: collection.collection_id,
    front_text: "delete",
    back_text: "remove",
  });

  await flashcardCardService.deleteFlashcard(owner.user_id, flashcard.flashcard_id);

  const deleted = await flashcardModel.getFlashcardById(flashcard.flashcard_id);
  assert.equal(deleted, null);
});
