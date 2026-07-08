# Hero Loading Inicial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um loading inicial discreto ao Hero (overlay preto + barra fina no topo) que segura a timeline de entrada até fontes do Google Fonts e o primeiro frame do DarkVeil (WebGL) estarem prontos.

**Architecture:** Um elemento `.hero__loader` renderizado no HTML do `Hero.astro` desde o primeiro paint. Uma tween GSAP de progresso contínuo roda em paralelo a um `Promise.race` entre `Promise.all([document.fonts.ready, darkVeilFirstFrame])` e um timeout de 3s. Quando a promise resolve, a barra completa rapidamente e o loader some via fade, e só então a timeline de entrada existente do Hero começa. `dark-veil.js` ganha uma option `onFirstFrame` chamada uma única vez no primeiro tick do loop de render.

**Tech Stack:** Astro 7, GSAP 3, ogl (WebGL), Tailwind CSS 4.

Não há framework de testes neste projeto (ver `package.json` — sem `test` script, sem dependência de test runner). Este projeto é 100% visual/animação; a verificação é manual, rodando `npm run dev` e observando o comportamento no navegador (incluindo `prefers-reduced-motion` via DevTools). Cada task abaixo termina com uma verificação manual explícita em vez de um teste automatizado.

## Global Constraints

- Toda animação usa GSAP — não usar `@keyframes`/`transition` CSS para isso (exceção já existente: `hero-type-blink`, puramente decorativo).
- `gsap.registerPlugin(...)` já registrado em `smoother.ts` — não duplicar.
- Sempre checar `window.matchMedia("(prefers-reduced-motion: reduce)").matches` e pular para o estado final via `gsap.set(...)` quando reduzido.
- Animar `transform`/`opacity` via GSAP, não propriedades que disparam layout (`width`, `top`, `left`) — a barra deve animar `scaleX`, não `width`.
- Um componente = um arquivo `.astro` com estilos `<style>` escopado no mesmo arquivo — sem CSS Modules.
- Nomenclatura BEM para classes customizadas (`.hero__loader`, `.hero__loader-bar`).
- Comentários só quando explicam um "porquê" não óbvio.
- Mensagens de commit em gitmoji (`feat: :sparkles: ...`).

---

### Task 1: `onFirstFrame` hook em `dark-veil.js`

**Files:**
- Modify: `src/components/dark-veil.js:79-171`

**Interfaces:**
- Produces: `createDarkVeil(container, options)` aceita nova option opcional `onFirstFrame?: () => void`, chamada exatamente uma vez, na primeira execução do `loop()`, antes de `renderer.render()`.

- [ ] **Step 1: Adicionar a option e a chamada no primeiro tick**

Em `src/components/dark-veil.js`, dentro de `createDarkVeil`, desestruturar a nova option e disparar o callback uma única vez no `loop`:

```js
export function createDarkVeil(container, options = {}) {
  const {
    hueShift = 0,
    noiseIntensity = 0,
    scanlineIntensity = 0,
    speed = 0.5,
    scanlineFrequency = 0,
    warpAmount = 0,
    resolutionScale = 1,
    onFirstFrame,
  } = options;
```

E no loop (substituindo o bloco existente em torno da linha 138-146):

```js
  const start = performance.now();
  let rafId = 0;
  let firstFrameFired = false;
  const loop = () => {
    rafId = requestAnimationFrame(loop);
    uniforms.uTime.value = ((performance.now() - start) / 1000) * speed;
    const mouse = uniforms.uMouse.value;
    mouse[0] += (targetMouseX - mouse[0]) * 0.05;
    mouse[1] += (targetMouseY - mouse[1]) * 0.05;
    renderer.render({ scene: mesh });
    if (!firstFrameFired) {
      firstFrameFired = true;
      onFirstFrame?.();
    }
  };
  rafId = requestAnimationFrame(loop);
```

- [ ] **Step 2: Verificação manual**

Rodar `npm run dev`, abrir a home, adicionar temporariamente `console.log("first frame")` dentro do `if (!firstFrameFired)` (ou usar o DevTools debugger) e confirmar no console que loga exatamente uma vez ao carregar a página. Remover o log de teste depois de confirmar (a chamada real via `onFirstFrame` vem na Task 2).

- [ ] **Step 3: Commit**

```bash
git add src/components/dark-veil.js
git commit -m "feat: :sparkles: adiciona hook onFirstFrame ao DarkVeil"
```

---

### Task 2: Markup e estilos do `.hero__loader`

**Files:**
- Modify: `src/components/Hero.astro` (markup dentro da `<section>`, e bloco `<style>`)

**Interfaces:**
- Produces: elementos `#hero-loader` (overlay) e `#hero-loader-bar` (barra), classes `.hero__loader` e `.hero__loader-bar`, consumidos pelo script na Task 3.

- [ ] **Step 1: Adicionar o markup**

Em `src/components/Hero.astro`, adicionar o loader como primeiro filho da `<section class="hero ...">`, antes de `.hero__aurora` (linha 9 atual):

```astro
  <div class="hero__loader" id="hero-loader" aria-hidden="true">
    <div class="hero__loader-bar" id="hero-loader-bar"></div>
  </div>

  <div class="hero__aurora" id="hero-aurora" aria-hidden="true"></div>
```

- [ ] **Step 2: Adicionar os estilos**

No bloco `<style>` de `Hero.astro`, adicionar (após o bloco `.hero` existente, antes de `.hero__scan`):

```css
  .hero__loader {
    position: absolute;
    inset: 0;
    z-index: 3;
    background: #000;
  }

  .hero__loader-bar {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 2px;
    background: #fff;
    transform-origin: left center;
    transform: scaleX(0);
    will-change: transform;
  }
```

`z-index: 3` fica acima de `.hero__scan` (2) e `.hero__type`/`.hero__aurora` (1), cobrindo tudo dentro da section.

- [ ] **Step 3: Verificação manual**

Rodar `npm run dev`, abrir a home. O overlay preto deve cobrir a tela toda (indistinguível do fundo preto do hero, já que a barra está com `scaleX: 0` = invisível). Nenhuma quebra de layout visível.

- [ ] **Step 4: Commit**

```bash
git add src/components/Hero.astro
git commit -m "feat: :sparkles: markup e estilos do loader inicial do hero"
```

---

### Task 3: Lógica do loader no script do Hero

**Files:**
- Modify: `src/components/Hero.astro` (bloco `<script>`)

**Interfaces:**
- Consumes: `createDarkVeil(container, options)` com `options.onFirstFrame` (Task 1); elementos `#hero-loader` / `#hero-loader-bar` (Task 2).
- Produces: a timeline de entrada existente (linhas 268-286 do arquivo original) só começa a ser construída/disparada depois que o loader resolver — encapsulada numa função `runEntrance()` chamada após o fade-out do loader.

- [ ] **Step 1: Capturar elementos do loader e envolver o DarkVeil com a promise de first-frame**

Em `src/components/Hero.astro`, no `<script>`, logo após a declaração de `heroType` (linha 210) e antes da criação de `darkVeil` (linha 211), adicionar:

```js
  const loader = document.getElementById("hero-loader")!;
  const loaderBar = document.getElementById("hero-loader-bar")!;

  let resolveFirstFrame: () => void;
  const darkVeilFirstFrame = new Promise<void>((resolve) => {
    resolveFirstFrame = resolve;
  });
```

E modificar a chamada de `createDarkVeil` (linha 211-218) para passar o callback:

```js
  const darkVeil = createDarkVeil(aurora, {
    hueShift: 50,
    noiseIntensity: 0.09,
    scanlineIntensity: 0.43,
    speed: 0.8,
    scanlineFrequency: 1.3,
    warpAmount: 0.3,
    onFirstFrame: () => resolveFirstFrame(),
  });
```

- [ ] **Step 2: Envolver o disparo da timeline de entrada numa função `runEntrance`**

O arquivo hoje tem, dentro do `if (reduceMotion) { ... } else { ... }`, a timeline de entrada e o listener de `navbar:revealed` (linhas 231-286). Envolver esse bloco inteiro (o `if/else` completo, sem alterar seu conteúdo interno) numa função:

```js
  function runEntrance() {
    if (reduceMotion) {
      gsap.set([...word1Letters, ...word2Letters], { y: 0, opacity: 1 });
      gsap.set(semi, { opacity: 1, scale: 1 });
      gsap.set(scan, { autoAlpha: 0 });
      gsap.set(aurora, { autoAlpha: 1 });
      gsap.set(heroType, { autoAlpha: 1 });
      startTextType(heroType, heroTypePhrases);
      enableSectionStack();
    } else {
      const isColumn = getComputedStyle(row).flexDirection === "column";
      const mainAxis = isColumn ? "y" : "x";
      const tightGap = 48; // px between the two words while centered

      const rowRect = row.getBoundingClientRect();
      const rowCenterX = rowRect.left + rowRect.width / 2;
      const rowCenterY = rowRect.top + rowRect.height / 2;
      const pivot = isColumn ? rowCenterY : rowCenterX;

      const rects = words.map((w) => w.getBoundingClientRect());
      const sizes = rects.map((r) => (isColumn ? r.height : r.width));
      const centers = rects.map((r) =>
        isColumn ? r.top + r.height / 2 : r.left + r.width / 2,
      );
      const wordDeltas = words.map((_, i) => {
        const side = i === 0 ? -1 : 1;
        const targetCenter = pivot + side * (tightGap / 2 + sizes[i] / 2);
        return targetCenter - centers[i];
      });

      gsap.set(row, { y: window.innerHeight / 2 - rowCenterY });
      words.forEach((w, i) =>
        gsap.set(w, { [mainAxis]: wordDeltas[i], scale: 0.8 }),
      );

      const scanHeight = scan.offsetHeight;
      gsap.set(scan, { y: heroSection.offsetHeight });

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .to(word1Letters, { y: "0%", opacity: 1, duration: 1.1, stagger: 0.09 }, 0)
        .to(word2Letters, { y: "0%", opacity: 1, duration: 1.1, stagger: 0.09 }, 0)
        .to(semi, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(3)" }, "+=0.15")
        .to(
          words,
          { x: 0, y: 0, scale: 1, duration: 1.1, stagger: 0.12, ease: "power3.inOut" },
          "+=0.3",
        )
        .to(row, { y: 0, duration: 1.1, ease: "power3.inOut" }, "<")
        .to(scan, { y: -scanHeight, duration: 2.4, ease: "power2.inOut" }, "-=0.35")
        .to(aurora, { autoAlpha: 1, duration: 0.7, ease: "power2.in" }, "-=1.8")
        .to(heroType, { autoAlpha: 1, duration: 0.6, ease: "power2.out" }, "<")
        .call(() => startTextType(heroType, heroTypePhrases))
        .call(() => window.dispatchEvent(new CustomEvent("hero:reveal-nav")), [], "+=0.15");

      window.addEventListener("navbar:revealed", enableSectionStack, { once: true });
    }
  }
```

- [ ] **Step 3: Adicionar a lógica do loader e chamar `runEntrance()` no fim dela**

Logo após a definição de `runEntrance` (e antes do listener de `stack:progress`, que permanece inalterado no fim do arquivo), adicionar:

```js
  if (reduceMotion) {
    gsap.set(loader, { autoAlpha: 0 });
    runEntrance();
  } else {
    const progressTween = gsap.to(loaderBar, {
      scaleX: 0.9,
      duration: 2.5,
      ease: "power1.out",
    });

    const fontsReady = document.fonts.ready;
    const safetyTimeout = new Promise<void>((resolve) => setTimeout(resolve, 3000));

    Promise.race([
      Promise.all([fontsReady, darkVeilFirstFrame]),
      safetyTimeout,
    ]).then(() => {
      progressTween.kill();
      gsap
        .timeline()
        .to(loaderBar, { scaleX: 1, duration: 0.3, ease: "power2.out" })
        .to(loader, { autoAlpha: 0, duration: 0.4, ease: "power2.out" }, "+=0.15")
        .call(runEntrance);
    });
  }
```

- [ ] **Step 4: Verificação manual — caminho normal**

Rodar `npm run dev`, abrir a home em `http://localhost:4321` (porta padrão do Astro dev). Observar: barra fina preenche suavemente no topo, some com fade curto, e só então a animação de entrada das letras/scan/aurora começa (sem sobreposição). Testar em reload múltiplas vezes (cache de fontes frio/quente) para confirmar que não trava.

- [ ] **Step 5: Verificação manual — reduced motion**

No Chrome DevTools, abrir Rendering tab → "Emulate CSS media feature prefers-reduced-motion: reduce", recarregar a página. Confirmar que o loader some imediatamente (sem barra animada) e o hero aparece direto no estado final, sem animação de entrada.

- [ ] **Step 6: Verificação manual — failsafe**

Simular falha: no DevTools, usar throttling de rede extremo (Slow 3G) ou bloquear o domínio `fonts.gstatic.com` via DevTools Network request blocking, recarregar. Confirmar que após ~3s o loader some de qualquer forma e a entrada dispara (não trava indefinidamente).

- [ ] **Step 7: Commit**

```bash
git add src/components/Hero.astro
git commit -m "feat: :sparkles: loading inicial discreto do hero com barra de progresso real"
```

---

## Self-Review Notes

- Cobertura do spec: overlay preto (Task 2), barra fina (Task 2/3), progresso real via `Promise.all([fonts, darkVeil first frame])` sem marcos (Task 3), failsafe 3s (Task 3 Step 3/6), reduced motion (Task 3 Step 1/5), DarkVeil hook (Task 1). Todos os pontos do spec de 2026-07-08-hero-loading-design.md têm task correspondente.
- Sem placeholders — todo código está completo e copiável.
- Tipos consistentes: `onFirstFrame` (Task 1) casa com `options.onFirstFrame` (Task 3 Step 1); `#hero-loader`/`#hero-loader-bar` (Task 2) casam com `getElementById` (Task 3 Step 1).
