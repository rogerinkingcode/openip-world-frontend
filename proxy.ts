import { NextRequest, NextResponse } from "next/server";

// Em Next.js 16 o antigo middleware.ts passou a se chamar proxy.ts
// (mesma ideia: roda antes da requisição chegar na página/rota).
// Aqui ele funciona como guarda de rotas: quem não tem o cookie de sessão
// ("token", emitido pelo módulo de login do backend) é mandado para /login.

// Rotas públicas (não exigem sessão).
const PUBLIC_ROUTES = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // O backend grava o JWT no cookie httpOnly "token".
  const token = request.cookies.get("token")?.value;
  const isPublic = PUBLIC_ROUTES.includes(pathname);

  // Sem sessão tentando acessar rota protegida -> vai para o login.
  if (!token && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Já logado tentando abrir o /login -> manda para o perfil.
  if (token && isPublic) {
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Roda em tudo, menos assets estáticos e as chamadas de API (que são
  // proxeadas para o backend via rewrites no next.config.ts).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
