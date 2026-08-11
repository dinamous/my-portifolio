# Migrar conteúdo do site para o Sanity

## Contexto

Hoje quase todo o conteúdo textual do site está hardcoded direto nos componentes `.tsx` (arrays/objetos no topo do arquivo). Editar qualquer coisa — projetos, bio, telefone de contato, lista de skills — exige mexer em código e fazer novo deploy. `@sanity/client` já está instalado e [src/lib/sanity.ts](../../../src/lib/sanity.ts) já tem um client configurado, mas nada o consome ainda. Vários componentes já têm comentários `ponytail:` sinalizando essa migração como próximo passo (`AboutMe.tsx`, `Skills.tsx`, `contact.ts`).

## Objetivo

Permitir editar todo o conteúdo do site (projetos, bio, textos de seção, skills, dados de contato) pelo Sanity Studio, sem alterar código nem fazer novo deploy.

## Escopo

Migra: Projects, About Me, What I Do, Skills, Contact (incluindo os social links que o Navbar hoje duplica como placeholder).

Fora de escopo:
- Nome "Matheus Simões" no Hero — estrutural, acoplado a uma animação letra-a-letra com IDs fixos (`hero-word-1`/`hero-word-2`); mudar isso exigiria reescrever a animação, não só trocar a fonte do texto.
- Mapeamento tech → pacote npm em [ProjectDetail.tsx](../../../src/views/ProjectDetail/ProjectDetail.tsx) (`TECH_NPM`) — é enriquecimento de UI (tooltip do registro npm), não dado de conteúdo.
- Studio local/customizado no repo — schema definido e deployado via MCP, edição de conteúdo direto no sanity.io/manage.
- Autenticação/edição no frontend — o site só lê conteúdo publicado.

## Setup do projeto Sanity

Projeto novo e dedicado (não reaproveita o projeto "Next" já existente na conta, que tem datasets de outro projeto). Dataset `production`, ACL público (leitura via CDN, sem token).

## Schema

### `project` (document)

| campo | tipo | notas |
|---|---|---|
| `title` | string | obrigatório |
| `slug` | slug | source: title |
| `description` | text | obrigatório |
| `techs` | array de string | |
| `categories` | array de string | livre (sem lista fixa no schema) — o filtro da UI é construído a partir das categorias presentes nos documentos, em vez de uma lista fixa no código. "Fullstack" continua sendo derivado no frontend quando um projeto tem Frontend + Backend juntos |
| `gallery` | array de object | mistura imagem e vídeo, ordem definida no Studio. Cada item: `{ type: "image" \| "video", image?: image, videoUrl?: url }` — `image` obrigatório quando `type` é image, `videoUrl` (link externo, ex. YouTube/Vimeo) obrigatório quando `type` é video |
| `actions` | array de object `{ label: string, link: url }` | já cobre múltiplos tipos de link (repo, protótipo, deploy) sem mudança de schema |

### `aboutMe` (singleton document)

`heading` (string), `bio` (text), `photo` (image), `local` (string), `status` (string)

### `whatIDo` (singleton document)

`items`: array de object `{ title: string, text: text }` — hoje são 2 blocos (Arquitetura/Experiência), fica como array para caber mais sem mudar schema.

### `skills` (singleton document)

`headline`: array de string (uma por linha do título)
`meta`: array de object `{ term: string, value: string }`
`categories`: array de object `{ name: string, techs: array de string }`

### `hero` (singleton document)

`typePhrases`: array de string — as frases digitadas no efeito de type. Nome permanece fixo no componente (fora de escopo, ver acima).

### `contact` (singleton document)

`email` (string), `whatsapp` (string, só dígitos DDI+DDD+número), `phoneLabel` (string), `location` (string), `availability` (string), `replyTime` (string), `socials`: array de object `{ label: string, handle: string, href: url }`

## Consumo no frontend

Cada view busca seu conteúdo via GROQ usando `sanityClient` ([src/lib/sanity.ts](../../../src/lib/sanity.ts)), seguindo o padrão já usado por [src/lib/projects.ts](../../../src/lib/projects.ts) e [src/lib/contact.ts](../../../src/lib/contact.ts) — um módulo por domínio de conteúdo em `src/lib/`.

O [Navbar.tsx](../../../src/components/Navbar/Navbar.tsx) para de ter LinkedIn/GitHub hardcoded (`href="#"` placeholder) e passa a derivar os links de `contact.socials`.

### Fallback

Se o fetch ao Sanity falhar (erro de rede, projeto fora do ar, env vars ausentes), cada módulo cai para os dados hardcoded atuais em vez de quebrar a seção. Os arrays/objetos que já existem em cada `.tsx`/`lib` viram esse fallback — não são deletados, só deixam de ser a única fonte.

### Migração de dados

Conteúdo atual (8 projetos de `projects.json`, textos hardcoded de cada view) é recriado como documentos no Sanity via MCP (`create_documents` + `publish_documents`). Imagens de `public/projects/*.webp` e `public/profile-picture.webp` são enviadas como assets do Sanity.

### Env vars

`VITE_SANITY_PROJECT_ID` e `VITE_SANITY_DATASET` (já declaradas em [src/env.d.ts](../../../src/env.d.ts)) precisam ser setadas no `.env` local e nas envs de build/deploy (Vercel).
