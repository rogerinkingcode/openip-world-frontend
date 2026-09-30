import type { ReactNode } from "react";
import { AlertIcon, CheckCircleIcon, CloseIcon, InfoIcon } from "@/icons";

export type ToastVariant = "success" | "error" | "warning" | "info";

export type ToastItem = {
  id: number;
  variant: ToastVariant;
  message: string;
  title?: string;
  // true durante a animação de saída, antes de sair da lista.
  leaving: boolean;
};

// Deve acompanhar a duração de toast-out no globals.css.
export const TOAST_EXIT_MS = 200;

const icons: Record<ToastVariant, ReactNode> = {
  success: <CheckCircleIcon className="size-5 text-success-500" />,
  error: <InfoIcon className="size-5 rotate-180 text-error-500" />,
  warning: <AlertIcon className="size-5 text-warning-500" />,
  info: <InfoIcon className="size-5 text-blue-light-500" />,
};

export default function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      // Erro interrompe o leitor de tela; o resto é anunciado sem pressa.
      role={toast.variant === "error" ? "alert" : "status"}
      data-leaving={toast.leaving}
      className="toast flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
    >
      <span className="shrink-0">{icons[toast.variant]}</span>

      <div className="min-w-0 flex-1">
        {toast.title && (
          <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {toast.title}
          </p>
        )}
        <p className="text-gray-600 break-words text-theme-sm dark:text-gray-400">
          {toast.message}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Fechar notificação"
        className="-m-1 flex size-6 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-300"
      >
        <CloseIcon className="size-4" />
      </button>
    </div>
  );
}
