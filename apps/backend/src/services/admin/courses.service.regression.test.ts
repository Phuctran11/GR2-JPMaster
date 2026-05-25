import assert from "node:assert/strict";
import test from "node:test";
import adminCoursesService from "./courses.service.js";
import { ApiError } from "../../utils/http.js";

test("updateCourse rejects negative price before database update", async () => {
  await assert.rejects(
    () => adminCoursesService.updateCourse(1, { price: -1 }),
    (error) => error instanceof ApiError && error.status === 400 && /price/.test(error.message)
  );
});

test("updateCourse rejects non numeric price before database update", async () => {
  await assert.rejects(
    () => adminCoursesService.updateCourse(1, { price: "not-a-number" }),
    (error) => error instanceof ApiError && error.status === 400 && /price/.test(error.message)
  );
});
