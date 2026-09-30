import type { NextConfig } from "next";

// URL do backend Express. Em dev roda em http://localhost:3000.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  // Proxy transparente: tudo que o navegador chamar em /api/backend/* é
  // encaminhado para o backend Express, mantendo a mesma origem (localhost:3001).
  // Isso faz o cookie httpOnly "token" ser tratado como first-party, sem CORS.
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
      // Bull Board do subsistema, servido pela API (que confere sessão e papel de
      // admin). Mesma origem do painel, então o cookie de sessão acompanha. O
      // caminho precisa ser idêntico nas três pontas: o Bull Board gera as URLs
      // dos assets a partir dele.
      {
        source: "/admin/queues",
        destination: `${BACKEND_URL}/admin/queues`,
      },
      {
        source: "/admin/queues/:path*",
        destination: `${BACKEND_URL}/admin/queues/:path*`,
      },
    ];
  },
};

export default nextConfig;
