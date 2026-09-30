"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/context/ToastContext";
import { useUser } from "@/context/UserContext";
import {
  DropdownArrowIcon,
  LogoutIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
} from "@/icons";
import { backendFetch } from "@/lib/api";
import UserAvatar from "../ui/avatar/UserAvatar";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import Skeleton from "../ui/skeleton/Skeleton";

const ITEM_CLASS =
  "flex w-full items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300";
const ITEM_ICON_CLASS =
  "text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300";

// adminOnly: some do menu para os demais (a API recusa de qualquer jeito).
const MENU = [
  { label: "Meu perfil", href: "/profile", Icon: UserCircleIcon },
  { label: "Tokens da API", href: "/tokens", Icon: PlugInIcon },
  { label: "Atualizações", href: "/updates", Icon: TableIcon, adminOnly: true },
];

export default function UserDropdown() {
  const router = useRouter();
  const { user, error } = useUser();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  function toggleDropdown(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      // O backend expira o cookie httpOnly "token"; o proxy.ts faz o resto.
      await backendFetch("/logout", { method: "POST" });
      toast.success("Você saiu da conta.");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Não foi possível sair. Tente novamente.");
    } finally {
      setLoggingOut(false);
    }
  }

  if (!user && !error) return <UserDropdownSkeleton />;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex items-center text-gray-700 dark:text-gray-400 dropdown-toggle"
      >
        {user ? (
          <UserAvatar user={user} className="mr-3 h-11 w-11 text-sm" />
        ) : (
          <span className="mr-3 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            <UserCircleIcon />
          </span>
        )}

        <span className="block mr-1 font-medium text-theme-sm">
          {user?.firstName ?? "Conta"}
        </span>

        <DropdownArrowIcon
          className={`text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        {user && (
          <div>
            <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
              {user.firstName} {user.lastName}
            </span>
            <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400 break-all">
              {user.email}
            </span>
          </div>
        )}

        <ul
          className={`flex flex-col gap-1 pb-3 border-b border-gray-200 dark:border-gray-800 ${
            user ? "pt-4" : ""
          }`}
        >
          {MENU.filter(
            (item) => !item.adminOnly || user?.role === "admin",
          ).map(({ label, href, Icon }) => (
            <li key={href}>
              <DropdownItem
                onItemClick={closeDropdown}
                tag="a"
                href={href}
                baseClassName=""
                className={ITEM_CLASS}
              >
                <Icon className={ITEM_ICON_CLASS} />
                {label}
              </DropdownItem>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className={`${ITEM_CLASS} mt-3 disabled:opacity-60`}
        >
          <LogoutIcon className={ITEM_ICON_CLASS} />
          {loggingOut ? "Saindo..." : "Sair"}
        </button>
      </Dropdown>
    </div>
  );
}

function UserDropdownSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando usuário"
      className="flex items-center"
    >
      <Skeleton className="mr-3 h-11 w-11 rounded-full" />
      <div className="mr-1 flex h-5 items-center">
        <Skeleton className="h-3.5 w-16" />
      </div>
      <DropdownArrowIcon className="text-gray-300 dark:text-gray-700" />
    </div>
  );
}
