# Migrar conteúdo do site para o Sanity — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer todo o conteúdo editável do site (projetos, About Me, What I Do, Skills, Contact) vir do Sanity, com fallback para os dados hardcoded atuais se o fetch falhar.

**Architecture:** Projeto Sanity novo (schema definido/deployado via MCP, sem Studio local no repo). Um módulo por domínio em `src/lib/` expõe uma função `fetchX()` que roda uma query GROQ contra `sanityClient` (já existe em [src/lib/sanity.ts](../../../src/lib/sanity.ts)) e cai para um objeto/array hardcoded em caso de erro. Cada view chama seu fetch em `useEffect` e guarda o resultado em `useState`, inicializado com o fallback para nunca renderizar vazio.

**Tech Stack:** `@sanity/client` (já instalado), GROQ, React 19 (`useState`/`useEffect`), Vite env vars (`VITE_SANITY_*`).

## Global Constraints

- Sem CSS Modules; sem novas libs de animação; GSAP é a única lib de animação (ver CLAUDE.md).
- Lógica de dados no corpo do componente, DOM/GSAP em `useEffect` (ver CLAUDE.md — "React").
- `useEffect` de animação sempre limpa listeners/tweens no `return`.
- Comentários só quando explicam um "porquê" não óbvio.
- Preferir estender `lib/*.ts` existente a criar helper duplicado.
- Variáveis de ambiente client-side usam prefixo `VITE_`.
- Mensagens de commit em gitmoji (`feat: :sparkles: ...`, `fix: :bug: ...`, `docs: :memo: ...`).
- Projeto Sanity novo e dedicado — não reaproveita o projeto "Next" (`d7mvw21x`) já existente na conta.
- Dataset `production`, ACL público.
- Fallback obrigatório: se o fetch ao Sanity falhar, cada módulo usa os dados hardcoded atuais em vez de quebrar a seção — esses dados não são deletados, viram o fallback.
- Sem Studio local no repo (`studio/` folder) — schema via MCP, edição de conteúdo em sanity.io/manage.
- Build de verificação: `npm run build` (roda `tsc && vite build`) — usar como gate em cada task, já que o repo não tem test suite.

---

## Task 1: Criar projeto Sanity, dataset e configurar env vars

**Files:**
- Create: `.env` (local, não commitado — checar `.gitignore` primeiro)
- Modify: nenhum arquivo de código nesta task

**Interfaces:**
- Produces: `projectId` e `dataset` do Sanity, usados por todas as tasks seguintes via `import.meta.env.VITE_SANITY_PROJECT_ID` / `VITE_SANITY_DATASET` (já lidos em [src/lib/sanity.ts](../../../src/lib/sanity.ts)).

- [ ] **Step 1: Confirmar que `.env` está no `.gitignore`**

Rode: `git check-ignore .env || echo "NAO IGNORADO"`.
Se aparecer "NAO IGNORADO", adicione `.env` ao `.gitignore` antes de continuar (nunca commitar credenciais/IDs de projeto em arquivo de env não seja necessário esconder — mas manter o padrão do projeto).

- [ ] **Step 2: Criar o projeto Sanity via MCP**

Use a ferramenta MCP `mcp__Sanity__create_project` com:
- `displayName`: `"portifolio-dinamous"`
- `organizationId`: `"oeiEIFD6h"` (mesma organização do projeto "Next" já existente na conta)

Guarde o `projectId` retornado — é usado em todos os passos seguintes.

- [ ] **Step 3: Criar o dataset `production`**

Use `mcp__Sanity__create_dataset` com:
- `resource.projectId`: o `projectId` do Step 2
- `datasetName`: `"production"`
- `aclMode`: `"public"`

- [ ] **Step 4: Escrever `.env` local**

Crie (ou edite) `.env` na raiz do repo com:

```
VITE_SANITY_PROJECT_ID=<projectId do Step 2>
VITE_SANITY_DATASET=production
```

- [ ] **Step 5: Verificar que o client resolve as env vars**

Rode `npm run dev`, abra o console do navegador em qualquer página e confira que não há erro de "Missing projectId" do `@sanity/client`. Pare o dev server depois de confirmar.

- [ ] **Step 6: Commit**

Não há arquivo de código pra commitar nesta task (`.env` é ignorado). Se o `.gitignore` foi alterado no Step 1:

```bash
git add .gitignore
git commit -m "$(cat <<'EOF'
chore: :see_no_evil: garante que .env fique fora do versionamento
EOF
)"
```

Se `.gitignore` já cobria `.env`, pule este commit.

---

## Task 2: Definir e deployar o schema `project`

**Files:**
- Modify: nenhum arquivo do repo do site — schema é definido e deployado via MCP diretamente no Content Lake do Sanity, sem Studio local (ver CLAUDE.md/spec: "Sem Studio local no repo").

**Interfaces:**
- Consumes: `projectId`/`dataset` da Task 1.
- Produces: document type `project` no schema Sanity, com os campos abaixo — usado pela query GROQ da Task 4.

- [ ] **Step 1: Carregar as regras de schema do Sanity**

Já carregadas nesta sessão (`get_sanity_rules` com `schema`, `get-started`, `project-structure`). Relembrando o essencial: usar `defineType`/`defineField`/`defineArrayMember`, ícone em cada document/object, categorias vs referências (aqui tudo é `object`, nada precisa ser `reference` — não há reuso entre documentos).

- [ ] **Step 2: Definir o schema `project` via MCP**

Use `mcp__Sanity__deploy_schema` (ou o fluxo equivalente indicado pelas regras carregadas) para registrar o document type `project` com este shape:

```typescript
{
  name: "project",
  title: "Project",
  type: "document",
  fields: [
    { name: "title", type: "string", validation: required },
    { name: "slug", type: "slug", options: { source: "title" }, validation: required },
    { name: "description", type: "text", validation: required },
    { name: "techs", type: "array", of: [{ type: "string" }] },
    { name: "categories", type: "array", of: [{ type: "string" }] },
    {
      name: "gallery",
      type: "array",
      of: [{
        type: "object",
        name: "galleryItem",
        fields: [
          { name: "type", type: "string", options: { list: [{ title: "Imagem", value: "image" }, { title: "Vídeo", value: "video" }], layout: "radio" }, validation: required },
          { name: "image", type: "image", hidden: ({ parent }) => parent?.type !== "image" },
          { name: "videoUrl", type: "url", hidden: ({ parent }) => parent?.type !== "video" },
        ],
      }],
    },
    {
      name: "actions",
      type: "array",
      of: [{
        type: "object",
        name: "action",
        fields: [
          { name: "label", type: "string", validation: required },
          { name: "link", type: "url", validation: required },
        ],
      }],
    },
  ],
}
```

Siga o "Toggle Pattern" das regras de schema para `image`/`videoUrl` (campo `hidden` condicional ao `type` do item pai) — ver `schema.md` já carregado, seção 4D.

- [ ] **Step 3: Confirmar o deploy**

Rode `mcp__Sanity__get_schema` (ou `list_workspace_schemas`) para o `projectId`/`dataset` da Task 1 e confirme que `project` aparece com os campos acima.

- [ ] **Step 4: Commit**

Nenhum arquivo do repo muda nesta task — nada a commitar. (O schema vive no Content Lake do Sanity, não em arquivo local.)

---

## Task 3: Migrar os 8 projetos existentes para o Sanity

**Files:**
- Modify: nenhum arquivo do repo — dados vão para o Content Lake via MCP.

**Interfaces:**
- Consumes: schema `project` da Task 2, conteúdo de `projects.json` (raiz do repo) e imagens em `public/projects/*.webp`.
- Produces: 8 documentos `project` publicados no dataset `production`, consumidos pela query da Task 4.

- [ ] **Step 1: Ler `projects.json` para ter os 8 registros em mãos**

Já lido nesta conversa — os 8 projetos são: pizza.shop, AutismVogais, EasyLearn, Clone Nubank, TextToSpeech IBM, Vizionar RA, A 13° Jornada Científica e Tecnológica, AUTISMALG.

- [ ] **Step 2: Fazer upload de cada imagem como asset Sanity**

Para cada um dos 8 arquivos em `public/projects/` (`pizzashop.webp`, `AutismVogais.webp`, `EasyLearn.webp`, `Nubank.webp`, `TextToSpeech.webp`, `Vizionar.webp`, `IFSUL.webp`, `autismalg.webp`), use a ferramenta de upload de assets do MCP Sanity (o fluxo indicado pelas regras carregadas para criar `image` assets a partir de arquivo local) contra o `projectId`/`dataset` da Task 1. Guarde o `_id` de cada asset retornado — é usado no Step 3.

- [ ] **Step 3: Criar os 8 documentos via `create_documents`**

Para cada projeto, monte um documento seguindo o schema da Task 2. Categoria normalizada igual a hoje ([src/lib/projects.ts](../../../src/lib/projects.ts) `CATEGORY_LABEL`: "Front-end"/"Front-End" → `"Frontend"`, "Back-End" → `"Backend"`, mantém `"UI/UX"`, `"Mobile"`). Exemplo para o primeiro projeto:

```json
{
  "_type": "project",
  "title": "pizza.shop",
  "slug": { "_type": "slug", "current": "pizza-shop" },
  "description": "Uma aplicação simulando um dashbaord de vendas, inspirado na plataforma Ifood.",
  "techs": ["Vue", "Vite", "Vuelidate", "shadcn/ui"],
  "categories": ["Frontend"],
  "gallery": [
    { "_type": "galleryItem", "_key": "img1", "type": "image", "image": { "_type": "image", "asset": { "_type": "reference", "_ref": "<asset _id do Step 2>" } } }
  ],
  "actions": [
    { "_type": "action", "_key": "a1", "label": "Repo", "link": "https://github.com/dinamous/pizza-shop/tree/main" },
    { "_type": "action", "_key": "a2", "label": "Link", "link": "https://pizza-shop-web.vercel.app" }
  ]
}
```

Repita para os outros 7 projetos, usando o mesmo `slug` gerado por [src/lib/projects.ts](../../../src/lib/projects.ts) `slugify()` (minúsculo, acentos removidos, espaços viram `-`) para manter compatibilidade com links existentes (`/projetos/:slug`, ver [src/lib/router.ts](../../../src/lib/router.ts)):
- `AutismVogais` → `autismvogais`
- `EasyLearn` → `easylearn`
- `Clone Nubank` → `clone-nubank`
- `TextToSpeech IBM` → `texttospeech-ibm`
- `Vizionar RA (Fictícia)` → `vizionar-ra-ficticia`
- `A 13° Jornada Científica e Tecnológica` → `a-13-jornada-cientifica-e-tecnologica`
- `AUTISMALG` → `autismalg`

Chame `mcp__Sanity__create_documents` (cria como draft).

- [ ] **Step 4: Publicar os documentos**

Chame `mcp__Sanity__publish_documents` com os IDs retornados no Step 3, para que fiquem visíveis via CDN pública (o site lê só conteúdo publicado).

- [ ] **Step 5: Verificar com uma query**

Use `mcp__Sanity__query_documents` com `*[_type == "project"]{ title, slug }` no `projectId`/`dataset` da Task 1 e confirme que os 8 títulos aparecem.

- [ ] **Step 6: Commit**

Nenhum arquivo do repo muda — nada a commitar nesta task.

---

## Task 4: Trocar `src/lib/projects.ts` para buscar do Sanity com fallback

**Files:**
- Modify: `src/lib/projects.ts`

**Interfaces:**
- Consumes: `sanityClient` de [src/lib/sanity.ts](../../../src/lib/sanity.ts); documentos `project` publicados na Task 3.
- Produces: `export async function fetchProjects(): Promise<Project[]>`, mantendo os exports existentes `Project`, `ProjectAction`, `PROJECT_FILTERS` (agora derivado, não fixo — ver Task 5) e `getProjectBySlug` passa a operar sobre o array já carregado (recebe a lista como argumento, ver assinatura abaixo).

- [ ] **Step 1: Reescrever `src/lib/projects.ts`**

Substitua o conteúdo atual por:

```typescript
import { sanityClient } from "./sanity";
import rawProjects from "../../projects.json";

export type ProjectAction = { label: string; link: string };

export type GalleryItem =
  | { type: "image"; url: string }
  | { type: "video"; url: string };

export type Project = {
  slug: string;
  title: string;
  description: string;
  tag: string;
  techs: string[];
  categories: string[];
  images: string[];
  gallery: GalleryItem[];
  actions: ProjectAction[];
};

type RawProject = {
  titulo: string;
  img: string;
  descricao: string;
  techs: string[];
  categoria?: string[];
  actions?: ProjectAction[];
};

// o campo `categoria` do JSON de fallback tem grafia inconsistente
// (Front-end / Front-End); normaliza pros rótulos usados no filtro.
const CATEGORY_LABEL: Record<string, string> = {
  "front-end": "Frontend",
  frontend: "Frontend",
  "back-end": "Backend",
  backend: "Backend",
  "ui/ux": "UI/UX",
  mobile: "Mobile",
};

function categoriesOf(raw: string[] = []) {
  const list = Array.from(new Set(raw.map((c) => CATEGORY_LABEL[c.trim().toLowerCase()] ?? c)));
  if (list.includes("Frontend") && list.includes("Backend")) list.push("Fullstack");
  return list;
}

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// fallback usado quando o fetch ao Sanity falha (rede, projeto fora do ar,
// env vars ausentes) — mesmo shape de Project, pra fetchProjects() nunca
// deixar a seção vazia.
const fallbackProjects: Project[] = (rawProjects as RawProject[]).map((p) => {
  const categories = categoriesOf(p.categoria);
  return {
    slug: slugify(p.titulo),
    title: p.titulo,
    description: p.descricao,
    tag: p.techs.join(" / "),
    techs: p.techs,
    categories,
    images: [p.img],
    gallery: [{ type: "image", url: p.img }],
    actions: p.actions ?? [],
  };
});

type SanityProjectDoc = {
  title: string;
  slug: { current: string };
  description: string;
  techs: string[] | null;
  categories: string[] | null;
  gallery: Array<{
    type: "image" | "video";
    image: { asset: { url: string } } | null;
    videoUrl: string | null;
  }> | null;
  actions: ProjectAction[] | null;
};

const PROJECTS_QUERY = `*[_type == "project"] | order(_createdAt asc){
  title,
  slug,
  description,
  techs,
  categories,
  gallery[]{ type, image{asset->{url}}, videoUrl },
  actions
}`;

function fromSanityDoc(doc: SanityProjectDoc): Project {
  const categories = categoriesOf(doc.categories ?? []);
  const gallery: GalleryItem[] = (doc.gallery ?? [])
    .map((item): GalleryItem | null => {
      if (item.type === "image" && item.image?.asset?.url) {
        return { type: "image", url: item.image.asset.url };
      }
      if (item.type === "video" && item.videoUrl) {
        return { type: "video", url: item.videoUrl };
      }
      return null;
    })
    .filter((item): item is GalleryItem => item !== null);

  return {
    slug: doc.slug.current,
    title: doc.title,
    description: doc.description,
    tag: (doc.techs ?? []).join(" / "),
    techs: doc.techs ?? [],
    categories,
    images: gallery.filter((g) => g.type === "image").map((g) => g.url),
    gallery,
    actions: doc.actions ?? [],
  };
}

export async function fetchProjects(): Promise<Project[]> {
  try {
    const docs = await sanityClient.fetch<SanityProjectDoc[]>(PROJECTS_QUERY);
    if (!docs.length) return fallbackProjects;
    return docs.map(fromSanityDoc);
  } catch {
    return fallbackProjects;
  }
}

export function filterProjects(projects: Project[], filter: string) {
  return filter === "Todos" ? projects : projects.filter((p) => p.categories.includes(filter));
}

export function getProjectBySlug(projects: Project[], slug: string) {
  return projects.find((p) => p.slug === slug);
}
```

Nota: `PROJECT_FILTERS` (lista fixa) é removida daqui — a Task 5 mexe nos componentes que a usavam para derivar os filtros a partir dos projetos carregados.

- [ ] **Step 2: Rodar o build para checar erros de tipo isolados deste arquivo**

Rode: `npm run build`.
Nesta task, é esperado que o build **falhe** apontando para os componentes que ainda importam `projects` (o array) ou `PROJECT_FILTERS` de `src/lib/projects.ts` — essas quebras são resolvidas na Task 5. Confirme que o erro é exatamente sobre esses imports (não sobre `projects.ts` em si) antes de prosseguir.

- [ ] **Step 3: Commit**

```bash
git add src/lib/projects.ts
git commit -m "$(cat <<'EOF'
feat: :sparkles: projects.ts busca projetos do Sanity com fallback local

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Atualizar os componentes consumidores de `projects.ts`

**Files:**
- Modify: `src/views/Projects/Projects.tsx`
- Modify: `src/views/ProjectDetail/ProjectDetail.tsx`
- Modify: `src/components/ProjectGallery/ProjectGallery.tsx` (leitura, para confirmar o shape de `images` usado)

**Interfaces:**
- Consumes: `fetchProjects`, `filterProjects`, `getProjectBySlug`, `Project`, `GalleryItem` de [src/lib/projects.ts](../../../src/lib/projects.ts) (Task 4).
- Produces: nenhuma interface nova — fecha o consumo iniciado na Task 4.

- [ ] **Step 1: Ler `Projects.tsx` para localizar o uso atual de `projects`/`PROJECT_FILTERS`**

```bash
grep -n "projects\|PROJECT_FILTERS\|filterProjects" src/views/Projects/Projects.tsx
```

- [ ] **Step 2: Adaptar `Projects.tsx` para carregar via `fetchProjects` e derivar filtros**

No corpo do componente, adicione estado e efeito de carga (lógica de dados no corpo do componente, DOM/GSAP em `useEffect`, ver CLAUDE.md):

```tsx
const [projects, setProjects] = useState<Project[]>([]);
const [filter, setFilter] = useState("Todos");

useEffect(() => {
  fetchProjects().then(setProjects);
}, []);

const filterOptions = useMemo(
  () => ["Todos", ...Array.from(new Set(projects.flatMap((p) => p.categories)))],
  [projects],
);

const visibleProjects = useMemo(
  () => filterProjects(projects, filter),
  [projects, filter],
);
```

Troque toda referência a `PROJECT_FILTERS` por `filterOptions`, e ao array `projects` importado estaticamente pelo `visibleProjects`/`projects` de estado. Mantenha a estrutura de GSAP/DOM existente (efeitos que dependem de `.projects-card` etc. devem re-rodar quando `visibleProjects` muda — adicione `visibleProjects` ao array de dependências do `useEffect` de animação já existente, sem reescrever a lógica de animação em si).

- [ ] **Step 3: Adaptar `ProjectDetail.tsx` para receber a lista carregada**

`ProjectDetail.tsx` hoje chama `getProjectBySlug(slug)` direto do import estático. Ele precisa da mesma lista de `Projects.tsx`. Duas opções — escolha a que exigir menos mudança estrutural ao ler o arquivo atual: (a) `ProjectDetail` também chama `fetchProjects()` no seu próprio `useEffect` de inicialização, guardando em `useState<Project[]>([])`, e usa essa lista para resolver `getProjectBySlug(projects, slug)` dentro do handler `open`; ou (b) `App.tsx` (ou o pai comum) carrega uma vez e passa como prop. Prefira (a) — é a menor mudança, mantém `ProjectDetail` autossuficiente e não altera a assinatura de nenhum componente pai.

Exemplo de ajuste em `ProjectDetail.tsx` (dentro do `useEffect` que já existe, dispara antes do `open`):

```tsx
const [projects, setProjects] = useState<Project[]>([]);

useEffect(() => {
  fetchProjects().then(setProjects);
}, []);
```

E troque `getProjectBySlug(slug)` por `getProjectBySlug(projects, slug)` em todos os pontos onde é chamado (`open`, e no `useEffect` que reage a `initialSlug`/`popstate` — garanta que esse efeito só tenta abrir depois que `projects` já carregou, usando `projects` como dependência do efeito que lê a URL inicial).

- [ ] **Step 4: Ajustar `ProjectGallery` para o novo shape `gallery`/vídeo, se necessário**

Leia `src/components/ProjectGallery/ProjectGallery.tsx` para confirmar como `images: string[]` é usado hoje. Se o componente já itera só sobre URLs de imagem (`<img src={...}>`), a Task 4 manteve `images` como campo derivado (`gallery.filter(type === image)`), então **nenhuma mudança é necessária aqui nesta task** — vídeo na galeria completa fica coberto pelo dado (`project.gallery`) mas a renderização de vídeo na UI do lightbox é opcional/fora do escopo mínimo deste plano (o dado já está disponível em `project.gallery` para uso futuro do componente). Documente isso como comentário `ponytail:` só se for genuinamente não óbvio; caso contrário, não comente.

- [ ] **Step 5: Rodar o build**

Rode: `npm run build`.
Esperado: build passa sem erros de tipo.

- [ ] **Step 6: Testar manualmente no navegador**

Rode `npm run dev`, abra a seção Projects, confirme que os 8 projetos aparecem, que os filtros de categoria funcionam, e que abrir o detalhe de um projeto (`ProjectDetail`) mostra imagem, descrição, techs e actions corretos. Pare o dev server.

- [ ] **Step 7: Commit**

```bash
git add src/views/Projects/Projects.tsx src/views/ProjectDetail/ProjectDetail.tsx
git commit -m "$(cat <<'EOF'
feat: :sparkles: Projects e ProjectDetail consomem projetos via Sanity

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Schema + migração + consumo de `contact`

**Files:**
- Modify: `src/lib/contact.ts`
- Modify: `src/views/Contact/Contact.tsx`
- Modify: `src/components/Navbar/Navbar.tsx`

**Interfaces:**
- Consumes: `sanityClient` de [src/lib/sanity.ts](../../../src/lib/sanity.ts).
- Produces: `export async function fetchContact(): Promise<Contact>`, tipo `Contact`/`SocialLink` exportados; `Navbar` deriva seus links sociais de `contact.socials`.

- [ ] **Step 1: Definir e deployar o schema `contact` (singleton) via MCP**

```typescript
{
  name: "contact",
  title: "Contact",
  type: "document",
  fields: [
    { name: "email", type: "string", validation: required },
    { name: "whatsapp", type: "string", validation: required },
    { name: "phoneLabel", type: "string", validation: required },
    { name: "location", type: "string", validation: required },
    { name: "availability", type: "string", validation: required },
    { name: "replyTime", type: "string", validation: required },
    {
      name: "socials",
      type: "array",
      of: [{
        type: "object",
        name: "social",
        fields: [
          { name: "label", type: "string", validation: required },
          { name: "handle", type: "string", validation: required },
          { name: "href", type: "url", validation: required },
        ],
      }],
    },
  ],
}
```

Deploy via `mcp__Sanity__deploy_schema`, mesmo `projectId`/`dataset` da Task 1.

- [ ] **Step 2: Criar e publicar o documento singleton**

Use `mcp__Sanity__create_documents` com o conteúdo atual de `src/lib/contact.ts` (email, whatsapp, phoneLabel, location, availability, replyTime). Para `socials`, use os handles reais já em `contact.ts` (`@matheussimoes`/LinkedIn, `@dinamous`/GitHub, `@dinamous`/Instagram) — os `href` hoje são `"#"` placeholder; mantenha `"#"` no documento Sanity também (não é dado que este plano tem autoridade para inventar; documente como está). Publique com `mcp__Sanity__publish_documents`.

- [ ] **Step 3: Reescrever `src/lib/contact.ts`**

```typescript
import { sanityClient } from "./sanity";

export type SocialLink = { label: string; handle: string; href: string };

export type Contact = {
  email: string;
  whatsapp: string;
  phoneLabel: string;
  location: string;
  availability: string;
  replyTime: string;
  socials: SocialLink[];
};

// fallback usado quando o fetch ao Sanity falha
const fallbackContact: Contact = {
  email: "dinamous.dev@gmail.com",
  whatsapp: "5511999999999",
  phoneLabel: "+55 11 99999-9999",
  location: "São Paulo, Brasil",
  availability: "Disponível para novos projetos",
  replyTime: "Respondo em até 24h",
  socials: [
    { label: "LinkedIn", handle: "@matheussimoes", href: "#" },
    { label: "GitHub", handle: "@dinamous", href: "#" },
    { label: "Instagram", handle: "@dinamous", href: "#" },
  ],
};

const CONTACT_QUERY = `*[_type == "contact"][0]{
  email, whatsapp, phoneLabel, location, availability, replyTime, socials
}`;

export async function fetchContact(): Promise<Contact> {
  try {
    const doc = await sanityClient.fetch<Contact | null>(CONTACT_QUERY);
    return doc ?? fallbackContact;
  } catch {
    return fallbackContact;
  }
}
```

- [ ] **Step 4: Adaptar `Contact.tsx` para carregar via `fetchContact`**

Leia `src/views/Contact/Contact.tsx` (já lido nesta conversa): hoje importa `{ contact }` estático e usa em JSX (`contact.whatsapp`, `contact.email`, `contact.socials.map(...)`, etc.) e dentro do `useEffect` de animação (`message()`/`onSubmit` fecha sobre `contact.whatsapp`/`contact.email`).

Adicione estado no corpo do componente:

```tsx
const [contact, setContact] = useState<Contact>(fallbackFor when needed); // ver nota abaixo
```

Como o `useEffect` de animação (GSAP, listeners de form) fecha sobre `contact` dentro de `onSubmit`, e esse efeito só deve montar listeners uma vez (limpo no `return`, por CLAUDE.md), a forma mais segura é: manter o `useEffect` de animação como está, mas fazer com que ele leia `contact` via uma `ref` atualizada quando o fetch resolve — ou, mais simples e alinhado ao padrão do resto do plano, adicionar um segundo `useEffect` que só dispara o fetch e guarda em estado, e mover a leitura de `contact.whatsapp`/`contact.email` dentro de `onSubmit` para ler de uma `ref`:

```tsx
const [contact, setContact] = useState<Contact | null>(null);
const contactRef = useRef<Contact | null>(null);

useEffect(() => {
  fetchContact().then((c) => {
    setContact(c);
    contactRef.current = c;
  });
}, []);
```

No `useEffect` de animação existente, troque toda leitura de `contact.whatsapp`/`contact.email` dentro de closures (`onSubmit`, `message()`) por `contactRef.current!.whatsapp`/`contactRef.current!.email` — o efeito de animação continua montando os listeners imediatamente (não espera o fetch), só a leitura do valor é adiada para o momento do clique, quando o fetch já teve tempo de resolver.

No JSX (que já é re-renderizado quando `contact` muda), troque `contact.socials.map(...)`, `contact.email`, etc. por acesso condicional: `{contact && contact.socials.map(...)}` — ou inicialize `useState<Contact>` diretamente com o objeto fallback (importe `fallbackContact` — torne-o exportado em `contact.ts` — e use como valor inicial de `useState`), o que evita todo `contact &&` no JSX porque `contact` nunca é `null`. Prefira este segundo caminho: exporte `fallbackContact` de `contact.ts` e use `useState<Contact>(fallbackContact)` como estado inicial.

- [ ] **Step 5: Adaptar `Navbar.tsx` para usar `contact.socials`**

Leia `src/components/Navbar/Navbar.tsx` (já lido): hoje tem `href="#"` hardcoded pra LinkedIn/GitHub e `mailto:dinamous.dev@gmail.com` hardcoded pro Email, com comentário `ponytail: LinkedIn/GitHub hrefs are placeholders`.

Adicione o mesmo padrão de estado com fallback:

```tsx
const [contact, setContact] = useState<Contact>(fallbackContact);

useEffect(() => {
  fetchContact().then(setContact);
}, []);
```

Troque o JSX:

```tsx
<ul className="navbar__social">
  {contact.socials.map((s) => (
    <li key={s.label}><a href={s.href} target="_blank" rel="noopener">{s.label}</a></li>
  ))}
  <li><a href={`mailto:${contact.email}`}>Email</a></li>
</ul>
```

Remova o comentário `ponytail:` sobre placeholders — deixa de ser verdade uma vez que os links vêm do Sanity (mesmo que o `href` ainda seja `"#"` até você editar o documento).

- [ ] **Step 6: Rodar o build**

Rode: `npm run build`. Esperado: passa sem erros de tipo.

- [ ] **Step 7: Testar manualmente**

Rode `npm run dev`. Confirme: Navbar mostra os 3 links sociais + email; seção Contact mostra telefone/localização/disponibilidade corretos; preencher e enviar o form abre o WhatsApp com o número certo. Pare o dev server.

- [ ] **Step 8: Commit**

```bash
git add src/lib/contact.ts src/views/Contact/Contact.tsx src/components/Navbar/Navbar.tsx
git commit -m "$(cat <<'EOF'
feat: :sparkles: Contact e Navbar consomem dados de contato via Sanity

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Schema + migração + consumo de `aboutMe`

**Files:**
- Modify: `src/views/AboutMe/AboutMe.tsx`
- Create: `src/lib/aboutMe.ts`

**Interfaces:**
- Consumes: `sanityClient`.
- Produces: `export async function fetchAboutMe(): Promise<AboutMe>`, tipo `AboutMe` exportado.

- [ ] **Step 1: Definir e deployar o schema `aboutMe` (singleton) via MCP**

```typescript
{
  name: "aboutMe",
  title: "About Me",
  type: "document",
  fields: [
    { name: "heading", type: "string", validation: required },
    { name: "bio", type: "text", validation: required },
    { name: "photo", type: "image", validation: required },
    { name: "local", type: "string", validation: required },
    { name: "status", type: "string", validation: required },
  ],
}
```

- [ ] **Step 2: Criar e publicar o documento singleton**

Conteúdo: `heading: "Componho movimento, não telas."`, `bio` = o parágrafo atual ("Desenvolvedor front-end especializado..."), `local: "São Paulo, Brasil"`, `status: "Aberto pra oportunidades"`. Para `photo`, faça upload de `public/profile-picture.webp` como asset (mesmo fluxo da Task 3, Step 2) e referencie o `_id` retornado.

- [ ] **Step 3: Criar `src/lib/aboutMe.ts`**

```typescript
import { sanityClient } from "./sanity";

export type AboutMe = {
  heading: string;
  bio: string;
  photoUrl: string;
  local: string;
  status: string;
};

// fallback usado quando o fetch ao Sanity falha
export const fallbackAboutMe: AboutMe = {
  heading: "Componho movimento, não telas.",
  bio: "Desenvolvedor front-end especializado em animação, interação e experiências 3D. Código é matéria-prima; a emoção é o acabamento. Cada detalhe pensado pra ser sentido, não só visto.",
  photoUrl: "/profile-picture.webp",
  local: "São Paulo, Brasil",
  status: "Aberto pra oportunidades",
};

type SanityAboutMeDoc = {
  heading: string;
  bio: string;
  photo: { asset: { url: string } } | null;
  local: string;
  status: string;
};

const ABOUT_ME_QUERY = `*[_type == "aboutMe"][0]{
  heading, bio, photo{asset->{url}}, local, status
}`;

export async function fetchAboutMe(): Promise<AboutMe> {
  try {
    const doc = await sanityClient.fetch<SanityAboutMeDoc | null>(ABOUT_ME_QUERY);
    if (!doc) return fallbackAboutMe;
    return {
      heading: doc.heading,
      bio: doc.bio,
      photoUrl: doc.photo?.asset?.url ?? fallbackAboutMe.photoUrl,
      local: doc.local,
      status: doc.status,
    };
  } catch {
    return fallbackAboutMe;
  }
}
```

- [ ] **Step 4: Adaptar `AboutMe.tsx`**

Leia `src/views/AboutMe/AboutMe.tsx` (já lido): tem o objeto `about` hardcoded (`local`, `status`) usado no JSX, mais `heading`/`bio`/`photo src` fixos direto no JSX (não em variável). O `useEffect` de animação usa `document.getElementById(...)` para pegar elementos (padrão do CLAUDE.md) e não depende do conteúdo textual em si (anima opacity/transform dos wrappers, não lê o texto).

Adicione estado:

```tsx
const [about, setAbout] = useState<AboutMe>(fallbackAboutMe);

useEffect(() => {
  fetchAboutMe().then(setAbout);
}, []);
```

No JSX, troque:
- `<img className="aboutme__photo-img" src="/profile-picture.webp" alt="Matheus Simões" />` → `src={about.photoUrl}`
- `Residindo em {about.local}` e `Status: {about.status}` → já funciona, só troca a fonte do objeto `about` (remove o `about` hardcoded do topo do arquivo, usa o do estado)
- `<AnimatedLetters text="Componho movimento," prefix="aboutme" />` / `<AnimatedLetters text="não telas." prefix="aboutme" />` → mantenha como está por enquanto **apenas se** o texto de duas linhas depender de quebra fixa; caso contrário, considere `about.heading` inteiro passado para `AnimatedLetters`. Leia `src/components/AnimatedLetters.tsx` antes de decidir: se ele só faz split de letras sobre uma string simples (sem quebra de linha manual), troque as duas chamadas por uma única `<AnimatedLetters text={about.heading} prefix="aboutme" />` e remova o `<span className="aboutme__heading-break">`; se a quebra de linha em "Componho movimento," / "não telas." for estruturalmente necessária pro layout (duas `<AnimatedLetters>` separadas por design), mantenha `heading` fixo no componente e não o mova para o Sanity nesta task — documente a decisão com uma linha de comentário `ponytail:` explicando o porquê.
- `<p className="aboutme__sub" id="aboutme-sub">{...parágrafo fixo...}</p>` → `{about.bio}`

Como o `id="aboutme-sub"` é usado pelo `useEffect` de animação (`document.getElementById("aboutme-sub")`) só para aplicar `gsap.set`/tween de opacity/y — não para ler o texto — a troca do conteúdo textual não afeta a animação.

- [ ] **Step 5: Rodar o build**

Rode: `npm run build`. Esperado: passa sem erros.

- [ ] **Step 6: Testar manualmente**

Rode `npm run dev`, role até a seção About Me, confirme que foto, heading, bio, local e status aparecem e a animação de entrada/saída continua funcionando normalmente. Pare o dev server.

- [ ] **Step 7: Commit**

```bash
git add src/lib/aboutMe.ts src/views/AboutMe/AboutMe.tsx
git commit -m "$(cat <<'EOF'
feat: :sparkles: AboutMe consome conteúdo via Sanity

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Schema + migração + consumo de `whatIDo`

**Files:**
- Modify: `src/views/WhatIDo/WhatIDo.tsx`
- Create: `src/lib/whatIDo.ts`

**Interfaces:**
- Consumes: `sanityClient`.
- Produces: `export async function fetchWhatIDo(): Promise<WhatIDoItem[]>`, tipo `WhatIDoItem` exportado.

- [ ] **Step 1: Definir e deployar o schema `whatIDo` (singleton) via MCP**

```typescript
{
  name: "whatIDo",
  title: "What I Do",
  type: "document",
  fields: [
    {
      name: "items",
      type: "array",
      of: [{
        type: "object",
        name: "whatIDoItem",
        fields: [
          { name: "title", type: "string", validation: required },
          { name: "text", type: "text", validation: required },
        ],
      }],
      validation: (rule) => rule.length(2),
    },
  ],
}
```

- [ ] **Step 2: Criar e publicar o documento singleton**

Conteúdo: dois items, `{ title: "Arquitetura", text: "Desenvolvimento modular, limpo e de alta performance. Layouts responsivos com foco na acessibilidade e semântica web. Codificação robusta para experiências estáveis." }` e `{ title: "Experiência", text: "Transições fluidas e micro-interações elegantes que dão vida à interface. Criação de experiências imersivas e jornadas do usuário cativantes através do movimento." }`.

- [ ] **Step 3: Criar `src/lib/whatIDo.ts`**

```typescript
import { sanityClient } from "./sanity";

export type WhatIDoItem = { title: string; text: string };

// fallback usado quando o fetch ao Sanity falha
export const fallbackWhatIDo: WhatIDoItem[] = [
  {
    title: "Arquitetura",
    text: "Desenvolvimento modular, limpo e de alta performance. Layouts responsivos com foco na acessibilidade e semântica web. Codificação robusta para experiências estáveis.",
  },
  {
    title: "Experiência",
    text: "Transições fluidas e micro-interações elegantes que dão vida à interface. Criação de experiências imersivas e jornadas do usuário cativantes através do movimento.",
  },
];

const WHAT_I_DO_QUERY = `*[_type == "whatIDo"][0]{ items }`;

export async function fetchWhatIDo(): Promise<WhatIDoItem[]> {
  try {
    const doc = await sanityClient.fetch<{ items: WhatIDoItem[] } | null>(WHAT_I_DO_QUERY);
    if (!doc?.items?.length) return fallbackWhatIDo;
    return doc.items;
  } catch {
    return fallbackWhatIDo;
  }
}
```

- [ ] **Step 4: Adaptar `WhatIDo.tsx`**

Leia `src/views/WhatIDo/WhatIDo.tsx` (já lido): hoje `leftTitle`/`leftText`/`rightTitle`/`rightText` são constantes de módulo usadas em dois blocos JSX quase idênticos (`whatido-col-left`/`whatido-col-right`, `whatido-title-left`/`whatido-title-right`). O `useEffect` de animação usa `document.getElementById("whatido-title-left")`/`"whatido-title-right"` e `document.getElementById("whatido-col-left")`/`"whatido-col-right"` — IDs fixos, não dependem do texto.

Adicione estado:

```tsx
const [items, setItems] = useState<WhatIDoItem[]>(fallbackWhatIDo);

useEffect(() => {
  fetchWhatIDo().then(setItems);
}, []);
```

Troque `leftTitle`/`leftText` por `items[0]?.title`/`items[0]?.text` e `rightTitle`/`rightText` por `items[1]?.title`/`items[1]?.text` no JSX (os dois blocos continuam fixos estruturalmente — dois `<div className="whatido__col">` com IDs fixos — só o texto vem do array agora). Como `fallbackWhatIDo` sempre tem 2 items e o schema valida `rule.length(2)`, o acesso por índice é seguro.

Importante: o `useEffect` de animação (`layoutTitleGradient`, `buildRevealTimeline`) mede `titleEl.offsetWidth` e a posição de cada letra — isso só pode rodar depois que o título já está renderizado com o texto final. Como o estado inicial já é `fallbackWhatIDo` (não `[]`), o primeiro render já tem o texto correto e a medição no `useEffect` (que roda após o render) funciona normalmente tanto no caso fallback quanto após o fetch resolver. Se o fetch trouxer texto diferente do fallback depois da montagem, isso re-renderiza o título com texto novo, mas o `useEffect` de animação (dependências `[]`, roda uma vez) não vai remedir — para manter simples e não introduzir uma resize/remeasure dinâmica fora do escopo deste plano, aceite essa limitação (na prática o Sanity é editado raramente e a diferença só apareceria num reload).

- [ ] **Step 5: Rodar o build**

Rode: `npm run build`. Esperado: passa sem erros.

- [ ] **Step 6: Testar manualmente**

Rode `npm run dev`, role até What I Do, confirme que os dois títulos/textos aparecem e a animação de reveal (letra por letra, palavra por palavra) funciona. Pare o dev server.

- [ ] **Step 7: Commit**

```bash
git add src/lib/whatIDo.ts src/views/WhatIDo/WhatIDo.tsx
git commit -m "$(cat <<'EOF'
feat: :sparkles: WhatIDo consome conteúdo via Sanity

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Schema + migração + consumo de `skills`

**Files:**
- Modify: `src/views/Skills/Skills.tsx`
- Create: `src/lib/skills.ts`

**Interfaces:**
- Consumes: `sanityClient`.
- Produces: `export async function fetchSkills(): Promise<SkillsContent>`, tipo `SkillsContent` exportado.

- [ ] **Step 1: Definir e deployar o schema `skills` (singleton) via MCP**

```typescript
{
  name: "skills",
  title: "Skills",
  type: "document",
  fields: [
    { name: "headline", type: "array", of: [{ type: "string" }], validation: required },
    {
      name: "meta",
      type: "array",
      of: [{
        type: "object",
        name: "metaRow",
        fields: [
          { name: "term", type: "string", validation: required },
          { name: "value", type: "string", validation: required },
        ],
      }],
    },
    {
      name: "categories",
      type: "array",
      of: [{
        type: "object",
        name: "skillCategory",
        fields: [
          { name: "name", type: "string", validation: required },
          { name: "techs", type: "array", of: [{ type: "string" }], validation: required },
        ],
      }],
    },
  ],
}
```

- [ ] **Step 2: Criar e publicar o documento singleton**

Use o conteúdo atual de `src/views/Skills/Skills.tsx`: `headlineLines` (3 strings), `meta` (2 objetos: Formação/Atuação), `categories` (9 categorias × techs, já listadas no arquivo lido nesta conversa).

- [ ] **Step 3: Criar `src/lib/skills.ts`**

```typescript
import { sanityClient } from "./sanity";

export type SkillCategory = { name: string; techs: string[] };
export type SkillsMetaRow = { term: string; value: string };
export type SkillsContent = {
  headline: string[];
  meta: SkillsMetaRow[];
  categories: SkillCategory[];
};

// fallback usado quando o fetch ao Sanity falha
export const fallbackSkills: SkillsContent = {
  headline: ["Estas são as", "ferramentas com que", "trabalho todo dia."],
  meta: [
    { term: "Formação", value: "Bacharel em Ciência da Computação" },
    { term: "Atuação", value: "Desenvolvedor com foco em Front-end" },
  ],
  categories: [
    { name: "Linguagens", techs: ["TypeScript", "JavaScript", "HTML", "CSS", "SQL", "Python"] },
    { name: "Frameworks", techs: ["React", "Next.js", "Astro", "Vite", "React Router", "TanStack Query"] },
    { name: "Interface & Estilo", techs: ["Tailwind CSS", "Sass", "CSS Modules", "Radix UI", "shadcn/ui", "Storybook"] },
    { name: "Animação", techs: ["GSAP", "ScrollTrigger", "Observer", "SplitText", "Lenis", "Lottie"] },
    { name: "3D & Shaders", techs: ["Three.js", "React Three Fiber", "WebGL", "GLSL", "Blender", "Spline"] },
    { name: "Backend & APIs", techs: ["Node.js", "Express", "Fastify", "REST", "GraphQL", "WebSockets"] },
    { name: "Dados & CMS", techs: ["PostgreSQL", "MongoDB", "Supabase", "Prisma", "Sanity", "Redis"] },
    { name: "Infra & Deploy", techs: ["Git", "GitHub Actions", "Docker", "Vercel", "Cloudflare", "Nginx"] },
    { name: "Qualidade & Design", techs: ["Vitest", "Playwright", "ESLint", "Prettier", "Figma", "Lighthouse"] },
  ],
};

const SKILLS_QUERY = `*[_type == "skills"][0]{ headline, meta, categories }`;

export async function fetchSkills(): Promise<SkillsContent> {
  try {
    const doc = await sanityClient.fetch<SkillsContent | null>(SKILLS_QUERY);
    if (!doc?.categories?.length) return fallbackSkills;
    return doc;
  } catch {
    return fallbackSkills;
  }
}
```

- [ ] **Step 4: Adaptar `Skills.tsx`**

Leia `src/views/Skills/Skills.tsx` (já lido): `categories`, `headlineLines`, `meta` são constantes de módulo usadas tanto no JSX quanto — crucialmente — dentro do `useEffect` de animação, que faz `section.querySelectorAll<HTMLElement>(".skills__cat")` etc. **depois** que o JSX já renderizou (React renderiza antes do efeito rodar), então a contagem de categorias/técnicas no DOM já reflete o array usado no render.

Adicione estado, inicializado com o fallback (nunca `null`/`[]` vazio, para o `useEffect` de animação sempre encontrar os elementos que espera):

```tsx
const [skills, setSkills] = useState<SkillsContent>(fallbackSkills);

useEffect(() => {
  fetchSkills().then(setSkills);
}, []);
```

Troque no JSX: `headlineLines.map(...)` → `skills.headline.map(...)`; `meta.map(...)` → `skills.meta.map(...)`; `categories.map((cat, i) => ...)` → `skills.categories.map((cat, i) => ...)`.

**Atenção**: o `useEffect` de animação (`gsap.set(panels...)`, `setOpen(0, true)`, os listeners de scroll `stack:progress`/`projects:progress`) tem array de dependências `[]` — roda uma vez, na montagem. Isso já é seguro para o caso fallback (estado inicial já populado). Mas se o fetch trouxer uma lista de categorias com contagem diferente do fallback (9), a re-renderização troca o número de `.skills__cat` no DOM sem que o `useEffect` de animação rode de novo para reconfigurar `panels`/`setOpen`. Para manter o comportamento consistente com o padrão dos outros componentes deste plano (que aceitam a mesma limitação — ver nota da Task 8), **não** adicione `skills` às dependências do efeito de animação (isso re-executaria toda a lógica de acordeão/scroll a cada fetch resolvido, o que é mais arriscado que a limitação aceita). Documente com um comentário `ponytail:` de uma linha acima do `useEffect` existente: a lista de categorias é lida do estado inicial (fallback) no efeito de montagem; mudanças vindas do Sanity após o primeiro fetch só se refletem visualmente no texto, não na contagem de painéis do acordeão, até um reload.

- [ ] **Step 5: Rodar o build**

Rode: `npm run build`. Esperado: passa sem erros.

- [ ] **Step 6: Testar manualmente**

Rode `npm run dev`, role até Skills, confirme headline, meta (Formação/Atuação) e as 9 categorias com acordeão funcionando. Pare o dev server.

- [ ] **Step 7: Commit**

```bash
git add src/lib/skills.ts src/views/Skills/Skills.tsx
git commit -m "$(cat <<'EOF'
feat: :sparkles: Skills consome conteúdo via Sanity

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Schema + migração + consumo de `hero` (frases digitadas)

**Files:**
- Modify: `src/views/Hero/Hero.tsx`
- Create: `src/lib/hero.ts`

**Interfaces:**
- Consumes: `sanityClient`.
- Produces: `export async function fetchHero(): Promise<HeroContent>`, tipo `HeroContent` exportado.

- [ ] **Step 1: Definir e deployar o schema `hero` (singleton) via MCP**

```typescript
{
  name: "hero",
  title: "Hero",
  type: "document",
  fields: [
    { name: "typePhrases", type: "array", of: [{ type: "string" }], validation: (rule) => rule.min(1) },
  ],
}
```

- [ ] **Step 2: Criar e publicar o documento singleton**

As 3 frases atuais de `heroTypePhrases` em `Hero.tsx`.

- [ ] **Step 3: Criar `src/lib/hero.ts`**

```typescript
import { sanityClient } from "./sanity";

export type HeroContent = { typePhrases: string[] };

// fallback usado quando o fetch ao Sanity falha
export const fallbackHero: HeroContent = {
  typePhrases: [
    "Dev de poucas palavras, interfaces que falam por si.",
    "Criador silencioso no *front* das ideias, dando vida com movimento e suavidade.",
    "Calmo por fora, *keyframes* por dentro. Detalhes que ninguém nota, mas todo mundo sente.",
  ],
};

const HERO_QUERY = `*[_type == "hero"][0]{ typePhrases }`;

export async function fetchHero(): Promise<HeroContent> {
  try {
    const doc = await sanityClient.fetch<HeroContent | null>(HERO_QUERY);
    if (!doc?.typePhrases?.length) return fallbackHero;
    return doc;
  } catch {
    return fallbackHero;
  }
}
```

- [ ] **Step 4: Adaptar `Hero.tsx`**

Leia `src/views/Hero/Hero.tsx` (já lido): `heroTypePhrases` é usado só dentro do `useEffect` principal, passado para `startTextType(heroType, heroTypePhrases)` em dois pontos (`runEntrance()` no branch `reduceMotion` e depois do timeline de entrada). O efeito inteiro é acoplado à sequência de loader/entrada (roda uma vez, `[]`).

Como o texto só é necessário no momento em que `runEntrance()` executa (depois do loader, ~2.5s de delay no caso não-reduzido), buscar via `fetchHero()` **antes** do efeito principal montar é suficiente — não precisa de um segundo estado/re-render. Adicione um `useState`/`useEffect` de carga separado, e leia o valor via `useRef` dentro do efeito principal (mesmo padrão adotado para `contact` na Task 6, pelo mesmo motivo: o efeito de animação não deve esperar o fetch para montar seus listeners):

```tsx
const phrasesRef = useRef<string[]>(fallbackHero.typePhrases);

useEffect(() => {
  fetchHero().then((h) => {
    phrasesRef.current = h.typePhrases;
  });
}, []);
```

No `useEffect` principal existente, troque as duas ocorrências de `startTextType(heroType, heroTypePhrases)` por `startTextType(heroType, phrasesRef.current)`. Remova a constante de módulo `heroTypePhrases` (substituída pelo fallback em `hero.ts`).

- [ ] **Step 5: Rodar o build**

Rode: `npm run build`. Esperado: passa sem erros.

- [ ] **Step 6: Testar manualmente**

Rode `npm run dev`, recarregue a página (Hero roda só na montagem inicial), confirme que o efeito de "digitação" mostra as frases corretas após a animação de entrada. Pare o dev server.

- [ ] **Step 7: Commit**

```bash
git add src/lib/hero.ts src/views/Hero/Hero.tsx
git commit -m "$(cat <<'EOF'
feat: :sparkles: Hero busca frases digitadas via Sanity

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Verificação final de build e smoke test completo

**Files:**
- Nenhum arquivo modificado — task de verificação.

**Interfaces:**
- Consumes: todas as mudanças das Tasks 1–10.

- [ ] **Step 1: Build limpo**

Rode `npm run build` na raiz do repo. Esperado: `tsc` e `vite build` completam sem erros.

- [ ] **Step 2: Smoke test com dados do Sanity**

Rode `npm run dev`. Percorra o site inteiro na ordem: Hero (frases digitadas) → About Me (foto, heading, bio, local, status) → What I Do (2 blocos) → Projects (8 cards, filtros por categoria, abrir um projeto no ProjectDetail) → Skills (headline, meta, 9 categorias em acordeão) → Contact (telefone/localização/disponibilidade, form de contato abrindo WhatsApp) → Navbar (3 social links + email). Confirme que nenhum conteúdo aparece vazio ou como `undefined`.

- [ ] **Step 3: Smoke test do fallback**

Temporariamente, renomeie `VITE_SANITY_PROJECT_ID` no `.env` para um valor inválido (ex. `VITE_SANITY_PROJECT_ID=invalid-test`), rode `npm run dev` de novo e confirme que **todo** o conteúdo ainda aparece (vindo dos fallbacks hardcoded em cada `lib/*.ts`), sem tela em branco ou erro não tratado no console. Reverta o `.env` para o valor correto ao final deste step.

- [ ] **Step 4: Rodar lint**

Rode `npm run lint`. Corrija quaisquer erros novos introduzidos pelas tasks anteriores (imports não usados, como `projects` array estático que não existe mais, `PROJECT_FILTERS`, etc. — devem já ter sido limpos nas tasks anteriores, mas confirme aqui).

- [ ] **Step 5: Commit final, se houver ajustes**

Se o Step 4 exigiu correções:

```bash
git add -A
git commit -m "$(cat <<'EOF'
fix: :bug: corrige lint após migração de conteúdo para o Sanity

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

Se nenhum ajuste foi necessário, esta task não gera commit — é só verificação.
