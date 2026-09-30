import type { ReactNode } from "react";
import UserAvatar from "@/components/ui/avatar/UserAvatar";
import Badge from "@/components/ui/badge/Badge";
import Skeleton from "@/components/ui/skeleton/Skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ManagedUser } from "@/lib/types";

const COLUMNS = ["Usuário", "Perfil", "Situação", "Tokens", "Criado em", "Ações"];

const HEAD_CELL =
  "px-5 py-3 font-medium text-gray-500 text-start text-theme-xs whitespace-nowrap dark:text-gray-400 sm:px-6";
const CELL = "px-5 py-4 text-start whitespace-nowrap sm:px-6";
const MUTED_CELL = `${CELL} text-theme-sm text-gray-500 dark:text-gray-400`;

const ACTION_BUTTON =
  "inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200";
const DANGER_BUTTON =
  "inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-xs font-medium text-error-600 shadow-theme-xs hover:bg-error-50 dark:border-gray-700 dark:bg-gray-800 dark:text-error-500 dark:hover:bg-error-500/15";

// Cabeçalho compartilhado entre a tabela real e o skeleton.
function UsersTableFrame({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-full overflow-x-auto custom-scrollbar">
      <Table className="min-w-[860px]">
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

export default function UsersTable({
  users,
  currentUserId,
  onEdit,
  onDelete,
}: {
  users: ManagedUser[];
  currentUserId: string;
  onEdit: (user: ManagedUser) => void;
  onDelete: (user: ManagedUser) => void;
}) {
  return (
    <UsersTableFrame>
      {users.map((user) => {
        const isSelf = user.id === currentUserId;

        return (
          <TableRow key={user.id}>
            <TableCell className={CELL}>
              <div className="flex items-center gap-3">
                <UserAvatar user={user} className="h-10 w-10 text-sm" />
                <div className="min-w-0">
                  <span className="flex items-center gap-2 font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {user.firstName} {user.lastName}
                    {isSelf && (
                      <Badge size="sm" color="primary">
                        Você
                      </Badge>
                    )}
                  </span>
                  <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                    {user.email}
                  </span>
                </div>
              </div>
            </TableCell>
            <TableCell className={CELL}>
              <Badge size="sm" color={user.role === "admin" ? "primary" : "light"}>
                {user.role === "admin" ? "Administrador" : "Cliente"}
              </Badge>
            </TableCell>
            <TableCell className={CELL}>
              <Badge size="sm" color={user.isBlocked ? "error" : "success"}>
                {user.isBlocked ? "Bloqueado" : "Ativo"}
              </Badge>
            </TableCell>
            <TableCell className={MUTED_CELL}>{user.tokens}</TableCell>
            <TableCell className={MUTED_CELL}>
              {new Date(user.createdAt).toLocaleDateString("pt-BR")}
            </TableCell>
            <TableCell className={CELL}>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(user)}
                  className={ACTION_BUTTON}
                >
                  Editar
                </button>
                {/* A própria conta não se exclui (a API também recusa). */}
                {!isSelf && (
                  <button
                    type="button"
                    onClick={() => onDelete(user)}
                    className={DANGER_BUTTON}
                  >
                    Excluir
                  </button>
                )}
              </div>
            </TableCell>
          </TableRow>
        );
      })}
    </UsersTableFrame>
  );
}

export function UsersTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <UsersTableFrame>
      {Array.from({ length: rows }, (_, i) => (
        <TableRow key={i}>
          <TableCell className={CELL}>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div>
                <div className="flex h-5 items-center">
                  <Skeleton className="h-3.5 w-36" />
                </div>
                <div className="flex h-[18px] items-center">
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            </div>
          </TableCell>
          <TableCell className={CELL}>
            <Skeleton className="h-[22px] w-24 rounded-full" />
          </TableCell>
          <TableCell className={CELL}>
            <Skeleton className="h-[22px] w-16 rounded-full" />
          </TableCell>
          <TableCell className={CELL}>
            <Skeleton className="h-3.5 w-6" />
          </TableCell>
          <TableCell className={CELL}>
            <Skeleton className="h-3.5 w-20" />
          </TableCell>
          <TableCell className={CELL}>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-[62px] rounded-lg" />
              <Skeleton className="h-9 w-[66px] rounded-lg" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </UsersTableFrame>
  );
}
