import { handler, provider } from "@/lib/server/bff";
export const dynamic = "force-dynamic";
export const PUT = handler({
  method: "PUT",
  path: ({ params }) =>
    provider(params.providerType) ? `/ai-providers/${provider(params.providerType)}/config` : "",
  long: true,
});
