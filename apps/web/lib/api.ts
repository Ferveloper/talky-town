import type { ApiErrorResponse } from "@talkytown/shared";
import { clearBrowserSession } from "./pending";
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: ApiErrorResponse,
  ) {
    super(detail.code);
  }
}
export async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      cache: "no-store",
      headers:
        method === "GET" ? {} : { "Content-Type": "application/json", "X-TalkyTown-Request": "1" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new ApiError(503, { code: "BACKEND_UNAVAILABLE" });
  }
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(502, { code: "INVALID_RESPONSE" });
  }
  if (!response.ok) {
    if (response.status === 401) {
      clearBrowserSession();
      window.dispatchEvent(new Event("talkytown:auth-expired"));
    }
    throw new ApiError(response.status, data as ApiErrorResponse);
  }
  return data as T;
}
export function errorText(error: unknown): string {
  const code = error instanceof ApiError ? error.detail.code : "";
  const messages: Record<string, string> = {
    UNAUTHORIZED: "La sesión de adulto ha caducado. Entra de nuevo para continuar.",
    SAFETY_REVIEW_REQUIRED:
      "Este contenido necesita revisión de un administrador. El historial no se puede mostrar.",
    UNSAFE_ALIAS: "Elige un alias inventado y seguro, sin datos personales.",
    RESOURCE_CONFLICT: "Ese alias ya existe. Elige otro alias inventado.",
    VALIDATION_ERROR: "Revisa los campos indicados y usa un mensaje de 1 a 500 caracteres.",
    DEMO_SEED_REQUIRED: "Prepara los datos de demostración siguiendo la guía local.",
    DEMO_AUTH_DISABLED: "La demostración está desactivada en este entorno.",
    SESSION_NOT_ACTIVE: "Esta conversación ya terminó. Consulta su resumen.",
    AVATAR_UNAVAILABLE: "Este acompañante no está disponible. Crea un perfil con otro acompañante.",
    MISSION_INELIGIBLE: "Esta misión no está disponible para este perfil.",
    PROVIDER_NOT_CONFIGURED: "El proveedor seleccionado necesita configuración de un adulto.",
    PROVIDER_CONFIGURATION_INVALID: "Revisa la configuración del proveedor en la zona de adultos.",
    PROVIDER_URL_NOT_ALLOWED: "La dirección no está autorizada por la política del servidor.",
    PROVIDER_CONFIG_IN_USE:
      "Hay conversaciones activas con esta dirección. Ciérralas antes de cambiarla.",
    PROVIDER_CONFIGURATION_CHANGED:
      "La configuración cambió durante la operación. Revisa y vuelve a intentarlo.",
    PROVIDER_OPERATION_RATE_LIMITED:
      "Espera un minuto antes de iniciar otra operación de proveedor.",
    PROVIDER_AUTHENTICATION_FAILED:
      "El servidor no pudo autenticar el proveedor. Un adulto debe revisar sus credenciales.",
    PROVIDER_INVALID_RESPONSE: "El proveedor no devolvió una respuesta válida. Puedes reintentar.",
    PROVIDER_UNAVAILABLE:
      "El proveedor no está disponible. Puedes reintentar o pedir ayuda a un adulto.",
    PROVIDER_RATE_LIMITED: "El proveedor está ocupado. Espera un momento antes de reintentar.",
    PROVIDER_TIMEOUT: "El proveedor tardó demasiado. Reintenta la misma operación.",
    BACKEND_TIMEOUT:
      "La respuesta tardó demasiado. Puede haberse guardado: reintenta la misma operación.",
    BACKEND_UNAVAILABLE: "No podemos conectar con TalkyTown. Comprueba el servidor y reintenta.",
    DATABASE_UNAVAILABLE:
      "El servidor de datos no está disponible. Un adulto puede revisar la instalación.",
    REQUEST_ID_CONFLICT:
      "Esta operación pertenece a otro intento. Recupera la conversación antes de continuar.",
  };
  return messages[code] || "No se pudo completar la operación. Vuelve a intentarlo.";
}
