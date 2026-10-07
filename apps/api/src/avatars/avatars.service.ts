import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
@Injectable()
export class AvatarsService {
  constructor(private readonly db: PrismaService) {}
  async list() {
    return {
      items: await this.db.avatar.findMany({
        where: { isActive: true },
        select: { code: true, name: true, personality: true },
        orderBy: { code: "asc" },
      }),
    };
  }
}
