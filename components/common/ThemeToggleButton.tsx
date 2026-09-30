"use client";

import { useTheme } from "@/context/ThemeContext";
import { MoonIcon, SunIcon } from "@/icons";

export function ThemeToggleButton() {
  const { toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Alternar tema claro/escuro"
      className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full h-11 w-11 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
    >
      {/* Os dois ícones ficam no DOM e a classe dark decide qual aparece: assim o
          ícone já nasce certo, antes mesmo de o React hidratar. */}
      <SunIcon className="hidden dark:block" />
      <MoonIcon className="dark:hidden" />
    </button>
  );
}
