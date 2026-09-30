"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Select from "@/components/form/Select";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Pagination from "@/components/ui/pagination/Pagination";
import Skeleton from "@/components/ui/skeleton/Skeleton";
import { useUser } from "@/context/UserContext";
import { PlusIcon, SearchIcon } from "@/icons";
import { backendFetch } from "@/lib/api";
import type { ManagedUser, UsersPage } from "@/lib/types";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import DeleteUserDialog from "./delete-user-dialog";
import UserFormDialog from "./user-form-dialog";
import UsersTable, { UsersTableSkeleton } from "./users-table";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

const ROLE_FILTERS = [
  { value: "all", label: "Todos os perfis" },
  { value: "user", label: "Clientes" },
  { value: "admin", label: "Administradores" },
];

const STATUS_FILTERS = [
  { value: "all", label: "Todas as situações" },
  { value: "active", label: "Ativos" },
  { value: "blocked", label: "Bloqueados" },
];

const CARD_CLASS =
  "overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]";
const FILTERS_CLASS =
  "flex flex-col gap-3 border-t border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6 lg:flex-row";

function CardHeader({ action }: { action: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Usuários
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Crie e gerencie os logins dos clientes. Bloquear ou excluir corta o
          acesso ao painel e à API na hora.
        </p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

export function UsersSkeleton() {
  return (
    <div role="status" aria-label="Carregando usuários" className={CARD_CLASS}>
      <CardHeader action={<Skeleton className="h-11 w-[152px] rounded-lg" />} />
      <div className={FILTERS_CLASS}>
        <Skeleton className="h-11 flex-1 rounded-lg" />
        <Skeleton className="h-11 rounded-lg lg:w-52" />
        <Skeleton className="h-11 rounded-lg lg:w-52" />
      </div>
      <UsersTableSkeleton />
    </div>
  );
}

// A página é só de admin. Esconder no menu é conforto; quem garante é a API, que
// recusa não-admin mesmo que alguém digite a URL.
export default function UsersView() {
  const { user, error } = useUser();

  if (!user && !error) return <UsersSkeleton />;

  if (user?.role !== "admin") {
    return (
      <Alert
        variant="error"
        title="Acesso restrito"
        message="Esta página é exclusiva para administradores."
      />
    );
  }

  return <UsersManager currentUserId={user.id} />;
}

type LoadResult = {
  key: string;
  data: UsersPage | null;
  error: string | null;
};

function UsersManager({ currentUserId }: { currentUserId: string }) {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [reloadCount, setReloadCount] = useState(0);
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);

  // Formulário: `formKey` muda a cada abertura e remonta o modal com os dados do
  // usuário escolhido; fechar mantém a instância para a animação de saída.
  const [formKey, setFormKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [formUser, setFormUser] = useState<ManagedUser | null>(null);
  const [deleting, setDeleting] = useState<ManagedUser | null>(null);

  const queryKey = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (role !== "all") params.set("role", role);
    if (status !== "all") params.set("status", status);
    return `${params.toString()}#${reloadCount}`;
  }, [debouncedSearch, role, status, page, reloadCount]);

  const [result, setResult] = useState<LoadResult | null>(null);

  useEffect(() => {
    let active = true;
    const [query] = queryKey.split("#");

    (async () => {
      try {
        const res = await backendFetch(`/users?${query}`);
        const body = await res.json();
        if (!active) return;

        if (body?.status !== 200) {
          setResult({
            key: queryKey,
            data: null,
            error: body?.message ?? "Não foi possível carregar os usuários.",
          });
          return;
        }
        setResult({ key: queryKey, data: body as UsersPage, error: null });
      } catch {
        if (active) {
          setResult({
            key: queryKey,
            data: null,
            error: "Erro de conexão com o servidor.",
          });
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [queryKey]);

  const data = result?.data ?? null;
  // Enquanto a consulta nova não chega, a lista anterior fica na tela esmaecida,
  // em vez de piscar o skeleton a cada tecla.
  const refreshing = result !== null && result.key !== queryKey;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  // Excluir o último usuário da última página deixa a página vazia: volta para a
  // última que ainda tem gente (ajuste durante o render, sem efeito).
  if (!refreshing && data && data.items.length === 0 && data.total > 0 && page > totalPages) {
    setPage(totalPages);
  }

  const hasFilters = Boolean(debouncedSearch) || role !== "all" || status !== "all";
  const reload = async () => setReloadCount((count) => count + 1);

  function openForm(user: ManagedUser | null) {
    setFormKey((key) => key + 1);
    setFormUser(user);
    setFormOpen(true);
  }

  return (
    <div className={CARD_CLASS}>
      <CardHeader
        action={
          <Button
            size="sm"
            startIcon={<PlusIcon className="size-4" />}
            onClick={() => openForm(null)}
          >
            Novo usuário
          </Button>
        }
      />

      <div className={FILTERS_CLASS}>
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-gray-500 dark:text-gray-400">
            <SearchIcon />
          </span>
          <Input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nome ou e-mail"
            aria-label="Buscar usuários"
            className="pl-12"
          />
        </div>
        <Select
          aria-label="Filtrar por perfil"
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          options={ROLE_FILTERS}
          className="lg:w-52"
        />
        <Select
          aria-label="Filtrar por situação"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          options={STATUS_FILTERS}
          className="lg:w-52"
        />
      </div>

      {result?.error && (
        <div className="px-5 pb-5 sm:px-6">
          <Alert
            variant="error"
            title="Não foi possível carregar os usuários"
            message={result.error}
          />
        </div>
      )}

      {result === null ? (
        <UsersTableSkeleton />
      ) : data && data.items.length > 0 ? (
        <div
          aria-busy={refreshing}
          className={`transition-opacity ${refreshing ? "opacity-60" : ""}`}
        >
          <UsersTable
            users={data.items}
            currentUserId={currentUserId}
            onEdit={(user) => openForm(user)}
            onDelete={setDeleting}
          />
        </div>
      ) : (
        !result.error && (
          <div className="border-t border-gray-100 px-5 py-12 text-center dark:border-gray-800 sm:px-6">
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              Nenhum usuário encontrado
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {hasFilters
                ? "Ajuste a busca ou os filtros."
                : "Crie o primeiro login de cliente."}
            </p>
          </div>
        )
      )}

      {data && data.total > 0 && (
        <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-theme-sm text-gray-500 dark:text-gray-400">
            Mostrando {(data.page - 1) * data.pageSize + 1}–
            {Math.min(data.page * data.pageSize, data.total)} de {data.total}
          </p>
          {totalPages > 1 && (
            <Pagination
              page={data.page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          )}
        </div>
      )}

      <UserFormDialog
        key={formKey}
        open={formOpen}
        initialUser={formUser}
        currentUserId={currentUserId}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
      />
      <DeleteUserDialog
        user={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={reload}
      />
    </div>
  );
}
