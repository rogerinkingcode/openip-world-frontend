"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { backendFetch } from "@/lib/api";
import type { User } from "@/lib/types";

type UserContextType = {
  // null enquanto carrega ou quando deu erro — `error` diferencia os dois.
  user: User | null;
  error: string | null;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

// O usuário logado aparece no header (em todas as páginas) e no perfil. Buscar
// uma vez no layout evita repetir GET /user a cada navegação.
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await backendFetch("/user");
        const data = await res.json();
        if (!active) return;

        // Erros do backend chegam com HTTP 200 e um campo "status" no corpo.
        if (data?.status && data.status !== 200) {
          setError(data.message ?? "Não foi possível carregar o perfil.");
          return;
        }
        setUser(data as User);
      } catch {
        if (active) setError("Erro de conexão com o servidor.");
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, error }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
