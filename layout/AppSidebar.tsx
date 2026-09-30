"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState, type HTMLAttributes } from "react";
import { createPortal } from "react-dom";
import Logo from "@/components/common/Logo";
import { useSidebar } from "@/context/SidebarContext";
import { useUser } from "@/context/UserContext";
import { ArrowRightIcon, ChevronDownIcon, HorizontaLDots } from "@/icons";
import { adminItems, navItems, type NavItem } from "./navigation";
import SidebarWidget from "./SidebarWidget";

function isPathActive(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

// Índice do grupo que contém a rota atual, para já abrir o submenu certo.
function findOpenSubmenu(items: NavItem[], pathname: string) {
  const index = items.findIndex((nav) =>
    nav.subItems?.some((sub) => isPathActive(pathname, sub.path)),
  );
  return index === -1 ? null : index;
}

export default function AppSidebar() {
  const { isExpanded, isMobileOpen, closeMobileSidebar } = useSidebar();
  const { user } = useUser();
  const isAdmin = user?.role === "admin";
  const pathname = usePathname();

  const [openSubmenu, setOpenSubmenu] = useState<number | null>(() =>
    findOpenSubmenu(navItems, pathname),
  );

  // Ao trocar de rota, abre o grupo da nova página. É ajuste de estado durante o
  // render (e não efeito) para não pintar um frame com o submenu antigo.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpenSubmenu(findOpenSubmenu(navItems, pathname));
  }

  const isActive = useCallback(
    (path: string) => isPathActive(pathname, path),
    [pathname],
  );

  // Recolher e expandir é só pelo botão do header; passar o mouse não abre.
  const showText = isExpanded || isMobileOpen;
  const isCollapsed = !isExpanded;

  const handleSubmenuToggle = (index: number) => {
    setOpenSubmenu((prev) => (prev === index ? null : index));
  };

  // Tooltip com o nome do item quando a sidebar está encolhida. Vai para o body
  // via portal com posição fixa: dentro da lista (overflow-y-auto, 90px) ele
  // seria cortado.
  const [tooltip, setTooltip] = useState<{
    label: string;
    top: number;
    left: number;
  } | null>(null);

  const showTooltip = (label: string, target: HTMLElement) => {
    const rect = target.getBoundingClientRect();
    // getBoundingClientRect devolve px de tela, mas top/left do tooltip são
    // multiplicados pelo zoom do <html>; dividir mantém o balão colado no item.
    const zoom =
      parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
    setTooltip({
      label,
      top: (rect.top + rect.height / 2) / zoom,
      left: rect.right / zoom + 12,
    });
  };
  const hideTooltip = () => setTooltip(null);

  const tooltipProps = (label: string): HTMLAttributes<HTMLElement> =>
    showText
      ? {}
      : {
          "aria-label": label,
          onMouseEnter: (e) => showTooltip(label, e.currentTarget),
          onMouseLeave: hideTooltip,
          onFocus: (e) => showTooltip(label, e.currentTarget),
          onBlur: hideTooltip,
        };

  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              type="button"
              onClick={() => handleSubmenuToggle(index)}
              aria-expanded={openSubmenu === index}
              {...tooltipProps(nav.name)}
              className={`menu-item group ${
                openSubmenu === index ? "menu-item-active" : "menu-item-inactive"
              } cursor-pointer ${isCollapsed ? "lg:justify-center" : "lg:justify-start"}`}
            >
              <span
                className={
                  openSubmenu === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }
              >
                {nav.icon}
              </span>
              {showText && <span className="menu-item-text">{nav.name}</span>}
              {showText && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu === index ? "rotate-180 text-brand-500" : ""
                  }`}
                />
              )}
            </button>
          ) : nav.path && nav.external ? (
            <a
              href={nav.path}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMobileSidebar}
              {...tooltipProps(nav.name)}
              className={`menu-item group menu-item-inactive ${
                isCollapsed ? "lg:justify-center" : "lg:justify-start"
              }`}
            >
              <span className="menu-item-icon-inactive">{nav.icon}</span>
              {showText && (
                <>
                  <span className="menu-item-text">{nav.name}</span>
                  <ArrowRightIcon
                    aria-hidden="true"
                    className="ml-auto size-4 -rotate-45 text-gray-400"
                  />
                </>
              )}
              <span className="sr-only">(abre em nova aba)</span>
            </a>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                onClick={closeMobileSidebar}
                aria-current={isActive(nav.path) ? "page" : undefined}
                {...tooltipProps(nav.name)}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                } ${isCollapsed ? "lg:justify-center" : "lg:justify-start"}`}
              >
                <span
                  className={
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }
                >
                  {nav.icon}
                </span>
                {showText && <span className="menu-item-text">{nav.name}</span>}
              </Link>
            )
          )}

          {nav.subItems && showText && (
            // Linhas de grid 0fr → 1fr animam a altura sem medir o conteúdo.
            <div
              className={`grid transition-all duration-300 ${
                openSubmenu === index ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <ul className="mt-2 space-y-1 ml-9">
                  {nav.subItems.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        href={subItem.path}
                        onClick={closeMobileSidebar}
                        className={`menu-dropdown-item ${
                          isActive(subItem.path)
                            ? "menu-dropdown-item-active"
                            : "menu-dropdown-item-inactive"
                        }`}
                      >
                        {subItem.name}
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            novo
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 bottom-0 transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${showText ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
    >
      <div
        className={`py-8 flex ${isCollapsed ? "lg:justify-center" : "justify-start"}`}
      >
        <Link href="/profile" onClick={closeMobileSidebar}>
          <Logo iconOnly={!showText} />
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6" aria-label="Menu principal">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  isCollapsed ? "lg:justify-center" : "justify-start"
                }`}
              >
                {showText ? "Menu" : <HorizontaLDots aria-label="Menu" />}
              </h2>
              {renderMenuItems(navItems)}
            </div>

            {isAdmin && (
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    isCollapsed ? "lg:justify-center" : "justify-start"
                  }`}
                >
                  {showText ? (
                    "Administração"
                  ) : (
                    <HorizontaLDots aria-label="Administração" />
                  )}
                </h2>
                {renderMenuItems(adminItems)}
              </div>
            )}
          </div>
        </nav>
        {showText && <SidebarWidget onNavigate={closeMobileSidebar} />}
      </div>

      {tooltip &&
        !showText &&
        createPortal(
          <div
            role="tooltip"
            style={{ top: tooltip.top, left: tooltip.left }}
            className="pointer-events-none fixed z-99999 -translate-y-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-theme-xs font-medium text-white shadow-theme-lg dark:bg-gray-700"
          >
            <span className="absolute -left-1 top-1/2 size-2 -translate-y-1/2 rotate-45 rounded-[1px] bg-gray-900 dark:bg-gray-700" />
            {tooltip.label}
          </div>,
          document.body,
        )}
    </aside>
  );
}
