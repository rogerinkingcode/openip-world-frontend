"use client";

import { useState } from "react";
import Alert from "@/components/ui/alert/Alert";
import Badge from "@/components/ui/badge/Badge";
import { useUser } from "@/context/UserContext";
import { BASE_URL, GRUPOS, type Endpoint, type Resposta } from "@/lib/api-docs";

/**
 * Página de referência da API para os clientes.
 *
 * É só de admin: esconder no menu é conforto, e aqui a verificação é explícita
 * porque esta página não chama a API — sem uma chamada que o servidor recuse,
 * nada barraria quem digitasse a URL.
 */
export default function ApiDocsView() {
  const { user, error } = useUser();

  if (!user && !error) {
    return (
      <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/[0.03]" />
    );
  }

  if (user?.role !== "admin") {
    return (
      <Alert
        variant="error"
        title="Acesso restrito"
        message="Esta página é exclusiva para administradores."
      />
    );
  }

  return <ApiDocs />;
}

function ApiDocs() {
  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      <Sumario />

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <Introducao />

        {GRUPOS.map((grupo) => (
          <section key={grupo.id} id={grupo.id} className="scroll-mt-24">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                {grupo.titulo}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {grupo.descricao}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {grupo.endpoints.map((endpoint) => (
                <CartaoEndpoint key={endpoint.id} endpoint={endpoint} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

/** Índice lateral. Some no celular, onde a rolagem já resolve. */
function Sumario() {
  /**
   * Rola suavemente até a seção.
   *
   * Feito no clique, e não com `scroll-behavior: smooth` no CSS global: aquilo
   * mudaria a rolagem de todas as páginas do painel, inclusive das tabelas
   * longas, onde o salto instantâneo é o comportamento desejado.
   *
   * O `href` continua no elemento para o link seguir funcionando com teclado,
   * "abrir em nova aba" e cópia do endereço.
   */
  const rolarAte = (evento: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const destino = document.getElementById(id);
    if (!destino) return;

    evento.preventDefault();

    // Quem pediu menos animação no sistema recebe o salto direto.
    const preferePoucaAnimacao = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    destino.scrollIntoView({
      behavior: preferePoucaAnimacao ? "auto" : "smooth",
      block: "start",
    });

    // Mantém o endereço com a âncora, para recarregar ou compartilhar o link
    // cair na mesma seção. `replaceState` evita encher o histórico do navegador
    // com uma entrada por clique no índice.
    window.history.replaceState(null, "", `#${id}`);
  };

  return (
    <nav className="hidden xl:block xl:w-56 xl:shrink-0">
      <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="mb-3 text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
          Nesta página
        </p>
        <ul className="flex flex-col gap-2">
          {GRUPOS.map((grupo) => (
            <li key={grupo.id}>
              <a
                href={`#${grupo.id}`}
                onClick={(evento) => rolarAte(evento, grupo.id)}
                className="text-sm text-gray-600 transition hover:text-brand-500 dark:text-gray-300"
              >
                {grupo.titulo}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

function Introducao() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <h1 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Como consumir a API
      </h1>

      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Todos os endpoints respondem JSON e exigem um token de acesso no
        cabeçalho <code className="rounded bg-gray-100 px-1 dark:bg-white/10">Authorization</code>.
        O endereço base é:
      </p>

      <Bloco texto={BASE_URL} />

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Passo
          numero="1"
          titulo="Gere o token no painel"
          texto="Em Tokens da API, crie um token com escopo de leitura. O refresh token aparece uma única vez — guarde-o."
        />
        <Passo
          numero="2"
          titulo="Troque por um token de acesso"
          texto="Chame /refresh-token com o refresh token. A resposta traz o access token, válido por 24 horas."
        />
        <Passo
          numero="3"
          titulo="Chame os endpoints"
          texto="Envie o access token no cabeçalho Authorization e renove antes de expirar."
        />
      </div>

      <div className="mt-4 rounded-xl border border-warning-200 bg-warning-25 p-3 dark:border-warning-500/30 dark:bg-warning-500/[0.06]">
        <p className="text-theme-sm text-warning-700 dark:text-warning-400">
          <strong>Atenção ao refresh token:</strong> ele muda a cada renovação, e
          o anterior deixa de valer. Se um token já usado for reapresentado, o
          sistema entende que duas partes têm a mesma credencial e revoga o
          acesso inteiro — nesse caso é preciso gerar um novo no painel.
        </p>
      </div>
    </div>
  );
}

function Passo({ numero, titulo, texto }: { numero: string; titulo: string; texto: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-theme-xs font-semibold text-white">
        {numero}
      </span>
      <p className="mt-2 text-theme-sm font-medium text-gray-800 dark:text-white/90">
        {titulo}
      </p>
      <p className="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">{texto}</p>
    </div>
  );
}

function CartaoEndpoint({ endpoint }: { endpoint: Endpoint }) {
  const [aba, setAba] = useState<"exemplo" | "respostas">("exemplo");

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <header className="border-b border-gray-200 p-4 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-2">
          <Badge size="sm" color={endpoint.metodo === "GET" ? "info" : "warning"}>
            {endpoint.metodo}
          </Badge>
          <code className="font-mono text-theme-sm text-gray-800 dark:text-white/90">
            {endpoint.caminho}
          </code>
        </div>

        <p className="mt-2 text-theme-sm font-medium text-gray-800 dark:text-white/90">
          {endpoint.titulo}
        </p>
        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
          {endpoint.descricao}
        </p>
      </header>

      {endpoint.parametros && endpoint.parametros.length > 0 && (
        <div className="border-b border-gray-200 p-4 dark:border-gray-800">
          <p className="mb-2 text-theme-xs font-semibold uppercase tracking-wide text-gray-400">
            Parâmetros
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-theme-sm">
              <tbody>
                {endpoint.parametros.map((parametro) => (
                  <tr
                    key={parametro.nome}
                    className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                  >
                    <td className="whitespace-nowrap py-2 pr-4 align-top">
                      <code className="font-mono text-theme-xs text-brand-500">
                        {parametro.nome}
                      </code>
                    </td>
                    <td className="py-2 pr-4 align-top text-gray-600 dark:text-gray-300">
                      {parametro.descricao}
                    </td>
                    <td className="whitespace-nowrap py-2 align-top text-gray-400">
                      {parametro.exemplo && (
                        <code className="font-mono text-theme-xs">{parametro.exemplo}</code>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex gap-1 border-b border-gray-200 px-4 pt-3 dark:border-gray-800">
        <Aba ativa={aba === "exemplo"} onClick={() => setAba("exemplo")}>
          No código
        </Aba>
        <Aba ativa={aba === "respostas"} onClick={() => setAba("respostas")}>
          Respostas
        </Aba>
      </div>

      <div className="p-4">
        {aba === "exemplo" ? (
          <Bloco texto={endpoint.exemplo} />
        ) : (
          <div className="flex flex-col gap-3">
            <Resposta item={endpoint.sucesso} sucesso />
            {endpoint.erros.map((erro, indice) => (
              <Resposta key={`${erro.status}-${indice}`} item={erro} />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function Aba({
  ativa,
  onClick,
  children,
}: {
  ativa: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-t-lg px-3 py-2 text-theme-sm transition ${
        ativa
          ? "border-b-2 border-brand-500 font-medium text-brand-500"
          : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

function Resposta({ item, sucesso }: { item: Resposta; sucesso?: boolean }) {
  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <Badge size="sm" color={sucesso ? "success" : item.status >= 500 ? "error" : "warning"}>
          {item.status}
        </Badge>
        <span className="text-theme-xs text-gray-500 dark:text-gray-400">{item.quando}</span>
      </div>
      <Bloco texto={item.corpo} />
    </div>
  );
}

/** Bloco de código com botão de copiar. */
function Bloco({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      // Navegador sem permissão de área de transferência: o texto continua
      // selecionável na tela, então não vale interromper o usuário com erro.
    }
  };

  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-xl bg-gray-900 p-4 text-theme-xs leading-relaxed text-gray-100">
        <code>{texto}</code>
      </pre>

      <button
        type="button"
        onClick={copiar}
        className="absolute right-2 top-2 rounded-lg bg-white/10 px-2 py-1 text-theme-xs text-gray-200 transition hover:bg-white/20"
      >
        {copiado ? "copiado" : "copiar"}
      </button>
    </div>
  );
}
