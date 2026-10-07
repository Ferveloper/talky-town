import { describe, expect, it } from "vitest";
import { MissionEvaluationService } from "../src/missions/mission-evaluation.service";
describe("deterministic mission engine", () => {
  it.each([
    ["meet-a-new-friend", ["Hello", "I like dogs", "Goodbye"]],
    ["animal-adventure", ["dog", "I likes dogs", "cat"]],
    ["ice-cream-shop", ["Can I have ice cream", "chocolate", "Thank you"]],
    ["space-explorer", ["rocket", "The rocket is red", "We fly"]],
  ])("completes %s through exactly three steps", (code, answers) => {
    const engine = new MissionEvaluationService();
    let progress = 0;
    const history: string[] = [];
    for (const [index, message] of answers.entries()) {
      const result = engine.evaluate(code, progress, message, history);
      expect(result.progress).toBe([33, 67, 100][index]);
      expect(result.completed).toBe(index === 2);
      progress = result.progress;
      history.push(message);
    }
    expect(engine.prompt(code, progress)).toContain("completed");
  });
  it("does not advance off-topic, repeat animal, or completed mission", () => {
    const engine = new MissionEvaluationService();
    expect(engine.evaluate("animal-adventure", 0, "Hello", []).progress).toBe(0);
    expect(engine.evaluate("animal-adventure", 67, "dogs", ["dog", "I like dogs"]).progress).toBe(
      67,
    );
    expect(engine.evaluate("animal-adventure", 100, "cat", ["dog"]).completed).toBe(false);
    expect(() => engine.prompt("custom", 0)).toThrow();
    expect(() => engine.prompt("animal-adventure", 25)).toThrow();
  });
});
