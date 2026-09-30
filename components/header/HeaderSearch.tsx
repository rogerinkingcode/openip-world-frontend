"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useUser } from "@/context/UserContext";
import { SearchIcon } from "@/icons";
import { searchItems } from "@/layout/navigation";

const subscribeNoop = () => () => {};
const getIsMac = () => /Mac|iPhone|iPad/.test(navigator.userAgent);
const getServerIsMac = () => false;

// Compara sem acento e sem caixa: "atualizacoes" encontra "Atualizações".
function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export default function HeaderSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  // O servidor não sabe o sistema do usuário: renderiza "Ctrl" e o cliente troca
  // para "⌘" no Mac logo após hidratar, sem erro de hidratação.
  const isMac = useSyncExternalStore(subscribeNoop, getIsMac, getServerIsMac);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { user } = useUser();
  // Atalhos de admin só para admin (a API recusa os demais de qualquer jeito).
  const availableItems = searchItems.filter(
    (item) => !item.adminOnly || user?.role === "admin",
  );

  const term = normalize(query);
  const results = term
    ? availableItems.filter((item) =>
        normalize(`${item.name} ${item.description}`).includes(term),
      )
    : availableItems;

  function navigate(path: string) {
    setIsOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(path);
  }

  return (
    <div ref={containerRef} className="relative">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (results[0]) navigate(results[0].path);
        }}
      >
        <div className="relative">
          <span className="absolute -translate-y-1/2 left-4 top-1/2 pointer-events-none text-gray-500 dark:text-gray-400">
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsOpen(false);
                e.currentTarget.blur();
              }
            }}
            placeholder="Buscar páginas ou digite um comando..."
            aria-label="Buscar páginas"
            aria-expanded={isOpen}
            aria-controls="header-search-results"
            role="combobox"
            className="h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-16 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-white/[0.03] dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
          />

          <button
            type="button"
            onClick={() => inputRef.current?.focus()}
            aria-label="Focar a busca"
            className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400"
          >
            <span>{isMac ? "⌘" : "Ctrl"}</span>
            <span>K</span>
          </button>
        </div>
      </form>

      {isOpen && (
        <div
          id="header-search-results"
          className="absolute left-0 right-0 z-40 mt-2 rounded-xl border border-gray-200 bg-white p-2 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
        >
          {results.length === 0 ? (
            <p className="px-3 py-2 text-theme-sm text-gray-500 dark:text-gray-400">
              Nenhum resultado para “{query.trim()}”.
            </p>
          ) : (
            <ul role="listbox" className="flex flex-col gap-1">
              {results.map((item) => (
                <li key={item.path} role="option" aria-selected={false}>
                  <button
                    type="button"
                    onClick={() => navigate(item.path)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left group hover:bg-gray-100 dark:hover:bg-white/5"
                  >
                    <span className="menu-item-icon-inactive">{item.icon}</span>
                    <span>
                      <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-300">
                        {item.name}
                      </span>
                      <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                        {item.description}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
