# NEXT26 Superlógica Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the NEXT26 Superlógica project to the portfolio's project list, including a dedicated "Demo" video block on its detail page.

**Architecture:** The project system is data-driven: `projects.json` (raw data) → `src/lib/projects.ts` (normalizes + types) → `Projects.tsx` (list/filter UI) and `ProjectDetail.tsx` (detail overlay), both already generic over any entry. This work adds one JSON entry, extends the `Project`/`RawProject` types with an optional `video` field, and adds a new conditionally-rendered "Demo" section in `ProjectDetail.tsx` plus matching CSS. No new components, no changes to `Projects.tsx`/`Projects.css`.

**Tech Stack:** Vite + React 19 + TypeScript + GSAP 3 (existing `data-reveal` cascade pattern, no new animation code needed — the block joins the existing stagger). No test runner in this repo; verification is `tsc`/build plus manual check with the dev server.

## Global Constraints

- Animation: GSAP only, no CSS `@keyframes`/`transition` for interactive/entry animation (see `CLAUDE.md`). The new Demo block adds no animation of its own — it only needs to be included in `ProjectDetail.tsx`'s existing `data-reveal` cascade (`ProjectDetail.tsx:206-215`), so no new GSAP code is required.
- One component = one `.tsx` + one companion `.css` with the same name (`CLAUDE.md`). The Demo block is not a new component — it's markup inside the existing `ProjectDetail.tsx`, styled in the existing `ProjectDetail.css`.
- BEM naming for custom CSS classes (`CLAUDE.md`) — new classes follow `.projectdetail__demo*`.
- Commit messages use gitmoji style (`CLAUDE.md`), e.g. `feat: :sparkles: ...`.
- Comments only for non-obvious "why" (`CLAUDE.md`) — do not add explanatory comments to straightforward JSON/type changes.

---

### Task 1: Extend the `Project` type and data pipeline with an optional `video` field

**Files:**
- Modify: `src/lib/projects.ts:16-23` (`RawProject` type), `src/lib/projects.ts:5-14` (`Project` type), `src/lib/projects.ts:57-66` (the `.map()` that builds `projects`)

**Interfaces:**
- Consumes: nothing new — extends existing `RawProject`/`Project` types and the existing `.map()` pipeline.
- Produces: `Project.video?: string` — Task 3 (`ProjectDetail.tsx`) reads `project.video` to decide whether to render the Demo block.

- [ ] **Step 1: Add `video?: string` to both `RawProject` and `Project` types**

In `src/lib/projects.ts`, update the two type definitions:

```typescript
export type Project = {
  slug: string;
  title: string;
  description: string;
  tag: string;
  techs: string[];
  categories: string[];
  images: string[];
  actions: ProjectAction[];
  video?: string;
};
```

```typescript
type RawProject = {
  titulo: string;
  img: string;
  descricao: string;
  techs: string[];
  categoria?: string[];
  actions?: ProjectAction[];
  video?: string;
};
```

- [ ] **Step 2: Pass `video` through in the `projects` map**

In `src/lib/projects.ts`, the `projects` array build (around line 57):

```typescript
export const projects: Project[] = (rawProjects as RawProject[]).map((p) => ({
  slug: slugify(p.titulo),
  title: p.titulo,
  description: p.descricao,
  tag: p.techs.join(" / "),
  techs: p.techs,
  categories: categoriesOf(p.categoria),
  images: [p.img],
  actions: p.actions ?? [],
  video: p.video,
}));
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (Existing `projects.json` entries have no `video` key — since the field is optional, this is fine; `p.video` will be `undefined` for all of them.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/projects.ts
git commit -m "feat: :sparkles: adiciona campo opcional video ao model de projeto"
```

---

### Task 2: Add the NEXT26 Superlógica entry to `projects.json`

**Files:**
- Modify: `projects.json` (append new array entry)

**Interfaces:**
- Consumes: `Project`/`RawProject` shape from Task 1 (specifically the new `video` field).
- Produces: a `projects` entry with `slug: "next26-superlogica"` (derived by `slugify` from `"NEXT26 Superlógica"`), consumed by `Projects.tsx` (list rendering) and `ProjectDetail.tsx` (detail view, Task 3) via `getProjectBySlug`.

- [ ] **Step 1: Append the new entry to `projects.json`**

Add as the last element of the top-level array in `projects.json` (keep valid JSON — add a comma after the previous last entry's closing `}`):

```json
{
  "titulo": "NEXT26 Superlógica",
  "img": "/projects/next/next-hero.png",
  "descricao": "Landing page do NEXT26, evento da Superlógica para o mercado de moradia, reunindo marcas como Superlógica, Gruvi e Imobi num festival de conteúdo sobre tecnologia para o setor.",
  "techs": ["React", "Gatsby", "GraphQL", "Design System"],
  "categoria": ["Front-End"],
  "actions": [{ "label": "Link", "link": "https://next.superlogica.com/" }],
  "video": "/projects/next/next.webm"
}
```

This project only uses `next-hero.png` as `img` (the card thumbnail and first gallery image). `next-full-page.png` is added as a second gallery image in Step 2 below — `src/lib/projects.ts` only takes one `img` per raw entry (`images: [p.img]`), so the second image needs a small addition to the same mapping.

- [ ] **Step 2: Add `next-full-page.png` as a second gallery image**

The current pipeline (`src/lib/projects.ts:64`) hardcodes `images: [p.img]` — single image per project. Rather than restructuring the raw JSON shape (out of scope — would touch every existing entry), add a small per-slug override in `src/lib/projects.ts`, right after the `projects` array is built:

```typescript
export const projects: Project[] = (rawProjects as RawProject[]).map((p) => ({
  slug: slugify(p.titulo),
  title: p.titulo,
  description: p.descricao,
  tag: p.techs.join(" / "),
  techs: p.techs,
  categories: categoriesOf(p.categoria),
  images: [p.img],
  actions: p.actions ?? [],
  video: p.video,
}));

// next26-superlogica é o único projeto com mais de uma imagem de galeria hoje;
// o JSON cru continua 1 imagem por entrada (`img`), então a segunda é anexada
// aqui em vez de mudar o shape de RawProject pros outros projetos.
const nextProject = projects.find((p) => p.slug === "next26-superlogica");
if (nextProject) nextProject.images.push("/projects/next/next-full-page.png");
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Verify the data loads correctly**

Run: `npm run dev`, open the site, navigate to the Projects section, filter by "Frontend". Confirm a "NEXT26 Superlógica" row appears with the `next-hero.png` thumbnail and tag "React / Gatsby / GraphQL / Design System".

- [ ] **Step 5: Commit**

```bash
git add projects.json src/lib/projects.ts
git commit -m "feat: :sparkles: adiciona projeto NEXT26 Superlógica"
```

---

### Task 3: Add the "Demo" video block to `ProjectDetail.tsx`

**Files:**
- Modify: `src/views/ProjectDetail/ProjectDetail.tsx` (JSX, around line 448, and the `TECH_NPM` map at line 68-79)
- Modify: `src/views/ProjectDetail/ProjectDetail.css` (new `.projectdetail__demo*` rules, appended near the gallery-adjacent styles or at the end before the `@media` blocks)

**Interfaces:**
- Consumes: `project.video?: string` from Task 1/2; `CropMarks`, `DashedLine` from `../../components/graphics` (already imported in this file at line 10).
- Produces: nothing consumed by later tasks — this is the final visible piece.

- [ ] **Step 1: Add `Gatsby` to the `TECH_NPM` map**

In `src/views/ProjectDetail/ProjectDetail.tsx`, the `TECH_NPM` record (around line 68):

```typescript
const TECH_NPM: Record<string, string> = {
  Vue: "vue",
  Vite: "vite",
  Vuelidate: "@vuelidate/core",
  "shadcn/ui": "shadcn",
  React: "react",
  "React Native": "react-native",
  Expo: "expo",
  "styled-components": "styled-components",
  "Sequelize ORM": "sequelize",
  Bootstrap: "bootstrap",
  Gatsby: "gatsby",
};
```

(`React` already exists in the map — no change needed there. `GraphQL` and `Design System` are intentionally left out: they render as plain chips with no npm tooltip, same treatment as `Figma`/`SQL` today.)

- [ ] **Step 2: Insert the Demo block JSX**

In `src/views/ProjectDetail/ProjectDetail.tsx`, right after the `<ProjectGallery ... />` line (line 448) and before the `<section className="projectdetail__techs-block" ...>` (line 450):

```tsx
{project.video && (
  <section className="projectdetail__demo" data-reveal>
    <div className="projectdetail__demo-stub">
      <span>↠ Demo</span>
      <DashedLine className="projectdetail__demo-stub-edge" />
    </div>
    <div className="projectdetail__demo-frame">
      <CropMarks corners="all" x="8px" opacity={0.4} />
      <video
        className="projectdetail__demo-video"
        src={project.video}
        controls
        playsInline
        preload="metadata"
      />
    </div>
  </section>
)}
```

- [ ] **Step 3: Add the CSS for the Demo block**

In `src/views/ProjectDetail/ProjectDetail.css`, insert a new section after `.projectdetail__hr` (line 219-223) and before the `------------------------------------------------------- tecnologias + tooltip` comment block (line 225):

```css
/* -------------------------------------------------------------------- demo */

.projectdetail__demo {
  margin-top: clamp(1.6rem, 3.5vh, 2.6rem);
  will-change: transform, opacity;
}

.projectdetail__demo-stub {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.9rem;
  font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  font-size: 0.62rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(244, 247, 245, 0.45);
}

.projectdetail__demo-stub-edge {
  flex: 1 1 auto;
}

.projectdetail__demo-frame {
  position: relative;
  border: 1px solid rgba(244, 247, 245, 0.14);
  background: #080a09;
  padding: clamp(0.5rem, 1.5vw, 1rem);
}

.projectdetail__demo-video {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
}
```

Also add the mobile override inside the existing `@media (max-width: 640px)` block (line 328-337) if the frame padding needs tightening — reuse the existing block rather than adding a new query:

```css
@media (max-width: 640px) {
  .projectdetail__inner {
    padding: 10vh 6vw 8vh;
  }

  .projectdetail__close {
    top: 2.5vh;
    right: 6vw;
  }

  .projectdetail__demo-frame {
    padding: 0.5rem;
  }
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manual verification in the browser**

Run: `npm run dev`, open the site, go to Projects → open the "NEXT26 Superlógica" card.

Confirm:
- The detail overlay opens with the iris/clip-path transition (existing behavior, untouched).
- Gallery shows 2 images (`next-hero.png`, `next-full-page.png`), carousel arrows work.
- Below the gallery, a "↠ Demo" block appears with the `next.webm` video, native controls, no layout jump while it loads (fixed `aspect-ratio`).
- Tech chips show: `React` and `Gatsby` with the npm tooltip on hover (fetches from the npm registry); `GraphQL` and `Design System` as plain chips, no tooltip.
- The single action button "Link" opens `https://next.superlogica.com/` in a new tab.
- Resize to mobile width (≤640px) and confirm the Demo frame padding tightens and the video stays full-width without overflow.

- [ ] **Step 6: Commit**

```bash
git add src/views/ProjectDetail/ProjectDetail.tsx src/views/ProjectDetail/ProjectDetail.css
git commit -m "feat: :sparkles: adiciona bloco de demo em vídeo na ficha de projeto"
```

---

### Task 4: Clean up stray root-level scratch file

**Files:**
- Delete: `.tmp-shot-contact.mjs` (untracked file currently sitting at repo root, unrelated to this feature — visible in `git status` at session start)

**Interfaces:**
- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Confirm the file is unrelated scratch output, not in-progress work**

Run: `git status --short .tmp-shot-contact.mjs`
Expected: shown as untracked (`??`). Read its contents first — if it looks like a screenshot script the user is actively using, skip this task and leave it; otherwise remove it since it's not part of this feature and clutters the root.

```bash
cat .tmp-shot-contact.mjs
```

- [ ] **Step 2: Remove it if confirmed unrelated scratch**

```bash
rm .tmp-shot-contact.mjs
```

(No commit needed — it was untracked, so removing it doesn't touch git history. This step is cleanup only, not a required part of the NEXT26 feature; skip entirely if the user wants to keep the file.)

---

## Self-Review Notes

- **Spec coverage:** JSON entry (Task 2), `video` field on `Project`/`RawProject` (Task 1), Demo block conditional rendering (Task 3 Step 2), Demo CSS (Task 3 Step 3), `Gatsby` added to `TECH_NPM` (Task 3 Step 1), two-image gallery (Task 2 Step 2) — all spec sections covered. Task 4 is unrelated pre-existing repo clutter noticed in `git status`, included only as optional cleanup, not a spec requirement.
- **Placeholders:** none — all steps have literal code/JSON to write.
- **Type consistency:** `Project.video` (Task 1) matches `project.video` usage in Task 3; `nextProject.images.push(...)` (Task 2) matches the `images: string[]` field already defined in `Project`.
