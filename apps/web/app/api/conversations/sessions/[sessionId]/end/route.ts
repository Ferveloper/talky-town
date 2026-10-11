import { handler, segment } from "@/lib/server/bff";
export const dynamic = "force-dynamic";
export const POST = handler({
  method: "POST",
  path: ({ params }) => `/conversations/sessions/${segment(params.sessionId)}/end`,
  bodyless: true,
  long: true,
});
