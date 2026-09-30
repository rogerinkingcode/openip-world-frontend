"use client";

import type React from "react";
import { useEffect, useRef } from "react";
import { CloseIcon } from "@/icons";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  // Desligue quando fechar sem querer custa caro (ex.: segredo exibido uma vez).
  closeOnBackdrop?: boolean;
}

// Deve acompanhar a duração das transições de .modal no globals.css.
export const MODAL_TRANSITION_MS = 200;

// Visual do Modal do tema (caixa rounded-3xl, backdrop cinza com blur, botão de
// fechar redondo) sobre o <dialog> nativo, que já entrega foco preso na caixa,
// Esc e top layer sem código extra.
export function Modal({
  isOpen,
  onClose,
  children,
  className = "",
  showCloseButton = true,
  closeOnBackdrop = true,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  // showModal() é o que trava o foco na caixa, põe o elemento no top layer e
  // habilita o backdrop. Só o <dialog> aberto por ele responde ao Esc.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (isOpen && !el.open) {
      el.showModal();
    } else if (!isOpen && el.open) {
      el.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={ref}
      // Dispara no Esc e no dialog.close(): é o único ponto que avisa o pai, então
      // o estado dele acompanha a caixa por qualquer caminho de fechamento.
      onClose={onClose}
      // Clique no backdrop tem o próprio <dialog> como alvo, porque todo o
      // conteúdo visível mora no wrapper interno logo abaixo.
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) {
          e.currentTarget.close();
        }
      }}
      className={`modal w-modal max-h-modal overflow-hidden rounded-3xl bg-white p-0 text-left text-gray-500 dark:bg-gray-900 dark:text-gray-400 ${className}`}
    >
      <div className="no-scrollbar relative max-h-modal overflow-y-auto p-6 lg:p-10">
        {children}

        {/* Depois do conteúdo no DOM: o foco inicial do showModal() cai no primeiro
            campo, não no X. A posição absoluta o leva de volta ao canto. */}
        {showCloseButton && (
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Fechar"
            className="absolute right-3 top-3 z-999 flex h-9.5 w-9.5 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white sm:right-6 sm:top-6 sm:h-11 sm:w-11"
          >
            <CloseIcon />
          </button>
        )}
      </div>
    </dialog>
  );
}
