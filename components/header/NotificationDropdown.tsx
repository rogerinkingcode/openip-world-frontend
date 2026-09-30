"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import {
  AlertIcon,
  BellIcon,
  CheckCircleIcon,
  CloseIcon,
  DownloadIcon,
  TimeIcon,
} from "@/icons";
import { backendFetch } from "@/lib/api";
import type { UpdateRecord, UpdatesOverview } from "@/lib/types";
import { UPDATE_GROUPS, formatDate, formatSourceLabel } from "@/lib/updates";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import Skeleton from "../ui/skeleton/Skeleton";

// As notificações de admin são os arquivos do INPI ainda pendentes na nossa base:
// é o evento do sistema que pede atenção de quem acompanha o painel. Cliente não
// recebe esse tipo (nem acessa /updates), então para ele a caixa fica vazia.
export default function NotificationDropdown() {
  const { user, error: userError } = useUser();
  const isAdmin = user?.role === "admin";
  const [isOpen, setIsOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const [pending, setPending] = useState<UpdateRecord[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;

    (async () => {
      try {
        const res = await backendFetch("/list-all-updates");
        const body = await res.json();
        if (!active) return;

        if (body?.status && body.status !== 200) {
          setFailed(true);
          return;
        }
        const overview = body as UpdatesOverview;
        setPending(
          UPDATE_GROUPS.flatMap((group) => overview[group.key] ?? []).filter(
            (row) => !row.update_status,
          ),
        );
      } catch {
        if (active) setFailed(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [isAdmin]);

  const userLoading = !user && !userError;
  const loading = userLoading || (isAdmin && pending === null && !failed);
  const notifying = !seen && (pending?.length ?? 0) > 0;

  function closeDropdown() {
    setIsOpen(false);
  }

  function handleClick() {
    setIsOpen((prev) => !prev);
    setSeen(true);
  }

  return (
    // Abaixo de lg o wrapper não é "relative": a caixa se posiciona pelo header
    // (sticky) e ocupa a largura da tela. Presa ao sino, que fica à esquerda no
    // mobile, ela vazava pela lateral. No desktop volta a alinhar com o sino.
    <div className="lg:relative">
      <button
        type="button"
        onClick={handleClick}
        aria-label="Notificações"
        aria-expanded={isOpen}
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
      >
        <span
          className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${
            notifying ? "flex" : "hidden"
          }`}
        >
          <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping" />
        </span>
        <BellIcon />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute left-4 right-4 mt-[17px] flex h-[480px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:left-5 sm:right-auto sm:w-[361px] lg:left-auto lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notificações
          </h5>
          <button
            type="button"
            onClick={closeDropdown}
            aria-label="Fechar notificações"
            className="text-gray-500 transition dropdown-toggle dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <CloseIcon />
          </button>
        </div>

        {loading ? (
          <ul role="status" aria-label="Carregando notificações" className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
            {Array.from({ length: 4 }, (_, i) => (
              <li key={i}>
                <NotificationItemSkeleton />
              </li>
            ))}
          </ul>
        ) : failed || userError ? (
          <EmptyState
            icon={<AlertIcon />}
            tone="error"
            title="Não foi possível carregar"
            description="Tente novamente em instantes."
          />
        ) : !isAdmin ? (
          <EmptyState
            icon={<BellIcon />}
            tone="neutral"
            title="Nenhuma notificação"
            description="Você não tem notificações no momento."
          />
        ) : pending && pending.length > 0 ? (
          <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
            {pending.map((row) => (
              <li key={row.id}>
                <DropdownItem
                  tag="a"
                  href="/updates"
                  onItemClick={closeDropdown}
                  baseClassName=""
                  className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
                >
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400">
                    {row.download_status ? (
                      <DownloadIcon className="size-5" />
                    ) : (
                      <TimeIcon />
                    )}
                    <span
                      className={`absolute bottom-0 right-0 z-10 h-2.5 w-2.5 rounded-full border-[1.5px] border-white dark:border-gray-900 ${
                        row.download_status ? "bg-blue-light-500" : "bg-warning-500"
                      }`}
                    />
                  </span>

                  <span className="block">
                    <span className="mb-1.5 space-x-1 block text-theme-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {row.table}
                      </span>
                      <span>
                        {row.download_status
                          ? "já baixado, aguardando carga na base"
                          : "aguardando download do INPI"}
                      </span>
                    </span>

                    <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                      <span>{formatSourceLabel(row.source)}</span>
                      <span className="w-1 h-1 bg-gray-400 rounded-full" />
                      <span>INPI em {formatDate(row.date_update)}</span>
                    </span>
                  </span>
                </DropdownItem>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<CheckCircleIcon />}
            tone="success"
            title="Tudo em dia"
            description="Todos os arquivos do INPI já estão na nossa base."
          />
        )}
      </Dropdown>
    </div>
  );
}

const EMPTY_STATE_TONES = {
  success:
    "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
  error: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
  neutral: "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400",
};

function EmptyState({
  icon,
  tone,
  title,
  description,
}: {
  icon: React.ReactNode;
  tone: "success" | "error" | "neutral";
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <span
        className={`mb-1 flex h-12 w-12 items-center justify-center rounded-full ${EMPTY_STATE_TONES[tone]}`}
      >
        {icon}
      </span>
      <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
        {title}
      </p>
      <p className="text-gray-500 text-theme-xs dark:text-gray-400">
        {description}
      </p>
    </div>
  );
}

function NotificationItemSkeleton() {
  return (
    <div className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 dark:border-gray-800">
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="flex-1">
        <div className="mb-1.5 flex h-5 items-center">
          <Skeleton className="h-3.5 w-full" />
        </div>
        <div className="flex h-[18px] items-center">
          <Skeleton className="h-3 w-36" />
        </div>
      </div>
    </div>
  );
}
