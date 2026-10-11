import { PrismaClient } from "@prisma/client";
import { synchronizeBadgeCatalog } from "../src/gamification/badge-catalog";
const prisma = new PrismaClient();
prisma
  .$transaction((db) => synchronizeBadgeCatalog(db))
  .then((changed) => console.log(JSON.stringify({ changed }, null, 2)))
  .catch(() => {
    console.error("CATALOG_SYNCHRONIZATION_FAILED");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
