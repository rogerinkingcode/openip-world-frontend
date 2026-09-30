"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

type SidebarContextType = {
  isExpanded: boolean;
  isMobileOpen: boolean;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

// Corte "md" do tema (768px) × --app-zoom: abaixo dele a sidebar nunca fica
// "expandida". Deve acompanhar --breakpoint-md do globals.css.
const MOBILE_QUERY = "(max-width: 671.98px)";

function subscribeMobile(onChange: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

const getIsMobile = () => window.matchMedia(MOBILE_QUERY).matches;
const getServerIsMobile = () => false;

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const isMobile = useSyncExternalStore(
    subscribeMobile,
    getIsMobile,
    getServerIsMobile,
  );

  // Saindo da faixa mobile, a gaveta aberta deixa de fazer sentido.
  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const handleChange = () => {
      if (!mql.matches) setIsMobileOpen(false);
    };
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  const toggleSidebar = useCallback(() => setIsExpanded((prev) => !prev), []);
  const toggleMobileSidebar = useCallback(
    () => setIsMobileOpen((prev) => !prev),
    [],
  );
  const closeMobileSidebar = useCallback(() => setIsMobileOpen(false), []);

  return (
    <SidebarContext.Provider
      value={{
        isExpanded: isMobile ? false : isExpanded,
        isMobileOpen,
        toggleSidebar,
        toggleMobileSidebar,
        closeMobileSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
