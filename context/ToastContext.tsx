"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Toast, {
  TOAST_EXIT_MS,
  type ToastItem,
  type ToastVariant,
} from "@/components/ui/toast/Toast";

type ToastOptions = {
  title?: string;
  // Tempo na tela em ms antes de sumir sozinho.
  duration?: number;
};

type ToastApi = Record<
  ToastVariant,
  (message: string, options?: ToastOptions) => number
> & {
  dismiss: (id: number) => void;
};

const DEFAULT_DURATION_MS = 4000;
// Discreto: além disso o mais antigo sai para dar lugar ao novo.
const MAX_TOASTS = 3;

const ToastContext = createContext<ToastApi | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, number>());
  const regionRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(0);

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }

    // Marca para a animação de saída e só remove quando ela termina.
    setToasts((prev) =>
      prev.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)),
    );
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, TOAST_EXIT_MS);
  }, []);

  const show = useCallback(
    (variant: ToastVariant, message: string, options?: ToastOptions) => {
      const id = ++nextId.current;

      setToasts((prev) => [
        ...prev.slice(-(MAX_TOASTS - 1)),
        { id, variant, message, title: options?.title, leaving: false },
      ]);
      timers.current.set(
        id,
        window.setTimeout(
          () => dismiss(id),
          options?.duration ?? DEFAULT_DURATION_MS,
        ),
      );

      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  // A região é um popover "manual" para entrar no top layer e ficar por cima de
  // um <dialog> modal (ex.: o de criar token). O top layer empilha por ordem de
  // abertura, então, se um modal abriu depois, fechar e reabrir a região a
  // traz de volta para o topo.
  useEffect(() => {
    const region = regionRef.current;
    const count = toasts.length;
    const added = count > prevCount.current;
    prevCount.current = count;

    // Sem suporte a popover a região é só um bloco fixo comum, já visível.
    if (!region || typeof region.showPopover !== "function") return;

    const isOpen = region.matches(":popover-open");
    if (count === 0) {
      if (isOpen) region.hidePopover();
    } else if (!isOpen) {
      region.showPopover();
    } else if (added && document.querySelector("dialog:modal")) {
      region.hidePopover();
      region.showPopover();
    }
  }, [toasts.length]);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message, options) => show("success", message, options),
      error: (message, options) => show("error", message, options),
      warning: (message, options) => show("warning", message, options),
      info: (message, options) => show("info", message, options),
      dismiss,
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        ref={regionRef}
        popover="manual"
        aria-live="polite"
        aria-label="Notificações"
        className="toast-region"
      >
        {/* O display fica no filho: na própria região ele sobrescreveria o
            display:none que o navegador aplica ao popover fechado. */}
        <div className="flex flex-col gap-2">
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
