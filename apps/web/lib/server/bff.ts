import "server-only";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIE = "talkytown_session";
const cacheHeaders = { "Cache-Control": "private, no-store", Vary: "Cookie" };
const maxBody = 16 * 1024;
type Context = { params: Record<string, string> };
type Options = {
  method: "GET" | "POST" | "PUT";
  path: string | ((context: Context) => string);
  public?: boolean;
  bodyless?: boolean;
  login?: boolean;
  logout?: boolean;
  long?: boolean;
};

export function backendUrl(path: string) {
  return new URL(path, process.env.TALKYTOWN_API_URL || "http://localhost:3001").toString();
}
function origin() {
  return new URL(process.env.WEB_APP_ORIGIN || "http://localhost:3000").origin;
}
export function result(value: unknown, status = 200) {
  return NextResponse.json(value, { status, headers: cacheHeaders });
}
function clear(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: origin().startsWith("https:"),
    path: "/",
    maxAge: 0,
  });
  return response;
}
async function readBody(request: NextRequest, bodyless: boolean) {
  if (Number(request.headers.get("content-length") || 0) > maxBody)
    throw new Error("BODY_TOO_LARGE");
  const reader = request.body?.getReader();
  if (!reader) {
    if (bodyless) return undefined;
    throw new Error("INVALID_BODY");
  }
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBody) {
      await reader.cancel();
      throw new Error("BODY_TOO_LARGE");
    }
    chunks.push(value);
  }
  const raw = new TextDecoder().decode(Buffer.concat(chunks));
  if (!raw.trim() && bodyless) return undefined;
  try {
    const body: unknown = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return JSON.stringify(body);
  } catch {
    throw new Error("INVALID_BODY");
  }
}
export function handler(options: Options) {
  return async (request: NextRequest, context: Context = { params: {} }) => {
    if (options.method !== "GET") {
      if (
        request.headers.get("origin") !== origin() ||
        request.headers.get("x-talkytown-request") !== "1"
      )
        return result({ code: "ORIGIN_REJECTED" }, 403);
      if (
        request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !==
        "application/json"
      )
        return result({ code: "INVALID_BODY" }, 415);
    }
    const token = cookies().get(SESSION_COOKIE)?.value;
    if (!options.public && !token) return clear(result({ code: "UNAUTHORIZED" }, 401));
    let body: string | undefined;
    if (options.method !== "GET") {
      try {
        body = await readBody(request, Boolean(options.bodyless));
      } catch (error) {
        return result({ code: error instanceof Error ? error.message : "INVALID_BODY" }, 400);
      }
    }
    if (options.logout) return clear(result({ ok: true }));
    const path = typeof options.path === "function" ? options.path(context) : options.path;
    if (!path) return result({ code: "RESOURCE_NOT_FOUND" }, 404);
    const controller = new AbortController();
    const configured = Number(
      process.env[options.long ? "BFF_OPERATION_TIMEOUT_MS" : "BFF_READ_TIMEOUT_MS"],
    );
    const timeout =
      Number.isFinite(configured) && configured > 0 ? configured : options.long ? 150000 : 10000;
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const upstream = await fetch(backendUrl(path), {
        method: options.method,
        body,
        cache: "no-store",
        redirect: "error",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...(token && !options.public ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      let data: Record<string, unknown>;
      try {
        const value: unknown = await upstream.json();
        if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
        data = value as Record<string, unknown>;
      } catch {
        return result({ code: "INVALID_RESPONSE" }, 502);
      }
      if (!upstream.ok) {
        const code =
          typeof data.code === "string" && /^[A-Z_]+$/.test(data.code)
            ? data.code
            : "BACKEND_ERROR";
        const response = result(
          {
            code,
            ...(Number.isInteger(data.activeSessionCount)
              ? { activeSessionCount: data.activeSessionCount }
              : {}),
          },
          upstream.status,
        );
        return upstream.status === 401 ? clear(response) : response;
      }
      if (options.login) {
        if (
          typeof data.accessToken !== "string" ||
          !data.user ||
          typeof data.expiresIn !== "number"
        )
          return result({ code: "INVALID_RESPONSE" }, 502);
        const response = result({
          user: data.user,
          expiresIn: Math.min(7200, Math.max(0, data.expiresIn)),
        });
        response.cookies.set(SESSION_COOKIE, data.accessToken, {
          httpOnly: true,
          sameSite: "lax",
          secure: origin().startsWith("https:"),
          path: "/",
          maxAge: Math.min(7200, Math.max(0, data.expiresIn)),
        });
        return response;
      }
      return result(data, upstream.status);
    } catch {
      return result(
        { code: controller.signal.aborted ? "BACKEND_TIMEOUT" : "BACKEND_UNAVAILABLE" },
        controller.signal.aborted ? 504 : 503,
      );
    } finally {
      clearTimeout(timer);
    }
  };
}
export function segment(value: string | undefined) {
  return encodeURIComponent(value || "");
}
export function provider(value: string | undefined) {
  return ["mock", "openai-compatible-cloud", "local-openai-compatible"].includes(value || "")
    ? value
    : undefined;
}
