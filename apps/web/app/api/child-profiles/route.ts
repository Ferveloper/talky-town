import { handler } from "@/lib/server/bff";
export const dynamic = "force-dynamic";
export const GET = handler({ method: "GET", path: "/child-profiles" });
export const POST = handler({ method: "POST", path: "/child-profiles" });
