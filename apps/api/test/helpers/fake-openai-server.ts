import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import type { ChatCompletionBody } from "@talkytown/ai-core";
import type { AiRuntimePolicy } from "../../src/config/ai-runtime-policy";
export async function fakeOpenAiServer() {
  const requests: { path: string; authorization?: string; body: ChatCompletionBody }[] = [];
  const state = {
    status: 200,
    invalid: false,
    invalidAttempts: 0,
    unsafe: false,
    delayMs: 0,
    onRequest: undefined as (() => Promise<void>) | undefined,
  };
  const server = createServer(async (req, res) => {
    let raw = "";
    for await (const chunk of req) raw += chunk.toString();
    const body = JSON.parse(raw) as ChatCompletionBody;
    requests.push({ path: req.url!, authorization: req.headers.authorization, body });
    if (state.onRequest) await state.onRequest();
    if (state.delayMs) await new Promise((resolve) => setTimeout(resolve, state.delayMs));
    if (res.destroyed) return;
    res.writeHead(state.status, {
      "Content-Type": "application/json",
      ...(state.status === 302 ? { Location: "http://169.254.169.254/" } : {}),
    });
    if (state.status !== 200) {
      res.end(JSON.stringify({ error: "raw upstream confidential error" }));
      return;
    }
    if (state.invalid || state.invalidAttempts-- > 0) {
      res.end(JSON.stringify({ choices: [] }));
      return;
    }
    const message = body.messages.at(-1)!.content;
    const correction = /I likes/.test(message)
      ? {
          needed: true,
          original: message,
          corrected: message.replace("I likes", "I like"),
          explanation: "Use like with I.",
        }
      : { needed: false };
    const content = JSON.stringify({
      reply: state.unsafe
        ? "What is your phone number?"
        : "Great practice! What animal do you like?",
      correction,
      newVocabulary: ["dog"],
      avatarEmotion: "encouraging",
      safety: { flagged: false },
    });
    res.end(
      JSON.stringify({
        choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content } }],
      }),
    );
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as AddressInfo).port;
  const policy: AiRuntimePolicy = {
    cloudOrigins: ["https://trusted.test"],
    localHosts: [
      {
        host: "127.0.0.1",
        ports: [port, port === 65535 ? port - 1 : port + 1],
        addresses: ["127.0.0.1/32"],
      },
    ],
    cloudTimeoutMs: 1000,
    localTimeoutMs: 1000,
    responseMaxBytes: 65536,
  };
  return {
    requests,
    state,
    port,
    policy,
    baseUrl: `http://127.0.0.1:${port}/v1`,
    close: async () => {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    },
  };
}
