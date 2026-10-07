import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { fail } from "../common/api-error";
import { profileInclude } from "../common/response-mappers";
@Injectable()
export class ProfileOwnershipService {
  constructor(private readonly prisma: PrismaService) {}
  async get(userId: string, profileId: string, db: Prisma.TransactionClient = this.prisma) {
    const profile = await db.childProfile.findFirst({
      where: { id: profileId, userId },
      include: profileInclude,
    });
    if (!profile) fail(404, "PROFILE_NOT_FOUND");
    return profile;
  }
  async lock(userId: string, profileId: string, db: Prisma.TransactionClient) {
    const rows = await db.$queryRaw<
      { id: string }[]
    >`SELECT "id" FROM "ChildProfile" WHERE "id" = ${profileId} AND "userId" = ${userId} FOR UPDATE`;
    if (!rows.length) fail(404, "PROFILE_NOT_FOUND");
    return this.get(userId, profileId, db);
  }
}
