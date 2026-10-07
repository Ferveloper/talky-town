import { describe, expect, it } from "vitest";
import { practiceXp } from "../src/gamification/gamification-rules";
import { practicedTerms } from "../src/gamification/vocabulary-rules";
import { PersistenceIds } from "../src/common/persistence-ids.service";
describe("authoritative reward rules and centralized IDs", () => {
  it("rewards effort, not correction or numeric noise", () => {
    expect(practiceXp("I likes dogs")).toBe(5);
    expect(practiceXp("I like dogs")).toBe(5);
    expect(practiceXp("123 !")).toBe(0);
  });
  it("counts canonical terms once, with boundaries, plurals and phrases", () => {
    expect(practicedTerms("DOG dogs dog ice cream")).toEqual(["dog", "ice cream"]);
    expect(practicedTerms("dogma catalogue")).toEqual([]);
  });
  it("scopes every deterministic ID without hashing messages", () => {
    const ids = new PersistenceIds();
    const operation = ids.operation("session", "request");
    expect(ids.operation("session", "request")).toBe(operation);
    expect(ids.operation("other", "request")).not.toBe(operation);
    expect(ids.turn(operation, "child")).not.toBe(ids.turn(operation, "avatar"));
    expect(ids.practiceXp(operation)).not.toBe(ids.safety(operation));
    expect(ids.completionXp("session")).toBe(ids.completionXp("session"));
  });
});
