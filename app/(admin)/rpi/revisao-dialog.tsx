"use client";

import { useCallback, useEffect, useState } from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/context/ToastContext";
import { backendFetch } from "@/lib/api";
import { avisoDaLinha, rpiPdfNaPagina, secaoSemPublicacao } from "@/lib/rpi";
import type { RpiCampoRevisao, RpiItemRevisao, RpiRevisao, RpiSecao } from "@/lib/types";
import { formatDateTime } from "@/lib/updates";

const TEXTAREA =
  "w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";
const LINK =
  "inline-flex items-center gap-1.5 text-theme-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400";

type Filtro = "alerta" | "conferido";

/** O valor do campo como texto no formulário (tabelas viram JSON indentado). */
function paraTexto(campo: RpiCampoRevisao, valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  if (campo.tipo === "json") return JSON.stringify(valor, null, 2);
  return String(valor);
}

/**
 * Revisão de uma seção da RPI publicada só em PDF.
 *
 * Lista os registros gravados com alerta (alguma conferência automática não
 * fechou), com o motivo e um link que abre o PDF na página do registro.
 * Corrigir é opcional: o alerta não quer dizer que o dado está errado. "Marcar
 * como conferido" grava as correções, se houver, e tira o registro da lista;
 * a recarga da edição preserva o que foi conferido.
 */
export default function RevisaoDialog({
  secao,
  label,
  onClose,
  onChanged,
}: {
  secao: RpiSecao | null;
  label: string;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const toast = useToast();
  const [shown, setShown] = useState<RpiSecao | null>(secao);
  const [filtro, setFiltro] = useState<Filtro>("alerta");
  const [dados, setDados] = useState<RpiRevisao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  // Quantos registros ainda estão com alerta. Vem da própria lista de
  // pendentes, então baixa na hora em que um registro é conferido.
  const [pendentes, setPendentes] = useState<number | null>(null);

  // Guarda a última seção para o conteúdo não sumir durante a animação de
  // saída. Outra seção abre do zero, na aba de pendentes.
  if (secao && secao !== shown) {
    setShown(secao);
    setFiltro("alerta");
    setDados(null);
    setPendentes(null);
  }

  // Avisos da carga que não são de um registro só (ex.: despacho do índice
  // que não foi lido). A contagem de alertas e o "sem publicação" têm caixa própria.
  const outrosAvisos = ((shown && avisoDaLinha(shown)) ?? "")
    .split(". ")
    .filter((parte) => parte && !/despacho\(s\) com alerta para conferir$/.test(parte));

  const carrega = useCallback(async () => {
    if (!shown) return;
    try {
      const res = await backendFetch(`/rpi/revisao/${shown.secao}?rpi=${shown.numero_rpi}&status=${filtro}`);
      const body = await res.json();
      if (!res.ok) {
        setErro(body?.message ?? "Não foi possível carregar a revisão.");
        return;
      }
      setErro(null);
      setDados(body as RpiRevisao);
      if (filtro === "alerta") setPendentes((body as RpiRevisao).itens.length);
    } catch {
      setErro("Erro de conexão com o servidor.");
    }
  }, [shown, filtro]);

  useEffect(() => {
    if (!secao) return;
    // O setState acontece depois do await, não no corpo do efeito.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carrega();
  }, [secao, carrega]);

  async function aoConferir() {
    await carrega();
    await onChanged();
  }

  return (
    <Modal isOpen={secao !== null} onClose={onClose} className="max-w-[900px]" contentClassName="flex flex-col">
      <h4 className="mb-1 pr-12 text-2xl font-semibold text-gray-800 dark:text-white/90">
        Revisar {label} — RPI {shown?.numero_rpi}
      </h4>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        O alerta quer dizer que uma conferência automática não fechou, não que o
        dado esteja errado. Compare com o PDF, corrija se precisar e marque como
        conferido.
      </p>

      {shown && secaoSemPublicacao(shown) && (
        <p className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-theme-sm text-gray-600 dark:bg-white/[0.03] dark:text-gray-400">
          Sem publicação nesta edição: o INPI não publicou despachos desta seção
          na RPI {shown.numero_rpi}.
        </p>
      )}

      {(Boolean(pendentes) || outrosAvisos.length > 0) && (
        <div className="mt-4 rounded-lg bg-warning-25 px-4 py-3 text-theme-sm text-warning-700 dark:bg-warning-500/[0.08] dark:text-warning-400">
          {Boolean(pendentes) && (
            <p className="font-medium">
              {pendentes} {pendentes === 1 ? "registro com alerta" : "registros com alerta"} para conferir.
            </p>
          )}
          {outrosAvisos.map((aviso, i) => (
            <p key={i}>{aviso}</p>
          ))}
        </div>
      )}

      <div className="mt-5 flex gap-2">
        {(["alerta", "conferido"] as const).map((opcao) => (
          <button
            key={opcao}
            type="button"
            onClick={() => setFiltro(opcao)}
            className={`rounded-lg px-3 py-1.5 text-theme-sm font-medium ${
              filtro === opcao ? "menu-item-active" : "menu-item-inactive"
            }`}
          >
            {opcao === "alerta" ? "Pendentes" : "Conferidos"}
          </button>
        ))}
      </div>

      {/* Rolagem própria, com barra visível: a do Modal é escondida. A lista
          fica com o que sobra da altura da caixa (flex-1), seja qual for o
          tamanho dos avisos acima — com altura fixa, avisos longos empurravam
          o fim da lista (e o botão de conferir) para fora da tela. Título e
          abas ficam fixos; só a lista rola. */}
      <div className="custom-scrollbar mt-5 min-h-40 flex-1 space-y-5 overflow-y-auto pr-2">

        {erro && <p className="text-sm text-error-600 dark:text-error-500">{erro}</p>}

        {dados && dados.itens.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filtro === "alerta"
              ? "Nenhum registro com alerta nesta edição."
              : "Nenhum registro conferido nesta edição."}
          </p>
        )}

        {dados?.itens.map((item) => (
          <ItemRevisao
            key={`${item.id}-${item.status_extracao}`}
            secao={dados.secao}
            item={item}
            campos={dados.campos}
            pdfId={dados.pdf?.id ?? null}
            onConferido={aoConferir}
            notify={toast}
          />
        ))}
      </div>
    </Modal>
  );
}

function ItemRevisao({
  secao,
  item,
  campos,
  pdfId,
  onConferido,
  notify,
}: {
  secao: string;
  item: RpiItemRevisao;
  campos: RpiCampoRevisao[];
  pdfId: string | null;
  onConferido: () => Promise<void>;
  notify: ReturnType<typeof useToast>;
}) {
  const inicial = Object.fromEntries(campos.map((campo) => [campo.chave, paraTexto(campo, item.valores[campo.chave])]));
  const [valores, setValores] = useState<Record<string, string>>(inicial);
  const [salvando, setSalvando] = useState(false);

  const alterados = campos.filter((campo) => valores[campo.chave] !== inicial[campo.chave]);

  async function conferir() {
    setSalvando(true);
    try {
      const res = await backendFetch(`/rpi/revisao/${secao}/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ valores: Object.fromEntries(alterados.map((campo) => [campo.chave, valores[campo.chave]])) }),
      });
      const body = await res.json();

      if (!res.ok) {
        notify.error(body?.message ?? "Não foi possível salvar a revisão.");
        return;
      }

      notify.success(
        alterados.length
          ? `${item.resumo}: ${alterados.length} ${alterados.length === 1 ? "campo corrigido" : "campos corrigidos"} e conferido.`
          : `${item.resumo}: conferido.`,
      );
      await onConferido();
    } catch {
      notify.error("Erro de conexão com o servidor.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-medium text-gray-800 dark:text-white/90">{item.resumo}</p>
          <p className="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
            Página {item.pagina} · lido por {item.extraido_por}
          </p>
        </div>
        {pdfId && (
          <a href={rpiPdfNaPagina(pdfId, item.pagina)} target="_blank" rel="noopener noreferrer" className={LINK}>
            Abrir o PDF na página {item.pagina} ↗
          </a>
        )}
      </div>

      {item.alertas.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-lg bg-warning-25 px-4 py-3 text-theme-sm text-warning-700 dark:bg-warning-500/[0.08] dark:text-warning-400">
          {item.alertas.map((alerta, i) => (
            <li key={i}>• {alerta}</li>
          ))}
        </ul>
      )}

      {item.status_extracao === "conferido" && (
        <div className="mt-3 text-theme-xs text-gray-500 dark:text-gray-400">
          <p>
            <Badge size="sm" color="success">
              Conferido
            </Badge>{" "}
            por {item.conferido_por} em {item.conferido_em ? formatDateTime(item.conferido_em) : "—"}
          </p>
          {item.correcoes && (
            <ul className="mt-2 space-y-0.5">
              {Object.entries(item.correcoes).map(([chave, correcao]) => (
                <li key={chave}>
                  {/* O rótulo do formulário, não o nome da coluna. */}
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {campos.find((campo) => campo.chave === chave)?.rotulo ?? chave}:
                  </span>{" "}
                  <span className="line-through">{correcao.antes || "vazio"}</span> → {correcao.depois || "vazio"}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {campos.map((campo) => {
          const id = `${item.id}-${campo.chave}`;
          const longo = campo.tipo === "textoLongo" || campo.tipo === "json";
          return (
            <div key={campo.chave} className={longo ? "sm:col-span-2" : ""}>
              <Label htmlFor={id}>
                {campo.rotulo}
                {valores[campo.chave] !== inicial[campo.chave] && (
                  <span className="ml-2 text-theme-xs text-brand-500">alterado</span>
                )}
              </Label>
              {longo ? (
                <textarea
                  id={id}
                  rows={campo.tipo === "json" ? 10 : 3}
                  value={valores[campo.chave]}
                  onChange={(e) => setValores((atual) => ({ ...atual, [campo.chave]: e.target.value }))}
                  className={`${TEXTAREA} ${campo.tipo === "json" ? "font-mono text-theme-xs" : ""}`}
                />
              ) : (
                <Input
                  id={id}
                  type={campo.tipo === "data" ? "date" : "text"}
                  value={valores[campo.chave]}
                  onChange={(e) => setValores((atual) => ({ ...atual, [campo.chave]: e.target.value }))}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-end gap-3">
        {alterados.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => setValores(inicial)} disabled={salvando}>
            Desfazer alterações
          </Button>
        )}
        <Button size="sm" onClick={conferir} disabled={salvando}>
          {salvando
            ? "Salvando..."
            : item.status_extracao === "conferido"
              ? alterados.length
                ? "Salvar correções"
                : "Conferir de novo"
              : alterados.length
                ? "Salvar e marcar como conferido"
                : "Marcar como conferido"}
        </Button>
      </div>
    </div>
  );
}
