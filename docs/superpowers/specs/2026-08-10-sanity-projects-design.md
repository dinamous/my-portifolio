# Migrar projetos para o Sanity

## Contexto

Hoje os cards de projeto (seção Projects/ProjectGallery) vêm de `projects.json` na raiz do repo, consumido por [src/lib/projects.ts](../../../src/lib/projects.ts). Adicionar ou editar um projeto exige mexer no JSON e fazer deploy do site. `@sanity/client` já está instalado e [src/lib/sanity.ts](../../../src/lib/sanity.ts) já tem um client configurado, mas nada o consome ainda — o comentário no arquivo já sinalizava essa migração como próximo passo.

## Objetivo

Permitir editar/adicionar projetos pelo Sanity Studio, sem alterar código nem fazer novo deploy do site.

## Escopo

Só o conteúdo de projetos. Textos de outras seções (Hero, About Me, Skills, Contact) continuam hardcoded — fora de escopo.

## Arquitetura

- Projeto Sanity novo e dedicado (não reaproveita o projeto "Next" existente na conta, que já tem datasets de outro projeto).
- Dataset `production`, ACL público (leitura via CDN, sem token).
- Sem Studio local no repo — schema definido e deployado via MCP; edição de conteúdo feita direto no sanity.io/manage (ou Studio hospedado pelo Sanity), mantendo o repo do portfólio livre de uma pasta `studio/`.

## Schema

Document `project`:

| campo | tipo | notas |
|---|---|---|
| `title` | string | obrigatório |
| `slug` | slug | source: title |
| `description` | text | obrigatório |
| `techs` | array de string | |
| `categories` | array de string | valores: Frontend, Backend, UI/UX, Mobile — mesma lista usada hoje em `CATEGORY_LABEL` |
| `image` | image | asset do Sanity; hoje cada projeto tem 1 imagem, campo fica singular (não array) — `images: string[]` no frontend continua sendo derivado como array de 1 item |
| `actions` | array de object `{label: string, link: url}` | |

`Fullstack` continua sendo derivado no frontend (Frontend + Backend juntos), não é uma categoria própria no schema.

## Migração de dados

Os 8 projetos de `projects.json` são recriados como documentos `project` no Sanity via MCP (`create_documents` + `publish_documents`), com as imagens de `public/projects/*.webp` enviadas como assets do Sanity.

## Consumo no frontend

[src/lib/projects.ts](../../../src/lib/projects.ts) passa a buscar via GROQ usando `sanityClient` ([src/lib/sanity.ts](../../../src/lib/sanity.ts)), mantendo a mesma interface pública (`Project`, `PROJECT_FILTERS`, `filterProjects`, `getProjectBySlug`) para não exigir mudanças nos componentes que já consomem essa lib (ProjectGallery, Projects, ProjectDetail).

### Fallback

Se o fetch ao Sanity falhar (erro de rede, projeto fora do ar, env vars ausentes), cai para os dados de `projects.json` em vez de quebrar a seção. `projects.json` continua no repo como fonte de fallback, não é removido.

### Env vars

`VITE_SANITY_PROJECT_ID` e `VITE_SANITY_DATASET` (já declaradas em [src/env.d.ts](../../../src/env.d.ts)) precisam ser setadas no `.env` local e nas envs de build/deploy (Vercel).

## Fora de escopo

- Studio local/customizado no repo.
- Migrar outras seções do site (Hero, About, Skills, Contact) para o Sanity.
- Autenticação/edição autenticada no frontend — o site só lê conteúdo publicado.
