import { handler, segment } from "@/lib/server/bff";
export const dynamic = "force-dynamic";
export const GET = handler({
  method: "GET",
  path: ({ params }) => `/conversations/sessions/${segment(params.sessionId)}`,
});
