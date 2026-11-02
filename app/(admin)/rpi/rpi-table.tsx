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
import { DocsIcon, TimeIcon } from "@/icons";
import {
  formatBytes,
  RPI_SECOES_PDF,
  rotuloArquivo,
  rpiDownloadPath,
  secaoComFalha,
  secaoEmEnvio,
} from "@/lib/rpi";
import type { RpiArquivo, RpiSecao } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/updates";

const COLUMNS = [
  "Número da revista",
  "Arquivos da seção",
  // Envio ao bucket vem antes da carga na base, por isso fica à esquerda da Situação.
  "Download",
  "Situação",
  "Atualização no INPI",
  "Verificado em",
  "",
];

const HEAD_CELL =
  "px-5 py-3 font-medium text-gray-500 text-start text-theme-xs whitespace-nowrap dark:text-gray-400";
const CELL = "px-5 py-4 text-start whitespace-nowrap";
const MUTED_CELL = `${CELL} text-theme-sm text-gray-500 dark:text-gray-400`;
const FILE_LINK =
  "inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-theme-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200";
const FILE_UNAVAILABLE =
  "inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-2.5 py-1.5 text-theme-xs font-medium text-gray-400 dark:border-gray-700 dark:text-gray-500";
// Revisão das seções em PDF: neutro quando não há pendência, em destaque com alerta.
const NEUTRAL_BUTTON =
  "inline-flex items-center whitespace-nowrap rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]";
const WARNING_BUTTON =
  "inline-flex items-center whitespace-nowrap rounded-lg border border-warning-300 bg-warning-25 px-3 py-2 text-theme-xs font-medium text-warning-700 shadow-theme-xs hover:bg-warning-50 dark:border-warning-500/40 dark:bg-warning-500/[0.08] dark:text-warning-400 dark:hover:bg-warning-500/15";
const DANGER_BUTTON =
  "inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-xs font-medium text-error-600 shadow-theme-xs hover:bg-error-50 dark:border-gray-700 dark:bg-gray-800 dark:text-error-500 dark:hover:bg-error-500/15";

function TableCard({
  title,
  description,
  aside,
  children,
}: {
  title: ReactNode;
  description: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-3 px-5 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {title}
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
      <Table className="min-w-[1000px]">
        <TableHeader className="border-y border-gray-100 dark:border-gray-800">
          <TableRow>
            {COLUMNS.map((column, i) => (
              <TableCell key={i} isHeader className={HEAD_CELL}>
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

export default function RpiTable({
  title,
  rows,
  emEnvio,
  onDelete,
  onRevisar,
}: {
  title: string;
  rows: RpiSecao[];
  emEnvio: boolean;
  onDelete: (secao: RpiSecao) => void;
  onRevisar: (secao: RpiSecao) => void;
}) {
  const foraDoBucket = rows.filter((row) => !row.download_status).length;

  return (
    <TableCard
      title={title}
      description={
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {rows.length === 0 ? (
            "Nenhuma edição registrada nesta seção."
          ) : foraDoBucket === 0 ? (
            <>
              <span className="font-medium text-success-600 dark:text-success-500">
                Arquivos salvos
              </span>{" "}
              — {rows.length} {rows.length === 1 ? "edição" : "edições"} com
              todos os arquivos no bucket.
            </>
          ) : (
            <>
              <span className="font-medium text-warning-600 dark:text-orange-400">
                {foraDoBucket} {foraDoBucket === 1 ? "edição" : "edições"} com
                arquivos fora do bucket
              </span>{" "}
              de {rows.length}.
            </>
          )}
        </p>
      }
      aside={
        emEnvio && (
          <p className="flex items-center gap-1.5 text-theme-xs text-gray-500 whitespace-nowrap dark:text-gray-400">
            <TimeIcon className="size-4" />
            Envio em andamento — atualizando sozinha
          </p>
        )
      }
    >
      {rows.length > 0 && (
        <TableFrame>
          {rows.map((row) => (
            <Row key={row.id} row={row} onDelete={onDelete} onRevisar={onRevisar} />
          ))}
        </TableFrame>
      )}
    </TableCard>
  );
}

function Row({
  row,
  onDelete,
  onRevisar,
}: {
  row: RpiSecao;
  onDelete: (secao: RpiSecao) => void;
  onRevisar: (secao: RpiSecao) => void;
}) {
  // Seções em PDF carregadas têm revisão no painel (alertas e conferidos).
  const revisavel = row.update_status && RPI_SECOES_PDF.has(row.secao);
  // Com a carga feita, o aviso (alertas, "sem publicação") fica no popup de
  // revisão; aqui só o botão muda de cor.
  const comAlerta = Boolean(row.status_detail?.includes("com alerta para conferir"));

  return (
    <TableRow
      className={
        row.download_status
          ? ""
          : "bg-warning-25 shadow-[inset_3px_0_0_0_var(--color-warning-500)] dark:bg-warning-500/[0.04]"
      }
    >
      <TableCell
        className={`${CELL} font-mono text-theme-sm font-medium text-gray-800 dark:text-white/90`}
      >
        {row.numero_rpi}
      </TableCell>
      <TableCell className={CELL}>
        <div className="flex flex-wrap items-center gap-2">
          {row.arquivos.length === 0 ? (
            <span className="text-theme-xs text-gray-400">nenhum arquivo</span>
          ) : (
            row.arquivos.map((arquivo) => (
              <FileChip
                key={arquivo.id}
                arquivo={arquivo}
                rotulo={rotuloArquivo(row.secao, arquivo)}
              />
            ))
          )}
        </div>
      </TableCell>
      <TableCell className={CELL}>
        <DownloadBadge row={row} />
      </TableCell>
      <TableCell className={CELL}>
        {row.update_status ? (
          <div className="flex flex-col gap-1">
            <Badge size="sm" color="success">
              Na base
            </Badge>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <Badge
              size="sm"
              color="warning"
              title={
                row.status_detail ??
                "Os dados destes arquivos ainda não foram gravados na base"
              }
            >
              Aguardando
            </Badge>
            {row.status_detail && (
              <span className="max-w-[220px] text-theme-xs leading-tight text-warning-700 dark:text-warning-400">
                {row.status_detail}
              </span>
            )}
          </div>
        )}
      </TableCell>
      <TableCell className={MUTED_CELL}>
        {formatDate(row.data_publicacao)}
      </TableCell>
      <TableCell className={MUTED_CELL}>
        {formatDateTime(row.verificado_em)}
      </TableCell>
      <TableCell className={`${CELL} text-end`}>
        <div className="flex items-center justify-end gap-2">
          {revisavel && (
            <button
              type="button"
              onClick={() => onRevisar(row)}
              className={comAlerta ? WARNING_BUTTON : NEUTRAL_BUTTON}
              aria-label={`Revisar a RPI ${row.numero_rpi} desta seção`}
            >
              {comAlerta ? "Revisar alertas" : "Ver conferidos"}
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(row)}
            className={DANGER_BUTTON}
            aria-label={`Excluir os arquivos da RPI ${row.numero_rpi} desta seção`}
          >
            Excluir
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function FileChip({
  arquivo,
  rotulo,
}: {
  arquivo: RpiArquivo;
  rotulo: string;
}) {
  const tamanho = formatBytes(arquivo.bytes);

  if (!arquivo.in_bucket) {
    return (
      <span
        className={FILE_UNAVAILABLE}
        title={`${arquivo.nome_arquivo} — ${arquivo.status_detail ?? "ainda não está no bucket"}`}
      >
        <DocsIcon className="size-4" />
        {rotulo}
      </span>
    );
  }

  return (
    <a
      href={rpiDownloadPath(arquivo)}
      title={tamanho ? `${arquivo.nome_arquivo} (${tamanho})` : arquivo.nome_arquivo}
      aria-label={`Baixar ${arquivo.nome_arquivo}`}
      className={FILE_LINK}
    >
      <DocsIcon className="size-4" />
      {rotulo}
    </a>
  );
}

function DownloadBadge({ row }: { row: RpiSecao }) {
  if (row.download_status) {
    return (
      <Badge size="sm" color="info" title="Todos os arquivos estão no bucket">
        No bucket
      </Badge>
    );
  }

  if (secaoComFalha(row)) {
    const falhas = row.arquivos.filter((a) => !a.download_status && a.status_detail);
    return (
      <div className="flex flex-col gap-1">
        <Badge size="sm" color="error" title={falhas[0].status_detail ?? undefined}>
          Falhou
        </Badge>
        <span className="max-w-[220px] text-theme-xs leading-tight text-error-600 dark:text-error-500">
          {falhas.length} {falhas.length === 1 ? "arquivo" : "arquivos"} — passe
          o mouse no arquivo para ver o motivo
        </span>
      </div>
    );
  }

  return (
    <Badge
      size="sm"
      color="light"
      title={
        secaoEmEnvio(row)
          ? "Os arquivos estão sendo baixados do INPI e enviados ao bucket"
          : "Os arquivos ainda não foram enviados ao bucket"
      }
    >
      Pendente
    </Badge>
  );
}

export function RpiTableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <TableCard
      title={<Skeleton className="h-5 w-56" />}
      description={
        <div className="mt-1 flex h-5 items-center">
          <Skeleton className="h-3.5 w-72 max-w-full" />
        </div>
      }
    >
      <TableFrame>
        {Array.from({ length: rows }, (_, i) => (
          <TableRow key={i}>
            <TableCell className={CELL}>
              <Skeleton className="h-3.5 w-12" />
            </TableCell>
            <TableCell className={CELL}>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16 rounded-lg" />
                <Skeleton className="h-8 w-16 rounded-lg" />
              </div>
            </TableCell>
            <TableCell className={CELL}>
              <Skeleton className="h-[22px] w-20 rounded-full" />
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
              <Skeleton className="ml-auto h-9 w-[72px] rounded-lg" />
            </TableCell>
          </TableRow>
        ))}
      </TableFrame>
    </TableCard>
  );
}
