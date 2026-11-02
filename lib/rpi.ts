import type { RpiArquivo, RpiSecao } from "./types";

// As oito seções da RPI, na ordem da revista. A chave é contrato com a API e o
// subsistema (SECOES_RPI nos dois): mudar aqui exige mudar lá.
export const RPI_SECOES: { key: string; numeral: string; label: string }[] = [
  { key: "comunicados", numeral: "I", label: "Comunicados" },
  { key: "contratos_tecnologia", numeral: "II", label: "Contratos de tecnologia" },
  { key: "desenhos_industriais", numeral: "III", label: "Desenhos industriais" },
  { key: "indicacoes_geograficas", numeral: "IV", label: "Indicações geográficas" },
  { key: "marcas", numeral: "V", label: "Marcas" },
  { key: "patentes", numeral: "VI", label: "Patentes" },
  { key: "programas_computador", numeral: "VII", label: "Programas de computador" },
  {
    key: "topografias_circuitos",
    numeral: "VIII",
    label: "Topografias de circuitos integrados",
  },
];

// Link que a API transforma em redirecionamento para o bucket. O arquivo nunca
// passa pela Vercel: o navegador baixa direto do bucket com um link assinado.
export function rpiDownloadPath(arquivo: RpiArquivo) {
  return `/api/backend/rpi/arquivos/${arquivo.id}/download`;
}

// Seções cujo ZIP o INPI anuncia como "TXT", mas que trazem o TXT e o XML (o
// XML é o que a carga lê). O rótulo mostra os dois. Mesma lista da API.
const SECOES_TXT_E_XML = new Set(["patentes", "programas_computador", "contratos_tecnologia"]);

export function rotuloArquivo(secao: string, arquivo: RpiArquivo) {
  if (SECOES_TXT_E_XML.has(secao) && arquivo.nome_arquivo.toLowerCase().endsWith(".zip")) {
    return "TXT + XML";
  }
  return arquivo.rotulo;
}

// Seções que o INPI publica só em PDF: a leitura grava com alerta o que não
// passou nas conferências automáticas, e o painel tem a revisão delas.
export const RPI_SECOES_PDF = new Set([
  "comunicados",
  "desenhos_industriais",
  "indicacoes_geograficas",
  "topografias_circuitos",
]);

// O subsistema escreve o aviso da carga em partes separadas por ". ". "Sem
// publicação nesta edição" é uma delas: aparece só na revisão, para não
// poluir a linha da tabela.
const SEM_PUBLICACAO = "Sem publicação nesta edição";

export function secaoSemPublicacao(secao: RpiSecao) {
  return Boolean(secao.update_status && secao.status_detail?.split(". ").includes(SEM_PUBLICACAO));
}

// O aviso da linha da tabela, sem o "Sem publicação" (vai para o popup).
export function avisoDaLinha(secao: RpiSecao) {
  if (!secao.status_detail) return null;
  if (!secao.update_status) return secao.status_detail;
  const partes = secao.status_detail.split(". ").filter((parte) => parte !== SEM_PUBLICACAO);
  return partes.length ? partes.join(". ") : null;
}

// Abre o PDF da seção na página do registro. O "#page" sobrevive ao
// redirecionamento para o link assinado do bucket, e o leitor de PDF do
// navegador abre direto na página.
export function rpiPdfNaPagina(pdfId: string, pagina: number) {
  return `/api/backend/rpi/arquivos/${pdfId}/download?ver=1#page=${pagina}`;
}

export function formatBytes(bytes: number | null) {
  if (bytes == null) return null;
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: unit > 1 ? 1 : 0 })} ${units[unit]}`;
}

// Falhou = algum arquivo voltou com motivo de erro. Sem motivo e fora do bucket,
// o arquivo ainda está sendo baixado ou enviado.
export function secaoComFalha(secao: RpiSecao) {
  return secao.arquivos.some((a) => !a.download_status && a.status_detail);
}

export function secaoEmEnvio(secao: RpiSecao) {
  return secao.arquivos.some((a) => !a.download_status && !a.status_detail);
}
