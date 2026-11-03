"use client";

import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertIcon } from "@/icons";

const TONS = {
  warning: "text-warning-500 hover:text-warning-600 dark:text-orange-400",
  error: "text-error-500 hover:text-error-600 dark:text-error-500",
} as const;

const LARGURA_DICA = 288;

/**
 * Ícone de atenção pequeno ao lado de um selo. O motivo aparece numa dica
 * flutuante ao passar o mouse (ou ao focar pelo teclado).
 *
 * A dica vai por portal para o <body>, com posição fixa: dentro da tabela ela
 * seria cortada, porque a moldura da tabela tem rolagem horizontal.
 */
export default function AvisoIcone({
  children,
  tom = "warning",
  rotulo = "Ver detalhes",
}: {
  children: ReactNode;
  tom?: keyof typeof TONS;
  rotulo?: string;
}) {
  const [posicao, setPosicao] = useState<{ top: number; left: number } | null>(null);

  function mostra(elemento: HTMLElement) {
    const caixa = elemento.getBoundingClientRect();
    // Centralizada sobre o ícone, sem sair da tela pelos lados.
    const left = Math.min(Math.max(8, caixa.left + caixa.width / 2 - LARGURA_DICA / 2), window.innerWidth - LARGURA_DICA - 8);
    setPosicao({ top: caixa.top - 8, left });
  }

  return (
    <>
      <button
        type="button"
        aria-label={rotulo}
        onMouseEnter={(e) => mostra(e.currentTarget)}
        onMouseLeave={() => setPosicao(null)}
        onFocus={(e) => mostra(e.currentTarget)}
        onBlur={() => setPosicao(null)}
        className={`inline-flex shrink-0 items-center ${TONS[tom]}`}
      >
        <AlertIcon className="size-4" />
      </button>

      {posicao &&
        createPortal(
          <div
            role="tooltip"
            style={{ top: posicao.top, left: posicao.left, width: LARGURA_DICA }}
            className="pointer-events-none fixed z-99999 -translate-y-full rounded-lg bg-gray-900 px-3 py-2 text-theme-xs leading-snug text-white shadow-theme-lg dark:bg-gray-800"
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
