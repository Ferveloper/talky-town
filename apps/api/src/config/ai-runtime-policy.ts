import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ipaddr from "ipaddr.js";
export const AI_RUNTIME_POLICY = Symbol("AI_RUNTIME_POLICY");
export type AiRuntimePolicy = {
  cloudOrigins: string[];
  localHosts: { host: string; ports: number[]; addresses: string[] }[];
  cloudTimeoutMs: number;
  localTimeoutMs: number;
  responseMaxBytes: number;
};
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
  return value as Record<string, unknown>;
};
const strings = (value: unknown): string[] => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item.trim()))
    throw new Error();
  return value;
};
const number = (value: unknown, maximum: number): number => {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > maximum)
    throw new Error();
  return value;
};
export function parseRuntimePolicy(value: unknown): AiRuntimePolicy {
  try {
    const data = object(value);
    if (
      Object.keys(data).some(
        (key) =>
          ![
            "cloudOrigins",
            "localHosts",
            "cloudTimeoutMs",
            "localTimeoutMs",
            "responseMaxBytes",
          ].includes(key),
      )
    )
      throw new Error();
    const cloudOrigins = strings(data.cloudOrigins).map((origin) => {
      const url = new URL(origin);
      if (url.protocol !== "https:" || url.origin !== origin || url.username || url.password)
        throw new Error();
      return origin;
    });
    if (!Array.isArray(data.localHosts)) throw new Error();
    const localHosts = data.localHosts.map((item: unknown) => {
      const host = object(item);
      if (
        Object.keys(host).some((key) => !["host", "ports", "addresses"].includes(key)) ||
        typeof host.host !== "string" ||
        !host.host ||
        /[\s/@?#]/.test(host.host)
      )
        throw new Error();
      if (!Array.isArray(host.ports) || !host.ports.length) throw new Error();
      const ports = host.ports.map((port: unknown) => number(port, 65535));
      const addresses = strings(host.addresses);
      if (!addresses.length) throw new Error();
      addresses.forEach((address) => ipaddr.parseCIDR(address));
      return { host: host.host.toLowerCase(), ports, addresses };
    });
    return {
      cloudOrigins,
      localHosts,
      cloudTimeoutMs: number(data.cloudTimeoutMs, 120000),
      localTimeoutMs: number(data.localTimeoutMs, 120000),
      responseMaxBytes: number(data.responseMaxBytes, 1048576),
    };
  } catch {
    throw new Error("Invalid AI runtime policy.");
  }
}
export function loadRuntimePolicy(): AiRuntimePolicy {
  try {
    return parseRuntimePolicy(
      JSON.parse(
        readFileSync(resolve(__dirname, "../../../../config/ai-runtime-policy.json"), "utf8"),
      ),
    );
  } catch {
    throw new Error("Invalid or missing AI runtime policy.");
  }
}
