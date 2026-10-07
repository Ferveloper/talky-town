import { Injectable } from "@nestjs/common";
import { fail } from "../common/api-error";
@Injectable()
export class ProviderOperationLimiter {
  private readonly users = new Map<string, { until: number; count: number; busy: boolean }>();
  async run<T>(userId: string, operation: () => Promise<T>): Promise<T> {
    const now = Date.now();
    for (const [id, state] of this.users)
      if (!state.busy && state.until <= now) this.users.delete(id);
    const state = this.users.get(userId) ?? { until: now + 60000, count: 0, busy: false };
    if (state.busy || state.count >= 5) fail(429, "PROVIDER_OPERATION_RATE_LIMITED");
    state.count++;
    state.busy = true;
    this.users.set(userId, state);
    try {
      return await operation();
    } finally {
      state.busy = false;
    }
  }
}
