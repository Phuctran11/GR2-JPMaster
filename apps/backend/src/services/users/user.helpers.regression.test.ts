import assert from "node:assert/strict";
import test from "node:test";
import { toPublicUser } from "./user.helpers.js";
import type { UserWithPassword } from "../../models/users/user.model.js";

test("toPublicUser removes password_hash from auth user rows", () => {
  const user: UserWithPassword = {
    user_id: 1,
    username: "learner",
    email: "learner@example.test",
    password_hash: "secret-hash",
    avatar_url: null,
    role: "learner",
    status: "active",
    deleted_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const publicUser = toPublicUser(user);

  assert.ok(publicUser);
  assert.equal("password_hash" in publicUser, false);
});
