import { handler, segment } from "@/lib/server/bff";
import { NextRequest } from "next/server";
export const dynamic = "force-dynamic";
const base = handler({
  method: "GET",
  path: ({ params }) =>
    `/conversations/sessions/${segment(params.sessionId)}/turns${params.query || ""}`,
});
export const GET = (request: NextRequest, context: { params: Record<string, string> }) => {
  const query = new URLSearchParams();
  for (const key of ["cursor", "limit"]) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) query.set(key, value);
  }
  return base(request, { params: { ...context.params, query: query.size ? `?${query}` : "" } });
};
