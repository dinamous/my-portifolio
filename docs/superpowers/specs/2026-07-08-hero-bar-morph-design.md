# Hero bar → "I" morph via flubber

## Contexto

O Hero ([Hero.astro](../../../src/components/Hero.astro)) hoje transforma a barra fechada (resultado do `clip-path` de `sectionStack.ts`, encolhendo até `FINAL_WIDTH_VW` = 10vw) na letra "I" (`bar-i.svg`) usando `mask-image` com uma troca abrupta de classe (`.hero--spinning`). Não há interpolação de forma — a máscara muda de retângulo para glifo instantaneamente quando `spinT > 0`.

Este design substitui essa técnica pela lib `flubber` (MIT, gratuita) para produzir um morph real do path SVG: um retângulo se transforma suavemente na forma do "I" conforme o usuário rola a página.

## Escopo

- Substitui apenas a etapa de "virar o I" (a `mask-image`/`.hero--spinning`), **não** o `clip-path` de fechamento da barra em `sectionStack.ts`, que continua controlando a largura de 10vw como hoje.
- Fica restrito ao Hero; não afeta outras seções.

## Arquitetura

### Dependência nova

`flubber` via npm (MIT license). Usada apenas para gerar a função de interpolação entre dois paths SVG — não precisa rodar em cada frame de forma cara, já que `interpolate()` é chamada uma vez no load do script e retorna uma função barata de amostrar por `t`.

### Novo helper: `src/lib/heroMorph.ts`

Isolado para ser testável fora do componente Astro:

- `buildDenseRectPath(width: number, height: number, pointsPerSide: number): string` — gera o `d` de um retângulo com pontos extras distribuídos uniformemente em cada lado (não só os 4 cantos), para dar ao flubber uma interpolação mais previsível contra o path orgânico e curvo do "I".
- `createBarMorph(rectPathD: string, iPathD: string): (t: number) => string` — wrapper fino sobre `flubber.interpolate`, retornando a função de interpolação pronta para ser chamada com `spinT` (0 a 1).
- O `d` do `bar-i.svg` é importado/colado como string constante no helper (o SVG tem `viewBox="0 0 25 114"`; o path já existe em `public/bar-i.svg`).
- `buildDenseRectPath` usa as mesmas dimensões do viewBox (25×114) para que o retângulo de partida e o path do "I" compartilhem o mesmo sistema de coordenadas, sem necessidade de escala adicional no morph em si (a escala visual final continua sendo responsabilidade do `mask-size`/`viewBox` do `<svg>` no componente, como já ocorre hoje).

### Markup no Hero.astro

Um `<svg>` novo dentro de `.hero-section`, com:
- `viewBox="0 0 25 114"` (mesmo sistema de coordenadas do `bar-i.svg`).
- Posicionado/centralizado para ocupar a mesma área que a barra final de 10vw ocupa hoje (usando a mesma lógica de largura já resolvida em [Hero.astro:182](../../../src/components/Hero.astro#L182) — o caule do glifo bate com `FINAL_WIDTH_VW`).
- Um único `<path id="hero-morph-path" fill="currentColor">` (ou fill explícito), cujo `d` começa como o retângulo denso.
- `visibility`/`opacity` inicial: oculto até `spinT > 0` (mesmo gate que `.hero--spinning` tinha).

O `mask-image`/`.hero--spinning` em CSS é removido.

### Sincronização com o scroll

Dentro do handler `stack:progress` existente ([Hero.astro:304-352](../../../src/components/Hero.astro#L304-L352)):

- `spinT` continua calculado exatamente como hoje (linha 313).
- A cada tick, `path.setAttribute("d", interpolator(spinT))` substitui o antigo `heroSection.classList.toggle("hero--spinning", spinT > 0)`.
- O SVG fica visível assim que `spinT > 0` (mesmo gate atual) e escondido (`opacity: 0` via `gsap.set`) quando `spinT` chega a 1.
- `rotation`, `scaleX`, `scaleY`, `backgroundColor` continuam sendo aplicados a `heroSection` como já ocorre (linhas 331-336) — o SVG, por estar dentro dela e sem transform própria conflitante, herda essas transformações naturalmente.

### Fim de vida / performance

Quando `spinT` atinge 1 (fim do spin, barra some):
- O SVG recebe `opacity: 0` (ou `visibility: hidden`).
- `heroSection` recebe `display: none` — ajuste novo em relação ao comportamento atual (hoje ela só encolhe via `scaleX`/`scaleY` até 0, permanecendo no layout). Isso evita manter um elemento fixed full-screen ativo (com DarkVeil/aurora, listeners, etc.) depois que ele deixou de ser visível, economizando recurso.
- Esse toggle de `display: none` só deve disparar uma vez (na borda `spinT` cruzando 1 de baixo pra cima), não a cada frame — para não invalidar layout repetidamente. Pode usar um flag simples (`let hidden = false`) dentro do closure do listener.
- Reverter esse `display: none` não é necessário: a seção não volta a ficar visível depois (mesma direção de scroll unidirecional do restante do sectionStack).

### Reduced motion

Segue o padrão já usado no restante do Hero (`prefers-reduced-motion: reduce`): pula direto para o estado final do path (o "I" completo) via `gsap.set`-equivalente (atribuição direta do `d` final), sem passar pela interpolação frame a frame.

### Fora de escopo

- Não altera `sectionStack.ts` além do que já existe (`FINAL_WIDTH_VW`, `CLIP_CLOSE_T` continuam como estão).
- Não adiciona morph a nenhuma outra seção.
- Não versiona o SVG do "I" fora do path já existente em `bar-i.svg` (o helper apenas referencia/copia o `d`).

## Testes

- `heroMorph.ts` é testável isoladamente: `createBarMorph(...)(0)` deve aproximar o path retangular; `createBarMorph(...)(1)` deve aproximar o `d` do `bar-i.svg`.
- Verificação visual manual no scroll do Hero (dev server), com e sem `prefers-reduced-motion`.
