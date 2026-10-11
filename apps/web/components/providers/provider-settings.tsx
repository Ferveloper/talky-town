"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type {
  AiProviderType,
  ProviderCatalogResponse,
  ProviderTestResponse,
  UpdateProviderConfigRequest,
} from "@talkytown/shared";
import { api, errorText } from "@/lib/api";
import { FallbackStateCard, LoadingCard, TalkyCard } from "@/components/ui/talky";
const names: Record<AiProviderType, string> = {
  mock: "Mock · demo sin claves",
  "openai-compatible-cloud": "Nube compatible con OpenAI",
  "local-openai-compatible": "Servidor local compatible con OpenAI",
};
type Item = ProviderCatalogResponse["items"][number];
export function ProviderStatusCard({
  item,
  busy,
  health,
  onSave,
  onTest,
}: {
  item: Item;
  busy: boolean;
  health?: ProviderTestResponse;
  onSave: (type: AiProviderType, body: UpdateProviderConfigRequest) => Promise<void>;
  onTest: (type: AiProviderType) => Promise<void>;
}) {
  const [draft, setDraft] = useState<UpdateProviderConfigRequest>({
    baseUrl: item.baseUrl || "",
    model: item.model || "",
  });
  useEffect(() => {
    setDraft({ baseUrl: item.baseUrl || "", model: item.model || "" });
  }, [item.baseUrl, item.model]);
  const dirty = draft.baseUrl !== (item.baseUrl || "") || draft.model !== (item.model || "");
  return (
    <TalkyCard className="provider-card">
      <h2>{names[item.providerType]}</h2>
      <div className="provider-status">
        <span>{item.active ? "Seleccionado para nuevas sesiones" : "Sin seleccionar"}</span>
        <span>{item.configured ? "Configuración completa" : "Necesita configuración"}</span>
        <span>
          {item.providerType === "mock"
            ? "No necesita credenciales"
            : item.credentialsConfigured
              ? "Credenciales del servidor presentes"
              : item.providerType === "local-openai-compatible"
                ? "Credenciales opcionales no presentes"
                : "Faltan credenciales del servidor"}
        </span>
      </div>
      {item.configurationError && <p>Estado de configuración: {item.configurationError}</p>}
      {item.providerType === "mock" ? (
        <p>Respuesta local determinista. No llama a proveedores externos.</p>
      ) : (
        <form
          className="form-stack"
          onSubmit={(event) => {
            event.preventDefault();
            void onSave(item.providerType, draft);
          }}
        >
          <label>
            Dirección del servidor
            <input
              aria-label={`Dirección de ${item.providerType}`}
              type="url"
              required
              maxLength={2048}
              value={draft.baseUrl}
              onChange={(event) => setDraft({ ...draft, baseUrl: event.target.value })}
              placeholder={
                item.providerType === "local-openai-compatible"
                  ? "http://localhost:11434/v1"
                  : "https://servidor-autorizado.example/v1"
              }
            />
          </label>
          <label>
            Modelo
            <input
              aria-label={`Modelo de ${item.providerType}`}
              required
              maxLength={200}
              value={draft.model}
              onChange={(event) => setDraft({ ...draft, model: event.target.value })}
            />
          </label>
          <button className="talky-button secondary" disabled={busy || !dirty}>
            Guardar configuración
          </button>
        </form>
      )}
      <div className="action-row">
        <button
          className="talky-button"
          disabled={busy || dirty || !item.configured}
          onClick={() => void onTest(item.providerType)}
        >
          Probar {names[item.providerType]}
        </button>
      </div>
      <p className="demo-notice">
        {health && !dirty
          ? `Disponible en la última prueba: ${health.model} · ${health.latencyMs} ms`
          : "Disponibilidad sin comprobar para esta configuración."}
      </p>
      <small>
        Guardar no activa el proveedor. La prueba explícita genera una solicitud y puede consumir
        recursos o saldo; no guarda conversación ni cambia la selección.
      </small>
    </TalkyCard>
  );
}
export function ProviderSettingsScreen() {
  const [catalog, setCatalog] = useState<ProviderCatalogResponse>();
  const [selected, setSelected] = useState<AiProviderType>("mock");
  const [health, setHealth] = useState<Partial<Record<AiProviderType, ProviderTestResponse>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const guard = useRef(false);
  async function load() {
    const data = await api<ProviderCatalogResponse>("/ai-providers");
    setCatalog(data);
    setSelected(data.activeProvider || "mock");
  }
  useEffect(() => {
    void load().catch((e) => setError(errorText(e)));
  }, []);
  async function operation(action: () => Promise<void>) {
    if (guard.current) return;
    guard.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (e) {
      setError(errorText(e));
    } finally {
      guard.current = false;
      setBusy(false);
    }
  }
  async function save(type: AiProviderType, body: UpdateProviderConfigRequest) {
    await operation(async () => {
      await api(`/ai-providers/${type}/config`, "PUT", body);
      setHealth((h) => ({ ...h, [type]: undefined }));
      await load();
      setNotice("Configuración guardada. La selección del proveedor no ha cambiado.");
    });
  }
  async function test(type: AiProviderType) {
    await operation(async () => {
      setHealth((h) => ({ ...h, [type]: undefined }));
      const result = await api<ProviderTestResponse>(`/ai-providers/${type}/test`, "POST");
      setHealth((h) => ({ ...h, [type]: result }));
      setNotice("Prueba completada. No se ha activado el proveedor ni guardado aprendizaje.");
    });
  }
  return (
    <div className="narrow">
      <Link className="back-link" href="/adult">
        ← Zona de adultos
      </Link>
      <h1>Configurar el acompañante IA</h1>
      <p>Solo para adultos. No introduzcas claves aquí: se configuran en el servidor.</p>
      {error && (
        <FallbackStateCard text={error} retry={!catalog ? () => void operation(load) : undefined} />
      )}
      {notice && (
        <p className="alert" role="status">
          {notice}
        </p>
      )}
      {!catalog ? (
        !error && <LoadingCard />
      ) : (
        <>
          <TalkyCard>
            <h2>Proveedor para conversaciones nuevas</h2>
            <p>
              Cuenta demo compartida: activar otro proveedor afecta las nuevas conversaciones de
              todos sus visitantes. Las conversaciones abiertas conservan su proveedor y modelo.
            </p>
            {catalog.selectionError && (
              <p>
                No hay una selección utilizable: {catalog.selectionError}. Puedes activar Mock
                explícitamente para recuperarla.
              </p>
            )}
            <label>
              Elegir proveedor
              <select
                value={selected}
                onChange={(event) => setSelected(event.target.value as AiProviderType)}
              >
                {catalog.items.map((item) => (
                  <option value={item.providerType} key={item.providerType}>
                    {names[item.providerType]}
                  </option>
                ))}
              </select>
            </label>
            <div className="action-row">
              <button
                className="talky-button"
                disabled={
                  busy || !catalog.items.find((i) => i.providerType === selected)?.activatable
                }
                onClick={() =>
                  void operation(async () => {
                    await api("/ai-providers/active", "PUT", { providerType: selected });
                    await load();
                    setNotice(
                      "Proveedor activado para conversaciones nuevas. Las abiertas mantienen su configuración.",
                    );
                  })
                }
              >
                Activar para nuevas conversaciones
              </button>
            </div>
          </TalkyCard>
          <p className="demo-notice">
            Una configuración completa no garantiza disponibilidad. localhost se refiere al servidor
            NestJS. Las direcciones deben estar autorizadas por su política de red. Si se usa una
            dirección en conversaciones activas, abre y termina esas conversaciones antes de
            cambiarla.
          </p>
          {catalog.items.map((item) => (
            <ProviderStatusCard
              key={item.providerType}
              item={item}
              busy={busy}
              health={health[item.providerType]}
              onSave={save}
              onTest={test}
            />
          ))}
        </>
      )}
    </div>
  );
}
