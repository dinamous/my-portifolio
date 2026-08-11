# Regras do projeto

Stack: Vite + React 19 + GSAP 3 + Tailwind CSS 4. Componentes são `.tsx`, um arquivo por componente.

## Animação

- Toda animação (interação, entrada, scroll) é feita com GSAP. Não usar CSS `@keyframes`/`transition` para isso, nem outra lib de animação (Framer Motion, anime.js, etc). Exceção já existente: `@keyframes` só para o piscar do cursor de texto (`hero-type-blink`), por ser puramente decorativo e não interativo.
- `gsap.registerPlugin(...)` só deve ser chamado uma vez por plugin (ex. `ScrambleTextPlugin` em [Skills.tsx](src/components/Skills.tsx)) — não duplicar o registro em outro componente que use o mesmo plugin.
- Sequenciamento de seções (scroll, clip-path, z-index) fica em [sectionStack.ts](src/lib/sectionStack.ts) via GSAP `Observer` — importar `initSectionStack`/`enableSectionStack`/`goToSection` de lá em vez de recriar a lógica.
- Sempre checar `window.matchMedia("(prefers-reduced-motion: reduce)").matches` e pular para o estado final via `gsap.set(...)` quando reduzido. Ver [Hero.tsx](src/components/Hero.tsx) como referência.
- Uma timeline por seção/interação; usar position parameters (`"-="`, `"<"`, labels) em vez de `setTimeout` para encadear.
- Animar `transform`/`opacity` (via GSAP), não propriedades que disparam layout (`width`, `top`, `left`).

## React

- Lógica de dados/props no corpo do componente; DOM e GSAP em `useEffect`, buscando elementos por id/seletor (`document.getElementById(...)`) como nos componentes existentes — não reescrever essa camada como refs a menos que vá mexer no efeito de qualquer forma.
- `useEffect` de animação sempre limpa listeners/tweens no `return` (ver [Contact.tsx](src/components/Contact.tsx)); sem isso, remount/HMR duplica listeners.
- Um componente = um arquivo `.tsx` + um `.css` companheiro com o mesmo nome, importado diretamente no componente (`import "./Hero.css"`). Sem CSS Modules — classes já são BEM, então não colidem.
- `<script>` de seção só deve pegar elementos pelo id/seletor daquela seção, sem acoplar a estrutura de outras seções.
- Sem `StrictMode` em [main.tsx](src/main.tsx): os efeitos de animação são imperativos e de disparo único (`ponytail:` documentado ali), não escritos para sobreviver a um double-mount.

## CSS / Tailwind

- Tailwind 4 via `@import "tailwindcss"` em [global.css](src/styles/global.css). Usar utilitárias Tailwind para layout/spacing/cores estáticas; usar o `.css` do componente só para o que Tailwind não cobre bem (ex. BEM custom com clamps, animação-alvo do GSAP).
- Nomenclatura de classes customizadas em BEM (`.hero__word--first`), como já usado em Hero/Navbar.

## Convenções gerais

- Comentários só quando explicam um "porquê" não óbvio (ver comentários `ponytail:` existentes como exemplo de tom). Não comentar o óbvio.
- Preferir reescrever/estender um `lib/*.ts` existente a criar um novo helper duplicado — checar `src/lib/` antes de escrever lógica nova (scroll, texto, shaders).
- Variáveis de ambiente client-side usam o prefixo `VITE_` (não `PUBLIC_`), ver [env.d.ts](src/env.d.ts).
- Mensagens de commit no padrão gitmoji já usado no histórico (`feat: :sparkles: ...`, `fix: :bug: ...`).
