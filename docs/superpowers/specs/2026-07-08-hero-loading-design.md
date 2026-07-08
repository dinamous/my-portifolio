# Hero: loading inicial discreto

## Problema

O Hero dispara sua timeline de entrada (letras, scan, aurora/DarkVeil, texto digitado) assim que o script roda, mas ativos pesados — fontes do Google Fonts e o primeiro frame do shader WebGL do DarkVeil — podem não estar prontos ainda. O resultado é a sensação de "tudo carrega de uma vez" / flash de conteúdo não estilizado.

## Objetivo

Adicionar um loading inicial mínimo que segura o início da timeline de entrada até fontes + primeiro frame do DarkVeil estarem prontos, com feedback visual (barra fina) em vez de esconder silenciosamente.

## Design

### Estrutura

Novo elemento `.hero__loader` dentro de `#hero-section`, presente no HTML desde o primeiro paint (sem esperar JS) para evitar qualquer flash:

```html
<div class="hero__loader" id="hero-loader" aria-hidden="true">
  <div class="hero__loader-bar" id="hero-loader-bar"></div>
</div>
```

- `.hero__loader`: overlay preto full-screen (`position: absolute; inset: 0`), `z-index` acima de todos os outros elementos do hero (scan, aurora, type, bottom, navbar).
- `.hero__loader-bar`: barra fina no topo (`height: 2px`, `width: 100%`), `transform-origin: left`, escala via `scaleX` (GSAP anima transform, não `width`).

### Progresso (sem marcos, sem números)

1. Ao rodar o script, a barra começa a preencher com uma tween GSAP de `scaleX: 0` até `scaleX: 0.9`, `ease: "power1.out"`, duração generosa (~2.5s) — dá feedback de atividade sem prometer um término exato.
2. Em paralelo, `Promise.all([fontsReady, darkVeilFirstFrame])`:
   - `fontsReady` = `document.fonts.ready`.
   - `darkVeilFirstFrame` = novo `Promise` resolvido pelo `createDarkVeil` no primeiro tick do seu `requestAnimationFrame` loop (ver mudança em `dark-veil.js` abaixo).
3. Quando a promise combinada resolve: mata a tween de progresso lento, anima rapidamente `scaleX` até `1` (`power2.out`, ~0.3s), espera um beat curto (~0.15s), depois `autoAlpha: 0` no `.hero__loader` (fade-out).
4. Só ao terminar esse fade-out a timeline de entrada atual do Hero (já existente, sem mudanças) começa.

### Mudança em `dark-veil.js`

`createDarkVeil` ganha um retorno adicional: uma `Promise` (ou callback via options) que resolve assim que o primeiro `renderer.render()` roda dentro do `loop()`. Abordagem: adicionar option `onFirstFrame?: () => void` chamada uma única vez dentro do primeiro tick do loop, antes de qualquer outra lógica — Hero.astro embrulha isso numa `Promise` local.

### Failsafe

`setTimeout` de 3s que força a resolução do fade-out do loader mesmo que `Promise.all` nunca resolva (ex: falha de rede nas fontes). Implementado com `Promise.race`.

### Reduced motion

Quando `prefers-reduced-motion: reduce`: nenhuma tween de progresso — a barra vai direto para `scaleX: 1` via `gsap.set`, e o loader some com fade curto (ou instantâneo, coerente com o restante do bloco `reduceMotion` já existente no arquivo) antes do estado final já ser aplicado via `gsap.set`.

### Fora de escopo

- Não é um preloader de página inteira (não cobre outras sections) — só o Hero.
- Sem número percentual visível.
- Sem retry/tratamento de erro específico para falha de fontes além do failsafe de timeout.
