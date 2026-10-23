/**
 * Catálogo dos endpoints que os clientes da API consomem.
 *
 * As mensagens dentro dos exemplos ficam em inglês porque é isso que a API
 * devolve de verdade: quem consome é sistema de terceiro. O texto da página
 * em volta é em português, para quem administra.
 *
 * Escrito à mão, e não gerado do backend, porque o front não importa código do
 * servidor. Quando um endpoint mudar lá, esta lista precisa acompanhar — por
 * isso ela é enxuta: só o que o cliente precisa para escrever o código dele.
 */

export type Parametro = {
  nome: string;
  descricao: string;
  exemplo?: string;
};

export type Resposta = {
  status: number;
  quando: string;
  corpo: string;
};

export type Endpoint = {
  id: string;
  metodo: "GET" | "POST";
  caminho: string;
  titulo: string;
  descricao: string;
  parametros?: Parametro[];
  sucesso: Resposta;
  erros: Resposta[];
  exemplo: string;
};

export type GrupoEndpoints = {
  id: string;
  titulo: string;
  descricao: string;
  endpoints: Endpoint[];
};

/**
 * Fonte de dados (INPI, TMView) ou assunto comum a todas (autenticação). É o
 * primeiro nível do índice lateral: as fontes se comportam de jeitos
 * diferentes, e quem integra precisa saber de qual delas está lendo.
 */
export type SecaoDocs = {
  id: string;
  titulo: string;
  descricao: string;
  /** Diferenças de comportamento que valem para todos os endpoints da seção. */
  notas?: string[];
  grupos: GrupoEndpoints[];
};

/** Endereço base mostrado nos exemplos. */
export const BASE_URL = "https://api.openipworld.com.br";

/** Erros que valem para qualquer rota autenticada — não repetidos em cada uma. */
export const ERROS_COMUNS: Resposta[] = [
  {
    status: 401,
    quando: "Token ausente, expirado ou revogado.",
    corpo: `{
  "status": 401,
  "error": "invalid_token",
  "message": "The access token is expired"
}`,
  },
  {
    status: 500,
    quando: "Falha inesperada no servidor.",
    corpo: `{
  "status": 500,
  "message": "Internal error while querying the data."
}`,
  },
];

const PAGINACAO: Parametro[] = [
  { nome: "page", descricao: "Página desejada. Começa em 1.", exemplo: "2" },
  { nome: "limit", descricao: "Itens por página. Máximo de 100.", exemplo: "50" },
];

function exemploConsulta(caminho: string, query: string) {
  return `const resposta = await fetch(
  "${BASE_URL}${caminho}${query}",
  { headers: { Authorization: \`Bearer \${accessToken}\` } }
);

if (!resposta.ok) {
  const erro = await resposta.json();
  throw new Error(\`\${erro.status}: \${erro.message}\`);
}

const { total, page, pages, results } = await resposta.json();`;
}

function recurso(
  slug: string,
  nome: string,
  nomeIngles: string,
  chave: string,
  filtros: Parametro[],
  exemploQuery: string,
  exemploChave: string,
  relacoes: string[],
): Endpoint[] {
  return [
    {
      id: `lista-${slug}`,
      metodo: "GET",
      caminho: `/api/${slug}`,
      titulo: `Listar ${nome.toLowerCase()}`,
      descricao: `Lista paginada com filtros. Sem filtro nenhum, devolve o catálogo inteiro de ${nome.toLowerCase()} em páginas.`,
      parametros: [...filtros, ...PAGINACAO],
      sucesso: {
        status: 200,
        quando: "Consulta bem-sucedida. `results` pode vir vazio se nada casar com os filtros.",
        corpo: `{
  "total": 19623,
  "page": 1,
  "limit": 20,
  "pages": 982,
  "results": [
    {
      "${chave}": "1000371",
      "numero_inpi": "820095370",
      "data_deposito": "1997-06-19",
      ...
    }
  ]
}`,
      },
      erros: [
        {
          status: 400,
          quando: "Parâmetro desconhecido, data fora do formato AAAA-MM-DD ou `limit` acima de 100.",
          corpo: `{
  "status": 400,
  "message": "Unknown parameter(s): nome. Accepted: ${filtros
    .map((f) => f.nome)
    .join(", ")}, page, limit."
}`,
        },
        ...ERROS_COMUNS,
      ],
      exemplo: exemploConsulta(`/api/${slug}`, exemploQuery),
    },
    {
      id: `detalhe-${slug}`,
      metodo: "GET",
      caminho: `/api/${slug}/{${chave}}`,
      titulo: `Detalhar ${nome.toLowerCase().replace(/s$/, "")}`,
      descricao: `Todos os dados de um registro, incluindo as tabelas relacionadas: ${relacoes.join(", ")}.`,
      sucesso: {
        status: 200,
        quando: "Registro encontrado.",
        corpo: `{
  "${chave}": "${exemploChave}",
  "numero_inpi": "820095370",
  ...
${relacoes.map((r) => `  "${r}": [ ... ]`).join(",\n")}
}`,
      },
      erros: [
        {
          status: 404,
          quando: "Não existe registro com essa chave.",
          corpo: `{
  "status": 404,
  "message": "No ${nomeIngles} found with ${chave} \\"000000000\\"."
}`,
        },
        ...ERROS_COMUNS,
      ],
      exemplo: `const resposta = await fetch(
  "${BASE_URL}/api/${slug}/${exemploChave}",
  { headers: { Authorization: \`Bearer \${accessToken}\` } }
);

if (resposta.status === 404) {
  // Não encontrado: trate como "sem resultado", não como erro de sistema.
}

const registro = await resposta.json();`,
    },
  ];
}

const AUTENTICACAO: GrupoEndpoints = {
  id: "autenticacao",
  titulo: "Autenticação",
  descricao:
    "Toda chamada exige um token de acesso no cabeçalho Authorization. O token de acesso vale 24 horas e é renovado com o refresh token, que você obtém uma única vez no painel.",
  endpoints: [
    {
      id: "refresh-token",
      metodo: "POST",
      caminho: "/refresh-token",
      titulo: "Renovar o token de acesso",
      descricao:
        "Troca o refresh token por um par novo. A cada troca, o refresh token anterior deixa de valer e um novo é devolvido — guarde sempre o mais recente.",
      parametros: [
        {
          nome: "refresh_token",
          descricao: "No corpo, em JSON. Na primeira vez, o valor gerado no painel; depois, o último recebido.",
        },
      ],
      sucesso: {
        status: 200,
        quando: "Par renovado.",
        corpo: `{
"status": 200,
"message": "Token renewed successfully",
"access_token": "eyJhbGciOi...",
"expires_in": 86400,
"expires_at": "2026-09-30T12:00:00.000Z",
"refresh_token": "novo-refresh-token",
"refresh_expires_at": "2026-10-29T12:00:00.000Z",
"scope": "read"
}`,
      },
      erros: [
        {
          status: 401,
          quando: "Refresh token inválido, expirado ou já trocado.",
          corpo: `{
"status": 401,
"error": "invalid_grant",
"message": "The refresh token is invalid"
}`,
        },
        {
          status: 401,
          quando:
            "Reapresentação de um refresh token já usado. Indica que duas partes têm o mesmo token, e por segurança o acesso inteiro é revogado — gere um novo no painel.",
          corpo: `{
"status": 401,
"error": "token_reuse_detected",
"message": "Refresh token reuse detected"
}`,
        },
        {
          status: 400,
          quando: "Corpo sem o campo refresh_token.",
          corpo: `{
"status": 400,
"error": "invalid_request",
"message": "refresh_token is required"
}`,
        },
      ],
      exemplo: `// Guarde o refresh token num lugar durável (banco, arquivo, cofre).
// Ele muda a cada renovação: reapresentar um antigo revoga o acesso.
let refreshToken = await storage.get("refresh_token");
let accessToken = null;
let expiraEm = 0;

async function tokenValido() {
// Renova cinco minutos antes de vencer, para nenhuma chamada sair com o
// token expirando no meio do caminho.
if (accessToken && Date.now() < expiraEm - 5 * 60 * 1000) return accessToken;

const resposta = await fetch("${BASE_URL}/refresh-token", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ refresh_token: refreshToken }),
});

const dados = await resposta.json();

if (!resposta.ok) {
  // invalid_grant ou token_reuse_detected: gere um token novo no painel.
  throw new Error(\`\${dados.error}: \${dados.message}\`);
}

accessToken = dados.access_token;
expiraEm = new Date(dados.expires_at).getTime();

// Grave ANTES de usar: se o processo cair agora, o próximo início precisa
// do token novo, e não do que acabou de ser gasto.
refreshToken = dados.refresh_token;
await storage.set("refresh_token", refreshToken);

return accessToken;
}`,
    },
  ],
};

const GRUPOS_INPI: GrupoEndpoints[] = [
  {
    id: "marcas",
    titulo: "Marcas",
    descricao: "Dados bibliográficos, classificações, titulares, despachos e prioridades das marcas registradas no INPI.",
    endpoints: [
      ...recurso(
        "marcas",
        "Marcas",
        "trademark",
        "codigo_interno",
        [
          { nome: "numero_inpi", descricao: "Número do processo no INPI.", exemplo: "820095370" },
          { nome: "elemento", descricao: "Trecho do elemento nominativo (o nome da marca).", exemplo: "NATURA" },
          { nome: "situacao", descricao: "Trecho da situação.", exemplo: "em vigor" },
          { nome: "classe", descricao: "Classe de Nice.", exemplo: "35" },
          { nome: "titular", descricao: "Trecho do nome do titular.", exemplo: "COSMETICOS" },
          { nome: "deposito_de", descricao: "Data de depósito a partir de (AAAA-MM-DD).", exemplo: "2020-01-01" },
          { nome: "deposito_ate", descricao: "Data de depósito até (AAAA-MM-DD).", exemplo: "2026-12-31" },
        ],
        "?elemento=NATURA&classe=35&limit=20",
        "1000371",
        ["classificações Nice", "classificações nacionais", "classificações de Viena", "depositantes", "despachos", "prioridades"],
      ),
      {
        id: "busca-fonetica",
        metodo: "GET",
        caminho: "/marca/search",
        titulo: "Busca fonética de marcas",
        descricao:
          "Encontra marcas que SOAM parecido com o termo, mesmo escritas de forma diferente. É a busca usada para avaliar colidência: \"Kolla\" encontra \"Cola\", \"Nattura\" encontra \"Natura\".",
        parametros: [{ nome: "q", descricao: "Termo buscado. Obrigatório.", exemplo: "nattura" }],
        sucesso: {
          status: 200,
          quando: "Busca executada. Resultados vêm ordenados por proximidade sonora.",
          corpo: `{
  "total": 50,
  "results": [
    {
      "id": "1000371",
      "score": 97.5,
      "nome": "NATURA",
      "numero_inpi": "820095370",
      "classe": ["03", "35"],
      "situacao": "Registro de marca em vigor"
    }
  ]
}`,
        },
        erros: [
          {
            status: 400,
            quando: "Parâmetro q ausente ou vazio.",
            corpo: `{
  "status": 400,
  "message": "The search parameter 'q' is required"
}`,
          },
          ...ERROS_COMUNS,
        ],
        exemplo: `const resposta = await fetch(
  \`${BASE_URL}/marca/search?q=\${encodeURIComponent("nattura")}\`,
  { headers: { Authorization: \`Bearer \${accessToken}\` } }
);

const { total, results } = await resposta.json();

// "score" é a proximidade sonora: quanto maior, mais parecido.
results.forEach((marca) => console.log(marca.score, marca.nome));`,
      },
    ],
  },
  {
    id: "patentes",
    titulo: "Patentes",
    descricao: "Pedidos e patentes concedidas, com título, resumo, inventores, depositantes, classificação IPC e despachos.",
    endpoints: recurso(
      "patentes",
      "Patentes",
      "patent",
      "codigo_interno",
      [
        { nome: "numero_inpi", descricao: "Número do pedido no INPI.", exemplo: "PI9604795" },
        { nome: "titulo", descricao: "Trecho do título da patente.", exemplo: "dispositivo" },
        { nome: "depositante", descricao: "Trecho do nome do depositante.", exemplo: "PETROBRAS" },
        { nome: "inventor", descricao: "Trecho do nome do inventor.", exemplo: "SILVA" },
        { nome: "ipc", descricao: "Símbolo da classificação IPC.", exemplo: "A61K" },
        { nome: "deposito_de", descricao: "Data de depósito a partir de (AAAA-MM-DD).", exemplo: "2015-01-01" },
        { nome: "deposito_ate", descricao: "Data de depósito até (AAAA-MM-DD).", exemplo: "2026-12-31" },
      ],
      "?ipc=A61K&deposito_de=2020-01-01",
      "198684",
      ["classificação IPC", "conteúdo (título e resumo)", "depositantes", "despachos", "inventores", "prioridades", "procuradores", "renumerações"],
    ),
  },
  {
    id: "desenhos-industriais",
    titulo: "Desenhos industriais",
    descricao: "Registros de desenho industrial, com autores, classificações de Locarno, depositantes e despachos.",
    endpoints: recurso(
      "desenhos-industriais",
      "Desenhos industriais",
      "industrial design",
      "codigo_interno",
      [
        { nome: "numero_inpi", descricao: "Número do processo no INPI.", exemplo: "DI6402427" },
        { nome: "titulo", descricao: "Trecho do título do desenho.", exemplo: "cadeira" },
        { nome: "depositante", descricao: "Trecho do nome do depositante.", exemplo: "INDUSTRIA" },
        { nome: "autor", descricao: "Trecho do nome do autor.", exemplo: "MIRANDA" },
        { nome: "deposito_de", descricao: "Data de depósito a partir de (AAAA-MM-DD).", exemplo: "2018-01-01" },
        { nome: "deposito_ate", descricao: "Data de depósito até (AAAA-MM-DD).", exemplo: "2026-12-31" },
      ],
      "?titulo=cadeira&limit=10",
      "656936",
      ["autores", "classificações", "conteúdo", "depositantes", "despachos", "prioridades", "procuradores"],
    ),
  },
  {
    id: "programas-computador",
    titulo: "Programas de computador",
    descricao: "Registros de software, com titulares, autores, linguagem, campo de aplicação e despachos.",
    endpoints: recurso(
      "programas-computador",
      "Programas de computador",
      "computer program",
      "codigo_interno",
      [
        { nome: "numero_inpi", descricao: "Número do registro no INPI.", exemplo: "512025002476" },
        { nome: "titulo", descricao: "Trecho do título do programa.", exemplo: "sistema" },
        { nome: "titular", descricao: "Trecho do nome do titular.", exemplo: "TOTVS" },
        { nome: "autor", descricao: "Trecho do nome do autor.", exemplo: "SOARES" },
        { nome: "linguagem", descricao: "Linguagem de programação.", exemplo: "JAVA" },
        { nome: "deposito_de", descricao: "Data de depósito a partir de (AAAA-MM-DD).", exemplo: "2024-01-01" },
        { nome: "deposito_ate", descricao: "Data de depósito até (AAAA-MM-DD).", exemplo: "2026-12-31" },
      ],
      "?linguagem=JAVA&limit=10",
      "50001",
      ["autores", "campos de aplicação", "despachos", "linguagens", "tipos", "titulares"],
    ),
  },
  {
    id: "contratos",
    titulo: "Contratos de transferência de tecnologia",
    descricao: "Contratos averbados no INPI, com cedente, cessionária, modalidade e despachos.",
    endpoints: recurso(
      "contratos",
      "Contratos de transferência de tecnologia",
      "technology transfer contract",
      "codigo_processo",
      [
        { nome: "numero_inpi", descricao: "Número do processo no INPI.", exemplo: "991227" },
        { nome: "cedente", descricao: "Trecho do nome do cedente.", exemplo: "SHELL" },
        { nome: "cessionaria", descricao: "Trecho do nome da cessionária.", exemplo: "RAIZEN" },
        { nome: "modalidade", descricao: "Trecho da modalidade contratual.", exemplo: "assistência técnica" },
        { nome: "processo_de", descricao: "Data do processo a partir de (AAAA-MM-DD).", exemplo: "2015-01-01" },
        { nome: "processo_ate", descricao: "Data do processo até (AAAA-MM-DD).", exemplo: "2026-12-31" },
      ],
      "?cedente=SHELL",
      "1",
      ["cedentes", "cessionárias", "despachos", "modalidades"],
    ),
  },
];

// ---------------------------------------------------------------------------
// TMView (EUIPO)
// ---------------------------------------------------------------------------

/** Erros próprios do TMView: a consulta depende da EUIPO, que tem limite e pode cair. */
const ERROS_TMVIEW: Resposta[] = [
  {
    status: 429,
    quando:
      "Limite de consultas à EUIPO atingido. O cabeçalho Retry-After diz em quantos segundos tentar de novo.",
    corpo: `{
  "status": 429,
  "error": "rate_limited",
  "message": "The TMview request limit was reached. Try again later."
}`,
  },
  {
    status: 502,
    quando: "A EUIPO está fora do ar ou devolveu um erro.",
    corpo: `{
  "status": 502,
  "error": "upstream_unavailable",
  "message": "The EUIPO service is unavailable at the moment. Try again later."
}`,
  },
  {
    status: 504,
    quando: "A EUIPO não respondeu a tempo.",
    corpo: `{
  "status": 504,
  "error": "upstream_timeout",
  "message": "The EUIPO service did not respond. Try again later."
}`,
  },
  ...ERROS_COMUNS,
];

const SITUACOES_TMVIEW =
  "RECEIVED, UNDER_EXAMINATION, APPLICATION_PUBLISHED, START_OF_OPPOSITION_PERIOD, OPPOSITION_PENDING, ACCEPTANCE_PENDING, ACCEPTED, REGISTRATION_PENDING, REGISTERED, APPEALABLE, APPEALED, CANCELLATION_PENDING, CANCELLED, WITHDRAWN, REFUSED, SURRENDERED, EXPIRED, REMOVED_FROM_REGISTER";

const TIPOS_TMVIEW =
  "WORD, FIGURATIVE, SHAPE_3D, COLOUR, SOUND, HOLOGRAM, OLFACTORY, POSITION, PATTERN, MOTION, MULTIMEDIA, OTHER";

const GRUPOS_TMVIEW: GrupoEndpoints[] = [
  {
    id: "tmview-marcas",
    titulo: "Marcas da União Europeia",
    descricao:
      "Busca e detalhe das marcas da União Europeia (EUTM) registradas na EUIPO, com titulares, procuradores, classes de Nice, produtos e serviços, oposições e histórico.",
    endpoints: [
      {
        id: "tmview-lista",
        metodo: "GET",
        caminho: "/api/tmview/marcas",
        titulo: "Buscar marcas da União Europeia",
        descricao:
          "Lista paginada com filtros. Os filtros podem ser combinados: a marca precisa atender a todos. Sem filtro nenhum, devolve o catálogo inteiro em páginas.",
        parametros: [
          { nome: "elemento", descricao: "Trecho do elemento nominativo (o nome da marca).", exemplo: "apple" },
          { nome: "titular", descricao: "Trecho do nome do titular.", exemplo: "Apple Inc." },
          { nome: "procurador", descricao: "Trecho do nome do procurador (o representante na EUIPO).", exemplo: "ELZABURU" },
          {
            nome: "classe",
            descricao: "Classe(s) de Nice, de 1 a 45. Várias separadas por vírgula: a marca precisa ter ao menos uma delas.",
            exemplo: "9,42",
          },
          {
            nome: "situacao",
            descricao: `Situação na EUIPO. Várias separadas por vírgula. Valores aceitos: ${SITUACOES_TMVIEW}.`,
            exemplo: "REGISTERED",
          },
          { nome: "tipo", descricao: `Tipo da marca. Vários separados por vírgula. Valores aceitos: ${TIPOS_TMVIEW}.`, exemplo: "WORD" },
          { nome: "deposito_de", descricao: "Data de depósito a partir de (AAAA-MM-DD).", exemplo: "2020-01-01" },
          { nome: "deposito_ate", descricao: "Data de depósito até (AAAA-MM-DD).", exemplo: "2026-12-31" },
          { nome: "registro_de", descricao: "Data de registro a partir de (AAAA-MM-DD).", exemplo: "2021-01-01" },
          { nome: "registro_ate", descricao: "Data de registro até (AAAA-MM-DD).", exemplo: "2026-12-31" },
          {
            nome: "vencimento_de",
            descricao: "Data de vencimento a partir de (AAAA-MM-DD). Útil para achar marcas perto de renovar.",
            exemplo: "2027-01-01",
          },
          { nome: "vencimento_ate", descricao: "Data de vencimento até (AAAA-MM-DD).", exemplo: "2027-06-30" },
          {
            nome: "ordem",
            descricao: "Ordenação: numero, elemento, deposito, registro ou atualizacao, seguido de :asc (padrão) ou :desc.",
            exemplo: "deposito:desc",
          },
          { nome: "page", descricao: "Página desejada. Começa em 1.", exemplo: "2" },
          { nome: "limit", descricao: "Itens por página, de 10 a 100. Padrão: 20.", exemplo: "50" },
        ],
        sucesso: {
          status: 200,
          quando:
            "Consulta bem-sucedida. `results` traz o resumo de cada marca; os dados completos estão no detalhe. Pode vir vazio se nada casar com os filtros.",
          corpo: `{
  "total": 982,
  "page": 1,
  "limit": 10,
  "pages": 99,
  "results": [
    {
      "applicationNumber": "019439531",
      "markKind": "INDIVIDUAL",
      "markFeature": "FIGURATIVE",
      "markBasis": "EU_TRADEMARK",
      "niceClasses": [16, 31, 35],
      "wordMarkSpecification": { "verbalElement": "Tedy apples" },
      "applicationDate": "2026-10-22",
      "status": "RECEIVED"
    }
  ]
}`,
        },
        erros: [
          {
            status: 400,
            quando: "Parâmetro desconhecido, valor fora da lista aceita, data inválida ou `limit` fora de 10 a 100.",
            corpo: `{
  "status": 400,
  "message": "Invalid value(s) for \\"situacao\\": ATIVA. Accepted: RECEIVED, UNDER_EXAMINATION, ..."
}`,
          },
          ...ERROS_TMVIEW,
        ],
        exemplo: `const resposta = await fetch(
  "${BASE_URL}/api/tmview/marcas?elemento=apple&classe=9,42&situacao=REGISTERED&ordem=deposito:desc",
  { headers: { Authorization: \`Bearer \${accessToken}\` } }
);

if (resposta.status === 429) {
  // Limite de consultas à EUIPO: espere o tempo indicado e tente de novo.
  const segundos = Number(resposta.headers.get("Retry-After"));
  throw new Error(\`Tente novamente em \${segundos} segundos\`);
}

if (!resposta.ok) {
  const erro = await resposta.json();
  throw new Error(\`\${erro.status}: \${erro.message}\`);
}

const { total, page, pages, results } = await resposta.json();

results.forEach((marca) =>
  console.log(marca.applicationNumber, marca.wordMarkSpecification?.verbalElement, marca.status)
);`,
      },
      {
        id: "tmview-detalhe",
        metodo: "GET",
        caminho: "/api/tmview/marcas/{numero}",
        titulo: "Detalhar uma marca da União Europeia",
        descricao:
          "Todos os dados de uma marca: titulares, procuradores, datas, produtos e serviços por classe, oposições, cancelamentos, recursos, averbações (records) e publicações. O número tem 9 dígitos (ex.: 018692868) e pode ser enviado sem os zeros à esquerda; registros internacionais usam W seguido de 8 dígitos.",
        parametros: [
          {
            nome: "idioma",
            descricao:
              "Código de duas letras (ex.: pt, en, es). Traz produtos, serviços e descrições só nesse idioma. Sem ele, vêm em todos os idiomas disponíveis — a resposta fica bem maior.",
            exemplo: "pt",
          },
        ],
        sucesso: {
          status: 200,
          quando: "Marca encontrada. Campos sem informação não aparecem na resposta.",
          corpo: `{
  "applicationNumber": "000000001",
  "markKind": "INDIVIDUAL",
  "markFeature": "WORD",
  "markBasis": "EU_TRADEMARK",
  "wordMarkSpecification": { "verbalElement": "AIPPI" },
  "applicants": [
    {
      "office": "EM",
      "identifier": "813",
      "name": "ASSOCIATION INTERNATIONALE POUR LA PROTECTION DE LA PROPRIETE INDUSTRIELLE"
    }
  ],
  "representatives": [
    { "office": "EM", "identifier": "11849", "name": "ELZABURU, S.L.P." }
  ],
  "applicationDate": "1996-04-01",
  "registrationDate": "1997-09-15",
  "expiryDate": "2036-04-01",
  "status": "REGISTERED",
  "goodsAndServices": [
    {
      "classNumber": 16,
      "description": [{ "language": "pt", "terms": ["Produtos de impressão", "..."] }]
    }
  ],
  "renewalStatus": "NOT_TO_BE_RENEWED",
  "cancellations": [ ... ],
  "records": [ ... ],
  "publications": [ ... ]
}`,
        },
        erros: [
          {
            status: 400,
            quando: "Número em formato inválido ou idioma que não tem duas letras.",
            corpo: `{
  "status": 400,
  "message": "Invalid application number \\"abc\\". Use 9 digits (e.g. 018692868) or W followed by 8 digits."
}`,
          },
          {
            status: 404,
            quando: "Não existe marca com esse número na EUIPO.",
            corpo: `{
  "status": 404,
  "message": "No trademark found with application number \\"099999999\\"."
}`,
          },
          ...ERROS_TMVIEW,
        ],
        exemplo: `const resposta = await fetch(
  "${BASE_URL}/api/tmview/marcas/000000001?idioma=pt",
  { headers: { Authorization: \`Bearer \${accessToken}\` } }
);

if (resposta.status === 404) {
  // Não encontrada: trate como "sem resultado", não como erro de sistema.
}

const marca = await resposta.json();

console.log(marca.wordMarkSpecification?.verbalElement, marca.status, marca.expiryDate);
marca.applicants?.forEach((titular) => console.log("Titular:", titular.name));`,
      },
    ],
  },
  {
    id: "tmview-midias",
    titulo: "Imagens e mídias",
    descricao:
      "O arquivo da marca em si: a imagem das marcas figurativas e, quando existem, o som, o vídeo ou o modelo 3D.",
    endpoints: [
      {
        id: "tmview-midia",
        metodo: "GET",
        caminho: "/api/tmview/marcas/{numero}/{midia}",
        titulo: "Baixar a imagem ou outra mídia da marca",
        descricao:
          "Devolve o arquivo (não JSON), com o tipo no cabeçalho Content-Type. Troque {midia} por uma das opções abaixo. Para exibir em listas, prefira a miniatura: é bem menor que a imagem original. O arquivo pode ser guardado — mídia de marca praticamente não muda.",
        parametros: [
          { nome: "imagem", descricao: "Imagem original da marca.", exemplo: "image/jpeg" },
          { nome: "imagem/miniatura", descricao: "Versão reduzida da imagem.", exemplo: "image/jpeg" },
          { nome: "som", descricao: "Áudio das marcas sonoras.", exemplo: "audio/*" },
          { nome: "video", descricao: "Vídeo das marcas de movimento e multimídia.", exemplo: "video/*" },
          { nome: "modelo", descricao: "Modelo 3D das marcas tridimensionais.", exemplo: "model/*" },
        ],
        sucesso: {
          status: 200,
          quando: "Arquivo encontrado. O corpo é o próprio arquivo, não JSON.",
          corpo: `HTTP/1.1 200 OK
Content-Type: image/jpeg
Cache-Control: private, max-age=86400

(conteúdo binário da imagem)`,
        },
        erros: [
          {
            status: 404,
            quando: "A marca não tem essa mídia — por exemplo, imagem de uma marca só nominativa.",
            corpo: `{
  "status": 404,
  "message": "Trademark \\"018692868\\" has no image thumbnail available."
}`,
          },
          {
            status: 404,
            quando: "Mídia fora da lista aceita.",
            corpo: `{
  "status": 404,
  "message": "Unknown media \\"foto\\". Accepted: imagem, imagem/miniatura, som, video, modelo."
}`,
          },
          ...ERROS_TMVIEW,
        ],
        exemplo: `const resposta = await fetch(
  "${BASE_URL}/api/tmview/marcas/000111153/imagem/miniatura",
  { headers: { Authorization: \`Bearer \${accessToken}\` } }
);

if (resposta.status === 404) {
  // A marca não tem imagem (ex.: marca nominativa).
}

// No navegador: exibir numa <img>.
const blob = await resposta.blob();
imagem.src = URL.createObjectURL(blob);

// No servidor (Node.js): salvar em arquivo.
// const bytes = Buffer.from(await resposta.arrayBuffer());
// await fs.writeFile("marca.jpg", bytes);`,
      },
    ],
  },
];

/** Tudo o que a página mostra, na ordem do índice lateral. */
export const SECOES: SecaoDocs[] = [
  {
    id: "geral",
    titulo: "Geral",
    descricao: "Vale para todas as fontes de dados.",
    grupos: [AUTENTICACAO],
  },
  {
    id: "inpi",
    titulo: "INPI — Brasil",
    descricao:
      "Dados das bases públicas do Instituto Nacional da Propriedade Industrial: marcas, patentes, desenhos industriais, programas de computador e contratos de transferência de tecnologia.",
    grupos: GRUPOS_INPI,
  },
  {
    id: "tmview",
    titulo: "TMView — União Europeia",
    descricao:
      "Marcas da União Europeia, consultadas na EUIPO (o escritório de propriedade intelectual da UE) no momento da requisição.",
    notas: [
      "Cobre as marcas da União Europeia (EUTM) registradas na EUIPO. Não inclui as marcas dos escritórios nacionais que aparecem no site do TMView.",
      "Os registros vêm no formato da EUIPO, com campos em inglês (applicationNumber, verbalElement, niceClasses...). Os filtros usam os mesmos nomes da consulta do INPI.",
      "As respostas ficam em cache: buscas por até 6 horas, detalhes por até 24 horas e imagens por até 7 dias. Uma marca recém-depositada pode levar algumas horas para aparecer.",
      "Há um limite de consultas à EUIPO. Quando ele é atingido, a API responde 429 com o cabeçalho Retry-After — guarde os resultados que for reutilizar.",
      "A paginação começa em 1, e o limit vai de 10 a 100 itens por página.",
    ],
    grupos: GRUPOS_TMVIEW,
  },
];
