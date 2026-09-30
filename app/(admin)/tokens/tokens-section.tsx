"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Alert from "@/components/ui/alert/Alert";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal, MODAL_TRANSITION_MS } from "@/components/ui/modal";
import Skeleton from "@/components/ui/skeleton/Skeleton";
import { useToast } from "@/context/ToastContext";
import { useUser } from "@/context/UserContext";
import { CheckLineIcon, CopyIcon, PlusIcon } from "@/icons";
import { backendFetch } from "@/lib/api";
import type {
  AuthorizationToken,
  CreatedAuthorization,
  TokenScope,
} from "@/lib/types";
import TokensTable, { TokensTableSkeleton } from "./tokens-table";

const SCOPE_OPTIONS: {
  value: TokenScope;
  label: string;
  description: string;
}[] = [
  {
    value: "read",
    label: "Somente leitura",
    description: "Consulta os dados da API. É o que os clientes usam.",
  },
  {
    value: "write",
    label: "Leitura e escrita",
    description:
      "Também cadastra, atualiza e remove dados. Use só em servidores seus.",
  },
];

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Card com título e ação, usado pela seção real e pelo skeleton.
function TokensSectionFrame({
  action,
  children,
}: {
  action: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Tokens da API
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Os sistemas enviam o access token no header Authorization: Bearer.
            Ele tem validade curta e é renovado com o refresh token, e cada
            renovação estende o prazo.
          </p>
        </div>
        <div className="shrink-0">{action}</div>
      </div>
      {children}
    </section>
  );
}

export function TokensSectionSkeleton() {
  return (
    <TokensSectionFrame action={<Skeleton className="h-11 w-[134px] rounded-lg" />}>
      <TokensTableSkeleton />
    </TokensSectionFrame>
  );
}

export default function TokensSection() {
  const [tokens, setTokens] = useState<AuthorizationToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  // Ação aguardando confirmação no modal (revogar ou excluir).
  const [pendingAction, setPendingAction] = useState<PendingTokenAction | null>(
    null,
  );

  const loadTokens = useCallback(async () => {
    try {
      const res = await backendFetch("/authorizations");
      const data = await res.json();

      // Sucesso é sempre um array; erro vem como objeto com "status".
      if (Array.isArray(data)) {
        setTokens(data);
        setListError(null);
      } else {
        setListError(data?.message ?? "Não foi possível listar os tokens.");
      }
    } catch {
      setListError("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // O fetch é assíncrono, então nenhum setState acontece durante o efeito.
    // O IIFE deixa isso explícito para a regra react-hooks/set-state-in-effect.
    (async () => {
      await loadTokens();
    })();
  }, [loadTokens]);

  return (
    <TokensSectionFrame
      action={
        <Button
          size="sm"
          startIcon={<PlusIcon className="size-4" />}
          onClick={() => setOpen(true)}
        >
          Criar token
        </Button>
      }
    >
      {listError && (
        <div className="px-5 pb-5 sm:px-6">
          <Alert
            variant="error"
            title="Não foi possível listar os tokens"
            message={listError}
          />
        </div>
      )}

      {loading ? (
        <TokensTableSkeleton />
      ) : tokens.length > 0 ? (
        <TokensTable
          tokens={tokens}
          onRevoke={(token) => setPendingAction({ action: "revoke", token })}
          onDelete={(token) => setPendingAction({ action: "delete", token })}
        />
      ) : (
        !listError && (
          <div className="px-5 py-10 text-center border-t border-gray-100 dark:border-gray-800 sm:px-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nenhum token ainda. Crie o primeiro acima.
            </p>
          </div>
        )
      )}

      {/* Sempre montados: o <dialog> precisa continuar no DOM durante a animação
          de saída. Fechado, ele é `display: none` e não renderiza nada. */}
      <CreateTokenDialog
        open={open}
        onClose={() => setOpen(false)}
        onCreated={loadTokens}
      />
      <TokenActionDialog
        pending={pendingAction}
        onClose={() => setPendingAction(null)}
        onDone={loadTokens}
      />
    </TokensSectionFrame>
  );
}

function CreateTokenDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const { user } = useUser();
  // Só admin escolhe escopo; o backend recusa write para os demais de qualquer jeito.
  const isAdmin = user?.role === "admin";

  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [scope, setScope] = useState<TokenScope>("read");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Enquanto preenchido, o modal mostra os segredos em vez do formulário.
  const [created, setCreated] = useState<CreatedAuthorization | null>(null);

  // O efeito do Modal (filho) roda antes deste e já abriu o <dialog>, então o
  // campo está visível e pode receber foco.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Os segredos são descartados ao fechar, mas só depois que a caixa terminou de
  // sumir — limpar de imediato trocaria o conteúdo no meio da animação.
  useEffect(() => {
    if (open) return;

    const timer = window.setTimeout(() => {
      setCreated(null);
      setName("");
      setScope("read");
      setError(null);
    }, MODAL_TRANSITION_MS);

    return () => window.clearTimeout(timer);
  }, [open]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      const res = await backendFetch("/authorization", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim() || null,
          ...(isAdmin ? { scope } : {}),
        }),
      });
      const data = await res.json();

      if (data.status === 200) {
        setCreated(data as CreatedAuthorization);
        await onCreated();
      } else {
        setError(data.message ?? "Não foi possível criar o token.");
      }
    } catch {
      setError("Erro de conexão com o servidor.");
    } finally {
      setCreating(false);
    }
  }

  return (
    // Com o segredo na tela, clique fora não fecha: perder o valor é irreversível.
    <Modal isOpen={open} onClose={onClose} closeOnBackdrop={!created}>
      {created ? (
        <>
          <div className="mb-2 flex flex-wrap items-center gap-3 pr-12">
            <h4 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Token criado
            </h4>
            <Badge size="sm" color={created.scope === "write" ? "warning" : "light"}>
              {created.scope === "write" ? "Leitura e escrita" : "Somente leitura"}
            </Badge>
          </div>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Guarde os valores abaixo em um lugar seguro.
          </p>

          <Alert
            variant="warning"
            title="Copie agora"
            message="Ao fechar esta janela os valores não serão exibidos de novo."
          />

          <div className="mt-6 space-y-5">
            <SecretRow
              label="Access token"
              value={created.access_token}
              hint={`Envie no header Authorization: Bearer. Vale até ${formatDateTime(created.expires_at)}.`}
            />
            <SecretRow
              label="Refresh token"
              value={created.refresh_token}
              hint={`Gera um novo par em POST /refresh-token. Renove antes de ${formatDateTime(created.refresh_expires_at)}; cada renovação estende o prazo.`}
            />
          </div>

          <div className="flex items-center gap-3 mt-8 lg:justify-end">
            <Button size="sm" onClick={onClose}>
              Já copiei, fechar
            </Button>
          </div>
        </>
      ) : (
        <form onSubmit={handleCreate}>
          <h4 className="mb-2 pr-12 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Criar token da API
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Dê um nome para reconhecer onde ele é usado. O nome é opcional.
          </p>

          <div>
            <Label htmlFor="token-name">Nome</Label>
            <Input
              ref={inputRef}
              id="token-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              placeholder="ex.: integração-erp"
            />
          </div>

          {isAdmin ? (
            <fieldset className="mt-5">
              <legend className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Escopo
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {SCOPE_OPTIONS.map((option) => {
                  const selected = scope === option.value;
                  return (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                        selected
                          ? "border-brand-300 bg-brand-25 dark:border-brand-800 dark:bg-brand-500/10"
                          : "border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.03]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="token-scope"
                        value={option.value}
                        checked={selected}
                        onChange={() => setScope(option.value)}
                        className="mt-0.5 accent-brand-500"
                      />
                      <span>
                        <span className="block text-sm font-medium text-gray-800 dark:text-white/90">
                          {option.label}
                        </span>
                        <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
                          {option.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ) : (
            <p className="mt-4 text-theme-xs text-gray-500 dark:text-gray-400">
              Seus tokens têm acesso somente de leitura aos dados da API.
            </p>
          )}

          {error && (
            <div className="mt-5">
              <Alert
                variant="error"
                title="Não foi possível criar o token"
                message={error}
              />
            </div>
          )}

          <div className="flex items-center gap-3 mt-8 lg:justify-end">
            <Button size="sm" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button size="sm" type="submit" disabled={creating}>
              {creating ? "Criando..." : "Criar token"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

type TokenAction = "revoke" | "delete";

type PendingTokenAction = { action: TokenAction; token: AuthorizationToken };

const TOKEN_ACTIONS: Record<
  TokenAction,
  {
    title: string;
    // Texto depois do nome do token na frase de confirmação.
    consequence: string;
    confirmLabel: string;
    pendingLabel: string;
    successMessage: string;
    errorMessage: string;
    request: (tokenId: string) => Promise<Response>;
  }
> = {
  revoke: {
    title: "Revogar token",
    consequence:
      "deixa de funcionar na hora, inclusive nos sistemas que já o usam. Não é possível desfazer.",
    confirmLabel: "Revogar token",
    pendingLabel: "Revogando...",
    successMessage: "Token revogado.",
    errorMessage: "Não foi possível revogar o token.",
    request: (tokenId) =>
      backendFetch(`/authorization/${tokenId}/revoke`, { method: "POST" }),
  },
  delete: {
    title: "Excluir token",
    consequence:
      "sai da lista e o registro dele é apagado. Não é possível desfazer.",
    confirmLabel: "Excluir token",
    pendingLabel: "Excluindo...",
    successMessage: "Token excluído.",
    errorMessage: "Não foi possível excluir o token.",
    request: (tokenId) =>
      backendFetch(`/authorization/${tokenId}`, { method: "DELETE" }),
  },
};

// Confirmação das ações destrutivas sobre um token (revogar ou excluir).
function TokenActionDialog({
  pending,
  onClose,
  onDone,
}: {
  pending: PendingTokenAction | null;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  // Guarda a última ação para o texto não sumir durante a animação de saída
  // (o pai zera `pending` assim que o modal começa a fechar).
  const [shown, setShown] = useState<PendingTokenAction | null>(pending);
  if (pending && pending !== shown) {
    setShown(pending);
  }

  const config = TOKEN_ACTIONS[shown?.action ?? "revoke"];

  async function handleConfirm() {
    if (!shown) return;
    setSubmitting(true);

    try {
      const res = await config.request(shown.token.id);
      const data = await res.json();

      if (data.status === 200) {
        toast.success(config.successMessage);
        onClose();
        await onDone();
      } else {
        toast.error(data.message ?? config.errorMessage);
      }
    } catch {
      toast.error("Erro de conexão com o servidor.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={pending !== null} onClose={onClose}>
      <h4 className="mb-2 pr-12 text-2xl font-semibold text-gray-800 dark:text-white/90">
        {config.title}
      </h4>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        O token{" "}
        <span className="font-medium text-gray-800 dark:text-white/90">
          {shown?.token.name ?? "Sem nome"}
        </span>{" "}
        {config.consequence}
      </p>

      <div className="flex items-center gap-3 mt-8 lg:justify-end">
        <Button size="sm" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={handleConfirm}
          disabled={submitting}
        >
          {submitting ? config.pendingLabel : config.confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

function SecretRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copiado.`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard negado (permissão, contexto sem HTTPS): o valor segue visível.
      toast.error("Não foi possível copiar. Selecione o valor e copie manualmente.");
    }
  }

  return (
    <div>
      <p className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <code className="block h-11 min-w-0 flex-1 truncate rounded-lg border border-gray-300 bg-gray-50 px-4 font-mono text-theme-xs leading-[42px] text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90">
          {value}
        </code>
        <Button
          size="sm"
          variant="outline"
          onClick={copy}
          className="shrink-0"
          startIcon={
            copied ? <CheckLineIcon /> : <CopyIcon className="size-4" />
          }
        >
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
      <p className="mt-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
        {hint}
      </p>
    </div>
  );
}
