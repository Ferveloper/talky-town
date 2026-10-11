import { test as base } from "@playwright/test";
import { installSpeech } from "./speech-fakes";

// Keep the existing text journeys deterministic after native voice is introduced.
export const test = base.extend({
  page: async ({ page }, use) => {
    await installSpeech(page);
    await use(page);
  },
});
export { expect, type Page } from "@playwright/test";
