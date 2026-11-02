"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Alert from "@/components/ui/alert/Alert";
import Badge from "@/components/ui/badge/Badge";
import Skeleton from "@/components/ui/skeleton/Skeleton";
import { useUser } from "@/context/UserContext";
import { backendFetch } from "@/lib/api";
import { dragToScroll } from "@/lib/dragToScroll";
import { RPI_SECOES, secaoEmEnvio } from "@/lib/rpi";
import type { RpiOverview, RpiSecao } from "@/lib/types";
import DeleteSecaoDialog from "./delete-secao-dialog";
import RpiMonitor from "./rpi-monitor";
import RevisaoDialog from "./revisao-dialog";
import RpiTable, { RpiTableSkeleton } from "./rpi-table";

// Mesma moldura de abas da tela de Atualizações.
const TABS_FRAME_CLASS =
  "rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-white/[0.03]";
const TABS_SCROLLER_CLASS = "overflow-x-auto overscroll-x-contain no-scrollbar";
const TABLIST_CLASS = "flex w-full min-w-max items-center gap-1";

// Enquanto algum arquivo está a caminho do bucket, a tela se atualiza sozinha
// para acompanhar a rodada disparada no subsistema.
const POLL_INTERVAL_MS = 10_000;

export default function RpiView() {
  const { user, error } = useUser();

  if (!user && !error) return <RpiSkeleton />;

  if (user?.role !== "admin") {
    return (
      <Alert
        variant="error"
        title="Acesso restrito"
        message="Esta página é exclusiva para administradores."
      />
    );
  }

  return <RpiDashboard />;
}

function RpiDashboard() {
  const [data, setData] = useState<RpiOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState(RPI_SECOES[0].key);
  const [deleting, setDeleting] = useState<RpiSecao | null>(null);
  const [revisando, setRevisando] = useState<RpiSecao | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await backendFetch("/rpi/secoes");
      const body = await res.json();

      if (!res.ok || (body?.status && body.status !== 200)) {
        setError(body?.message ?? "Não foi possível carregar a RPI.");
        return;
      }
      setError(null);
      setData(body as RpiOverview);
    } catch {
      setError("Erro de conexão com o servidor.");
    }
  }, []);

  useEffect(() => {
    // Carga inicial: o setState acontece depois do await, não no corpo do efeito.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const emEnvio = useMemo(
    () =>
      data
        ? Object.values(data.secoes).some((secoes) => secoes.some(secaoEmEnvio))
        : false,
    [data],
  );

  useEffect(() => {
    if (!emEnvio) return;
    const timer = setInterval(() => void load(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [emEnvio, load]);

  const rows = data?.secoes[activeKey] ?? [];

  if (error && !data) {
    return (
      <Alert
        variant="error"
        title="Não foi possível carregar a RPI"
        message={error}
      />
    );
  }

  if (!data) return <RpiSkeleton />;

  const active = RPI_SECOES.find((secao) => secao.key === activeKey)!;

  return (
    <div className="space-y-6">
      {data.monitoramento && <RpiMonitor monitoramento={data.monitoramento} />}

      <div className={TABS_FRAME_CLASS}>
        <div ref={dragToScroll} className={TABS_SCROLLER_CLASS}>
          <div role="tablist" aria-label="Seções da RPI" className={TABLIST_CLASS}>
            {RPI_SECOES.map((secao) => {
              const pendentes = (data.secoes[secao.key] ?? []).filter(
                (row) => !row.download_status,
              ).length;
              const isActive = secao.key === activeKey;

              return (
                <button
                  key={secao.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  title={`Seção ${secao.numeral} — ${secao.label}`}
                  onClick={(e) => {
                    setActiveKey(secao.key);
                    e.currentTarget.scrollIntoView({
                      behavior: "smooth",
                      block: "nearest",
                      inline: "nearest",
                    });
                  }}
                  className={`group flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-theme-sm font-medium transition-colors ${
                    isActive ? "menu-item-active" : "menu-item-inactive"
                  }`}
                >
                  <span>{secao.label}</span>
                  {pendentes > 0 && (
                    <Badge
                      size="sm"
                      color="warning"
                      title={`${pendentes} ${pendentes === 1 ? "edição" : "edições"} com arquivos fora do bucket`}
                    >
                      {pendentes}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Erro numa atualização automática não derruba a tela já carregada. */}
      {error && (
        <Alert variant="warning" title="Falha ao atualizar" message={error} />
      )}

      <RpiTable
        title={`Seção ${active.numeral} — ${active.label}`}
        rows={rows}
        emEnvio={rows.some(secaoEmEnvio)}
        onDelete={setDeleting}
        onRevisar={setRevisando}
      />

      <DeleteSecaoDialog
        secao={deleting}
        label={active.label}
        onClose={() => setDeleting(null)}
        onDeleted={load}
      />

      <RevisaoDialog
        secao={revisando}
        label={active.label}
        onClose={() => setRevisando(null)}
        onChanged={load}
      />
    </div>
  );
}

export function RpiSkeleton() {
  return (
    <div role="status" aria-label="Carregando a RPI" className="space-y-6">
      <div className={TABS_FRAME_CLASS}>
        <div className={TABS_SCROLLER_CLASS}>
          <div className={TABLIST_CLASS}>
            {RPI_SECOES.map((secao) => (
              <div key={secao.key} className="flex h-9 flex-1 items-center justify-center px-3">
                <Skeleton className="h-3.5 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <RpiTableSkeleton />
    </div>
  );
}
