import { test } from "node:test";

export const runIntegrationTests = process.env.RUN_INTEGRATION_TESTS === "1";

export const assertIntegrationDatabaseAllowed = () => {
  if (!runIntegrationTests) return;

  const dbName = process.env.DB_NAME ?? "";
  const allowNonTestDatabase = process.env.ALLOW_NON_TEST_DB_INTEGRATION === "1";

  if (!allowNonTestDatabase && !/test/i.test(dbName)) {
    throw new Error(
      `Refusing to run integration tests against non-test database "${dbName}". ` +
        "Use a test database name or set ALLOW_NON_TEST_DB_INTEGRATION=1 intentionally."
    );
  }
};

export const integrationTest = (name: string, fn: () => Promise<void>) =>
  test(name, { skip: runIntegrationTests ? false : "Set RUN_INTEGRATION_TESTS=1 to run DB integration tests" }, fn);
