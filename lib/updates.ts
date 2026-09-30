import type { UpdateRecord, UpdatesOverview } from "./types";

// As cinco tabelas de controle, na ordem em que viram abas. O rótulo aqui é só
// um fallback: quando o grupo tem registros, o título da aba é o "source" deles.
export const UPDATE_GROUPS: {
  key: keyof UpdatesOverview;
  fallbackLabel: string;
}[] = [
  { key: "marcas_atualizacoes", fallbackLabel: "Marcas" },
  { key: "patentes_atualizacoes", fallbackLabel: "Patentes" },
  {
    key: "programas_computador_atualizacoes",
    fallbackLabel: "Programas de computador",
  },
  {
    key: "contratos_transferencia_tecnologia_atualizacoes",
    fallbackLabel: "Contratos de transferência de tecnologia",
  },
  {
    key: "desenhos_industriais_atualizacoes",
    fallbackLabel: "Desenhos industriais",
  },
];

// O "source" vem do subsistema no formato de chave ("contratos_de_transferência_de_tecnologia").
// Para exibir, troca separadores por espaço e deixa só a primeira letra maiúscula,
// como uma frase: "Contratos de transferência de tecnologia".
export function formatSourceLabel(source: string) {
  const text = source.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// date_update é DATE puro no banco e chega como "2026-08-30T00:00:00.000Z".
// Formatar no fuso local jogaria para o dia anterior no Brasil (UTC-3),
// então lemos a data em UTC.
export function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

// updated_at é timestamp de verdade: aqui o fuso local é o correto.
export function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type UpdatesSummary = {
  total: number;
  upToDate: number;
  pending: number;
  awaitingDownload: number;
  awaitingDatabase: number;
  lastCheck: string | null;
};

export function summarizeUpdates(rows: UpdateRecord[]): UpdatesSummary {
  const pending = rows.filter((row) => !row.update_status).length;

  // Dentro do que está pendente, separa quem nem baixou ainda de quem já tem o
  // arquivo no servidor e só espera a carga na base — são etapas diferentes e
  // travam por motivos diferentes.
  const awaitingDownload = rows.filter(
    (row) => !row.update_status && !row.download_status,
  ).length;

  // A verificação roda para o grupo inteiro, mas cada linha guarda seu próprio
  // updated_at; mostramos o mais recente como "última verificação" do grupo.
  const lastCheck = rows.reduce<string | null>((latest, row) => {
    if (!row.updated_at) return latest;
    if (!latest || new Date(row.updated_at) > new Date(latest)) {
      return row.updated_at;
    }
    return latest;
  }, null);

  return {
    total: rows.length,
    upToDate: rows.length - pending,
    pending,
    awaitingDownload,
    awaitingDatabase: pending - awaitingDownload,
    lastCheck,
  };
}
