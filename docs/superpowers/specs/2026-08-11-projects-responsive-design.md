# Projects — responsividade do título e marquee de tecnologias

## Contexto

Em `src/views/Projects/Projects.tsx` / `Projects.css`, duas lacunas:

1. `.projects__title` (nome do projeto, dentro de `.projects__row`, grid `1fr auto auto`) não tem proteção contra overflow — um nome longo em coluna estreita estica o grid ou quebra o layout da row.
2. `.projects__marquee` (carrossel de tags reais dos projetos, no header) já existe e funciona, mas some (`display: none`) em `≤1100px` — ou seja, em tablet e mobile o carrossel de tecnologias simplesmente desaparece.

## Mudança 1 — título com fade em vez de corte seco

`.projects__title` usa `AnimatedLetters`, que quebra cada caractere em `<span class="projects__letter-wrap"><span class="projects__letter">`. Isso impede `text-overflow: ellipsis` nativo (que exige texto contínuo). Solução: mascarar visualmente a borda direita do título com `mask-image`/`-webkit-mask-image: linear-gradient(90deg, #000 85%, transparent 100%)`, junto com `overflow: hidden` e `max-width: 100%`. Quando o texto cabe, a máscara não tem nada para cortar — visualmente não muda nada; quando estoura, a borda direita se dissolve em vez de vazar.

Pré-requisito: a coluna do título no grid de `.projects__row` (`grid-template-columns: 1fr auto auto`) precisa de `min-width: 0` — sem isso, itens de grid não encolhem abaixo do conteúdo intrínseco, e é essa a causa raiz do estouro hoje.

Não mexe em `AnimatedLetters.tsx` nem na timeline GSAP de reveal — puramente CSS em `.projects__title`.

## Mudança 2 — marquee visível em todas as larguras

- Remove a regra `@media (max-width: 1100px) { .projects__marquee { display: none } }`.
- Novo comportamento no mesmo breakpoint (`≤1100px`): `.projects__meta` ganha `flex-wrap: wrap`, e `.projects__marquee` ganha `flex-basis: 100%` (+ ajuste de `min-width`/`width` para ocupar a linha toda) — o marquee desce para uma linha própria, abaixo de `.projects__filters`, em vez de dividir espaço horizontal com eles.
- O breakpoint `≤640px` existente remove sua própria regra `display: none` duplicada do marquee (ele herda o comportamento de linha própria do breakpoint de 1100px) e mantém `align-items: flex-start` / demais ajustes já existentes.
- A máscara lateral (`mask-image` de fade nas bordas) do marquee continua a mesma, só a largura do container muda.

## Fora de escopo

- Não mexe na lógica JS/GSAP do marquee (`gsap.to(track, { xPercent: -50, repeat: -1 })` em `Projects.tsx`) — é puramente CSS/layout.
- Não mexe em `.projects__tag` (string de techs por row) — não fez parte do pedido.
- Não adiciona novo componente de carrossel; "carrossel de tecnologias" é o marquee que já existe, só corrigindo a visibilidade dele.
