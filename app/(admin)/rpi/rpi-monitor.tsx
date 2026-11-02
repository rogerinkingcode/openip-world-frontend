import Badge from "@/components/ui/badge/Badge";
import { RPI_SECOES } from "@/lib/rpi";
import type { RpiAcessoInpi, RpiMonitoramento } from "@/lib/types";
import { formatDateTime } from "@/lib/updates";

const CARD = "rounded-2xl border border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-white/[0.03]";
const TITULO = "text-theme-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400";

// Acessos falhando há mais que isso viram destaque: o site de revistas cai com
// frequência, mas costuma voltar em poucas horas.
const ALERTA_FALHA_MS = 24 * 60 * 60 * 1000;

function rotuloSecao(chave: string | null) {
  if (!chave) return "Edição";
  return RPI_SECOES.find((secao) => secao.key === chave)?.label ?? chave;
}

function ResultadoAcesso({ acesso }: { acesso: RpiAcessoInpi }) {
  if (acesso.resultado === "ok") {
    return (
      <Badge size="sm" color="success">
        OK
      </Badge>
    );
  }
  return (
    <Badge size="sm" color={acesso.resultado === "fora_do_ar" ? "warning" : "error"} title={acesso.detalhe ?? undefined}>
      {acesso.resultado === "fora_do_ar" ? "INPI fora do ar" : "Resposta inesperada"}
      {acesso.http_status ? ` (${acesso.http_status})` : ""}
    </Badge>
  );
}

/**
 * Acompanhamento do job da RPI: o último acesso ao site do INPI e a última
 * conferência de sábado. O job só acessa o INPI enquanto a edição da semana
 * está incompleta, então o último acesso pode ser de dias atrás sem problema.
 */
export default function RpiMonitor({ monitoramento }: { monitoramento: RpiMonitoramento }) {
  const { ultimo_acesso: ultimo, ultimo_acesso_ok: ultimoOk, falha_desde: falhaDesde, ultima_conferencia: conferencia } = monitoramento;
  // eslint-disable-next-line react-hooks/purity -- comparação com o relógio na renderização, refeita a cada atualização da tela
  const falhaLonga = Boolean(falhaDesde && Date.now() - new Date(falhaDesde).getTime() > ALERTA_FALHA_MS);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className={`${CARD} ${falhaLonga ? "border-error-300 dark:border-error-500/40" : ""}`}>
        <p className={TITULO}>Último acesso ao INPI</p>
        {ultimo ? (
          <>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-theme-sm font-medium text-gray-800 dark:text-white/90">{formatDateTime(ultimo.acessado_em)}</span>
              <ResultadoAcesso acesso={ultimo} />
              {ultimo.resultado === "ok" && ultimo.numero_rpi && (
                <span className="text-theme-xs text-gray-500 dark:text-gray-400">primeira linha da página: RPI {ultimo.numero_rpi}</span>
              )}
            </div>
            {ultimo.resultado !== "ok" && (
              <p className="mt-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
                {ultimo.detalhe && <>{ultimo.detalhe}. </>}
                Último acesso com sucesso: {ultimoOk ? formatDateTime(ultimoOk) : "nenhum ainda"}.
              </p>
            )}
            {falhaLonga && (
              <p className="mt-1.5 text-theme-xs font-medium text-error-600 dark:text-error-500">
                Os acessos falham desde {formatDateTime(falhaDesde)}. Vale verificar se o site de revistas do INPI mudou de endereço.
              </p>
            )}
          </>
        ) : (
          <p className="mt-2 text-theme-sm text-gray-500 dark:text-gray-400">O job ainda não acessou o INPI.</p>
        )}
        <p className="mt-2 text-theme-xs text-gray-400 dark:text-gray-500">
          O job roda de 30 em 30 minutos, mas só acessa o INPI enquanto a edição da semana está incompleta.
        </p>
      </div>

      <div className={`${CARD} ${conferencia && !conferencia.completa ? "border-warning-300 dark:border-warning-500/40" : ""}`}>
        <p className={TITULO}>Conferência de sábado</p>
        {conferencia ? (
          <>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-theme-sm font-medium text-gray-800 dark:text-white/90">{formatDateTime(conferencia.conferido_em)}</span>
              {conferencia.numero_rpi && <span className="text-theme-xs text-gray-500 dark:text-gray-400">RPI {conferencia.numero_rpi}</span>}
              <Badge size="sm" color={conferencia.completa ? "success" : "warning"}>
                {conferencia.completa ? "Edição completa" : `${conferencia.pendencias.length} pendência(s)`}
              </Badge>
            </div>
            {!conferencia.completa && (
              <ul className="mt-2 space-y-1 text-theme-xs text-warning-700 dark:text-warning-400">
                {conferencia.pendencias.map((pendencia, i) => (
                  <li key={i}>
                    <span className="font-medium">{rotuloSecao(pendencia.secao)}:</span> {pendencia.problema}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="mt-2 text-theme-sm text-gray-500 dark:text-gray-400">Nenhuma conferência ainda. A primeira roda no próximo sábado, ao meio-dia.</p>
        )}
      </div>
    </div>
  );
}
