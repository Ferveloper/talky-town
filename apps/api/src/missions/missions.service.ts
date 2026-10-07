import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { MissionResponse } from "@talkytown/shared";
import { PrismaService } from "../prisma/prisma.service";
import { ProfileOwnershipService } from "../child-profiles/profile-ownership.service";
import { fail } from "../common/api-error";
@Injectable()
export class MissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: ProfileOwnershipService,
  ) {}
  async list(userId: string, childId: string) {
    const profile = await this.ownership.get(userId, childId);
    const missions = await this.prisma.mission.findMany({
      where: { isActive: true, minAge: { lte: profile.age }, maxAge: { gte: profile.age } },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
    });
    return {
      items: missions.map(
        (mission): MissionResponse => ({
          id: mission.id,
          code: mission.code,
          title: mission.title,
          description: mission.description,
          minAge: mission.minAge,
          maxAge: mission.maxAge,
          estimatedXp: mission.xpReward,
        }),
      ),
    };
  }
  async eligible(code: string, age: number, db: Prisma.TransactionClient = this.prisma) {
    const mission = await db.mission.findUnique({ where: { code } });
    if (!mission?.isActive || age < mission.minAge || age > mission.maxAge)
      fail(422, "MISSION_INELIGIBLE");
    return mission;
  }
}
