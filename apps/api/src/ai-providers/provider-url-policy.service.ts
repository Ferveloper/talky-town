import { Inject, Injectable } from "@nestjs/common";
import { lookup } from "node:dns/promises";
import ipaddr from "ipaddr.js";
import { ProviderExecutionError } from "@talkytown/ai-core";
import type { AiProviderType } from "@talkytown/shared";
import { AI_RUNTIME_POLICY, type AiRuntimePolicy } from "../config/ai-runtime-policy";
export type ResolvedAddress = { address: string; family: number };
@Injectable()
export class ProviderDnsResolver {
  lookup(host: string): Promise<ResolvedAddress[]> {
    return lookup(host, { all: true, verbatim: true });
  }
}
export async function withAbort<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted();
  let abort!: () => void;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        abort = () => reject(new ProviderExecutionError("PROVIDER_TIMEOUT"));
        signal.addEventListener("abort", abort, { once: true });
      }),
    ]);
  } finally {
    signal.removeEventListener("abort", abort);
  }
}
@Injectable()
export class ProviderUrlPolicyService {
  constructor(
    @Inject(AI_RUNTIME_POLICY) private readonly policy: AiRuntimePolicy,
    private readonly dns: ProviderDnsResolver,
  ) {}
  normalize(type: AiProviderType, input: string): string {
    try {
      const url = new URL(input);
      if (
        type === "mock" ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        /[\\\s]/.test(input) ||
        /%/.test(url.pathname) ||
        !["http:", "https:"].includes(url.protocol)
      )
        throw new Error();
      const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
      if (type === "openai-compatible-cloud") {
        if (url.protocol !== "https:" || !this.policy.cloudOrigins.includes(url.origin))
          throw new Error();
      } else if (
        !this.policy.localHosts.some(
          (entry) =>
            entry.host === host &&
            entry.ports.includes(Number(url.port || (url.protocol === "https:" ? 443 : 80))),
        )
      )
        throw new Error();
      if (ipaddr.isValid(host)) this.assertAddress(type, host, host);
      return url.toString().replace(/\/+$/, "");
    } catch {
      throw new ProviderExecutionError("PROVIDER_URL_NOT_ALLOWED");
    }
  }
  private assertAddress(type: AiProviderType, host: string, raw: string) {
    const address = ipaddr.process(raw);
    const range = address.range();
    if (["linkLocal", "multicast", "unspecified", "broadcast", "reserved"].includes(range))
      throw new ProviderExecutionError("PROVIDER_URL_NOT_ALLOWED");
    if (type === "openai-compatible-cloud") {
      if (range !== "unicast") throw new ProviderExecutionError("PROVIDER_URL_NOT_ALLOWED");
    } else {
      const entry = this.policy.localHosts.find((item) => item.host === host);
      if (
        !entry?.addresses.some((cidr) => {
          const [network, prefix] = ipaddr.parseCIDR(cidr);
          return address.kind() === network.kind() && address.match(network, prefix);
        })
      )
        throw new ProviderExecutionError("PROVIDER_URL_NOT_ALLOWED");
    }
  }
  async authorize(type: AiProviderType, baseUrl: string, signal: AbortSignal) {
    const url = new URL(this.normalize(type, baseUrl));
    const host = url.hostname.replace(/^\[|\]$/g, "");
    let addresses: ResolvedAddress[];
    try {
      addresses = ipaddr.isValid(host)
        ? [{ address: host, family: ipaddr.parse(host).kind() === "ipv4" ? 4 : 6 }]
        : await withAbort(this.dns.lookup(host), signal);
    } catch (error) {
      throw error instanceof ProviderExecutionError
        ? error
        : new ProviderExecutionError("PROVIDER_UNAVAILABLE");
    }
    if (!addresses.length) throw new ProviderExecutionError("PROVIDER_UNAVAILABLE");
    try {
      addresses.forEach((item) => this.assertAddress(type, host, item.address));
    } catch {
      throw new ProviderExecutionError("PROVIDER_URL_NOT_ALLOWED");
    }
    return { url: url.toString().replace(/\/+$/, "") + "/chat/completions", addresses };
  }
}
