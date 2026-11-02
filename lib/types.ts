// Tipos espelhando o que o backend retorna.

// Registro completo do usuário (GET /user).
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhoto: string | null;
  role: string;
  isBlocked: boolean;
  createdAt: string;
}

// Conta na tela de gestão de usuários (GET /users), só para admin.
export interface ManagedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhoto: string | null;
  role: string;
  isBlocked: boolean;
  createdAt: string;
  // Quantidade de tokens de API da conta.
  tokens: number;
}

export interface UsersPage {
  items: ManagedUser[];
  total: number;
  page: number;
  pageSize: number;
}

// read: só endpoints de leitura. write: leitura e escrita (apenas admin emite).
export type TokenScope = "read" | "write";

// Token de API (GET /authorizations). O backend não devolve segredos: só o final
// do refresh token vigente, para o dono identificar qual é.
export interface AuthorizationToken {
  id: string;
  name: string | null;
  scope: TokenScope;
  refreshTokenHint: string;
  accessExpiresAt: string;
  // Prazo para renovar; cada renovação o estende.
  refreshExpiresAt: string;
  revokedAt: string | null;
  // manual: o dono revogou. refresh_token_reuse: o backend revogou porque um
  // refresh token já usado foi reapresentado (possível vazamento).
  revokedReason: "manual" | "refresh_token_reuse" | null;
  createdAt: string;
  updatedAt: string;
}

// Resposta de POST /authorization. É a única vez que o par de tokens volta
// completo do backend, então a UI mostra o valor inteiro só nesse momento.
export interface CreatedAuthorization {
  status: number;
  message: string;
  token_type: "Bearer";
  access_token: string;
  // Validade do access token em segundos.
  expires_in: number;
  expires_at: string;
  refresh_token: string;
  refresh_expires_at: string;
  scope: TokenScope;
}

// Um arquivo do INPI acompanhado pelo controle de atualizações.
// created_at e last_update não vêm do backend: a tela não os exibe.
export interface UpdateRecord {
  id: string;
  source: string;
  url: string;
  table: string;
  file_size: string;
  file_type: string;
  download_link: string;
  // true = já estamos em dia com o INPI; false = atualiza nas próximas 24h.
  update_status: boolean;
  // true = o arquivo do INPI já está baixado e conferido no servidor.
  // É a etapa anterior ao update_status: primeiro o arquivo chega, depois os
  // dados dele entram no banco.
  download_status: boolean;
  // Por que ainda está pendente, quando o subsistema soube dizer. Só aparece
  // enquanto update_status for false.
  status_detail?: string | null;
  // Data da última atualização do arquivo no INPI.
  date_update: string;
  // Quando o sistema checou por atualização (roda todo dia, tendo mudado ou não).
  updated_at: string;
}

// Resposta de GET /list-all-updates: uma lista por tabela de controle.
export interface UpdatesOverview {
  marcas_atualizacoes: UpdateRecord[];
  patentes_atualizacoes: UpdateRecord[];
  programas_computador_atualizacoes: UpdateRecord[];
  contratos_transferencia_tecnologia_atualizacoes: UpdateRecord[];
  desenhos_industriais_atualizacoes: UpdateRecord[];
}

// Um arquivo de uma seção da RPI (o PDF, o ZIP com XML/TXT).
export interface RpiArquivo {
  id: string;
  nome_arquivo: string;
  // Como o INPI anuncia o link: "PDF", "XML", "TXT".
  formato: string;
  // Texto do link na página do INPI ("PDF 1", "PDF 2").
  rotulo: string;
  bytes: number | null;
  download_status: boolean;
  // Por que o envio ao bucket falhou, quando falhou.
  status_detail: string | null;
  // Pode ser baixado pelo painel (está no bucket).
  in_bucket: boolean;
}

// Uma seção de uma edição da RPI: uma linha da tabela.
export interface RpiSecao {
  id: string;
  numero_rpi: number;
  secao: string;
  // Data da edição no INPI (DATE puro, lido em UTC).
  data_publicacao: string;
  // true = todos os arquivos da seção estão no bucket.
  download_status: boolean;
  // true = os dados dos arquivos já estão na base.
  update_status: boolean;
  // Com update_status false, o motivo da falha. Com true (seções em PDF), os
  // despachos gravados com alerta, para conferir com o PDF.
  status_detail: string | null;
  // Quando a página da RPI foi lida com esta edição nela.
  verificado_em: string;
  arquivos: RpiArquivo[];
}

// Resposta de GET /rpi/secoes: uma lista por seção, todas presentes.
export interface RpiOverview {
  secoes: Record<string, RpiSecao[]>;
  monitoramento: RpiMonitoramento;
}

// Um acesso do job da RPI à página do INPI.
export interface RpiAcessoInpi {
  acessado_em: string;
  // "fora_do_ar": 5xx, falha de rede ou sem resposta em 30 s.
  // "resposta_inesperada": a página abriu, mas o formato mudou.
  resultado: "ok" | "fora_do_ar" | "resposta_inesperada";
  http_status: number | null;
  detalhe: string | null;
  // A edição da primeira linha da página, quando deu para ler.
  numero_rpi: number | null;
}

export interface RpiConferencia {
  conferido_em: string;
  numero_rpi: number | null;
  completa: boolean;
  pendencias: { secao: string | null; problema: string }[];
}

// O job da RPI só acessa o INPI enquanto a edição da semana está incompleta.
export interface RpiMonitoramento {
  ultimo_acesso: RpiAcessoInpi | null;
  ultimo_acesso_ok: string | null;
  // Primeira falha da sequência atual de acessos que não deram certo.
  falha_desde: string | null;
  // A conferência de sábado mais recente.
  ultima_conferencia: RpiConferencia | null;
}

// Revisão das seções da RPI publicadas só em PDF (GET /rpi/revisao/:secao).
export type RpiCampoRevisaoTipo = "texto" | "textoLongo" | "data" | "json";

export interface RpiCampoRevisao {
  chave: string;
  rotulo: string;
  tipo: RpiCampoRevisaoTipo;
}

export interface RpiItemRevisao {
  id: string;
  sequencia: number;
  // Uma linha que identifica o registro (processo, nome, código).
  resumo: string;
  // Página do PDF onde o registro começa.
  pagina: number;
  // "alerta" = alguma conferência automática não fechou; "conferido" = revisado.
  status_extracao: "alerta" | "conferido" | "ok";
  extraido_por: string;
  alertas: string[];
  conferido_por: string | null;
  conferido_em: string | null;
  correcoes: Record<string, { antes: string; depois: string }> | null;
  // Valor atual de cada campo editável. Datas em AAAA-MM-DD; tabelas como lista.
  valores: Record<string, unknown>;
}

export interface RpiRevisao {
  secao: string;
  numero_rpi: number;
  // O PDF da seção, para abrir na página do registro.
  pdf: { id: string; nome_arquivo: string } | null;
  campos: RpiCampoRevisao[];
  itens: RpiItemRevisao[];
}
