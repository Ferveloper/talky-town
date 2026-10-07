export type ProviderErrorCode =
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_AUTHENTICATION_FAILED"
  | "PROVIDER_RATE_LIMITED"
  | "PROVIDER_INVALID_RESPONSE"
  | "PROVIDER_REQUEST_REJECTED"
  | "PROVIDER_URL_NOT_ALLOWED";

/** Deliberately carries no upstream body, URL, input, credential or original error. */
export class ProviderExecutionError extends Error {
  constructor(readonly code: ProviderErrorCode) {
    super(code);
    this.name = "ProviderExecutionError";
  }
}
