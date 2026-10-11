import { handler } from "@/lib/server/bff";
export const dynamic = "force-dynamic";
export const POST = handler({
  method: "POST",
  path: "/auth/demo",
  public: true,
  bodyless: true,
  login: true,
});
