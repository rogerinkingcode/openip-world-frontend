// Helper de chamadas ao backend (lado do cliente).
//
// Todas as chamadas passam por /api/backend/*, que o next.config.ts reescreve
// para o backend Express. Como é a mesma origem do frontend, o cookie httpOnly
// "token" viaja automaticamente — não precisamos manipular o token à mão.

const BASE = "/api/backend";

// Várias chamadas da mesma tela podem receber 401 juntas; basta encerrar uma vez.
let endingSession: Promise<void> | null = null;

// Sessão recusada (expirada, conta bloqueada ou excluída). Só ir para /login não
// basta: o cookie continua no navegador e o proxy.ts, que só enxerga o cookie,
// devolveria para /profile, que recebe 401 de novo — um loop. O cookie é httpOnly,
// então quem apaga é o backend, no /logout (com o mesmo domínio com que o criou).
function endSession() {
  endingSession ??= (async () => {
    try {
      await fetch(`${BASE}/logout`, { method: "POST" });
    } catch {
      // Sem conexão não há como limpar o cookie; o redirect abaixo segue igual.
    }
    window.location.replace("/login");
  })();
  return endingSession;
}

export async function backendFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  // Middleware de auth do backend responde 401 quando a sessão não vale mais.
  if (res.status === 401 && typeof window !== "undefined") {
    void endSession();
  }

  return res;
}
