import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ProfileOwnershipService } from "./profile-ownership.service";
import { SafetyService } from "../safety/safety.service";
import { CreateChildProfileDto } from "./dto/create-child-profile.dto";
import { profileInclude, profileResponse } from "../common/response-mappers";
import { fail } from "../common/api-error";
@Injectable()
export class ChildProfilesService {
  constructor(
    private readonly db: PrismaService,
    private readonly ownership: ProfileOwnershipService,
    private readonly safety: SafetyService,
  ) {}
  async list(userId: string) {
    const profiles = await this.db.childProfile.findMany({
      where: { userId },
      include: profileInclude,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    return { items: profiles.map(profileResponse) };
  }
  async get(userId: string, profileId: string) {
    return profileResponse(await this.ownership.get(userId, profileId));
  }
  async create(userId: string, input: CreateChildProfileDto) {
    if (this.safety.screen(input.alias).flagged) fail(400, "UNSAFE_ALIAS");
    return this.db.$transaction(async (db) => {
      const avatar = await db.avatar.findUnique({ where: { code: input.avatarCode } });
      if (!avatar?.isActive) fail(422, "AVATAR_UNAVAILABLE");
      const profile = await db.childProfile.create({
        data: {
          userId,
          alias: input.alias,
          age: input.age,
          ageBand: input.age <= 7 ? "5-7" : input.age <= 10 ? "8-10" : "11-12",
          nativeLanguage: input.nativeLanguage,
          targetLanguage: input.targetLanguage,
          level: input.learningLevel,
          avatarId: avatar.id,
          xpTotal: 0,
          streakDays: 0,
        },
        include: profileInclude,
      });
      return profileResponse(profile);
    });
  }
}
