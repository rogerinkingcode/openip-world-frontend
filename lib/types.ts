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
