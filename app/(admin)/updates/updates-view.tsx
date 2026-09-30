"use client";

import { useEffect, useMemo, useState } from "react";
import Alert from "@/components/ui/alert/Alert";
import Badge from "@/components/ui/badge/Badge";
import Skeleton from "@/components/ui/skeleton/Skeleton";
import { useUser } from "@/context/UserContext";
import { backendFetch } from "@/lib/api";
import { dragToScroll } from "@/lib/dragToScroll";
import type { UpdatesOverview } from "@/lib/types";
import {
  UPDATE_GROUPS,
  formatSourceLabel,
  summarizeUpdates,
} from "@/lib/updates";
import UpdatesMetrics, { UpdatesMetricsSkeleton } from "./updates-metrics";
import UpdatesTable, { UpdatesTableSkeleton } from "./updates-table";

// A moldura fica parada e só as abas deslizam dentro dela. Elas ocupam a largura
// toda e dividem o espaço; se os nomes não couberem (telas estreitas), min-w-max
// mantém o tamanho do conteúdo e a faixa rola (toque, ou arrastando com o mouse).
const TABS_FRAME_CLASS =
  "rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-white/[0.03]";
const TABS_SCROLLER_CLASS = "overflow-x-auto overscroll-x-contain no-scrollbar";
const TABLIST_CLASS = "flex w-full min-w-max items-center gap-1";

const TAB_SKELETON_WIDTHS = ["w-14", "w-16", "w-40", "w-64", "w-36"];

// A página é só de admin. Esconder no menu é conforto; quem garante é a API, que
// recusa não-admin mesmo que alguém digite a URL.
export default function UpdatesView() {
  const { user, error } = useUser();

  if (!user && !error) return <UpdatesSkeleton />;

  if (user?.role !== "admin") {
    return (
      <Alert
        variant="error"
        title="Acesso restrito"
        message="Esta página é exclusiva para administradores."
      />
    );
  }

  return <UpdatesDashboard />;
}

function UpdatesDashboard() {
  const [data, setData] = useState<UpdatesOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<keyof UpdatesOverview>(
    UPDATE_GROUPS[0].key,
  );

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await backendFetch("/list-all-updates");
        const body = await res.json();
        if (!active) return;

        // Erros do backend chegam com HTTP 200 e um campo "status" no corpo.
        if (body?.status && body.status !== 200) {
          setError(body.message ?? "Não foi possível carregar as atualizações.");
          return;
        }
        setData(body as UpdatesOverview);
      } catch {
        if (active) setError("Erro de conexão com o servidor.");
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const rows = useMemo(
    () => (data ? (data[activeKey] ?? []) : []),
    [data, activeKey],
  );
  const summary = useMemo(() => summarizeUpdates(rows), [rows]);

  if (error) {
    return (
      <Alert
        variant="error"
        title="Não foi possível carregar as atualizações"
        message={error}
      />
    );
  }

  if (!data) return <UpdatesSkeleton />;

  return (
    <div className="space-y-6">
      {/* Abas: uma por tabela de controle, título vindo do "source". */}
      <div className={TABS_FRAME_CLASS}>
        <div ref={dragToScroll} className={TABS_SCROLLER_CLASS}>
          <div
            role="tablist"
            aria-label="Tabelas de controle"
            className={TABLIST_CLASS}
          >
            {UPDATE_GROUPS.map((group) => {
              const groupRows = data[group.key] ?? [];
              const source = groupRows[0]?.source;
              const label = source ? formatSourceLabel(source) : group.fallbackLabel;
              const groupPending = groupRows.filter(
                (row) => !row.update_status,
              ).length;
              const isActive = group.key === activeKey;

              return (
                <button
                  key={group.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={(e) => {
                    setActiveKey(group.key);
                    // Aba cortada na borda da faixa desliza para dentro da tela.
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
                  <span>{label}</span>
                  {groupPending > 0 && (
                    <Badge
                      size="sm"
                      color="warning"
                      title={`${groupPending} aguardando atualização`}
                    >
                      {groupPending}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <UpdatesMetrics summary={summary} />
      <UpdatesTable rows={rows} summary={summary} />
    </div>
  );
}

export function UpdatesSkeleton() {
  return (
    <div role="status" aria-label="Carregando atualizações" className="space-y-6">
      <div className={TABS_FRAME_CLASS}>
        <div className={TABS_SCROLLER_CLASS}>
          <div className={TABLIST_CLASS}>
            {TAB_SKELETON_WIDTHS.map((width, i) => (
              <div key={i} className="flex h-9 flex-1 items-center justify-center px-3">
                <Skeleton className={`h-3.5 ${width}`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <UpdatesMetricsSkeleton />
      <UpdatesTableSkeleton />
    </div>
  );
}
