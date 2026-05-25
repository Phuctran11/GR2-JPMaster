import assert from "node:assert/strict";
import { after } from "node:test";
import pool from "../../config/database.js";
import databaseService from "../../services/database.service.js";
import userModel from "./user.model.js";
import { assertIntegrationDatabaseAllowed, integrationTest, runIntegrationTests } from "../integrationTest.helpers.js";

assertIntegrationDatabaseAllowed();

const testRunId = `user_public_it_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
const createdUserIds: number[] = [];

const createSeedUser = async () => {
  const result = await databaseService.executeQuery(
    `
      INSERT INTO "User" (username, email, password_hash, role, status, created_at, updated_at)
      VALUES ($1, $2, 'integration-test-password-hash', 'learner', 'active', NOW(), NOW())
      RETURNING user_id, email;
    `,
    [`${testRunId}_user_${createdUserIds.length}`, `${testRunId}_${createdUserIds.length}@example.test`]
  );
  const user = result.rows[0];
  createdUserIds.push(user.user_id);
  return user;
};

after(async () => {
  if (runIntegrationTests) {
    await databaseService.executeQuery(`DELETE FROM "User" WHERE user_id = ANY($1::int[])`, [createdUserIds]);
  }

  await pool.end();
});

integrationTest("public user reads do not include password_hash", async () => {
  const user = await createSeedUser();

  const byId = await userModel.getUserById(user.user_id);
  const allUsers = await userModel.getAllUsers(10, 0);

  assert.ok(byId);
  assert.equal("password_hash" in byId, false);
  assert.equal(allUsers.some((row) => row.user_id === user.user_id && "password_hash" in row), false);
});

integrationTest("public user update profile does not include password_hash", async () => {
  const user = await createSeedUser();

  const updated = await userModel.updateUserProfile(
    user.user_id,
    `${testRunId}_updated`,
    user.email,
    "https://example.test/avatar.png"
  );

  assert.ok(updated);
  assert.equal("password_hash" in updated, false);
});
