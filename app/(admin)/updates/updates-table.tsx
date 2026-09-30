import type { ReactNode } from "react";
import Badge from "@/components/ui/badge/Badge";
import Skeleton from "@/components/ui/skeleton/Skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRightIcon, DownloadIcon, TimeIcon } from "@/icons";
import type { UpdateRecord } from "@/lib/types";
import { formatDate, formatDateTime, type UpdatesSummary } from "@/lib/updates";

const COLUMNS = [
  "Tabela",
  // Download do arquivo do INPI para o servidor: etapa que vem antes da carga na
  // base, por isso fica à esquerda da Situação.
  "Download",
  "Situação",
  "Atualização no INPI",
  "Verificado em",
  "Tipo",
  "Tamanho",
  "Origem",
  "Arquivo",
];

const HEAD_CELL =
  "px-5 py-3 font-medium text-gray-500 text-start text-theme-xs whitespace-nowrap dark:text-gray-400";
const CELL = "px-5 py-4 text-start whitespace-nowrap";
const MUTED_CELL = `${CELL} text-theme-sm text-gray-500 dark:text-gray-400`;
// Botão de ação das colunas Origem e Arquivo.
const LINK_BUTTON =
  "inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200";

function TableCard({
  description,
  aside,
  children,
}: {
  description: ReactNode;
  aside: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-3 px-5 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Arquivos do INPI
          </h3>
          {description}
        </div>
        {aside}
      </div>
      {children}
    </div>
  );
}

function TableFrame({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-full overflow-x-auto custom-scrollbar">
      <Table className="min-w-[1100px]">
        <TableHeader className="border-y border-gray-100 dark:border-gray-800">
          <TableRow>
            {COLUMNS.map((column) => (
              <TableCell key={column} isHeader className={HEAD_CELL}>
                {column}
              </TableCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
          {children}
        </TableBody>
      </Table>
    </div>
  );
}

export default function UpdatesTable({
  rows,
  summary,
}: {
  rows: UpdateRecord[];
  summary: UpdatesSummary;
}) {
  const { total, pending, awaitingDownload, awaitingDatabase, lastCheck } =
    summary;

  return (
    <TableCard
      description={
        <>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {total === 0 ? (
              "Nenhum arquivo cadastrado."
            ) : pending === 0 ? (
              <>
                <span className="font-medium text-success-600 dark:text-success-500">
                  Tudo em dia
                </span>{" "}
                — {total} {total === 1 ? "arquivo" : "arquivos"} em dia com o
                INPI.
              </>
            ) : (
              <>
                <span className="font-medium text-warning-600 dark:text-orange-400">
                  {pending} {pending === 1 ? "arquivo" : "arquivos"} aguardando
                </span>{" "}
                de {total} — atualização nas próximas 24h.
              </>
            )}
          </p>
          {pending > 0 && awaitingDatabase > 0 && (
            <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">
              {awaitingDatabase}{" "}
              {awaitingDatabase === 1 ? "já baixado" : "já baixados"} do INPI,{" "}
              {awaitingDownload > 0
                ? `${awaitingDownload} ainda por baixar.`
                : "aguardando apenas a carga na base."}
            </p>
          )}
        </>
      }
      aside={
        lastCheck && (
          <p className="flex items-center gap-1.5 text-theme-xs text-gray-500 whitespace-nowrap dark:text-gray-400">
            <TimeIcon className="size-4" />
            Última verificação: {formatDateTime(lastCheck)}
          </p>
        )
      }
    >
      {rows.length > 0 && (
        <TableFrame>
          {rows.map((row) => (
            <Row key={row.id} row={row} />
          ))}
        </TableFrame>
      )}
    </TableCard>
  );
}

function Row({ row }: { row: UpdateRecord }) {
  return (
    <TableRow
      className={
        // Pendente ganha fundo e faixa âmbar à esquerda para saltar na varredura.
        row.update_status
          ? ""
          : "bg-warning-25 shadow-[inset_3px_0_0_0_var(--color-warning-500)] dark:bg-warning-500/[0.04]"
      }
    >
      <TableCell
        className={`${CELL} font-mono text-theme-xs text-gray-800 dark:text-white/90`}
      >
        {row.table}
      </TableCell>
      <TableCell className={CELL}>
        {row.download_status ? (
          <Badge
            size="sm"
            color="info"
            title="Arquivo baixado do INPI e conferido no servidor"
          >
            Baixado
          </Badge>
        ) : (
          <Badge
            size="sm"
            color="light"
            title="O arquivo ainda não foi baixado do INPI"
          >
            Pendente
          </Badge>
        )}
      </TableCell>
      <TableCell className={CELL}>
        {row.update_status ? (
          <Badge size="sm" color="success">
            Atualizado
          </Badge>
        ) : (
          <div className="flex flex-col gap-1">
            <Badge
              size="sm"
              color="warning"
              title={
                row.status_detail ?? "Ainda vamos atualizar nas próximas 24 horas"
              }
            >
              Aguardando
            </Badge>
            {/* O motivo só existe quando o subsistema soube dizer por que
                recusou (arquivo incompleto, tabela sem mapeamento, falha na
                carga). Sem ele, a linha ficava "Aguardando" sem explicação e a
                causa vivia só no log do container. */}
            {row.status_detail && (
              <span className="max-w-[220px] text-theme-xs leading-tight text-warning-700 dark:text-warning-400">
                {row.status_detail}
              </span>
            )}
          </div>
        )}
      </TableCell>
      <TableCell className={MUTED_CELL}>{formatDate(row.date_update)}</TableCell>
      <TableCell className={MUTED_CELL}>
        {formatDateTime(row.updated_at)}
      </TableCell>
      <TableCell className={MUTED_CELL}>{row.file_type || "—"}</TableCell>
      <TableCell className={MUTED_CELL}>{row.file_size || "—"}</TableCell>
      <TableCell className={CELL}>
        {row.url ? (
          // A URL não aparece na tabela: fica no title para quem quiser conferir.
          <a
            href={row.url}
            target="_blank"
            rel="noreferrer"
            title={row.url}
            aria-label={`Acessar a origem de ${row.table} (abre em nova aba)`}
            className={LINK_BUTTON}
          >
            <ArrowRightIcon className="size-4 -rotate-45" />
            Acessar
          </a>
        ) : (
          <span className="text-theme-xs text-gray-400">indisponível</span>
        )}
      </TableCell>
      <TableCell className={CELL}>
        {row.download_link ? (
          <a
            href={row.download_link}
            download
            target="_blank"
            rel="noreferrer"
            className={LINK_BUTTON}
          >
            <DownloadIcon className="size-4" />
            Baixar
          </a>
        ) : (
          <span className="text-theme-xs text-gray-400">indisponível</span>
        )}
      </TableCell>
    </TableRow>
  );
}

export function UpdatesTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <TableCard
      description={
        <div className="mt-1 flex h-5 items-center">
          <Skeleton className="h-3.5 w-80 max-w-full" />
        </div>
      }
      aside={
        <div className="flex h-[18px] items-center">
          <Skeleton className="h-3 w-52" />
        </div>
      }
    >
      <TableFrame>
        {Array.from({ length: rows }, (_, i) => (
          <TableRow key={i}>
            <TableCell className={CELL}>
              <Skeleton className="h-3 w-44" />
            </TableCell>
            <TableCell className={CELL}>
              <Skeleton className="h-[22px] w-16 rounded-full" />
            </TableCell>
            <TableCell className={CELL}>
              <Skeleton className="h-[22px] w-20 rounded-full" />
            </TableCell>
            <TableCell className={CELL}>
              <Skeleton className="h-3.5 w-20" />
            </TableCell>
            <TableCell className={CELL}>
              <Skeleton className="h-3.5 w-28" />
            </TableCell>
            <TableCell className={CELL}>
              <Skeleton className="h-3.5 w-10" />
            </TableCell>
            <TableCell className={CELL}>
              <Skeleton className="h-3.5 w-14" />
            </TableCell>
            <TableCell className={CELL}>
              <Skeleton className="h-9 w-[92px] rounded-lg" />
            </TableCell>
            <TableCell className={CELL}>
              <Skeleton className="h-9 w-[88px] rounded-lg" />
            </TableCell>
          </TableRow>
        ))}
      </TableFrame>
    </TableCard>
  );
}
