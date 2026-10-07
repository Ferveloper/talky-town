import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { AdultIdentity, DemoLoginResponse } from "@talkytown/shared";
import { PrismaService } from "../prisma/prisma.service";
import { fail } from "../common/api-error";
@Injectable()
export class AuthService {
  constructor(
    private readonly db: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}
  async demo(): Promise<DemoLoginResponse> {
    if (this.config.get("DEMO_AUTH_ENABLED") === "false") fail(404, "DEMO_AUTH_DISABLED");
    const user = await this.db.user.findUnique({
      where: { email: this.config.get<string>("DEMO_USER_EMAIL") ?? "demo@talkytown.local" },
    });
    if (!user || user.role !== "adult") fail(503, "DEMO_SEED_REQUIRED");
    const identity: AdultIdentity = { id: user.id, displayAlias: user.displayAlias, role: "adult" };
    return {
      accessToken: await this.jwt.signAsync({ sub: user.id, role: "adult" }),
      tokenType: "Bearer",
      expiresIn: 7200,
      user: identity,
    };
  }
  async authenticate(token: string): Promise<AdultIdentity> {
    let subject: string;
    try {
      const claims = await this.jwt.verifyAsync<{ sub: string; role: string }>(token, {
        algorithms: ["HS256"],
        issuer: "talkytown-api",
        audience: "talkytown-demo",
      });
      if (typeof claims.sub !== "string" || claims.role !== "adult") fail(401, "UNAUTHORIZED");
      subject = claims.sub;
    } catch {
      return fail(401, "UNAUTHORIZED");
    }
    const user = await this.db.user.findUnique({ where: { id: subject } });
    if (!user || user.role !== "adult") fail(401, "UNAUTHORIZED");
    return { id: user.id, displayAlias: user.displayAlias, role: "adult" };
  }
}
