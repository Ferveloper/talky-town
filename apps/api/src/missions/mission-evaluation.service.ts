import { Injectable } from "@nestjs/common";
import { fail } from "../common/api-error";
import { missionRules, missionProgressSteps } from "./mission-rules";
@Injectable()
export class MissionEvaluationService {
  private rule(code: string) {
    const rule = missionRules[code];
    if (!rule) fail(422, "MISSION_ENGINE_UNAVAILABLE");
    return rule;
  }
  prompt(code: string, progress: number): string {
    const rule = this.rule(code);
    const index = missionProgressSteps.indexOf(progress as 0 | 33 | 67 | 100);
    if (index < 0) fail(422, "MISSION_PROGRESS_INVALID");
    return rule.prompts[index] ?? "Great work! You completed the mission.";
  }
  evaluate(code: string, progress: number, message: string, acceptedHistory: string[]) {
    const rule = this.rule(code);
    const index = missionProgressSteps.indexOf(progress as 0 | 33 | 67 | 100);
    if (index < 0) fail(422, "MISSION_PROGRESS_INVALID");
    const advances = index < 3 && Boolean(rule.accepts[index]?.(message, acceptedHistory));
    return {
      progress: advances ? missionProgressSteps[index + 1]! : progress,
      completed: advances && index === 2,
    };
  }
}
