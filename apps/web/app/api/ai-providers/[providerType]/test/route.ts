import { handler, provider } from "@/lib/server/bff";
export const dynamic = "force-dynamic";
export const POST = handler({
  method: "POST",
  path: ({ params }) =>
    provider(params.providerType) ? `/ai-providers/${provider(params.providerType)}/test` : "",
  bodyless: true,
  long: true,
});
