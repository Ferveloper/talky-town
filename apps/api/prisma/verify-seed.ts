import { PrismaClient } from "@prisma/client";

import { verifyDemoData } from "./seed-verification";

const prisma = new PrismaClient();

verifyDemoData(prisma)
  .then((report) => console.log(JSON.stringify(report, null, 2)))
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
