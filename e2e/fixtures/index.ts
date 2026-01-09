// e2e/fixtures/index.ts
import { mergeTests } from "@playwright/test";
import { test as authTest } from "./auth";
import { test as classTest } from "./class";
import { test as etogetherTest } from "./etogether";
import { test as volunteerTest } from "./volunteer";
import { test as workTest } from "./work";

export const test = mergeTests(
  authTest,
  volunteerTest,
  etogetherTest,
  classTest,
  workTest,
);
export { expect } from "@playwright/test";
