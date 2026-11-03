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
export const BASE_URL = "https://api.openipworld.com";

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
    descricao:
      "Dados bibliográficos, classificações, titulares, despachos e prioridades das marcas registradas no INPI. Cada marca traz também o campo imagem_url: o endereço da imagem da marca, que pode ir direto no src de uma <img>, sem token. Vem null quando a marca não tem imagem.",
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
        parametros: [{ nome: "q", descricao: "Termo buscado. Obrigatório.", exemplo: "legitima" }],
        sucesso: {
          status: 200,
          quando: "Busca executada. Resultados vêm ordenados por proximidade sonora.",
          corpo: `{
  "total": 50,
  "results": [
    {
      "id": "1000371",
      "score": 97.5,
      "nome": "ÁGUA MINERAL NATURAL LEGITIMA",
      "numero_inpi": "820095370",
      "classe": ["32"],
      "situacao": "Registro de marca extinto"
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
  \`${BASE_URL}/marca/search?q=\${encodeURIComponent("legitima")}\`,
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

const GRUPOS_RPI: GrupoEndpoints[] = [
  {
    id: "rpi-arquivos",
    titulo: "Arquivos originais",
    descricao:
      "Os arquivos que o INPI publicou em cada edição (PDF, XML, TXT), para baixar como vieram. Vale para todas as oito seções, inclusive as que ainda não têm os dados na API. Seções: comunicados, contratos_tecnologia, desenhos_industriais, indicacoes_geograficas, marcas, patentes, programas_computador, topografias_circuitos.",
    endpoints: [
      {
        id: "rpi-arquivos-lista",
        metodo: "GET",
        caminho: "/api/rpi/{secao}/{numero_rpi}/arquivos",
        titulo: "Listar os arquivos de uma edição",
        descricao:
          "Os arquivos da seção na edição, com um `download_url` permanente: pode ser guardado e usado a qualquer momento. `disponivel: false` indica um arquivo que ainda não terminou de ser copiado do INPI; nesse caso `download_url` vem nulo.",
        sucesso: {
          status: 200,
          quando: "A seção existe nessa edição.",
          corpo: `{
  "numero_rpi": 2912,
  "secao": "patentes",
  "data_publicacao": "2026-10-27",
  "arquivos": [
    {
      "nome_arquivo": "P2912.zip",
      "formato": "TXT",
      "rotulo": "TXT + XML",
      "bytes": 252020,
      "disponivel": true,
      "download_url": "${BASE_URL}/api/rpi/patentes/2912/arquivos/P2912.zip"
    },
    {
      "nome_arquivo": "Patentes2912.pdf",
      "formato": "PDF",
      "rotulo": "PDF",
      "bytes": 2307781,
      "disponivel": true,
      "download_url": "${BASE_URL}/api/rpi/patentes/2912/arquivos/Patentes2912.pdf"
    }
  ]
}`,
        },
        erros: [
          {
            status: 404,
            quando: "Seção desconhecida, ou a edição não tem essa seção.",
            corpo: `{
  "status": 404,
  "message": "RPI 2900 has no \\"patentes\\" section registered."
}`,
          },
          ...ERROS_COMUNS,
        ],
        exemplo: `const resposta = await fetch("${BASE_URL}/api/rpi/patentes/2912/arquivos", {
  headers: { Authorization: \`Bearer \${accessToken}\` },
});

const { arquivos } = await resposta.json();`,
      },
      {
        id: "rpi-arquivos-download",
        metodo: "GET",
        caminho: "/api/rpi/{secao}/{numero_rpi}/arquivos/{nome_arquivo}",
        titulo: "Baixar um arquivo",
        descricao:
          "É o `download_url` da lista. Responde com um redirecionamento para um link temporário do armazenamento, válido por 5 minutos, de onde o arquivo é baixado. Clientes HTTP comuns seguem o redirecionamento sozinhos. Não guarde o link temporário; guarde o `download_url`.",
        sucesso: {
          status: 302,
          quando: "Arquivo disponível. O cabeçalho `Location` traz o link temporário.",
          corpo: `Location: https://...?X-Amz-Expires=300&...`,
        },
        erros: [
          {
            status: 404,
            quando: "O arquivo não existe nessa seção e edição.",
            corpo: `{
  "status": 404,
  "message": "File \\"P2911.zip\\" not found in RPI 2912 / patentes."
}`,
          },
          {
            status: 409,
            quando: "O arquivo ainda está sendo copiado do INPI. Tente de novo mais tarde.",
            corpo: `{
  "status": 409,
  "message": "File is not in storage yet; try again later."
}`,
          },
          ...ERROS_COMUNS,
        ],
        exemplo: `const resposta = await fetch("${BASE_URL}/api/rpi/patentes/2912/arquivos/P2912.zip", {
  headers: { Authorization: \`Bearer \${accessToken}\` },
});

// fetch segue o redirecionamento: aqui já é o arquivo.
const arquivo = await resposta.arrayBuffer();`,
      },
    ],
  },
  {
    id: "rpi-marcas",
    titulo: "Marcas (Seção V)",
    descricao:
      "Os processos de marca publicados em cada edição da RPI, com os despachos da semana, titulares e classes de Nice. Uma edição sai por semana, às terças.",
    endpoints: [
      {
        id: "rpi-marcas-edicoes",
        metodo: "GET",
        caminho: "/api/rpi/marcas/edicoes",
        titulo: "Listar as edições disponíveis",
        descricao:
          "As edições da RPI com Marcas já carregadas, da mais recente para a mais antiga. Use para descobrir o número da última edição antes de consultá-la. O campo `arquivos` aponta para os arquivos originais da edição.",
        sucesso: {
          status: 200,
          quando: "Consulta bem-sucedida.",
          corpo: `{
  "results": [
    { "numero_rpi": 2912, "data_publicacao": "2026-10-27", "processos": 33456, "arquivos": "/api/rpi/marcas/2912/arquivos" }
  ]
}`,
        },
        erros: ERROS_COMUNS,
        exemplo: `const resposta = await fetch("${BASE_URL}/api/rpi/marcas/edicoes", {
  headers: { Authorization: \`Bearer \${accessToken}\` },
});

const { results } = await resposta.json();
const ultima = results[0]?.numero_rpi;`,
      },
      {
        id: "rpi-marcas-lista",
        metodo: "GET",
        caminho: "/api/rpi/marcas",
        titulo: "Buscar processos publicados",
        descricao:
          "Lista paginada com filtros, que podem ser combinados: o processo precisa atender a todos. Os filtros de despacho (despacho, requerente, protocolo) valem para o mesmo despacho. A lista traz as classes só com código e situação; a especificação completa e todos os dados do XML estão no detalhe.",
        parametros: [
          { nome: "rpi", descricao: "Número da edição.", exemplo: "2912" },
          { nome: "processo", descricao: "Número do processo no INPI.", exemplo: "938982168" },
          { nome: "marca", descricao: "Trecho do nome da marca.", exemplo: "budo" },
          { nome: "titular", descricao: "Trecho do nome do titular.", exemplo: "aikido" },
          { nome: "procurador", descricao: "Trecho do nome do procurador do processo.", exemplo: "Continental" },
          { nome: "classe", descricao: "Classe de Nice, de 1 a 45.", exemplo: "35" },
          { nome: "despacho", descricao: "Código do despacho. Ex.: IPAS009 (publicação para oposição), IPAS158 (concessão), IPAS423 (notificação de oposição).", exemplo: "IPAS009" },
          { nome: "requerente", descricao: "Trecho do nome de quem fez a petição que gerou o despacho — numa oposição, o terceiro que se opôs.", exemplo: "staff" },
          { nome: "protocolo", descricao: "Número da petição que gerou o despacho.", exemplo: "800260235760" },
          ...PAGINACAO,
        ],
        sucesso: {
          status: 200,
          quando: "Consulta bem-sucedida. Ordenada da edição mais recente para a mais antiga e, dentro dela, pelo número do processo. Pode vir vazia.",
          corpo: `{
  "total": 1,
  "page": 1,
  "limit": 20,
  "pages": 1,
  "results": [
    {
      "numero_rpi": 2912,
      "numero_processo": "938982168",
      "data_deposito": "2025-05-02",
      "data_concessao": "2026-10-27",
      "data_vigencia": "2036-10-27",
      "marca_nome": "BUDO KAIKAN",
      "apresentacao": "Mista",
      "natureza": "Produtos e/ou Serviço",
      "procurador": "Continental Marcas e Patentes S/S Ltda.",
      "despachos": [
        { "codigo": "IPAS158", "nome": "Concessão de registro", "texto_complementar": null, "protocolo_numero": null, "requerente_nome": null }
      ],
      "titulares": [{ "nome": "ESCOLA DE AIKIDO TAKEMUSSU LTDA", "pais": "BR", "uf": "SP" }],
      "classes_nice": [{ "codigo": "41", "status": "Deferida" }]
    }
  ]
}`,
        },
        erros: [
          {
            status: 400,
            quando: "Parâmetro desconhecido, número inválido, classe fora de 1 a 45 ou `limit` acima de 100.",
            corpo: `{
  "status": 400,
  "message": "Unknown parameter(s): titullar. Accepted: rpi, processo, marca, procurador, despacho, requerente, protocolo, titular, classe, page, limit."
}`,
          },
          ...ERROS_COMUNS,
        ],
        exemplo: exemploConsulta("/api/rpi/marcas", "?rpi=2912&despacho=IPAS009&classe=35"),
      },
      {
        id: "rpi-marcas-detalhe",
        metodo: "GET",
        caminho: "/api/rpi/marcas/{numero_rpi}/{numero_processo}",
        titulo: "Detalhar um processo publicado",
        descricao:
          "Tudo o que a edição publicou sobre o processo: despachos com a petição que os gerou, titulares, classes de Nice com a especificação completa e, em `dados`, o processo inteiro como veio no XML do INPI — inclusive classificação de Viena, prioridades, sobrestadores e dados de Madri.",
        sucesso: {
          status: 200,
          quando: "Processo encontrado na edição.",
          corpo: `{
  "numero_rpi": 2912,
  "numero_processo": "938982168",
  "marca_nome": "BUDO KAIKAN",
  "despachos": [ ... ],
  "titulares": [ ... ],
  "classes_nice": [
    { "codigo": "41", "especificacao": "Academias [educação]; ...", "traducao_especificacao": null, "status": "Deferida" }
  ],
  "dados": {
    "numero": "938982168",
    "classes-vienna": { "classe-vienna": [{ "codigo": "23.1.1", "edicao": "4" }] },
    ...
  }
}`,
        },
        erros: [
          {
            status: 404,
            quando: "O processo não foi publicado nessa edição.",
            corpo: `{
  "status": 404,
  "message": "No trademark process \\"000\\" found in RPI 2912."
}`,
          },
          ...ERROS_COMUNS,
        ],
        exemplo: `const resposta = await fetch("${BASE_URL}/api/rpi/marcas/2912/938982168", {
  headers: { Authorization: \`Bearer \${accessToken}\` },
});

const processo = await resposta.json();`,
      },
    ],
  },
  {
    id: "rpi-patentes",
    titulo: "Patentes (Seção VI)",
    descricao:
      "Os despachos de patente publicados em cada edição da RPI, com o processo como o INPI o publicou: titulares, inventores, classificações IPC e nacional, prioridades e dados de PCT. Aqui cada resultado é um despacho, porque o mesmo processo pode sair em mais de um despacho na mesma edição.",
    endpoints: [
      {
        id: "rpi-patentes-edicoes",
        metodo: "GET",
        caminho: "/api/rpi/patentes/edicoes",
        titulo: "Listar as edições disponíveis",
        descricao:
          "As edições da RPI com Patentes já carregadas, da mais recente para a mais antiga, com o número de despachos de cada uma. O campo `arquivos` aponta para os arquivos originais da edição.",
        sucesso: {
          status: 200,
          quando: "Consulta bem-sucedida.",
          corpo: `{
  "results": [
    { "numero_rpi": 2912, "data_publicacao": "2026-10-27", "despachos": 1927, "arquivos": "/api/rpi/patentes/2912/arquivos" }
  ]
}`,
        },
        erros: ERROS_COMUNS,
        exemplo: `const resposta = await fetch("${BASE_URL}/api/rpi/patentes/edicoes", {
  headers: { Authorization: \`Bearer \${accessToken}\` },
});

const { results } = await resposta.json();
const ultima = results[0]?.numero_rpi;`,
      },
      {
        id: "rpi-patentes-lista",
        metodo: "GET",
        caminho: "/api/rpi/patentes",
        titulo: "Buscar despachos publicados",
        descricao:
          "Lista paginada de despachos com filtros, que podem ser combinados: o despacho precisa atender a todos. O número do processo vale em qualquer formato, porque só os dígitos contam. Todos os dados do XML estão no detalhe.",
        parametros: [
          { nome: "rpi", descricao: "Número da edição.", exemplo: "2912" },
          { nome: "processo", descricao: "Número do processo, em qualquer formato: BR 10 2015 012489-9, BR102015012489-9 ou 1020150124899.", exemplo: "BR102015012489-9" },
          { nome: "despacho", descricao: "Código do despacho. Ex.: 3.1 (publicação do pedido), 6.1 (exigência técnica), 9.1 (deferimento), 16.1 (concessão).", exemplo: "16.1" },
          { nome: "titular", descricao: "Trecho do nome do titular ou depositante.", exemplo: "unicamp" },
          { nome: "inventor", descricao: "Trecho do nome do inventor.", exemplo: "silva" },
          { nome: "ipc", descricao: "Início da classificação IPC: seção, classe, subclasse ou grupo. Com ou sem espaço.", exemplo: "A61K" },
          { nome: "kindcode", descricao: "Tipo do documento. Ex.: A2 (pedido de invenção), B1 (patente de invenção), U2 (pedido de modelo de utilidade), Y1 (patente de modelo de utilidade).", exemplo: "B1" },
          ...PAGINACAO,
        ],
        sucesso: {
          status: 200,
          quando: "Consulta bem-sucedida. Ordenada da edição mais recente para a mais antiga e, dentro dela, na ordem da revista. Pode vir vazia.",
          corpo: `{
  "total": 1,
  "page": 1,
  "limit": 20,
  "pages": 1,
  "results": [
    {
      "numero_rpi": 2912,
      "codigo": "16.1",
      "titulo": "Concessão de Patente ou Certificado de Adição de Invenção",
      "comentario": "Prazo de Validade: 20 (vinte) anos contados a partir de 28/05/2015, ...",
      "numero_processo": "BR 10 2015 012489-9",
      "numero_inid": "11",
      "kindcode": "B1",
      "titulo_patente": "LUMINÁRIA RETRÁTIL PARA ILUMINAÇÃO PÚBLICA",
      "data_deposito": "2015-05-28",
      "data_concessao": null,
      "data_fase_nacional": null,
      "data_publicacao_nacional": "2017-01-17",
      "pct_numero": null,
      "pct_data": null,
      "wo_numero": null,
      "wo_data": null,
      "divisao_numero": null,
      "divisao_data": null,
      "pedido_principal_numero": null,
      "pedido_principal_data": null,
      "titulares": [{ "nome": "PROJELUZ LUMINÁRIAS E ARTEFATOS DE METAIS LTDA.", "pais": "BR", "uf": "PR", "inid": "73" }],
      "inventores": [{ "nome": "NADINAEL JOSÉ DA SILVA" }],
      "classificacoes": [
        { "tipo": "internacional", "codigo": "F21V 21/28", "ano": "2006.01" },
        { "tipo": "internacional", "codigo": "F21V 21/34", "ano": "2006.01" }
      ],
      "prioridades": []
    }
  ]
}`,
        },
        erros: [
          {
            status: 400,
            quando: "Parâmetro desconhecido, número inválido, IPC que não começa por uma seção de A a H ou `limit` acima de 100.",
            corpo: `{
  "status": 400,
  "message": "Unknown parameter(s): marca. Accepted: rpi, processo, despacho, titular, inventor, ipc, kindcode, page, limit."
}`,
          },
          ...ERROS_COMUNS,
        ],
        exemplo: exemploConsulta("/api/rpi/patentes", "?rpi=2912&despacho=16.1&ipc=A61K"),
      },
      {
        id: "rpi-patentes-detalhe",
        metodo: "GET",
        caminho: "/api/rpi/patentes/{numero_rpi}/{numero_processo}",
        titulo: "Detalhar um processo publicado",
        descricao:
          "Todos os despachos do processo na edição, na ordem da revista. Quase sempre é um só; quando são mais, cada despacho traz o processo como o INPI o publicou naquele despacho (por exemplo, como pedido, com INID 21, num deles e como patente concedida, com INID 11, no outro). Cada despacho traz também, em `dados`, o despacho inteiro como veio no XML do INPI. O número do processo vale em qualquer formato.",
        sucesso: {
          status: 200,
          quando: "Processo encontrado na edição.",
          corpo: `{
  "numero_rpi": 2912,
  "numero_processo": "BR 10 2015 012489-9",
  "despachos": [
    {
      "codigo": "16.1",
      "titulo": "Concessão de Patente ou Certificado de Adição de Invenção",
      "numero_inid": "11",
      "kindcode": "B1",
      "titulares": [ ... ],
      "inventores": [ ... ],
      "classificacoes": [ ... ],
      "prioridades": [],
      "dados": {
        "codigo": "16.1",
        "processo-patente": {
          "numero": { "inid": "11", "kindcode": "B1", "#text": "BR 10 2015 012489-9" },
          ...
        }
      }
    }
  ]
}`,
        },
        erros: [
          {
            status: 404,
            quando: "O processo não foi publicado nessa edição.",
            corpo: `{
  "status": 404,
  "message": "No patent process \\"1020150124899\\" found in RPI 2911."
}`,
          },
          ...ERROS_COMUNS,
        ],
        exemplo: `const resposta = await fetch("${BASE_URL}/api/rpi/patentes/2912/1020150124899", {
  headers: { Authorization: \`Bearer \${accessToken}\` },
});

const { despachos } = await resposta.json();`,
      },
    ],
  },
  {
    id: "rpi-programas",
    titulo: "Programas de computador (Seção VII)",
    descricao:
      "Os despachos de registro de programa de computador publicados em cada edição da RPI, com titulares, criadores, linguagens, campos de aplicação e tipos de programa. Como em Patentes, cada resultado é um despacho.",
    endpoints: [
      {
        id: "rpi-programas-edicoes",
        metodo: "GET",
        caminho: "/api/rpi/programas_computador/edicoes",
        titulo: "Listar as edições disponíveis",
        descricao:
          "As edições da RPI com Programas de computador já carregadas, da mais recente para a mais antiga, com o número de despachos de cada uma. O campo `arquivos` aponta para os arquivos originais da edição.",
        sucesso: {
          status: 200,
          quando: "Consulta bem-sucedida.",
          corpo: `{
  "results": [
    { "numero_rpi": 2912, "data_publicacao": "2026-10-27", "despachos": 334, "arquivos": "/api/rpi/programas_computador/2912/arquivos" }
  ]
}`,
        },
        erros: ERROS_COMUNS,
        exemplo: `const resposta = await fetch("${BASE_URL}/api/rpi/programas_computador/edicoes", {
  headers: { Authorization: \`Bearer \${accessToken}\` },
});

const { results } = await resposta.json();
const ultima = results[0]?.numero_rpi;`,
      },
      {
        id: "rpi-programas-lista",
        metodo: "GET",
        caminho: "/api/rpi/programas_computador",
        titulo: "Buscar despachos publicados",
        descricao:
          "Lista paginada de despachos com filtros, que podem ser combinados: o despacho precisa atender a todos. O número do processo vale em qualquer formato, porque só os dígitos contam. Todos os dados do XML estão no detalhe.",
        parametros: [
          { nome: "rpi", descricao: "Número da edição.", exemplo: "2912" },
          { nome: "processo", descricao: "Número do processo, em qualquer formato: BR 51 2025 006737-2, BR512025006737-2 ou 5120250067372.", exemplo: "BR512025006737-2" },
          { nome: "despacho", descricao: "Código do despacho. Ex.: 730 (expedição do certificado de registro), 734 (transferência de titularidade), 733 (alteração de endereço).", exemplo: "730" },
          { nome: "titular", descricao: "Trecho do nome do titular.", exemplo: "universidade" },
          { nome: "criador", descricao: "Trecho do nome do criador (autor do programa).", exemplo: "silva" },
          { nome: "linguagem", descricao: "Linguagem de programação, pelo nome exato que o INPI publica: JAVA não traz JAVA SCRIPT.", exemplo: "PYTHON" },
          { nome: "campo_aplicacao", descricao: "Início do código do campo de aplicação: a área (SD) ou o código completo (SD-06).", exemplo: "SD" },
          { nome: "tipo_programa", descricao: "Início do código do tipo de programa: a categoria (IA) ou o código completo (IA-02).", exemplo: "IA" },
          ...PAGINACAO,
        ],
        sucesso: {
          status: 200,
          quando: "Consulta bem-sucedida. Ordenada da edição mais recente para a mais antiga e, dentro dela, na ordem da revista. Pode vir vazia.",
          corpo: `{
  "total": 1,
  "page": 1,
  "limit": 20,
  "pages": 1,
  "results": [
    {
      "numero_rpi": 2912,
      "codigo": "730",
      "titulo": "Expedição do Certificado de Registro",
      "comentario": null,
      "numero_processo": "BR 51 2025 006737-2",
      "titulo_programa": "FERRAMENTA PARA PREDIÇÃO DE IDADE ÓSSEA EM IMAGENS DE RADIOGRAFIA CARPAL ...",
      "data_criacao": "2025-01-01",
      "titulares": [{ "nome": "HOSPITAL DE CLÍNICAS DE PORTO ALEGRE (HCPA)" }],
      "criadores": [{ "nome": "ALEXANDRE BACELAR" }, { "nome": "CARLA DINIZ LOPES BECKER" }],
      "linguagens": [{ "nome": "OUTROS" }, { "nome": "PYTHON" }],
      "classificacoes": [
        { "tipo": "campo_aplicacao", "codigo": "SD-06" },
        { "tipo": "tipo_programa", "codigo": "IA-02" }
      ]
    }
  ]
}`,
        },
        erros: [
          {
            status: 400,
            quando: "Parâmetro desconhecido, número inválido ou `limit` acima de 100.",
            corpo: `{
  "status": 400,
  "message": "Unknown parameter(s): ipc. Accepted: rpi, processo, despacho, titular, criador, linguagem, campo_aplicacao, tipo_programa, page, limit."
}`,
          },
          ...ERROS_COMUNS,
        ],
        exemplo: exemploConsulta("/api/rpi/programas_computador", "?rpi=2912&linguagem=PYTHON&tipo_programa=IA"),
      },
      {
        id: "rpi-programas-detalhe",
        metodo: "GET",
        caminho: "/api/rpi/programas_computador/{numero_rpi}/{numero_processo}",
        titulo: "Detalhar um processo publicado",
        descricao:
          "Todos os despachos do processo na edição, na ordem da revista, cada um com `dados`: o despacho inteiro como veio no XML do INPI. O número do processo vale em qualquer formato.",
        sucesso: {
          status: 200,
          quando: "Processo encontrado na edição.",
          corpo: `{
  "numero_rpi": 2912,
  "numero_processo": "BR 51 2025 006737-2",
  "despachos": [
    {
      "codigo": "730",
      "titulo": "Expedição do Certificado de Registro",
      "titulo_programa": "FERRAMENTA PARA PREDIÇÃO DE IDADE ÓSSEA ...",
      "data_criacao": "2025-01-01",
      "titulares": [ ... ],
      "criadores": [ ... ],
      "linguagens": [ ... ],
      "classificacoes": [ ... ],
      "dados": {
        "codigo": "730",
        "processo-programa": {
          "numero": { "inid": "Np", "#text": "BR 51 2025 006737-2" },
          ...
        }
      }
    }
  ]
}`,
        },
        erros: [
          {
            status: 404,
            quando: "O processo não foi publicado nessa edição.",
            corpo: `{
  "status": 404,
  "message": "No software process \\"5120250067372\\" found in RPI 2911."
}`,
          },
          ...ERROS_COMUNS,
        ],
        exemplo: `const resposta = await fetch("${BASE_URL}/api/rpi/programas_computador/2912/5120250067372", {
  headers: { Authorization: \`Bearer \${accessToken}\` },
});

const { despachos } = await resposta.json();`,
      },
    ],
  },
  {
    id: "rpi-contratos",
    titulo: "Contratos de tecnologia (Seção II)",
    descricao:
      "Os despachos de averbação e registro de contratos de tecnologia publicados em cada edição da RPI: as partes (cedente e cessionária), os certificados expedidos, com objeto, valor e prazos, e as petições notificadas. Como em Patentes, cada resultado é um despacho. Despacho sem processo — “Pedido inexistente” (140), que traz só a petição recusada — vem com `numero_processo` nulo e é achado pelo filtro `peticao`.",
    endpoints: [
      {
        id: "rpi-contratos-edicoes",
        metodo: "GET",
        caminho: "/api/rpi/contratos_tecnologia/edicoes",
        titulo: "Listar as edições disponíveis",
        descricao:
          "As edições da RPI com Contratos de tecnologia já carregados, da mais recente para a mais antiga, com o número de despachos de cada uma. O campo `arquivos` aponta para os arquivos originais da edição.",
        sucesso: {
          status: 200,
          quando: "Consulta bem-sucedida.",
          corpo: `{
  "results": [
    { "numero_rpi": 2912, "data_publicacao": "2026-10-27", "despachos": 42, "arquivos": "/api/rpi/contratos_tecnologia/2912/arquivos" }
  ]
}`,
        },
        erros: ERROS_COMUNS,
        exemplo: `const resposta = await fetch("${BASE_URL}/api/rpi/contratos_tecnologia/edicoes", {
  headers: { Authorization: \`Bearer \${accessToken}\` },
});

const { results } = await resposta.json();
const ultima = results[0]?.numero_rpi;`,
      },
      {
        id: "rpi-contratos-lista",
        metodo: "GET",
        caminho: "/api/rpi/contratos_tecnologia",
        titulo: "Buscar despachos publicados",
        descricao:
          "Lista paginada de despachos com filtros, que podem ser combinados: o despacho precisa atender a todos. Os filtros de certificado (categoria, certificado) valem para o mesmo certificado, e os de petição (peticao, requerente), para a mesma petição. O número do processo vale em qualquer formato, porque só os dígitos contam. Todos os dados do XML estão no detalhe.",
        parametros: [
          { nome: "rpi", descricao: "Número da edição.", exemplo: "2912" },
          { nome: "processo", descricao: "Número do processo, em qualquer formato: BR 70 2014 000160-6, BR702014000160-6 ou 7020140001606. Processos antigos têm só dígitos (ex.: 120068).", exemplo: "BR702014000160-6" },
          { nome: "despacho", descricao: "Código do despacho. Ex.: 145 (exigência), 150 (petição notificada), 350 (certificado expedido).", exemplo: "350" },
          { nome: "cedente", descricao: "Trecho do nome do cedente, quem fornece a tecnologia.", exemplo: "honda" },
          { nome: "cessionaria", descricao: "Trecho do nome da cessionária, quem recebe a tecnologia.", exemplo: "honda" },
          { nome: "categoria", descricao: "Trecho da categoria do certificado. Ex.: MARCA (uso de marca), PATENTE (exploração de patente).", exemplo: "patente" },
          { nome: "certificado", descricao: "Número do certificado de averbação.", exemplo: "702014000160/13" },
          { nome: "peticao", descricao: "Número da petição notificada.", exemplo: "880260000849" },
          { nome: "requerente", descricao: "Trecho do nome de quem fez a petição.", exemplo: "vallourec" },
          ...PAGINACAO,
        ],
        sucesso: {
          status: 200,
          quando: "Consulta bem-sucedida. Ordenada da edição mais recente para a mais antiga e, dentro dela, na ordem da revista. Pode vir vazia.",
          corpo: `{
  "total": 1,
  "page": 1,
  "limit": 20,
  "pages": 1,
  "results": [
    {
      "numero_rpi": 2912,
      "codigo": "350",
      "titulo": "Certificado expedido",
      "comentario": null,
      "numero_processo": "BR 70 2014 000160-6",
      "data_protocolo": "2026-10-05",
      "partes": [
        { "tipo": "cedente", "nome": "VALLOUREC OIL & GAS FRANCE", "pais": "FRANÇA", "setor": null },
        { "tipo": "cessionaria", "nome": "ONESUBSEA DO BRASIL SERVIÇOS SUBMARINOS LTDA.", "pais": "BRASIL", "setor": "Fabricação de máquinas e equipamentos para a prospecção e extração de petróleo" }
      ],
      "certificados": [
        {
          "numero": "702014000160/13",
          "natureza_documento": "Contrato de 05/10/2012.",
          "categorias": "USO DE MARCA;EXPLORAÇÃO DE PATENTE",
          "texto_objeto": "UM- Licença/sublicença não exclusiva para os Registros de Marca ...",
          "moeda": "EURO",
          "valor": "- UM: \\"NIHIL\\". - EP: EUR 18,00 até EUR 130,00 por unidade dos produtos, ...",
          "prazo_contrato": "De 05/10/2012 até 05/10/2027.",
          "prazo_vigencia_pi": "De 18/09/2014 até 05/10/2027, observando-se a vigência dos direitos ...",
          "observacao": "1- A validade deste Certificado de Averbação está condicionada ..."
        }
      ],
      "peticoes": []
    }
  ]
}`,
        },
        erros: [
          {
            status: 400,
            quando: "Parâmetro desconhecido, número inválido ou `limit` acima de 100.",
            corpo: `{
  "status": 400,
  "message": "Unknown parameter(s): titular. Accepted: rpi, processo, despacho, cedente, cessionaria, categoria, certificado, peticao, requerente, page, limit."
}`,
          },
          ...ERROS_COMUNS,
        ],
        exemplo: exemploConsulta("/api/rpi/contratos_tecnologia", "?rpi=2912&despacho=350&categoria=patente"),
      },
      {
        id: "rpi-contratos-detalhe",
        metodo: "GET",
        caminho: "/api/rpi/contratos_tecnologia/{numero_rpi}/{numero_processo}",
        titulo: "Detalhar um processo publicado",
        descricao:
          "Todos os despachos do processo na edição, na ordem da revista, cada um com `dados`: o despacho inteiro como veio no XML do INPI. O número do processo vale em qualquer formato.",
        sucesso: {
          status: 200,
          quando: "Processo encontrado na edição.",
          corpo: `{
  "numero_rpi": 2912,
  "numero_processo": "BR 70 2014 000318-8",
  "despachos": [
    {
      "codigo": "150",
      "titulo": "Notificado o Requerimento de Averbação/Registro ou Petição",
      "data_protocolo": null,
      "partes": [],
      "certificados": [],
      "peticoes": [
        { "numero": "880260000849", "data_protocolo": "2026-10-19", "requerente": "VALLOUREC SOLUÇÕES TUBULARES DO BRASIL S/A" }
      ],
      "dados": {
        "codigo": "150",
        "processo-contrato": {
          "numero": { "inid": "Np", "#text": "BR 70 2014 000318-8" },
          ...
        }
      }
    }
  ]
}`,
        },
        erros: [
          {
            status: 404,
            quando: "O processo não foi publicado nessa edição.",
            corpo: `{
  "status": 404,
  "message": "No technology contract process \\"7020140003188\\" found in RPI 2911."
}`,
          },
          ...ERROS_COMUNS,
        ],
        exemplo: `const resposta = await fetch("${BASE_URL}/api/rpi/contratos_tecnologia/2912/7020140003188", {
  headers: { Authorization: \`Bearer \${accessToken}\` },
});

const { despachos } = await resposta.json();`,
      },
    ],
  },
  {
    id: "rpi-indicacoes",
    titulo: "Indicações geográficas (Seção IV)",
    descricao:
      "Os despachos de Indicação Geográfica publicados em cada edição da RPI. O INPI publica esta seção só em PDF: os campos saem da ficha que abre cada despacho, conferidos contra o índice da revista e o rodapé da ficha, e o texto inteiro do despacho (ficha e anexos, com OCR nas páginas escaneadas) fica disponível para busca. Cada despacho informa como foi lido (`extraido_por`) e a situação da leitura (`status_extracao`): ok (passou em todas as conferências), alerta (alguma conferência não fechou; os motivos vêm em `alertas`) ou conferido (revisado por uma pessoa, com `conferido_em`).",
    endpoints: [
      {
        id: "rpi-indicacoes-edicoes",
        metodo: "GET",
        caminho: "/api/rpi/indicacoes_geograficas/edicoes",
        titulo: "Listar as edições disponíveis",
        descricao:
          "As edições da RPI com Indicações geográficas já carregadas, da mais recente para a mais antiga, com o número de despachos de cada uma. O campo `arquivos` aponta para o PDF original da edição.",
        sucesso: {
          status: 200,
          quando: "Consulta bem-sucedida.",
          corpo: `{
  "results": [
    { "numero_rpi": 2912, "data_publicacao": "2026-10-27", "despachos": 4, "arquivos": "/api/rpi/indicacoes_geograficas/2912/arquivos" }
  ]
}`,
        },
        erros: ERROS_COMUNS,
        exemplo: `const resposta = await fetch("${BASE_URL}/api/rpi/indicacoes_geograficas/edicoes", {
  headers: { Authorization: \`Bearer \${accessToken}\` },
});

const { results } = await resposta.json();
const ultima = results[0]?.numero_rpi;`,
      },
      {
        id: "rpi-indicacoes-lista",
        metodo: "GET",
        caminho: "/api/rpi/indicacoes_geograficas",
        titulo: "Buscar despachos publicados",
        descricao:
          "Lista paginada de despachos com filtros, que podem ser combinados: o despacho precisa atender a todos. O número do pedido vale em qualquer formato, porque só os dígitos contam. O texto completo de cada despacho está no detalhe.",
        parametros: [
          { nome: "rpi", descricao: "Número da edição.", exemplo: "2912" },
          { nome: "processo", descricao: "Número do pedido, em qualquer formato.", exemplo: "BR402026000003-1" },
          { nome: "despacho", descricao: "Código do despacho. Ex.: 310 (exigência em pedido de registro), 395 (concessão de registro).", exemplo: "395" },
          { nome: "indicacao", descricao: "Trecho do nome da indicação geográfica.", exemplo: "friburgo" },
          { nome: "especie", descricao: "Trecho da espécie: Indicação de Procedência ou Denominação de Origem.", exemplo: "origem" },
          { nome: "requerente", descricao: "Trecho do nome do requerente.", exemplo: "sindicato" },
          { nome: "texto", descricao: "Trecho procurado no texto inteiro do despacho, anexos incluídos (relatórios de exame, cadernos de especificações).", exemplo: "jabuticaba" },
          { nome: "status", descricao: "Situação da leitura do PDF: ok (passou em todas as conferências), alerta (alguma conferência não fechou) ou conferido (revisado por uma pessoa).", exemplo: "alerta" },
          ...PAGINACAO,
        ],
        sucesso: {
          status: 200,
          quando: "Consulta bem-sucedida. Ordenada da edição mais recente para a mais antiga e, dentro dela, na ordem do PDF. Pode vir vazia.",
          corpo: `{
  "total": 1,
  "page": 1,
  "limit": 20,
  "pages": 1,
  "results": [
    {
      "numero_rpi": 2912,
      "codigo": "395",
      "descricao_codigo": "Concessão de registro",
      "numero_processo": "BR402026000003-1",
      "indicacao_geografica": "Nova Friburgo",
      "especie": "Indicação de Procedência",
      "natureza": "Produto",
      "produto": "Lingerie",
      "pais": "Brasil",
      "delimitacao": "Compreende os municípios de Nova Friburgo, Cachoeiras de Macacu, ...",
      "data_deposito": "2026-03-05",
      "requerente": "Sindicato das Indústrias do Vestuário de Nova Friburgo – SINDVEST",
      "procurador": "Marcos Fabricio Welge Gonçalves",
      "despacho": "Comunicação de concessão de registro de reconhecimento de Indicação Geográfica. ...",
      "pagina_inicio": 27,
      "pagina_fim": 50,
      "extraido_por": "ocr+claude-haiku-5-5",
      "status_extracao": "ok",
      "alertas": null,
      "conferido_por": null,
      "conferido_em": null
    }
  ]
}`,
        },
        erros: [
          {
            status: 400,
            quando: "Parâmetro desconhecido, número inválido, status diferente de ok/alerta/conferido ou `limit` acima de 100.",
            corpo: `{
  "status": 400,
  "message": "The \\"status\\" parameter accepts \\"ok\\", \\"alerta\\" or \\"conferido\\"."
}`,
          },
          ...ERROS_COMUNS,
        ],
        exemplo: exemploConsulta("/api/rpi/indicacoes_geograficas", "?rpi=2912&especie=origem"),
      },
      {
        id: "rpi-indicacoes-detalhe",
        metodo: "GET",
        caminho: "/api/rpi/indicacoes_geograficas/{numero_rpi}/{numero_processo}",
        titulo: "Detalhar um pedido publicado",
        descricao:
          "Todos os despachos do pedido na edição, na ordem do PDF, com os mesmos campos da lista e mais `texto_completo`: o texto do despacho inteiro, ficha e anexos. As páginas escaneadas entram pelo OCR. O número do pedido vale em qualquer formato.",
        sucesso: {
          status: 200,
          quando: "Pedido encontrado na edição.",
          corpo: `{
  "numero_rpi": 2912,
  "numero_processo": "BR402026000003-1",
  "despachos": [
    {
      "codigo": "395",
      "descricao_codigo": "Concessão de registro",
      "indicacao_geografica": "Nova Friburgo",
      ...
      "pagina_inicio": 27,
      "pagina_fim": 50,
      "texto_completo": "INDICAÇÕES GEOGRÁFICAS — RPI 2912 de 27 de outubro de 2026 ...",
      "extraido_por": "ocr+claude-haiku-5-5",
      "status_extracao": "ok",
      "alertas": null
    }
  ]
}`,
        },
        erros: [
          {
            status: 404,
            quando: "O pedido não foi publicado nessa edição.",
            corpo: `{
  "status": 404,
  "message": "No geographical indication application \\"BR402026000003-1\\" found in RPI 2911."
}`,
          },
          ...ERROS_COMUNS,
        ],
        exemplo: `const resposta = await fetch("${BASE_URL}/api/rpi/indicacoes_geograficas/2912/BR402026000003-1", {
  headers: { Authorization: \`Bearer \${accessToken}\` },
});

const { despachos } = await resposta.json();`,
      },
    ],
  },
  ...gruposLista({
    id: "desenhos",
    secao: "desenhos_industriais",
    titulo: "Desenhos industriais (Seção III)",
    descricao:
      "Os despachos de desenho industrial publicados em cada edição da RPI: depósitos, exigências, concessões (com título, autor e classificação de Locarno), extinções, nulidades, petições e decisões judiciais. O INPI publica esta seção só em PDF, como uma lista: cada despacho tem à esquerda o identificador — o processo (BR302025000451-9), o registro antigo (DI6101520-2) ou a petição (870250102286, com a data) — e à direita o título e os campos. Cada resultado é um despacho.",
    despachos: 765,
    filtroExtra: { nome: "classificacao", descricao: "Início da classificação de Locarno: a classe (09) ou a subclasse (09-01).", exemplo: "09-01" },
    exemploLista: `{
      "numero_rpi": 2912,
      "identificador": "BR302025000453-5",
      "tipo_identificador": "processo",
      "complemento": "0/ 0000000453",
      "data_peticao": null,
      "subsecao": "Registro de desenho industrial concedido",
      "codigo": "158",
      "titulo": "Concessão de registro",
      "numero_processo": "BR302025000453-5",
      "titular": "NATURA COSMÉTICOS S.A. [BR/SP]",
      "autor": "DENIS CARLOS DO NASCIMENTO[BR]",
      "titulo_registro": "Frasco",
      "data_deposito": "2025-01-31",
      "classificacao": "09-01",
      "procurador": "Dannemann, Siemsen, Bigler & Ipanema Moreira",
      "requerente": null,
      "titular_registro": null,
      "procurador_titular": null,
      "peticao_tipo": null,
      "peticao_afetada": null,
      "prioridade": null,
      "detalhes": "De acordo com o item 3.5.2 do Manual de Desenhos Industriais, ...",
      "pagina": 38,
      "extraido_por": "regras",
      "status_extracao": "ok",
      "alertas": null,
      "conferido_por": null,
      "conferido_em": null
    }`,
    processoExemplo: "BR302025000453-5",
    despachoExemplo: "158",
    erro404: "No industrial design process \\\"BR302025000453-5\\\" found in RPI 2911.",
  }),
  ...gruposLista({
    id: "topografias",
    secao: "topografias_circuitos",
    titulo: "Topografias de circuitos integrados (Seção VIII)",
    descricao:
      "Os despachos de topografia de circuito integrado publicados em cada edição da RPI. O INPI publica esta seção só em PDF e, na maioria das semanas, sem despachos (\"Sem Publicação\"): a edição aparece em /edicoes com zero despachos. Os campos comuns vêm em colunas; os demais, em `campos_impressos` no detalhe.",
    despachos: 0,
    exemploLista: `{
      "numero_rpi": 2912,
      "identificador": "BR...",
      "tipo_identificador": "processo",
      "codigo": "...",
      "titulo": "...",
      "numero_processo": "BR...",
      "titular": "...",
      "procurador": "...",
      "data_deposito": "AAAA-MM-DD",
      "detalhes": null,
      "pagina": 4,
      "extraido_por": "regras",
      "status_extracao": "ok",
      "alertas": null,
      "conferido_por": null,
      "conferido_em": null
    }`,
    processoExemplo: "BR...",
    despachoExemplo: "...",
    erro404: "No integrated circuit topography process \\\"...\\\" found in RPI 2911.",
  }),
  {
    id: "rpi-comunicados",
    titulo: "Comunicados (Seção I)",
    descricao:
      "Os comunicados das diretorias do INPI publicados em cada edição da RPI: avisos, mudanças de procedimento e listas (por exemplo, restituições de retribuição deferidas e indeferidas). O INPI publica esta seção só em PDF. O texto vem inteiro; as tabelas são lidas e conferidas contra os números da página, e cada linha delas pode ser buscada pelo número do processo. Um comunicado não tem processo: no detalhe, ele é identificado pela posição na edição.",
    endpoints: [
      {
        id: "rpi-comunicados-edicoes",
        metodo: "GET",
        caminho: "/api/rpi/comunicados/edicoes",
        titulo: "Listar as edições disponíveis",
        descricao:
          "As edições da RPI com Comunicados já carregados, da mais recente para a mais antiga, com o número de comunicados de cada uma. O campo `arquivos` aponta para o PDF original da edição.",
        sucesso: {
          status: 200,
          quando: "Consulta bem-sucedida.",
          corpo: `{
  "results": [
    { "numero_rpi": 2912, "data_publicacao": "2026-10-27", "comunicados": 3, "arquivos": "/api/rpi/comunicados/2912/arquivos" }
  ]
}`,
        },
        erros: ERROS_COMUNS,
        exemplo: `const resposta = await fetch("${BASE_URL}/api/rpi/comunicados/edicoes", {
  headers: { Authorization: \`Bearer \${accessToken}\` },
});

const { results } = await resposta.json();`,
      },
      {
        id: "rpi-comunicados-lista",
        metodo: "GET",
        caminho: "/api/rpi/comunicados",
        titulo: "Buscar comunicados",
        descricao:
          "Lista paginada de comunicados com filtros, que podem ser combinados. A lista traz o cabeçalho e quantas linhas de tabela o comunicado tem; o texto e as tabelas estão no detalhe.",
        parametros: [
          { nome: "rpi", descricao: "Número da edição.", exemplo: "2912" },
          { nome: "titulo", descricao: "Trecho do título.", exemplo: "restituição" },
          { nome: "orgao", descricao: "Trecho do órgão que publica.", exemplo: "administração" },
          { nome: "texto", descricao: "Trecho procurado no texto inteiro do comunicado.", exemplo: "cachaça" },
          { nome: "processo", descricao: "Número de processo numa tabela do comunicado (processo administrativo ou de PI).", exemplo: "52402.025041/2026" },
          { nome: "status", descricao: "Situação da leitura do PDF: ok, alerta ou conferido.", exemplo: "ok" },
          ...PAGINACAO,
        ],
        sucesso: {
          status: 200,
          quando: "Consulta bem-sucedida. Ordenada da edição mais recente para a mais antiga e, dentro dela, na ordem do PDF. Pode vir vazia.",
          corpo: `{
  "total": 1,
  "page": 1,
  "limit": 20,
  "pages": 1,
  "results": [
    {
      "numero_rpi": 2912,
      "sequencia": 3,
      "orgao": "DIRETORIA DE ADMINISTRAÇÃO / COORDENAÇÃO-GERAL DE ORÇAMENTO, CONTABILIDADE E FINANÇAS / DIVISÃO DE ANÁLISE FINANCEIRA",
      "titulo": "Processos de Restituição de Retribuição Indeferidos",
      "pagina_inicio": 5,
      "pagina_fim": 8,
      "extraido_por": "claude-haiku-5-5",
      "status_extracao": "ok",
      "alertas": null,
      "conferido_por": null,
      "conferido_em": null,
      "linhas_de_tabela": 96
    }
  ]
}`,
        },
        erros: [
          {
            status: 400,
            quando: "Parâmetro desconhecido, número inválido, status diferente de ok/alerta/conferido ou `limit` acima de 100.",
            corpo: `{
  "status": 400,
  "message": "Unknown parameter(s): despacho. Accepted: rpi, titulo, orgao, texto, processo, status, page, limit."
}`,
          },
          ...ERROS_COMUNS,
        ],
        exemplo: exemploConsulta("/api/rpi/comunicados", "?rpi=2912&processo=52402.025041/2026"),
      },
      {
        id: "rpi-comunicados-detalhe",
        metodo: "GET",
        caminho: "/api/rpi/comunicados/{numero_rpi}/{sequencia}",
        titulo: "Detalhar um comunicado",
        descricao:
          "O comunicado inteiro: cabeçalho, texto e tabelas. `sequencia` é a posição do comunicado na edição (1, 2, 3...), que vem na lista.",
        sucesso: {
          status: 200,
          quando: "Comunicado encontrado.",
          corpo: `{
  "numero_rpi": 2912,
  "sequencia": 2,
  "orgao": "DIRETORIA DE ADMINISTRAÇÃO / COORDENAÇÃO-GERAL DE ORÇAMENTO, CONTABILIDADE E FINANÇAS / DIVISÃO DE ANÁLISE FINANCEIRA",
  "titulo": "Segue abaixo a lista dos processos de restituição de retribuição deferidos.",
  "texto": "DIRETORIA DE ADMINISTRAÇÃO ...",
  "tabelas": [
    {
      "titulo": "Processos de restituição de retribuição deferidos",
      "colunas": ["Nº do processo", "Nº da GRU"],
      "linhas": [["52402.025041/2026", "29409172355017020"]]
    }
  ],
  "pagina_inicio": 4,
  "pagina_fim": 4,
  "extraido_por": "claude-haiku-5-5",
  "status_extracao": "ok",
  "alertas": null,
  "conferido_por": null,
  "conferido_em": null,
  "correcoes": null
}`,
        },
        erros: [
          {
            status: 404,
            quando: "Não há comunicado nessa posição da edição.",
            corpo: `{
  "status": 404,
  "message": "No notice 9 in RPI 2912."
}`,
          },
          ...ERROS_COMUNS,
        ],
        exemplo: `const resposta = await fetch("${BASE_URL}/api/rpi/comunicados/2912/2", {
  headers: { Authorization: \`Bearer \${accessToken}\` },
});

const { tabelas } = await resposta.json();`,
      },
    ],
  },
];

/**
 * Os três endpoints das seções em lista (Desenhos industriais e Topografias),
 * que têm o mesmo formato e mudam só nos exemplos e num filtro.
 */
function gruposLista(opcoes: {
  id: string;
  secao: string;
  titulo: string;
  descricao: string;
  despachos: number;
  filtroExtra?: Parametro;
  exemploLista: string;
  processoExemplo: string;
  despachoExemplo: string;
  erro404: string;
}): GrupoEndpoints[] {
  const base = `/api/rpi/${opcoes.secao}`;
  const filtros = ["rpi", "processo", "despacho", "titular", "procurador", "requerente", "subsecao", "texto", "status", ...(opcoes.filtroExtra ? [opcoes.filtroExtra.nome] : [])];

  return [
    {
      id: `rpi-${opcoes.id}`,
      titulo: opcoes.titulo,
      descricao: opcoes.descricao,
      endpoints: [
        {
          id: `rpi-${opcoes.id}-edicoes`,
          metodo: "GET",
          caminho: `${base}/edicoes`,
          titulo: "Listar as edições disponíveis",
          descricao:
            "As edições da RPI com esta seção já carregada, da mais recente para a mais antiga, com o número de despachos de cada uma (zero quando a seção saiu sem publicação). O campo `arquivos` aponta para o PDF original da edição.",
          sucesso: {
            status: 200,
            quando: "Consulta bem-sucedida.",
            corpo: `{
  "results": [
    { "numero_rpi": 2912, "data_publicacao": "2026-10-27", "despachos": ${opcoes.despachos}, "arquivos": "${base}/2912/arquivos" }
  ]
}`,
          },
          erros: ERROS_COMUNS,
          exemplo: `const resposta = await fetch("${BASE_URL}${base}/edicoes", {
  headers: { Authorization: \`Bearer \${accessToken}\` },
});

const { results } = await resposta.json();`,
        },
        {
          id: `rpi-${opcoes.id}-lista`,
          metodo: "GET",
          caminho: base,
          titulo: "Buscar despachos publicados",
          descricao:
            "Lista paginada de despachos com filtros, que podem ser combinados: o despacho precisa atender a todos. O número do processo vale em qualquer formato, porque só os dígitos contam; nas petições, vale o processo afetado. Todos os campos impressos estão no detalhe.",
          parametros: [
            { nome: "rpi", descricao: "Número da edição.", exemplo: "2912" },
            { nome: "processo", descricao: "Número do processo, em qualquer formato. Nas petições, o processo afetado.", exemplo: opcoes.processoExemplo },
            { nome: "despacho", descricao: "Código do despacho.", exemplo: opcoes.despachoExemplo },
            { nome: "titular", descricao: "Trecho do nome do titular.", exemplo: "natura" },
            { nome: "procurador", descricao: "Trecho do nome do procurador.", exemplo: "dannemann" },
            { nome: "requerente", descricao: "Trecho do nome do requerente (petições).", exemplo: "ltda" },
            { nome: "subsecao", descricao: "Trecho da subseção do PDF: concedido, extintos, nulidade, exigência...", exemplo: "concedido" },
            { nome: "texto", descricao: "Trecho procurado nos detalhes do despacho.", exemplo: "Manual" },
            { nome: "status", descricao: "Situação da leitura do PDF: ok, alerta ou conferido.", exemplo: "ok" },
            ...(opcoes.filtroExtra ? [opcoes.filtroExtra] : []),
            ...PAGINACAO,
          ],
          sucesso: {
            status: 200,
            quando: "Consulta bem-sucedida. Ordenada da edição mais recente para a mais antiga e, dentro dela, na ordem do PDF. Pode vir vazia.",
            corpo: `{
  "total": 1,
  "page": 1,
  "limit": 20,
  "pages": 1,
  "results": [
    ${opcoes.exemploLista}
  ]
}`,
          },
          erros: [
            {
              status: 400,
              quando: "Parâmetro desconhecido, número inválido, status diferente de ok/alerta/conferido ou `limit` acima de 100.",
              corpo: `{
  "status": 400,
  "message": "Unknown parameter(s): marca. Accepted: ${[...filtros, "page", "limit"].join(", ")}."
}`,
            },
            ...ERROS_COMUNS,
          ],
          exemplo: exemploConsulta(base, `?rpi=2912&despacho=${opcoes.despachoExemplo}`),
        },
        {
          id: `rpi-${opcoes.id}-detalhe`,
          metodo: "GET",
          caminho: `${base}/{numero_rpi}/{numero_processo}`,
          titulo: "Detalhar um processo publicado",
          descricao:
            "Todos os despachos do processo na edição, na ordem do PDF, com os campos da lista e mais `campos_impressos`: cada campo como impresso, inclusive os que não têm coluna própria. Nas petições, o processo é o afetado. O número vale em qualquer formato.",
          sucesso: {
            status: 200,
            quando: "Processo encontrado na edição.",
            corpo: `{
  "numero_rpi": 2912,
  "numero_processo": "${opcoes.processoExemplo}",
  "despachos": [
    {
      "identificador": "${opcoes.processoExemplo}",
      "codigo": "${opcoes.despachoExemplo}",
      ...
      "campos_impressos": {
        "Código de despacho": "${opcoes.despachoExemplo}",
        "Titular": "...",
        ...
      },
      "correcoes": null
    }
  ]
}`,
          },
          erros: [
            {
              status: 404,
              quando: "O processo não foi publicado nessa edição.",
              corpo: `{
  "status": 404,
  "message": "${opcoes.erro404}"
}`,
            },
            ...ERROS_COMUNS,
          ],
          exemplo: `const resposta = await fetch("${BASE_URL}${base}/2912/${opcoes.processoExemplo}", {
  headers: { Authorization: \`Bearer \${accessToken}\` },
});

const { despachos } = await resposta.json();`,
        },
      ],
    },
  ];
}

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
    id: "rpi",
    titulo: "RPI — Revista da Propriedade Industrial",
    descricao:
      "As publicações semanais do INPI, edição por edição. Enquanto as bases do INPI mostram a situação atual de cada processo, a RPI mostra o que foi publicado em cada semana.",
    notas: [
      "As oito seções da revista estão disponíveis. Quatro o INPI publica também em XML (Marcas, Patentes, Programas de computador, Contratos de tecnologia); as outras — Comunicados, Desenhos industriais, Indicações geográficas e Topografias — só em PDF, e os dados delas saem da leitura do PDF.",
      "Nas seções em PDF, cada registro traz a situação da leitura (`status_extracao`): ok, alerta (alguma conferência automática não fechou — não quer dizer que o dado esteja errado) ou conferido (revisado por uma pessoa). Filtre com `status` se quiser só o que passou em todas as conferências.",
      "Uma edição nova sai toda terça-feira e fica disponível depois de carregada; consulte o /edicoes da seção (ex.: /api/rpi/patentes/edicoes) para saber a mais recente.",
    ],
    grupos: GRUPOS_RPI,
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
