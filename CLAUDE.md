# openip-world — frontend

Painel administrativo do OpenIP World. Next.js 16 (App Router), publicado na
**Vercel**.

Dois projetos vizinhos, em repositórios próprios:

- `../backend` — API Express + Prisma/MySQL + Elasticsearch, que roda numa VPS
- `../../openip-world-subsistence` — worker de ingestão dos dados do INPI

## Comandos

```bash
npm run dev     # porta 3001
npm run build
npm run lint
```

Para conferir compilação, **capture a saída antes de ler o código de saída** —
`npx tsc --noEmit | head` devolve o status do `head`, não do `tsc`:

```bash
out=$(npx tsc --noEmit 2>&1); echo "exit=$?"; echo "$out" | head
```

## Estrutura

```
app/(admin)/api-docs/     documentação da API para clientes (só admin)
lib/api-docs.ts           conteúdo da página de documentação
layout/navigation.tsx     itens do menu (adminItems, searchItems)
context/UserContext       useUser(), de onde vem o papel do usuário
next.config.ts            rewrites /api/backend/* -> backend
proxy.ts                  guarda de rotas (era middleware.ts no Next <16)
```

## Convenções

**Idioma.** O painel e os comentários em **português**. As mensagens de resposta
da **API** são em inglês (quem consome são sistemas de terceiros) — ao exibir ou
documentar uma resposta da API, mantenha o texto em inglês como ele sai.

**Comentários explicam o porquê, não o quê** — veja o `rolarAte` em
`api-docs-view.tsx`, que registra por que a rolagem suave é no clique e não no
CSS global.

Indentação de 2 espaços.

## Invariantes

**O navegador nunca fala com a API direto.** O `next.config.ts` reescreve
`/api/backend/*` para o backend, e a chamada sai do servidor da Vercel. É isso
que faz o cookie de sessão ser tratado como first-party, sem CORS no caminho.

**`BACKEND_URL` é build-time.** `rewrites()` é avaliado no build; mudar a
variável na Vercel exige **redeploy**. Reiniciar não basta, e o sintoma de
esquecer é o painel continuar chamando o endereço antigo sem erro nenhum.

**Páginas de admin verificam o papel no componente, não só no menu.** Esconder o
item na navegação é conforto. Onde a página não faz chamada à API que o servidor
possa recusar, a checagem de `user?.role !== "admin"` precisa ser explícita — é o
caso de `api-docs`, que só lê conteúdo estático.

**O caminho `/admin/queues` precisa ser idêntico em três pontas** (aqui, a API e
o subsistema): o Bull Board gera as URLs dos próprios assets a partir dele. Está
nos `rewrites` do `next.config.ts`.

## Deploy

Vai para a Vercel, com *Root Directory* apontando para este repositório. Na
Vercel, defina `BACKEND_URL` com o domínio público da API. O procedimento
completo das duas VPSs e da Vercel está no passo 8 de
`../backend/deploy/README.md`.
