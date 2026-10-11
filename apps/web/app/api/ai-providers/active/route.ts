import { handler } from "@/lib/server/bff";
export const dynamic = "force-dynamic";
export const PUT = handler({ method: "PUT", path: "/ai-providers/active" });
