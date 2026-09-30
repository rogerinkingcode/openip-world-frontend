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
import { PlugInIcon } from "@/icons";
import type { AuthorizationToken } from "@/lib/types";

const COLUMNS = [
  "Nome",
  "Escopo",
  "Refresh token",
  "Criado em",
  "Renovação até",
  "Situação",
  "Ações",
];

const HEAD_CELL =
  "px-5 py-3 font-medium text-gray-500 text-start text-theme-xs whitespace-nowrap dark:text-gray-400 sm:px-6";
const CELL = "px-5 py-4 text-start whitespace-nowrap sm:px-6";
const MUTED_CELL = `${CELL} text-theme-sm text-gray-500 dark:text-gray-400`;

// Ações destrutivas da linha (revogar, excluir).
const DANGER_BUTTON =
  "inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-xs font-medium text-error-600 shadow-theme-xs hover:bg-error-50 dark:border-gray-700 dark:bg-gray-800 dark:text-error-500 dark:hover:bg-error-500/15";

type TokenStatus = "active" | "expired" | "revoked" | "compromised";

// "Expirado" é quando o prazo de renovação passou: o access token vencer sozinho
// é normal, o sistema do cliente renova com o refresh token.
function getStatus(token: AuthorizationToken): TokenStatus {
  if (token.revokedAt) {
    return token.revokedReason === "refresh_token_reuse" ? "compromised" : "revoked";
  }
  if (new Date(token.refreshExpiresAt).getTime() < Date.now()) return "expired";
  return "active";
}

const STATUS_BADGE: Record<
  TokenStatus,
  { label: string; color: "success" | "light" | "error"; title?: string }
> = {
  active: { label: "Ativo", color: "success" },
  expired: { label: "Expirado", color: "light" },
  revoked: { label: "Revogado", color: "error" },
  compromised: {
    label: "Revogado por segurança",
    color: "error",
    title:
      "Um refresh token já usado foi apresentado de novo, sinal de que o valor vazou. Gere um token novo.",
  },
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

// Cabeçalho compartilhado entre a tabela real e o skeleton.
function TokensTableFrame({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-full overflow-x-auto custom-scrollbar">
      <Table className="min-w-[880px]">
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

export default function TokensTable({
  tokens,
  onRevoke,
  onDelete,
}: {
  tokens: AuthorizationToken[];
  onRevoke: (token: AuthorizationToken) => void;
  onDelete: (token: AuthorizationToken) => void;
}) {
  return (
    <TokensTableFrame>
      {tokens.map((token) => {
        const status = getStatus(token);
        const badge = STATUS_BADGE[status];

        return (
          <TableRow key={token.id}>
            <TableCell className={CELL}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
                  <PlugInIcon className="size-5" />
                </span>
                <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                  {token.name ?? "Sem nome"}
                </span>
              </div>
            </TableCell>
            <TableCell className={CELL}>
              {token.scope === "write" ? (
                <Badge size="sm" color="warning">
                  Leitura e escrita
                </Badge>
              ) : (
                <Badge size="sm" color="light">
                  Somente leitura
                </Badge>
              )}
            </TableCell>
            <TableCell
              className={`${CELL} font-mono text-theme-xs text-gray-500 dark:text-gray-400`}
            >
              …{token.refreshTokenHint}
            </TableCell>
            <TableCell className={MUTED_CELL}>
              {formatDate(token.createdAt)}
            </TableCell>
            <TableCell className={MUTED_CELL}>
              {token.revokedAt ? "—" : formatDate(token.refreshExpiresAt)}
            </TableCell>
            <TableCell className={CELL}>
              <Badge size="sm" color={badge.color} title={badge.title}>
                {badge.label}
              </Badge>
            </TableCell>
            <TableCell className={CELL}>
              {/* Ativo só revoga (excluir um token em uso não faz sentido); revogado
                  só exclui. Expirado não tem ação. */}
              {status === "active" ? (
                <button
                  type="button"
                  onClick={() => onRevoke(token)}
                  className={DANGER_BUTTON}
                >
                  Revogar
                </button>
              ) : token.revokedAt ? (
                <button
                  type="button"
                  onClick={() => onDelete(token)}
                  className={DANGER_BUTTON}
                >
                  Excluir
                </button>
              ) : (
                <span className="text-theme-xs text-gray-400">—</span>
              )}
            </TableCell>
          </TableRow>
        );
      })}
    </TokensTableFrame>
  );
}

export function TokensTableSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <TokensTableFrame>
      {Array.from({ length: rows }, (_, i) => (
        <TableRow key={i}>
          <TableCell className={CELL}>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="flex h-5 items-center">
                <Skeleton className="h-3.5 w-32" />
              </div>
            </div>
          </TableCell>
          <TableCell className={CELL}>
            <Skeleton className="h-[22px] w-28 rounded-full" />
          </TableCell>
          <TableCell className={CELL}>
            <Skeleton className="h-3 w-12" />
          </TableCell>
          <TableCell className={CELL}>
            <Skeleton className="h-3.5 w-20" />
          </TableCell>
          <TableCell className={CELL}>
            <Skeleton className="h-3.5 w-20" />
          </TableCell>
          <TableCell className={CELL}>
            <Skeleton className="h-[22px] w-14 rounded-full" />
          </TableCell>
          <TableCell className={CELL}>
            <Skeleton className="h-9 w-[76px] rounded-lg" />
          </TableCell>
        </TableRow>
      ))}
    </TokensTableFrame>
  );
}
