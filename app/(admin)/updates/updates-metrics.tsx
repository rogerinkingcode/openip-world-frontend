import type { ReactNode } from "react";
import Badge from "@/components/ui/badge/Badge";
import Skeleton from "@/components/ui/skeleton/Skeleton";
import { CheckCircleIcon, DocsIcon, DownloadIcon, TimeIcon } from "@/icons";
import type { UpdatesSummary } from "@/lib/updates";

const GRID_CLASS =
  "grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 xl:grid-cols-4";
const CARD_CLASS =
  "rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6";

// Cards no formato do EcommerceMetrics do tema, com números da aba ativa.
export default function UpdatesMetrics({ summary }: { summary: UpdatesSummary }) {
  const { total, upToDate, pending, awaitingDownload, awaitingDatabase } =
    summary;
  const percent = total > 0 ? Math.round((upToDate / total) * 100) : 0;

  return (
    <div className={GRID_CLASS}>
      <MetricCard
        icon={<DocsIcon className="size-6" />}
        label="Arquivos monitorados"
        value={total}
      />
      <MetricCard
        icon={<CheckCircleIcon className="size-6" />}
        label="Em dia com o INPI"
        value={upToDate}
        badge={total > 0 && <Badge color="success">{percent}%</Badge>}
      />
      <MetricCard
        icon={<TimeIcon className="size-6" />}
        label="Aguardando atualização"
        value={pending}
        badge={pending > 0 && <Badge color="warning">em 24h</Badge>}
      />
      <MetricCard
        icon={<DownloadIcon className="size-6" />}
        label="Baixados, aguardando carga"
        value={awaitingDatabase}
        badge={
          awaitingDownload > 0 && (
            <Badge color="info">{awaitingDownload} por baixar</Badge>
          )
        }
      />
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  badge,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  badge?: ReactNode;
}) {
  return (
    <div className={`${CARD_CLASS} flex items-center gap-4`}>
      <div className="flex items-center justify-center w-12 h-12 shrink-0 text-gray-800 bg-gray-100 rounded-xl dark:bg-gray-800 dark:text-white/90">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <span className="block text-sm text-gray-500 dark:text-gray-400">
          {label}
        </span>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <h4 className="font-bold text-gray-800 text-title-sm dark:text-white/90">
            {value}
          </h4>
          {badge}
        </div>
      </div>
    </div>
  );
}

export function UpdatesMetricsSkeleton() {
  return (
    <div className={GRID_CLASS}>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className={`${CARD_CLASS} flex items-center gap-4`}>
          <Skeleton className="w-12 h-12 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <div className="flex h-5 items-center">
              <Skeleton className="h-3.5 w-full max-w-36" />
            </div>
            <div className="mt-1 flex h-[38px] items-center gap-3">
              <Skeleton className="h-7 w-14" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
