"use client";

import type React from "react";
import { useEffect, useRef } from "react";

interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clique fora fecha; o botão que abre (".dropdown-toggle") fica de fora para
    // o próprio toggle decidir, senão ele fecharia e reabriria no mesmo clique.
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(".dropdown-toggle")
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  if (!isOpen) return null;

  // Posição (right/left/mt) fica com quem usa: aqui ela competiria com a do
  // className, e no CSS do Tailwind quem vence é a ordem das regras, não a das
  // classes — um right-0 fixo aqui ignorava o posicionamento de mobile.
  return (
    <div
      ref={dropdownRef}
      className={`absolute z-40 rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark ${className}`}
    >
      {children}
    </div>
  );
};
