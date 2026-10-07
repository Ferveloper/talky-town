import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { AdultIdentity } from "@talkytown/shared";
import { AuthService } from "./auth.service";
import { fail } from "../common/api-error";
export type AuthenticatedRequest = { headers: { authorization?: string }; user: AdultIdentity };
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const match = /^Bearer (\S+)$/i.exec(request.headers.authorization ?? "");
    if (!match?.[1]) fail(401, "UNAUTHORIZED");
    request.user = await this.auth.authenticate(match[1]);
    return true;
  }
}
