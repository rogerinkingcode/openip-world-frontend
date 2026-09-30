"use client";

import { UserProvider } from "@/context/UserContext";
import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isMobileOpen } = useSidebar();

  // A margem do conteúdo acompanha a largura da sidebar (290px aberta, 90px
  // recolhida). No mobile ela sobrepõe o conteúdo, então não há margem.
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <UserProvider>
      <div className="min-h-app-screen xl:flex">
        <AppSidebar />
        <Backdrop />
        {/* min-w-0: item flex não encolhe abaixo do conteúdo por padrão, então
            uma tabela larga esticaria a página inteira em vez de rolar dentro
            do próprio container. */}
        <div
          className={`min-w-0 flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
        >
          <AppHeader />
          {/* 1536px fixo (o 2xl original): o breakpoint foi reduzido pelo zoom,
              mas a largura máxima do conteúdo deve continuar a mesma. */}
          <div className="p-4 mx-auto max-w-[1536px] md:p-6">
            {children}
          </div>
        </div>
      </div>
    </UserProvider>
  );
}
