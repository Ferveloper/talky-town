import { createHash } from "node:crypto";
import { Injectable } from "@nestjs/common";
/** The only derivation point for request-linked persistence IDs. Never hash child content. */
@Injectable()
export class PersistenceIds {
  private derive(kind: string, ...scope: string[]): string {
    return `p4-${kind}-${createHash("sha256").update(JSON.stringify(scope)).digest("hex")}`;
  }
  session(userId: string, profileId: string, requestId: string) {
    return this.derive("session", userId, profileId, requestId);
  }
  operation(sessionId: string, requestId: string) {
    return this.derive("operation", sessionId, requestId);
  }
  turn(operationId: string, role: "child" | "avatar") {
    return this.derive("turn", operationId, role);
  }
  opening(sessionId: string) {
    return this.derive("opening", sessionId);
  }
  safety(operationId: string) {
    return this.derive("safety", operationId);
  }
  practiceXp(operationId: string) {
    return this.derive("xp", operationId);
  }
  completionXp(sessionId: string) {
    return this.derive("completion", sessionId);
  }
}
