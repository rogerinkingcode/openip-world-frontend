/**
 * Colore os exemplos de código da página de documentação da API.
 *
 * Feito à mão, e não com uma biblioteca (Shiki, Prism), porque os exemplos são
 * nossos e cabem em pouca sintaxe: JavaScript, JSON e um cabeçalho HTTP. Um
 * tokenizador simples resolve sem trazer dezenas de KB de gramáticas para o
 * navegador. Se um dia a página mostrar outras linguagens, aí vale a biblioteca.
 *
 * As cores imitam o tema escuro padrão do VS Code (Dark+), que é o que a maior
 * parte de quem integra já tem no editor.
 */

export type TipoToken =
  | "comentario"
  | "string"
  | "chave"
  | "numero"
  | "palavra-chave"
  | "literal"
  | "funcao"
  | "propriedade"
  | "interpolacao"
  | "texto";

export type Token = { tipo: TipoToken; texto: string };

const PALAVRAS_CHAVE = new Set([
  "async",
  "await",
  "catch",
  "const",
  "else",
  "export",
  "for",
  "from",
  "function",
  "if",
  "import",
  "let",
  "new",
  "of",
  "return",
  "throw",
  "try",
  "while",
]);

const LITERAIS = new Set(["true", "false", "null", "undefined"]);

// A ordem importa: em cada posição vence a primeira alternativa que casar.
// O comentário exige não vir depois de ":" ou de letra, para "https://..." solto
// (o endereço base) não ser tomado por comentário.
const PADRAO = new RegExp(
  [
    String.raw`(?<comentario>(?<![:\w])\/\/[^\n]*)`,
    String.raw`(?<template>` + "`" + String.raw`(?:\\[\s\S]|[^\\` + "`" + String.raw`])*` + "`)",
    String.raw`(?<string>"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')`,
    String.raw`(?<numero>\b\d+(?:\.\d+)?\b)`,
    // Hífen interno entra na palavra, para cabeçalhos HTTP (Content-Type) saírem
    // inteiros. Nos exemplos, subtração sempre tem espaços em volta.
    String.raw`(?<palavra>[A-Za-z_$][\w$]*(?:-[A-Za-z][\w$]*)*)`,
  ].join("|"),
  "g",
);

export function destacar(codigo: string): Token[] {
  const tokens: Token[] = [];
  let ultimo = 0;

  const texto = (fim: number) => {
    if (fim > ultimo) tokens.push({ tipo: "texto", texto: codigo.slice(ultimo, fim) });
  };

  for (const encontrado of codigo.matchAll(PADRAO)) {
    const inicio = encontrado.index ?? 0;
    const valor = encontrado[0];
    const grupos = encontrado.groups ?? {};
    const depois = codigo.slice(inicio + valor.length);

    texto(inicio);

    if (grupos.comentario) {
      tokens.push({ tipo: "comentario", texto: valor });
    } else if (grupos.template) {
      tokens.push(...template(valor));
    } else if (grupos.string) {
      // String seguida de ":" é chave de objeto JSON ("status": 200).
      tokens.push({ tipo: /^\s*:(?!:)/.test(depois) ? "chave" : "string", texto: valor });
    } else if (grupos.numero) {
      tokens.push({ tipo: "numero", texto: valor });
    } else {
      tokens.push({ tipo: classificarPalavra(valor, codigo[inicio - 1], depois), texto: valor });
    }

    ultimo = inicio + valor.length;
  }

  texto(codigo.length);
  return tokens;
}

function classificarPalavra(palavra: string, anterior: string | undefined, depois: string): TipoToken {
  if (PALAVRAS_CHAVE.has(palavra)) return "palavra-chave";
  if (LITERAIS.has(palavra)) return "literal";
  if (/^\s*\(/.test(depois)) return "funcao";
  if (anterior === ".") return "propriedade";
  // Chave de objeto sem aspas ({ headers: ... }) ou cabeçalho HTTP
  // (Content-Type: ...). Exige espaço depois dos dois-pontos para não pegar o
  // "https" de um endereço.
  if (/^\s*:\s/.test(depois)) return "chave";
  return "texto";
}

/** Template string: o texto fica na cor de string, e cada `${...}` na cor de código. */
function template(valor: string): Token[] {
  return valor
    .split(/(\$\{[^}]*\})/)
    .filter(Boolean)
    .map((parte) => ({ tipo: parte.startsWith("${") ? "interpolacao" : "string", texto: parte }));
}

/** Cor de cada tipo de token (Tailwind). */
export const COR_TOKEN: Record<TipoToken, string> = {
  comentario: "text-[#6a9955] italic",
  string: "text-[#ce9178]",
  chave: "text-[#9cdcfe]",
  numero: "text-[#b5cea8]",
  "palavra-chave": "text-[#c586c0]",
  literal: "text-[#569cd6]",
  funcao: "text-[#dcdcaa]",
  propriedade: "text-[#9cdcfe]",
  interpolacao: "text-[#9cdcfe]",
  texto: "",
};
