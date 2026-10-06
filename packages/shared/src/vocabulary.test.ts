import { describe, expect, it } from "vitest";
import { normalizeVocabularyTerm } from "./index";

describe("vocabulary normalization", () => {
  it.each([
    [" DOG ", "dog"],
    ["ice\t cream", "ice cream"],
    ["\uFF24\uFF2F\uFF27", "dog"],
  ])("normalizes %s into %s", (term, expected) => {
    expect(normalizeVocabularyTerm(term)).toBe(expected);
  });
});
