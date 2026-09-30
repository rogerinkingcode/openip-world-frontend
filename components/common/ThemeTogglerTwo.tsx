"use client";

import { useTheme } from "@/context/ThemeContext";
import { MoonIcon, SunIcon } from "@/icons";

// Variante flutuante (círculo brand-500) usada nas telas sem header.
export default function ThemeTogglerTwo() {
  const { toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Alternar tema claro/escuro"
      className="inline-flex size-14 items-center justify-center rounded-full bg-brand-500 text-white transition-colors hover:bg-brand-600"
    >
      <SunIcon className="hidden dark:block" />
      <MoonIcon className="dark:hidden" />
    </button>
  );
}
