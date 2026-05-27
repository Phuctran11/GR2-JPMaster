import { requireString } from "./common.validator.js";

export const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const parseTagList = (value: unknown) => (Array.isArray(value) ? value.map((tag: unknown) => requireString(tag)).filter(Boolean) : []);
