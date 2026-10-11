import { handler } from "@/lib/server/bff";
export const dynamic = "force-dynamic";
export const POST = handler({
  method: "POST",
  path: "",
  public: true,
  bodyless: true,
  logout: true,
});
