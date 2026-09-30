"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "@/components/common/Logo";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import HeaderSearch from "@/components/header/HeaderSearch";
import NotificationDropdown from "@/components/header/NotificationDropdown";
import UserDropdown from "@/components/header/UserDropdown";
import { useSidebar } from "@/context/SidebarContext";
import { CloseIcon, MenuIcon, MoreDotsIcon } from "@/icons";

export default function AppHeader() {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  // No desktop o botão recolhe/expande a sidebar; abaixo de lg abre a gaveta.
  // 896px = lg do tema (1024px) × --app-zoom; deve acompanhar o globals.css.
  const handleToggle = () => {
    if (window.matchMedia("(min-width: 896px)").matches) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  return (
    <header className="sticky top-0 flex w-full bg-white border-gray-200 z-99999 dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          <button
            type="button"
            className="items-center justify-center w-10 h-10 text-gray-500 border-gray-200 rounded-lg z-99999 dark:border-gray-800 lg:flex dark:text-gray-400 lg:h-11 lg:w-11 lg:border"
            onClick={handleToggle}
            aria-label="Alternar menu lateral"
          >
            {isMobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>

          <Link href="/profile" className="lg:hidden">
            <Logo />
          </Link>

          <button
            type="button"
            onClick={() => setApplicationMenuOpen((prev) => !prev)}
            aria-label="Mais opções"
            aria-expanded={isApplicationMenuOpen}
            className="flex items-center justify-center w-10 h-10 text-gray-700 rounded-lg z-99999 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
          >
            <MoreDotsIcon />
          </button>

          <div className="hidden lg:block">
            <HeaderSearch />
          </div>
        </div>

        <div
          className={`${
            isApplicationMenuOpen ? "flex" : "hidden"
          } items-center justify-between w-full gap-4 px-5 py-4 lg:flex shadow-theme-md lg:justify-end lg:px-0 lg:shadow-none`}
        >
          <div className="flex items-center gap-2 2xsm:gap-3">
            <ThemeToggleButton />
            <NotificationDropdown />
          </div>
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}
