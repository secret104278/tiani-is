// e2e/fixtures/index.ts
import { mergeTests } from "@playwright/test";
import { test as authTest } from "./auth";
import { test as etogetherTest } from "./etogether";
import { test as volunteerTest } from "./volunteer";
import { test as yideclassTest } from "./yideclass";
import { test as yideworkTest } from "./yidework";

export const test = mergeTests(
  authTest,
  volunteerTest,
  etogetherTest,
  yideclassTest,
  yideworkTest,
);
export { expect } from "@playwright/test";
