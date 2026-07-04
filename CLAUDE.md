# Regras do projeto

Stack: Astro 7 + GSAP 3 + Tailwind CSS 4. Sem React/Vue/etc — componentes são `.astro` com `<script>` inline.

## Animação

- Toda animação (interação, entrada, scroll) é feita com GSAP. Não usar CSS `@keyframes`/`transition` para isso, nem outra lib de animação (Framer Motion, anime.js, etc). Exceção já existente: `@keyframes` só para o piscar do cursor de texto (`hero-type-blink`), por ser puramente decorativo e não interativo.
- `gsap.registerPlugin(...)` só deve ser chamado uma vez por plugin. `ScrollTrigger`/`ScrollSmoother` já são registrados em [smoother.ts](src/lib/smoother.ts) — importar `getSmoother()` de lá em vez de criar uma nova instância.
- Sempre checar `window.matchMedia("(prefers-reduced-motion: reduce)").matches` e pular para o estado final via `gsap.set(...)` quando reduzido. Ver [Hero.astro](src/components/Hero.astro) como referência.
- Uma timeline por seção/interação; usar position parameters (`"-="`, `"<"`, labels) em vez de `setTimeout` para encadear.
- Animar `transform`/`opacity` (via GSAP), não propriedades que disparam layout (`width`, `top`, `left`).

## Astro

- Lógica de dados/props no frontmatter (`---`); DOM e GSAP no `<script>` (module, roda client-side).
- Um componente = um arquivo `.astro` com estilos `<style>` escopados no mesmo arquivo. Não criar CSS Modules nem arquivos de estilo separados por componente.
- `<script>` de componente só deve pegar elementos pelo id/seletor daquele componente (`document.getElementById(...)`), sem acoplar a estrutura de outras seções.

## CSS / Tailwind

- Tailwind 4 via `@import "tailwindcss"` em [global.css](src/styles/global.css). Usar utilitárias Tailwind para layout/spacing/cores estáticas; usar `<style>` escopado do componente só para o que Tailwind não cobre bem (ex. BEM custom com clamps, animação-alvo do GSAP).
- Nomenclatura de classes customizadas em BEM (`.hero__word--first`), como já usado em Hero/Navbar.

## Convenções gerais

- Comentários só quando explicam um "porquê" não óbvio (ver comentários `ponytail:` existentes como exemplo de tom). Não comentar o óbvio.
- Preferir reescrever/estender um `lib/*.ts` existente a criar um novo helper duplicado — checar `src/lib/` antes de escrever lógica nova (scroll, texto, shaders).
- Mensagens de commit no padrão gitmoji já usado no histórico (`feat: :sparkles: ...`, `fix: :bug: ...`).
