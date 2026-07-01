# Astro + React Islands + GSAP + Sanity Rebuild Plan
### dinamous.dev portfolio — full rebuild plan

Ecosystem versions confirmed live via npm registry at planning time (2026-07-01): `astro@7.0.5`, `@astrojs/react@6.0.0`, `gsap@3.15.0`, `sanity@7.23.0`, `@sanity/client@6.3.0` (verify), `@sanity/image-url@2.1.1`, `tailwindcss@4.3.2`, `@tailwindcss/vite@4.3.2`. Note `@astrojs/tailwind@6.0.2` still exists but the current Astro-recommended path for Tailwind v4 is the official `@tailwindcss/vite` Vite plugin, not `@astrojs/tailwind` (that integration predates Tailwind v4's CSS-first config model and is effectively legacy for v3). This plan uses Tailwind v4 + `@tailwindcss/vite`.

---

## 0. Source-of-truth content inventory (from current repo)

Read directly from `d:\projetos\portifolio-dinamous\src\components\*.tsx`:

- **HeroHeader.tsx**: heading "Front-End Dev", intro paragraph (2 lines, hardcoded Portuguese), avatar default/hover images, `@dinamous` handle label, array `frasesAvatar` (10 joke/flirty toast strings), social links (LinkedIn, GitHub — same pair reused in Footer), 4 decorative blob `<div>`s with inline Tailwind (`animate-blob`, per-blob color/size/position/delay), AOS attrs `data-aos="zoom-in"` / `data-aos="fade-up"`.
- **AboutMe.tsx**: title "Sobre mim", subtitle "Desenvolvedor do interior que vai desbravar o universo", office photo, 2 bio paragraphs, wrapped in a shadcn `Card`.
- **MyStack.tsx**: title "Minha stack", `skillIcons` array of `{ img: "https://skillicons.dev/icons?i=...", id }` — 9 entries, each a comma-joined skillicons.dev query string.
- **Projects.tsx**: `projetos` array, 8 objects: `{ titulo, img (local import), descricao, techs: string[], repo?: false, demo?: string|false, categoria: string[], actions: {label, link}[] }`. Note `repo`/`demo` fields are inconsistently present/typed (sometimes `false`, sometimes absent, sometimes a string) and unused in render — only `actions[]` is actually rendered, so **`repo`/`demo` are dead fields, safe to drop from the schema**. `actions[].label` is used to decide icon (GitHub icon if label === "Repo", else external-link arrow icon) — this label-based icon switch should be preserved as a small heuristic in the Astro template, not baked into Sanity.
- **Contact.tsx**: title "Contato", subtitle, 2 cards: Location (title "Localização", value "SP - Brasil") and Email (title "Email", value "matheusaugustosimoes@hotmail.com"). Note: email in Contact.tsx differs from the user's env email (dinamous.dev@gmail.com) — flag this as a content decision for the user when populating Sanity, not something to hardcode.
- **Navbar.tsx**: nav items array `[{name, href}]` with 4 hardcoded anchors, site name "dinamous.dev" (split styling: "dinamous." + sky-colored ".dev"), scroll-triggered background swap, mobile `Dialog` menu, `ModeToggle` embedded twice (desktop + mobile panel).
- **Footer.tsx**: copyright string "Copyright © 2024. All rights are reserved", same LinkedIn/GitHub links as Hero.
- **theme-provider.tsx / mode-toggle.tsx**: React Context based theme (`localStorage` key `vite-ui-theme`, values `light|dark|system`), toggle button using `lucide-react` Sun/Moon icons with CSS-only cross-fade (no JS-driven icon swap animation) — this pattern needs to be reimplemented without React Context since Astro pages aren't wrapped in a single React tree.
- **tailwind.config.js**: CJS config, `darkMode:["class"]`, container config, HSL CSS var color tokens (shadcn convention), custom `textShadow` plugin via `plugin()`, keyframes `accordion-down/up` (radix), `blob`, `fadeIn`; plugin deps `tailwindcss-animate`.
- **index.css**: `@tailwind base/components/utilities`, `:root`/`.dark` HSL var blocks, custom scrollbar (`::-webkit-scrollbar*`), `::selection`, `.animation-delay-2000/4000` utility classes, `html{scroll-behavior:smooth}`.
- **package.json**: React 18, Vite 5, `aos`, `next-themes` (unused directly except inside `sonner.tsx`'s `useTheme` call — actually a leftover since the project uses its own `theme-provider.tsx`, not next-themes' provider — this is a latent bug/dead dependency worth flagging), Radix primitives, `@headlessui/react` (Dialog for mobile nav), `sonner` (toast), `lucide-react` + `@radix-ui/react-icons` (two icon libs in use simultaneously).
- **components.json**: shadcn/ui config, `style: default`, `baseColor: slate`, aliases `@/components`, `@/lib/utils`.
- Assets: `src/assets/{Cute Avatar.png, avatar-hover.png, avatar-transparente.png, office.jpg, preview.png, react.svg}` + `src/assets/projects/*.png` (8 files matching the 8 project entries by name).

This inventory is the exact migration contract for Sanity schema fields below — every field maps 1:1 to something already rendered today, nothing invented.

---

## 1. New project scaffolding

### 1.1 Top-level structure (monorepo-style, single git repo)

```
portifolio-dinamous/
├── src/                      (Astro site — new root, replaces old Vite src/)
│   ├── pages/
│   │   └── index.astro
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── components/           (plain .astro components — no interactivity)
│   │   ├── Navbar.astro
│   │   ├── Hero.astro
│   │   ├── MyStack.astro
│   │   ├── AboutMe.astro
│   │   ├── Projects.astro
│   │   ├── ProjectCard.astro
│   │   ├── Contact.astro
│   │   └── Footer.astro
│   ├── islands/               (React components — hydrated, interactive only)
│   │   ├── AvatarTooltip.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── MobileNav.tsx
│   │   └── Toaster.tsx
│   ├── ui/                    (shadcn/ui-style primitives, React, used only inside islands/)
│   │   ├── button.tsx
│   │   ├── card.tsx            (kept only if an island needs it; plain sections use markup instead — see §5)
│   │   ├── tooltip.tsx
│   │   ├── sonner.tsx
│   │   └── ...
│   ├── scripts/                (vanilla JS/TS modules, not React — GSAP setup)
│   │   ├── gsap-setup.ts        (registers gsap + ScrollTrigger once)
│   │   ├── reveal.ts             (scroll-reveal utility, auto-applies to [data-reveal] els)
│   │   ├── hero-timeline.ts      (hero entrance timeline)
│   │   └── stagger-groups.ts     (stack icons + project cards stagger reveal)
│   ├── lib/
│   │   ├── sanity.ts             (client + typed fetch helpers)
│   │   ├── sanity.image.ts       (urlFor() helper via @sanity/image-url)
│   │   └── utils.ts              (cn() helper, unchanged from old repo)
│   ├── styles/
│   │   └── global.css            (Tailwind v4 entry + @theme tokens + old custom CSS ported)
│   └── env.d.ts                  (ImportMetaEnv typing for PUBLIC_SANITY_*)
├── public/
│   └── favicon/                  (copied as-is from old public/favicon)
├── studio/                       (embedded Sanity Studio workspace — separate package.json)
│   ├── schemaTypes/
│   │   ├── index.ts
│   │   ├── siteSettings.ts
│   │   ├── project.ts
│   │   └── objects/
│   │       ├── heroContent.ts
│   │       ├── aboutContent.ts
│   │       ├── contactContent.ts
│   │       └── projectAction.ts
│   ├── sanity.config.ts
│   ├── sanity.cli.ts
│   ├── package.json
│   └── tsconfig.json
├── astro.config.mjs
├── package.json                  (site root — Astro + React + GSAP + Sanity client deps)
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

Rationale for `studio/` embedded, not a separate repo: this is a one-person static portfolio, and a single repo to clone/manage is simpler operationally (one `git log`, one PR flow, one place to look). Sanity's own `npm create sanity@latest` scaffolds a fully independent `package.json`/`node_modules` inside whatever folder you point it at, so there's no dependency-graph coupling forced by embedding — it's purely a filesystem convenience. This matches Sanity's own documented "embedded studio in monorepo" pattern for small teams.

### 1.2 Scaffolding commands (sequence only)

1. Back up/reference the old repo (still on disk) — do not delete yet (see §8).
2. Run `npm create astro@latest .` in a **fresh** directory first (Astro's scaffolder expects an empty dir or `--yes`/force flag), OR scaffold into a temp sibling folder and merge in `src/`, `astro.config.mjs`, `package.json`, `tsconfig.json` — recommend the sibling-folder approach given the current repo isn't empty. Choose the minimal/empty template, TypeScript strict.
3. `npx astro add react` — installs and wires `@astrojs/react` into `astro.config.mjs` integrations array automatically.
4. Add Tailwind v4 manually (no official `astro add tailwind` path for v4 yet as of writing): install `tailwindcss` + `@tailwindcss/vite`, add `tailwindcss()` to `vite.plugins` in `astro.config.mjs`, create `src/styles/global.css` starting with `@import "tailwindcss";` then port the old HSL variable blocks and custom keyframes as native CSS `@theme`/plain CSS (Tailwind v4 no longer requires `tailwind.config.js`; `darkMode: 'class'` becomes `@custom-variant dark (&:where(.dark, .dark *));` in CSS, and the old `plugin()`-registered `text-shadow` utility becomes a `@utility text-shadow-*` block, or simplest: keep it as a manual CSS class since it's only used in two places (Navbar brand, Hero handle) — not worth the ceremony of a full plugin port for 2 usages).
5. `cd studio && npm create sanity@latest -- --template clean --typescript --dataset production --project-plan free` (run inside `studio/`, creates its own `package.json`). Studio dev command becomes independent (`npm run dev` inside `studio/`, default port 3333).
6. Install remaining site deps: `gsap`, `@sanity/client`, `@sanity/image-url`.
7. Do NOT run `sanity init` against a real project until the user supplies real projectId — scaffold with a placeholder or `--project` flag pointed at nothing yet, and note in README that `sanity login` + linking a real project is a manual follow-up step for the user.

---

## 2. Sanity schema design

Recommend the **singleton pattern** for `siteSettings` (hero + about + contact all live as fields/objects on one document, since there's exactly one of each for a personal portfolio) and a proper **document array** only for `project` (the one genuinely repeating type). This matches Sanity's own recommended pattern for "one-off" pages (their docs call this the "singleton" recipe: restrict document creation in the desk structure so editors can't accidentally create a second Settings doc).

### 2.1 `siteSettings` (singleton document, `studio/schemaTypes/siteSettings.ts`)

Structure it as one top-level document type with **nested objects** (not separate document types) for each old component's content, since they're never queried independently of the page and there's no need for cross-referencing:

- `heroHeading` (string) — e.g. "Front-End Dev"
- `heroIntro` (text) — the 2-line intro paragraph (plain `text` field, not portable text — overkill for 2 sentences)
- `heroHandle` (string) — "@dinamous" label under avatar
- `avatarDefault` (image, with hotspot) — replaces `avatar-transparente.png`
- `avatarHover` (image, with hotspot) — replaces `avatar-hover.png`
- `avatarHoverPhrases` (array of strings) — replaces `frasesAvatar`, editable list of toast strings
- `socialLinks` (array of object `{platform: string (select: linkedin/github/other), url: string}`) — replaces the hardcoded LinkedIn/GitHub pair used in both Hero and Footer, so both consume the same field
- `aboutTitle` (string) — "Sobre mim"
- `aboutSubtitle` (string) — "Desenvolvedor do interior..."
- `aboutPhoto` (image, with hotspot) — replaces `office.jpg`
- `aboutParagraphs` (array of strings, one entry per paragraph) — lets the Astro template `.map()` and the client add/remove paragraphs freely
- `stackIcons` (array of string) — each entry a full skillicons.dev query string, e.g. `"html,css"`, kept exactly as today's grouping (avoids needing an icon asset pipeline for something that's just hotlinked to a third-party service anyway)
- `contactTitle` / `contactSubtitle` (strings)
- `contactLocation` (string) — "SP - Brasil"
- `contactEmail` (string, with a custom validation rule requiring `@`)
- `footerCopyright` (string) — "Copyright © 2024..." (consider computing `new Date().getFullYear()` at build time instead of hardcoding the year, but keep as an editable string field if the user wants full control of the wording)
- `siteName` (string) — "dinamous.dev" (drives Navbar + `<title>` + OG title/description/keywords currently hardcoded in `main.tsx`'s `react-helmet-async` block — worth pulling those SEO strings into this singleton too as `seoTitle`/`seoDescription`/`seoKeywords`/`seoImage` fields, since Astro's `<head>` needs them at build time anyway)

Studio-side singleton enforcement: use Sanity's documented recipe — a custom desk structure (`studio/deskStructure.ts` or inline in `sanity.config.ts`'s `structure` field) that lists `siteSettings` as a single, non-creatable/non-deletable list item pointing at a fixed document ID (e.g. `siteSettings`), instead of the generic document-type list. This prevents an editor from creating multiple "Site Settings" docs by accident.

### 2.2 `project` (repeating document type, `studio/schemaTypes/project.ts`)

- `title` (string, required) — replaces `titulo`
- `slug` (slug, source: `title`) — not used by the current single-page site, but free to add now (optional, not required by current UI)
- `image` (image, with hotspot + required) — replaces local `img` import
- `description` (text) — replaces `descricao`
- `techs` (array of string) — replaces `techs[]`, unchanged shape
- `categories` (array of string, with a predefined `options.list` seeded from the current values: `Front-end`, `Front-End`, `Back-End`, `UI/UX`, `Mobile` — flag the case inconsistency `"Front-end"` vs `"Front-End"` in the source data as a bug to normalize during migration, use a single canonical casing) — replaces `categoria[]`
- `actions` (array of object, `studio/schemaTypes/objects/projectAction.ts`) — each object: `label` (string, e.g. "Repo"/"Link"), `url` (url type with `uri` validation) — replaces `actions[]`; drop the dead `repo`/`demo` top-level fields entirely per the inventory analysis above
- `order` (number, optional) — lets the user manually control display order in Studio (Sanity document arrays queried via GROQ need an explicit `order()` clause for deterministic ordering — recommend this field plus `| order(order asc)` in the query, falling back to `_createdAt` if `order` unset)
- `featured` (boolean, optional) — not in old data; cheap optionality to flag if the user later wants a "highlight" state; omit if scope discipline matters more than optionality

### 2.3 Schema registration

- `studio/schemaTypes/index.ts` exports `schemaTypes = [siteSettings, project, projectAction]`.
- `studio/sanity.config.ts` imports `schemaTypes`, sets `projectId`/`dataset` from env (Studio's own `.env` — different from the Astro site's `.env`), registers the `structureTool` with the custom singleton-aware structure, and `visionTool` (GROQ playground).
- Sanity typegen (`sanity schema extract` + `sanity typegen generate`) is optional polish, not required for MVP — simpler alternative: hand-write ~4 TypeScript interfaces in `src/lib/sanity.ts` (`SiteSettings`, `Project`, `SocialLink`, `ProjectAction`) and cast GROQ results to them.

---

## 3. Data fetching layer

### 3.1 `src/lib/sanity.ts`

- Instantiate a single `createClient` from `@sanity/client` with `{ projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID, dataset: import.meta.env.PUBLIC_SANITY_DATASET, apiVersion: import.meta.env.PUBLIC_SANITY_API_VERSION, useCdn: true }`. Use `useCdn: true` since this is build-time static fetching — keep the dataset **public** for read access so no `SANITY_API_TOKEN` secret is needed at build time (simplest path for a solo public portfolio).
- Export typed async functions: `getSiteSettings()` (fetches the singleton by fixed `_id: "siteSettings"`), `getProjects()` (fetches all `project` documents ordered).
- GROQ queries:
  - Site settings: fetch the raw `image` field objects (with `_ref`/`asset`), resolve URLs via `urlFor()` per usage site (hero avatar wants a small square crop, about-me photo a wider aspect, project cards a 16:9-ish crop) rather than inline GROQ projections — this is exactly what `@sanity/image-url`'s chainable `.width().height().fit().auto('format').url()` is for.
  - Projects: `*[_type == "project"] | order(order asc, _createdAt asc){ title, image, description, techs, categories, actions }`.
- Export a `urlFor(source)` helper (in `src/lib/sanity.image.ts`) wrapping `imageUrlBuilder(client)`.

### 3.2 Where it's called

- `src/pages/index.astro` frontmatter (runs at build time in Astro's default `output: 'static'` mode) calls `getSiteSettings()` and `getProjects()` once, then passes the resulting plain-object props down into each `.astro` section component — no client-side fetching, no loading states needed.
- Because Astro components receive data as props and render to static HTML at build time, there is no runtime dependency on Sanity being reachable after `astro build` completes — this preserves the static-site performance benefit.
- `.env` (git-ignored) holds the real `PUBLIC_SANITY_PROJECT_ID`/`PUBLIC_SANITY_DATASET` filled in later; until then, `getSiteSettings()`/`getProjects()` will either throw (invalid projectId) or return empty — see §9 for verifying against mock data before real credentials exist.

---

## 4. GSAP integration approach

Recommendation: **do not** wrap GSAP in a React island. GSAP operates directly on the DOM and needs zero framework glue; pulling in a hydrated React component purely to call `gsap.to(...)` on mount would ship React runtime JS for a job plain `<script>` modules do natively, defeating the point of choosing Astro islands for minimal JS. Use plain TypeScript modules loaded as Astro `<script>` tags (Astro bundles/treeshakes these automatically even though they're not React).

### 4.1 `src/scripts/gsap-setup.ts`
Single module: registers `ScrollTrigger` once via `gsap.registerPlugin(ScrollTrigger)`, exports `gsap`/`ScrollTrigger` for reuse by other scripts.

### 4.2 `src/scripts/reveal.ts` — generic scroll-reveal (replaces AOS)
- Convention: any element wanting a scroll reveal gets a `data-reveal` attribute (optionally `data-reveal-delay`, `data-reveal-y`), replacing the old `data-aos="fade-up"` etc. 1:1 in each `.astro` component's markup.
- `document.querySelectorAll('[data-reveal]')` → per element `gsap.from(el, { opacity: 0, y: 24, duration: 0.6, scrollTrigger: { trigger: el, start: 'top 85%' } })`, reading dataset overrides where present.
- Imported as a `<script>` module in `BaseLayout.astro`; wrap init in `document.addEventListener('astro:page-load', initReveals)` for forward-compat with View Transitions, even though this is a single-page site today.
- No `client:load`/`client:visible` directives needed — this isn't a framework component, it's a native `<script>` tag that Astro bundles/defers by default.

### 4.3 `src/scripts/hero-timeline.ts` — hero entrance
A `gsap.timeline()` sequencing blobs → avatar → heading/intro → social buttons, replacing AOS's `zoom-in`/`fade-up` pair with one cohesive authored timeline that runs on page load (not scroll-triggered, since Hero is above the fold). Selectors target `data-hero-*` attributes added to Hero.astro's markup, decoupled from Tailwind class churn.

### 4.4 `src/scripts/stagger-groups.ts` — stack icons + project cards
Two `ScrollTrigger`-batched staggers for `[data-stack-icon]` and `[data-project-card]`. Use `ScrollTrigger.batch()` only if the card count grows large enough to matter (8 cards today is fine either way).

### 4.5 Loading strategy
All three scripts import from `gsap-setup.ts` and are wired as `<script type="module">` tags inside the relevant `.astro` component — Astro bundles/dedupes/defers these automatically. No `client:idle` needed (that directive is for hydrating framework components, not plain scripts). This is the lower-JS approach preferred over wrapping reveals in React.

---

## 5. Component-by-component migration plan

| Old file | New home | Type | Notes |
|---|---|---|---|
| `App.tsx` | `src/pages/index.astro` | Astro page | Fetches Sanity data in frontmatter, composes sections |
| `main.tsx` + Helmet SEO block | `src/layouts/BaseLayout.astro` `<head>` | Astro layout | SEO meta becomes props/frontmatter-driven from `siteSettings.seo*`; no react-helmet-async needed |
| `Navbar.tsx` | `src/components/Navbar.astro` + `src/islands/MobileNav.tsx` + `src/islands/ThemeToggle.tsx` | Astro + 2 islands | Nav links stay hardcoded anchors; scroll bg toggle via tiny inline vanilla script, no island; only mobile `Dialog` and theme toggle are true islands (`client:load`) |
| `HeroHeader.tsx` | `src/components/Hero.astro` + `src/islands/AvatarTooltip.tsx` | Astro + 1 island | Blobs stay pure CSS/decorative, plain `.astro` markup; avatar hover-swap + Tooltip + toast is the one interactive piece (`client:load`) |
| `AboutMe.tsx` | `src/components/AboutMe.astro` | Astro, no island | Plain Tailwind markup instead of shadcn `Card` (purely presentational, no Radix behavior); `data-reveal` replaces `data-aos` |
| `MyStack.tsx` | `src/components/MyStack.astro` | Astro, no island | Plain `<img>` loop over `stackIcons`, `data-stack-icon` attrs, hover-lift stays pure CSS |
| `Projects.tsx` | `src/components/Projects.astro` + `ProjectCard.astro` | Astro, no island | Alert/Card/Separator become plain Tailwind markup, dropping React entirely for this section; images via `urlFor(project.image)...` |
| `Contact.tsx` | `src/components/Contact.astro` | Astro, no island | Static, same treatment as AboutMe |
| `Footer.tsx` | `src/components/Footer.astro` | Astro, no island | Pulls `socialLinks`/`footerCopyright` from the same `siteSettings` singleton Hero uses |
| `theme-provider.tsx` | Inline blocking `<script>` in `BaseLayout.astro` `<head>` + `src/islands/ThemeToggle.tsx` | Astro inline script + island | Synchronous inline script sets `document.documentElement.classList` before first paint (FOUC prevention, standard Astro dark-mode pattern); toggle reads/writes `document.documentElement` directly, no Context needed |
| `mode-toggle.tsx` | folded into `src/islands/ThemeToggle.tsx` | React island | Same Sun/Moon lucide-react cross-fade, reading/writing DOM directly instead of `useTheme()` context |
| `src/components/ui/*.tsx` | `src/ui/*.tsx` (subset) | React, island-only | Keep only `tooltip.tsx`, `sonner.tsx`, `button.tsx` (used by islands). Drop `alert.tsx`, `card.tsx`, `separator.tsx`, `dropdown-menu.tsx`, `menubar.tsx`, `resizable.tsx`, `tabs.tsx`, `toggle.tsx`, `toggle-group.tsx` — unused once Card/Alert/Separator become plain Astro markup. `Toaster` becomes its own tiny island mounted once (`client:load`) |
| `src/lib/utils.ts` (`cn()`) | `src/lib/utils.ts` | unchanged | Still needed by remaining `ui/*.tsx` primitives |
| `tailwind.config.js` | `src/styles/global.css` (`@theme` block) | CSS-first config | HSL vars, radius, blob/fadeIn keyframes portable as native CSS in Tailwind v4; verify `tailwindcss-animate` v4 compatibility (used by `tooltip.tsx`), replace with hand-written `@keyframes` if it proves v3-only |
| `src/index.css` | `src/styles/global.css` | merged | Scrollbar styling, `::selection`, `.animation-delay-2000/4000`, `html{scroll-behavior:smooth}` copy over unchanged |

---

## 6. package.json dependencies

### 6.1 Site root `package.json`

**Add:** `astro` (7.x), `@astrojs/react` (6.x), `@tailwindcss/vite` + `tailwindcss` (4.x, replaces standalone `postcss`/`autoprefixer` unless something else needs raw PostCSS), `gsap` (3.x), `@sanity/client` (6.x), `@sanity/image-url` (2.x), `react`/`react-dom` (verify React 18 vs 19 peer range for `@astrojs/react@6`, keep 18 if possible to minimize churn), `@radix-ui/react-tooltip` (kept), `@headlessui/react` (kept, MobileNav Dialog), `sonner` (kept), `class-variance-authority`/`clsx`/`tailwind-merge` (kept).

Prefer inlining LinkedIn/GitHub/Home/Envelope SVGs directly into `.astro` files instead of pulling `@radix-ui/react-icons` into non-island files; keep only `lucide-react`'s Sun/Moon inside the ThemeToggle island.

**Remove:** `aos` (replaced by GSAP+ScrollTrigger), `vite`/`@vitejs/plugin-react` (Astro bundles its own), `react-helmet-async` (Astro's `<head>` is static per-page), `react-resizable-panels` (confirm unused, likely dead), `next-themes` (unused directly — only referenced inside `sonner.tsx`'s `useTheme()`, a latent bug since the app never wrapped children in next-themes' Provider; new `Toaster` island reads `document.documentElement.classList` directly instead), `@radix-ui/react-dropdown-menu`/`menubar`/`tabs`/`toggle-group` (confirm unused via grep, likely shadcn boilerplate never wired up), `tailwindcss-animate` (only if proven v4-incompatible), `heroicons` (redundant with `@heroicons/react`, keep the latter for `Bars3Icon`/`XMarkIcon` in MobileNav).

`.eslintrc.cjs` targets Vite/React-only rules — Astro projects typically use `eslint-plugin-astro` instead; treat as a separate follow-up, not blocking.

### 6.2 `studio/package.json`
Generated automatically by `npm create sanity@latest` (`sanity`, `@sanity/vision`, its own `react`/`react-dom`, `styled-components` — isolated from the site's React tree, never touches the Astro bundle). No manual dependency work needed.

---

## 7. `.env.example`

Site root (`portifolio-dinamous/.env.example`):
```
PUBLIC_SANITY_PROJECT_ID=your-project-id
PUBLIC_SANITY_DATASET=production
PUBLIC_SANITY_API_VERSION=2026-01-01
```

- All three prefixed `PUBLIC_` per Astro's convention for client-exposed env vars (`import.meta.env.*`, replaced at build time).
- `PUBLIC_SANITY_API_VERSION` should be a real ISO date matching whenever the schema is finalized, per Sanity's API versioning convention ("today's date, or later").
- Actual `.env` stays git-ignored — verify old `.gitignore` covers `*.env`/`.env`, add if missing.
- `studio/.env.example` is separate, using Studio's own CLI env var naming (`SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET`).

---

## 8. Migration/deletion plan

**Delete outright (superseded, no reference value):** `src/App.tsx`, `src/main.tsx`, `vite.config.ts`, `index.html`, `src/vite-env.d.ts`, `.eslintrc.cjs`, `src/assets/react.svg`/`preview.png`/`Cute Avatar.png` (confirm unused first — grep shows only `avatar-transparente.png`/`avatar-hover.png` are actually imported).

**Delete after migrating into Sanity (keep locally until first successful Studio upload + build verification):**
- `src/assets/office.jpg` → `aboutPhoto` asset in Sanity.
- `src/assets/avatar-transparente.png`, `avatar-hover.png` — **decision point for the user**: recommend keeping these two local (brand/logo identity, not "content" the user is likely to want to manage via CMS) rather than moving to Sanity, unless the user says otherwise. All `src/assets/projects/*.png` (8 files) **do** move to Sanity, one per `project.image`, deleted from repo once confirmed rendering from Sanity's CDN.

**Delete once every component is rebuilt and visually verified against the old site:** all of `src/components/*.tsx` and any `ui/*.tsx` not carried into `src/ui/` — rely on git history for reference rather than keeping a parallel `_old/` folder. `tailwind.config.js`/`postcss.config.js` once `global.css`'s `@theme` block fully replaces them (Tailwind v4 can still read a legacy JS config via `@config` as a fallback if a clean port stalls). `components.json` can stay if the user wants to keep using `npx shadcn add` later (update its path fields).

**Keep unchanged:** `public/favicon/**`, `README.md` (update content), `.gitignore` (extend, don't replace).

---

## 9. Verification plan

### 9.1 Local dev — Astro site
- `npm run dev` at repo root (default `http://localhost:4321`), confirm hot-reload on `.astro` edits.
- With `.env` holding only placeholder/invalid Sanity credentials, `getSiteSettings()`/`getProjects()` will fail against the real API — mitigate with a local mock fallback in `src/lib/sanity.ts`: if `PUBLIC_SANITY_PROJECT_ID` is the placeholder/unset, return a hardcoded mock shaped like the real response (built from §0's inventory) instead of hitting the network, so every section renders and can be visually verified before real credentials exist.
- Manually diff each section against the old site (old repo still runnable on a different port, not yet deleted): Navbar (scroll bg swap, mobile Dialog, theme toggle), Hero (avatar hover swap, tooltip, click → toast with random phrase, blobs animating), MyStack (icons render, hover lift), AboutMe (photo + 2 paragraphs), Projects (all 8 cards, correct techs/categories/action icon-per-label heuristic), Contact (location/email cards), Footer (social links + copyright).
- Dark mode FOUC check: hard-refresh with dark mode active and confirm no flash of light-mode background before the inline script applies the `dark` class; verify via View Source that the script appears before any stylesheet/content in `<head>`.
- GSAP checks: hero timeline plays once on load; scroll-reveal fires once per element (use `toggleActions: "play none none none"` so reveals don't replay on scroll-up, matching AOS's one-shot behavior); stack-icon and project-card staggers show visually distinct per-item delay.

### 9.2 Local dev — Sanity Studio
- `cd studio && npm run dev` (default `http://localhost:3333`), independent of the Astro dev server, both can run simultaneously.
- Studio scaffolding (`npm create sanity@latest`) requires connecting to a real Sanity project during its own interactive flow — this is the natural point to capture real `projectId`/`dataset` and paste into the site's `.env`, so full end-to-end verification is gated on this one manual step, not indefinitely deferrable.
- Once connected: verify the custom desk structure shows a single non-duplicable "Site Settings" entry and a normal "Projects" list; create/edit the singleton, add one test `project` document with an uploaded image, publish both.
- Re-run the Astro build with real `.env` values, confirm the test project and edited site settings appear in the built HTML, confirm the Sanity-hosted image renders via the CDN URL (`<img>` `src` should point at `cdn.sanity.io` with width/format params from `@sanity/image-url`).
- Confirm `npm run build` succeeds end-to-end producing static output with no client-side Sanity fetch remaining (check Network tab on the built/previewed site — no `api.sanity.io` requests should fire from the browser, only from the build process).

---

## Critical files referenced during planning

- `src\components\HeroHeader.tsx`
- `src\components\Projects.tsx`
- `src\components\theme-provider.tsx`
- `tailwind.config.js`
- `src\index.css`
- `package.json`

These most directly drive the new Sanity schema fields (HeroHeader, Projects), the trickiest architectural translation (theme-provider's Context pattern → Astro inline script + island), and the dependency/design-token baseline carried into the new Astro + Tailwind v4 setup.
