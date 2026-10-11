import { PrismaClient } from "@prisma/client";
import { ApplicationClock } from "../src/common/application-clock";
import { reconcileGamification } from "../src/gamification/reconcile-gamification";
const args = process.argv.slice(2);
let apply = false;
let childProfileId: string | undefined;
for (let index = 0; index < args.length; index++) {
  if (args[index] === "--apply") apply = true;
  else if (
    args[index] === "--child-profile-id" &&
    args[index + 1] &&
    !args[index + 1]!.startsWith("--")
  )
    childProfileId = args[++index];
  else throw new Error("Usage: gamification:reconcile [--apply] [--child-profile-id ID]");
}
const prisma = new PrismaClient();
reconcileGamification(prisma, { apply, childProfileId, asOf: new ApplicationClock().now() })
  .then((report) => console.log(JSON.stringify(report, null, 2)))
  .catch(() => {
    console.error("GAMIFICATION_RECONCILIATION_FAILED");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
