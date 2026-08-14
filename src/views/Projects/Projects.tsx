import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "../../lib/motion";
import { PROJECT_FILTERS, filterProjects, projects } from "../../lib/projects";
import { projectPath } from "../../lib/router";
import { TRANSITION_DISTANCE, refreshSectionStack } from "../../lib/sectionStack";
import { scrubTimeline } from "../../lib/scrub";
import AnimatedLetters from "../../components/AnimatedLetters";
import { CropMarks, RegMark } from "../../components/graphics";
import "./Projects.css";

// tags reais viram o conteúdo do marquee do header — sem lista redundante hardcoded
const marqueeItems = Array.from(new Set(projects.flatMap((p) => p.tag.split(" / "))));

// row é um <a href> de verdade (ctrl/cmd/middle-click abrem em nova aba do jeito
// normal do navegador); só intercepta o clique simples pra rodar a transição GSAP
// do ProjectDetail em vez de uma navegação de página cheia.
function handleOpenProject(e: ReactMouseEvent<HTMLAnchorElement>, slug: string, active: boolean) {
  // active vem do mesmo revealT/exitLocal que a animação usa — bloqueia o clique
  // (inclusive ctrl/cmd-click) enquanto a row ainda não terminou de aparecer ou já
  // começou a sair, sem depender de pointer-events (isso quebrava o hover, ver pill).
  if (!active) {
    e.preventDefault();
    return;
  }
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  window.dispatchEvent(
    new CustomEvent("project:open", {
      detail: { slug, x: e.clientX, y: e.clientY, trigger: e.currentTarget },
    }),
  );
}

export default function Projects() {
  const activeRef = useRef(false);
  // sobrevive à remontagem do efeito na troca de filtro: com a seção já revelada,
  // só as linhas recascatam — reanimar o header (onde vivem os próprios botões de
  // filtro) a cada clique seria um flash gratuito
  const enteredRef = useRef(false);
  // filtro inicial vem da URL (?filtro=) quando ela aponta pra um valor válido —
  // recarregar ou compartilhar um link filtrado preserva a seleção
  const [filter, setFilter] = useState(() => {
    const fromUrl = new URLSearchParams(location.search).get("filtro");
    return fromUrl && (PROJECT_FILTERS as string[]).includes(fromUrl) ? fromUrl : PROJECT_FILTERS[0];
  });
  // dois estados de propósito: `filter` é o botão (responde no clique) e `listFilter` é a
  // lista, que só troca depois das linhas atuais saírem. Com um estado só, o React
  // remontava as linhas no mesmo frame do clique — as antigas sumiam de uma vez, sem
  // saída, e as que sobreviviam ao filtro piscavam no estado final antes de recascatar.
  const [listFilter, setListFilter] = useState(filter);
  const visible = useMemo(() => filterProjects(listFilter), [listFilter]);

  const pickFilter = (f: string) => {
    if (f === filter) return;
    setFilter(f);
    // replaceState (não push): trocar de filtro não deve empilhar histórico,
    // só manter a URL compartilhável/atualizável com a seleção atual
    const params = new URLSearchParams(location.search);
    if (f === PROJECT_FILTERS[0]) params.delete("filtro");
    else params.set("filtro", f);
    const query = params.toString();
    history.replaceState(
      history.state,
      "",
      `${location.pathname}${query ? `?${query}` : ""}${location.hash}`,
    );
    const rows = gsap.utils.toArray<HTMLElement>(".projects__row");
    // sem entrada feita ainda não há nada em cena pra tirar
    if (!enteredRef.current || prefersReducedMotion() || !rows.length) {
      setListFilter(f);
      return;
    }
    // overwrite: um segundo clique durante a cascata mata este tween, e tween morto não
    // dispara onComplete — só o último filtro clicado chega na lista
    gsap.to(rows, {
      x: -80,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
      stagger: Math.min(0.04, 0.24 / rows.length),
      overwrite: true,
      onComplete: () => setListFilter(f),
    });
  };

  // efeito próprio (deps []) de propósito: no efeito de [filter] cada clique num
  // filtro matava e recriava o tween em xPercent:0 — era isso que fazia o loop
  // "recomeçar" na cara do usuário. Aqui ele nasce uma vez e nunca reinicia.
  useEffect(() => {
    const track = document.getElementById("projects-marquee-track");
    if (!track || prefersReducedMotion()) return;
    const tween = gsap.to(track, {
      xPercent: -50,
      duration: Math.max(8, marqueeItems.length * 1.8),
      ease: "none",
      repeat: -1,
    });
    return () => {
      tween.kill();
    };
  }, []);

  // useLayoutEffect, não useEffect: na troca de filtro o React comita as linhas novas e o
  // navegador PINTA antes de um efeito passivo rodar — as linhas que sobreviveram ao
  // filtro apareciam um frame no estado final (styles inline da cascata anterior) e só
  // então eram escondidas pra recascatar. Era esse o flash.
  useLayoutEffect(() => {
    const section = document.getElementById("projects-section")!;
    const header = document.getElementById("projects-header")!;
    const headerLetters = document.querySelectorAll<HTMLElement>("#projects-heading .projects__letter");
    const listViewport = document.getElementById("projects-list-viewport")!;
    const list = document.getElementById("projects-list")!;
    const progress = section.querySelector<HTMLElement>(".projects__progress")!;
    const progressTrack = section.querySelector<HTMLElement>(".projects__progress-track")!;
    const progressFill = document.getElementById("projects-progress-fill");
    const progressIndex = document.getElementById("projects-progress-index");
    const rows = Array.from(document.querySelectorAll<HTMLElement>(".projects__row"));

    // o passo do scroll da lista é uma row: a viewport é dividida num número inteiro
    // de rows (--projects-row-h), então nenhuma parada deixa meia row cortada no topo
    // ou no pé, e a última row termina exatamente no fim do container. Medido (e não
    // fixo no CSS) porque quantas rows cabem depende da altura da viewport.
    let rowH = 0;
    let maxStep = 0;
    // respiro: fatia do curso em que o scroll não move nada, entre a lista chegar
    // ao fim e a cascata de saída disparar. Sem ele um notch a mais na última linha
    // já arremessava a seção fora, sem dar tempo de ler o último projeto — e vale
    // também sem overflow, onde a lista inteira aparece de cara.
    const BREATHE_T = 0.12;
    // a metade final do curso é da saída, e não "o que a lista não usou": é
    // exatamente a janela em que a barra da Skills enche na navbar (sectionEnter, em
    // sectionStack, faz a troca em local 0.5 e isso não é negociável daqui). Deixar a
    // lista correr até 0.9 empurrava a cascata inteira pros 10% finais — a barra da
    // Skills andava meio curso com a Projects intacta, e aí a transição acontecia num
    // piscar. A lista fica com o que vem antes do respiro.
    const EXIT_START = 0.5;
    // janela do progresso local dedicada a navegar a lista.
    // ponytail: teto fixo, então lista longa rola mais rápido que o wheel (hoje ~1.7x)
    // em vez de roubar curso da saída; só um passo variável no stack resolveria de fato.
    let listT = 0;

    const measure = () => {
      // sem a var, o li volta pra altura natural do clamp — é dela que sai quantas
      // rows inteiras cabem na viewport
      list.style.removeProperty("--projects-row-h");
      const natural = rows[0]?.getBoundingClientRect().height || 1;
      // getBoundingClientRect e não clientHeight: clientHeight vem arredondado pro
      // inteiro, e 1px de erro aqui vira 1px de row sobrando no pé do container
      const viewportH = listViewport.getBoundingClientRect().height;
      const perPage = Math.max(1, Math.round(viewportH / natural));
      rowH = viewportH / perPage;
      maxStep = Math.max(0, rows.length - perPage);
      list.style.setProperty("--projects-row-h", `${rowH}px`);
      listT =
        maxStep > 0
          ? gsap.utils.clamp(0.2, EXIT_START - BREATHE_T, (maxStep * rowH) / TRANSITION_DISTANCE)
          : 0;
    };
    measure();

    // a cascata (entrada e saída) só conta as linhas que estão em cena: as abaixo da
    // dobra na entrada, e as que a lista já rolou pra fora do topo na saída, gastariam
    // slot de stagger sem ninguém ver — com lista longa era isso que empurrava a cascata
    // visível pra quase o fim do curso. Quem está fora de cena anda junto com a linha de
    // borda mais próxima, então nada fica pra trás sem animar.
    // ponytail: contagem congelada aqui; um resize que mude quantas linhas cabem só
    // desalinha a ordem da cascata, nada quebra — não vale reconstruir a timeline.
    const rowsOnScreen = Math.max(1, rows.length - maxStep);
    const rowRevealStagger = Math.min(0.12, 1.6 / rowsOnScreen);
    const rowExitStagger = Math.min(0.08, 1.2 / rowsOnScreen);
    const revealSlot = (i: number) => Math.min(i, rowsOnScreen - 1);
    const exitSlot = (i: number) => Math.max(0, i - maxStep);

    gsap.set(list, { y: 0 });
    gsap.set(progressFill, { scaleY: maxStep > 0 ? 0 : 1 });
    if (progressIndex) progressIndex.textContent = "01";

    const reduceMotion = prefersReducedMotion();

    // o scroll chega contínuo do stack e sai daqui em passos de row; o glide entre um
    // passo e o outro é do quickTo (retarget contínuo), não do scroll — é o que evita
    // o salto seco a cada notch que cruza um limiar.
    const listY = reduceMotion
      ? (v: number) => void gsap.set(list, { y: v })
      : gsap.quickTo(list, "y", { duration: 0.45, ease: "power3" });

    // último progresso local recebido do stack: é a fonte da posição da lista, então
    // uma remedição (resize) reaplica ele em vez de voltar a lista pro começo
    let lastP = 0;
    const applyBrowse = (p: number) => {
      lastP = p;
      const browseT = maxStep > 0 ? gsap.utils.clamp(0, 1, p / listT) : 1;
      const raw = browseT * maxStep;
      listY(-raw * rowH);
      gsap.set(progressFill, { scaleY: browseT });
      if (progressIndex) {
        const activeIndex = Math.min(rows.length, Math.max(1, Math.round(1 + browseT * (rows.length - 1))));
        progressIndex.textContent = String(activeIndex).padStart(2, "0");
      }
    };

    // sem isto o número inteiro de rows medido acima vira mentira assim que a viewport
    // muda de altura, e volta a sobrar meia row no pé. Observer na caixa em vez de
    // resize da janela porque a primeira medição cai antes das fontes assentarem — o
    // header muda de altura depois dela, e só o RO enxerga isso.
    const ro = new ResizeObserver(() => {
      measure();
      applyBrowse(lastP);
    });
    ro.observe(listViewport);

    const rowCleanups: Array<() => void> = [];
    let pillTl: gsap.core.Timeline | undefined;
    let pillFocus: gsap.core.Timeline | undefined;
    let reveal: gsap.core.Timeline | undefined;
    let hasEntered = false;
    let exitStarted = false;

    // AboutMe é um curtain com pointer-events:none no wrapper inteiro (deixa o
    // clique vazar pro que está embaixo) e as rows já existem no DOM antes da
    // própria entrada terminar — sem isso, dá pra "clicar através" da AboutMe numa
    // row que ainda nem apareceu. activeRef (lido no onClick/onMouseenter) só liga
    // quando a entrada (revealT) terminou e a saída ainda não começou; não mexe em
    // pointer-events porque isso interferia no disparo nativo de mouseenter/leave.
    const syncActive = () => {
      const next = hasEntered && !exitStarted;
      if (next === activeRef.current) return;
      activeRef.current = next;
      // liga/desliga o cursor:none junto (ver .projects__list--active no CSS) — sem
      // isso o cursor nativo sumia mesmo fora da janela em que a pill pode aparecer.
      list.classList.toggle("projects__list--active", next);
    };
    syncActive();

    // troca de filtro remonta o efeito com a seção já em cena: só as linhas novas
    // cascatam, o header (e os botões de filtro nele) fica onde está
    const refilter = enteredRef.current;

    if (reduceMotion) {
      gsap.set(header, { opacity: 1, y: 0 });
      gsap.set(rows, { opacity: 1, y: 0 });
      gsap.set(section.querySelectorAll(".projects__letter"), { y: 0, opacity: 1 });
      gsap.set([progress, progressTrack], { opacity: 1, scaleY: 1 });
    } else {
      gsap.set(rows, { opacity: 0, y: 40, x: -24 });
      gsap.set(rows.flatMap((r) => Array.from(r.querySelectorAll(".projects__letter"))), {
        yPercent: 100,
        opacity: 0,
      });

      reveal = gsap.timeline({ paused: true });

      if (refilter) {
        gsap.set(header, { opacity: 1, y: 0 });
        gsap.set(headerLetters, { yPercent: 0, opacity: 1 });
        gsap.set([progress, progressTrack], { opacity: 1, scaleY: 1 });
      } else {
        gsap.set(header, { opacity: 0, y: -16 });
        gsap.set(headerLetters, { yPercent: 100, opacity: 0 });
        // o marcador é chrome como o header: nasce junto com a lista, o trilho
        // "desenhando" de cima pra baixo enquanto os números aparecem — e não
        // recascata na troca de filtro (só as rows fazem isso)
        gsap.set(progress, { opacity: 0 });
        gsap.set(progressTrack, { scaleY: 0 });
        reveal
          .to(header, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, 0)
          .to(headerLetters, { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.025, ease: "power2.out" }, 0.05)
          .to(progress, { opacity: 1, duration: 0.4, ease: "power2.out" }, 0.25)
          .to(progressTrack, { scaleY: 1, duration: 0.7, ease: "power3.inOut" }, 0.25);
      }

      rows.forEach((row, i) => {
        const letters = row.querySelectorAll(".projects__letter");
        reveal!
          // slingshot: back.out passa do alvo e volta — a row é "atirada" pra dentro
          // em vez de deslizar; x junto com y dá a diagonal do estilingue
          .to(
            row,
            { opacity: 1, y: 0, x: 0, duration: 0.7, ease: "back.out(1.7)" },
            0.1 + revealSlot(i) * rowRevealStagger,
          )
          .to(letters, { yPercent: 0, opacity: 1, duration: 0.5, stagger: 0.02, ease: "power2.out" }, "<");
      });

      // marca de registro que segue o cursor no hover — um único elemento compartilhado
      // por todas as rows (não um por row), seguindo via quickTo (retarget contínuo,
      // não gsap.to() novo por mousemove) e mostrado/escondido pela mesma técnica de
      // play/reverse usada abaixo pro thumb, para não herdar o bug de hover "preso".
      const pill = document.getElementById("projects-cursor-pill");
      let pillX: gsap.QuickToFunc | undefined;
      let pillY: gsap.QuickToFunc | undefined;
      if (pill) {
        // os colchetes esperam afastados nas diagonais e fecham sobre a marca: o cursor
        // "trava" no projeto como um visor, em vez de só aparecer. Ordem dos cantos vem
        // do CropMarks (tl, tr, br, bl), então a diagonal de cada um é indexada.
        const corners = pill.querySelectorAll<HTMLElement>(".gfx-crop");
        const arrow = pill.querySelector<HTMLElement>(".projects__cursor-arrow");
        const cornerX = [-1, 1, 1, -1];
        const cornerY = [-1, -1, 1, 1];
        // a rotação de cada canto vem do CSS do CropMarks (i * 90deg); reescrita aqui
        // porque quem tweena x/y passa a ser dono do transform inteiro — deixar o GSAP
        // decompor a matriz existente é o que costuma virar canto apontando pro lado
        gsap.set(corners, {
          rotate: (i: number) => i * 90,
          x: (i: number) => cornerX[i] * 10,
          y: (i: number) => cornerY[i] * 10,
          opacity: 0,
        });

        // xPercent/yPercent centralizam no próprio tamanho (setado uma vez só);
        // x/y (abaixo) seguem o cursor em px puro — misturar isso com um
        // transform:translate(-50%,-50%) do CSS confundiria o parse do GSAP
        gsap.set(pill, { autoAlpha: 0, scale: 0.6, rotate: -45, xPercent: -50, yPercent: -50 });
        pillX = gsap.quickTo(pill, "x", { duration: 0.35, ease: "power3" });
        pillY = gsap.quickTo(pill, "y", { duration: 0.35, ease: "power3" });
        pillTl = gsap
          .timeline({ paused: true })
          // back.out passa da marca dos 0° e volta — o quadrado assenta no lugar em vez
          // de parar seco, mesmo idiom do slingshot das rows
          .to(pill, { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.42, ease: "back.out(2)" }, 0)
          .to(corners, { x: 0, y: 0, opacity: 0.85, duration: 0.34, ease: "power3.out" }, 0.1)
          .fromTo(arrow, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }, 0.14);

        // clique: a marca "foca" antes de sair — os colchetes fecham sobre o centro e a
        // caixa encolhe no ponto clicado, que é de onde a íris do ProjectDetail abre.
        // Timeline própria (não um gsap.to por clique, e sem overwrite) porque overwrite
        // mataria os tweens-filhos da pillTl e a deixaria corrompida pro próximo hover.
        pillFocus = gsap
          .timeline({
            paused: true,
            onStart: () => pillTl?.pause(),
            // devolve a marca ao estado inicial da pillTl: sem isso o próximo hover
            // tweenaria a partir do estado focado (encolhido e transparente)
            onComplete: () => pillTl?.pause(0),
          })
          .to(
            corners,
            {
              x: (i: number) => cornerX[i] * 3,
              y: (i: number) => cornerY[i] * 3,
              opacity: 1,
              duration: 0.24,
              ease: "power2.in",
            },
            0,
          )
          .to(pill, { scale: 0.66, duration: 0.5, ease: "power2.inOut" }, 0)
          .to(pill, { autoAlpha: 0, duration: 0.32, ease: "power1.in" }, 0.2);

        // escuta o mesmo evento que abre o detalhe (em vez de um onClick separado) pra
        // foco e íris partirem do mesmo x/y, no mesmo frame
        const onFocusOpen = ((e: CustomEvent<{ x: number; y: number }>) => {
          // retarget do quickTo: a marca ainda pode estar a caminho do ponto clicado
          pillX?.(e.detail.x);
          pillY?.(e.detail.y);
          pillFocus?.restart();
        }) as EventListener;
        window.addEventListener("project:open", onFocusOpen);
        rowCleanups.push(() => window.removeEventListener("project:open", onFocusOpen));
      }

      // microinteracoes: pull magnetico na linha, thumb com wipe + scan no hover,
      // faixa sob o titulo — tudo via GSAP (mouseenter/mouseleave), sem CSS transition.
      // thumb/underline tocam de uma timeline pausada única (.play()/.reverse()) em vez
      // de um gsap.to() novo por evento — passar o mouse rápido entre linhas dispara
      // enter+leave a poucos ms de distância, e um gsap.to() por evento nessa janela
      // fica "preso" no valor do primeiro (o overwrite "auto" só resolve no primeiro
      // tick do tween novo, não na criação); play/reverse na mesma timeline não disputa
      // a propriedade com ninguém, só muda de direção.
      // a thumb agora transborda a row: duas abertas ao mesmo tempo se sobrepõem de
      // verdade. Ao entrar numa row as outras fecham em dobro da velocidade — varrer a
      // lista inteira (em vez de confiar no mouseleave da anterior) cobre também o caso
      // do ponteiro pular de row sem passar pelo vão entre elas.
      const hovers: gsap.core.Timeline[] = [];

      rows.forEach((row) => {
        const thumb = row.querySelector<HTMLElement>(".projects__thumb");
        const scan = row.querySelector<HTMLElement>(".projects__thumb-scan");
        const underline = row.querySelector<HTMLElement>(".projects__title-underline");
        const moveX = gsap.quickTo(row, "x", { duration: 0.5, ease: "power3" });

        const hover = gsap
          .timeline({ paused: true })
          .to(thumb, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.55, ease: "expo.out" }, 0)
          .to(underline, { scaleX: 1, duration: 0.45, ease: "expo.out" }, 0);
        hovers.push(hover);

        const onMousemove = (e: MouseEvent) => {
          const rect = row.getBoundingClientRect();
          const dx = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
          moveX(dx * 12);
          pillX?.(e.clientX);
          pillY?.(e.clientY);
        };
        const onMouseenter = (e: MouseEvent) => {
          if (!activeRef.current) return;
          hovers.forEach((t) => {
            if (t !== hover && t.progress()) t.timeScale(2).reverse();
          });
          hover.timeScale(1).play();
          if (pill) gsap.set(pill, { x: e.clientX, y: e.clientY });
          pillTl?.play();
          // flash de "scan" é um efeito de disparo único (não um estado pra reverter),
          // por isso fica fora da timeline play/reverse acima
          gsap.fromTo(
            scan,
            { opacity: 0.5, yPercent: 100 },
            { opacity: 0, yPercent: -100, duration: 0.6, ease: "power2.out", overwrite: true },
          );
        };
        const onMouseleave = () => {
          moveX(0);
          hover.timeScale(1).reverse();
          // o clique tira o ponteiro da row (o overlay entra na frente) e dispara este
          // leave — reverter a pillTl aqui atropelaria o foco no meio
          if (!pillFocus?.isActive()) pillTl?.reverse();
        };

        row.addEventListener("mousemove", onMousemove);
        row.addEventListener("mouseenter", onMouseenter);
        row.addEventListener("mouseleave", onMouseleave);
        rowCleanups.push(() => {
          row.removeEventListener("mousemove", onMousemove);
          row.removeEventListener("mouseenter", onMouseenter);
          row.removeEventListener("mouseleave", onMouseleave);
          hover.kill();
        });
      });
    }

    // entrada escrubada pela saída da AboutMe, igual à da Contact: timeline pausada +
    // scrubTimeline (o lag do quickTo é o que dá o glide) na segunda metade da transição.
    // REVEAL_START é o ponto em que a cortina da AboutMe começa a dissolver (backdropT,
    // p 0.5→0.7) — antes disso a cascata rodaria escondida atrás do fundo sólido dela.
    const REVEAL_START = 0.5;
    const setRevealProgress = reveal ? scrubTimeline(reveal) : undefined;
    const onAboutmeProgress = ((e: CustomEvent<{ progress: number }>) => {
      const t = gsap.utils.clamp(0, 1, (e.detail.progress - REVEAL_START) / (1 - REVEAL_START));
      setRevealProgress?.(t);

      // hover/clique liberam já em 40% da entrada (antes do fim do curso), não no
      // onComplete da timeline: .progress() não dispara callback. Histerese porque o
      // quickTo da pilha assenta/ultrapassa em volta de 1 — um limiar único ficava
      // piscando ida e volta nessa borda; 0.35 fica abaixo do gatilho de entrada (0.4)
      // pra não reabrir o próprio limiar que acabou de fechar.
      const entered = hasEntered ? t > 0.35 : t >= 0.4;
      if (entered === hasEntered) return;
      hasEntered = entered;
      enteredRef.current = entered;
      syncActive();
    }) as EventListener;
    window.addEventListener("aboutme:progress", onAboutmeProgress);

    // saída própria da Projects: é uma lista, então sair "in cascata" (linhas
    // atiradas pra fora em sequência) tem mais identidade que um fade genérico —
    // distinto do fade da AboutMe e do glitch que a Skills vai usar.
    // data-no-close-clip tira essa seção do fechamento genérico do sectionStack.
    // escrubada pelo scroll (não disparada por limiar): a Skills pendura a entrada dela
    // no projects:progress, e com a timeline rodando no relógio próprio essa entrada
    // acontecia num ponto qualquer da barra da navbar — quem parasse de rolar via a
    // seção trocar sozinha. Escrubada, a cascata daqui, a entrada da Skills e a barra
    // são o mesmo valor: a saída termina exatamente quando "Trabalhos" enche.
    const emitProgress = (progress: number) =>
      window.dispatchEvent(new CustomEvent("projects:progress", { detail: { progress } }));

    // fromTo com immediateRender:false, não to(): um `to` captura o valor de partida no
    // primeiro render da timeline, e quem manda nesse instante é o scroll — na montagem
    // ela era renderizada em progress 0 com as linhas ainda escondidas, então a "saída"
    // partia de opacity 0 e as linhas simplesmente sumiam de uma vez em vez de cascatar
    // (e o header, capturado em opacity 0, nunca saía). Aqui a partida é declarada, então
    // não importa quando a timeline é tocada pela primeira vez.
    const exit = gsap.timeline({ paused: true });
    rows.forEach((row, i) => {
      // slingshot de saída: back.in recua um instante antes de arremessar a row
      exit.fromTo(
        row,
        { x: 0, opacity: 1 },
        { x: -140, opacity: 0, duration: 0.55, ease: "back.in(1.6)", immediateRender: false },
        exitSlot(i) * rowExitStagger,
      );
    });
    const cascadeEnd = (rowsOnScreen - 1) * rowExitStagger + 0.55;
    // ordem de saída: primeiro as linhas, depois o chrome que as emoldura (header e
    // marcador de progresso juntos, como entraram) — sair no mesmo instante da primeira
    // linha deixava a lista órfã em cena, sem título nem contador, durante toda a cascata.
    const chromeStart = cascadeEnd * 0.55;
    const chromeEnd = chromeStart + 0.4;
    exit.fromTo(
      [header, progress],
      { opacity: 1, y: 0 },
      { opacity: 0, y: -16, duration: 0.4, ease: "power2.in", immediateRender: false },
      chromeStart,
    );
    // por último o fundo sólido da seção dissolve, sobrepondo o fim do chrome (não antes
    // dele): a entrada da Skills é escrubada nesse mesmo trecho, e com o fundo opaco até
    // o fim ela se montava escondida atrás dele e só aparecia pronta. Ancorar só no fim
    // da cascata das linhas invertia a ordem com lista curta (um filtro de 1 projeto dá
    // cascata de 0.55s) — aí o fundo largava na frente do header.
    exit.fromTo(
      section,
      { opacity: 1 },
      { opacity: 0, duration: 0.7, immediateRender: false },
      Math.max(cascadeEnd - 0.45, chromeEnd - 0.25),
    );
    // ponytail: tween vazio só pra estender a duração. A Skills escruba a entrada dela
    // em `projects:progress`, que acaba junto com esta timeline — sem esta cauda a
    // revelação dela teria que caber inteira dentro do fade acima, ou seja, atrás de um
    // fundo ainda opaco. É também o botão de ritmo da entrada da Skills: é aqui que se
    // alonga ou encurta a cascata dela, não nas janelas de progresso do outro arquivo.
    exit.to({}, { duration: 1.1 });

    // 0 e não -1: na montagem (e a cada troca de filtro) o refreshSectionStack abaixo já
    // chega com exitT 0, e aplicar isso renderizaria a timeline de saída antes da entrada
    // — a reveal passaria a partir do estado revelado que ela acabou de escrever
    let lastExitT = 0;

    const onStackProgress = ((e: CustomEvent<{ progress: number }>) => {
      const p = e.detail.progress;

      // fase de "navegação": antes de qualquer coisa sair, o excedente da lista
      // (além do que cabe na viewport) desliza pra cima revelado por scroll —
      // header e linhas visíveis continuam intactos até essa fase acabar.
      applyBrowse(p);

      // a saída começa depois do respiro que segue o fim da lista e ocupa todo o resto
      // do curso, terminando em p = 1 — que é onde a Skills assenta e a barra enche
      const exitStart = Math.min(listT + BREATHE_T, 0.9);
      const exitT = gsap.utils.clamp(0, 1, (p - exitStart) / (1 - exitStart));
      // só toca a timeline quando o valor muda de fato. Parada em 0 ela reescrevia o
      // estado revelado das linhas a cada tick, e ao sair da seção pra trás (voltando pra
      // AboutMe) isso brigava com a reveal, que aí roda em reverse no próprio relógio: uma
      // escrevia "visível" no mesmo frame em que a outra escrevia "saindo". Era o piscar
      // ao sair e voltar. De quebra deixa a timeline intocada até a saída começar de fato.
      if (exitT !== lastExitT) {
        lastExitT = exitT;
        exit.progress(exitT);
        // fora do paint só no fim: display no meio do curso mataria a cascata em cena
        gsap.set(section, { display: exitT >= 1 ? "none" : "" });
      }
      emitProgress(exitT);

      if (exitStarted !== (exitT > 0)) {
        exitStarted = exitT > 0;
        syncActive();
      }
    }) as EventListener;
    section.addEventListener("stack:progress", onStackProgress);
    // acabou de (re)assinar: puxa o estado atual da pilha em vez de esperar o próximo
    // wheel — é o que faz a troca de filtro já recascatar e reposicionar a lista
    refreshSectionStack();

    return () => {
      window.removeEventListener("aboutme:progress", onAboutmeProgress);
      ro.disconnect();
      rowCleanups.forEach((fn) => fn());
      reveal?.kill();
      exit.kill();
      pillTl?.kill();
      pillFocus?.kill();
      section.removeEventListener("stack:progress", onStackProgress);
    };
  }, [listFilter]);

  return (
    <section
      className="projects fixed inset-0 h-dvh w-screen"
      id="projects-section"
      data-stack
      data-no-close-clip
    >
      <header className="projects__header" id="projects-header">
        <h2 className="projects__heading" id="projects-heading">
          <AnimatedLetters text="Projetos" prefix="projects" />
        </h2>
        <div className="projects__meta">
          <div className="projects__filters" role="group" aria-label="Filtrar por categoria">
            {PROJECT_FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`projects__filter${f === filter ? " projects__filter--active" : ""}`}
                aria-pressed={f === filter}
                onClick={() => pickFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="projects__marquee" aria-hidden="true">
            <div className="projects__marquee-track" id="projects-marquee-track">
              {[0, 1].map((copy) => (
                <span className="projects__marquee-row" key={copy}>
                  {marqueeItems.map((item, i) => (
                    <span className="projects__marquee-item" key={`${copy}-${item}-${i}`}>
                      {item}
                      <span className="projects__marquee-star" aria-hidden="true">
                        ✦
                      </span>
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        </div>
      </header>
      <div className="projects__list-viewport" id="projects-list-viewport">
        <div className="projects__progress">
          <span className="projects__progress-index" id="projects-progress-index">
            01
          </span>
          <span className="projects__progress-track" aria-hidden="true">
            <span className="projects__progress-fill" id="projects-progress-fill"></span>
          </span>
          <span className="projects__progress-total">{String(visible.length).padStart(2, "0")}</span>
        </div>
        <ul className="projects__list" id="projects-list">
          {visible.map((p, i) => (
            <li key={p.slug}>
              <a
                className="projects__row"
                id={`projects-row-${i}`}
                href={projectPath(p.slug)}
                onClick={(e) => handleOpenProject(e, p.slug, activeRef.current)}
              >
                <h3 className="projects__title">
                  <AnimatedLetters text={p.title} prefix="projects" />
                  <span className="projects__title-underline" aria-hidden="true"></span>
                </h3>
                <div className="projects__thumb" aria-hidden="true">
                  {/* sem loading="lazy": a seção é fixed e monta junto com a Hero, então
                     o lazy só adiava a busca pro momento do hover — era ali que a
                     imagem aparecia pintando. Eager em prioridade baixa carrega durante
                     o scroll das seções anteriores, sem disputar banda com a Hero. */}
                  <img
                    className="projects__thumb-img"
                    src={p.images[0]}
                    alt={p.title}
                    decoding="async"
                    fetchPriority="low"
                  />
                  <div className="projects__thumb-overlay"></div>
                  <div className="projects__thumb-scan"></div>
                </div>
                <span className="projects__tag">{p.tag}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      {/* o cursor é a mesma marca de registro dos grafismos, não uma pill à parte:
         quadrado com fio de acento em vez de esfera com borda branca */}
      <RegMark
        id="projects-cursor-pill"
        className="projects__cursor-pill"
        shape="square"
        size="clamp(34px, 2.6vw, 42px)"
        glyph={
          <>
            {/* colchetes por fora da caixa: o cursor vira visor de enquadramento.
               Offsets negativos os jogam pra fora da marca, não pra dentro dela */}
            <CropMarks corners="all" x="-7px" size="7px" />
            <svg className="projects__cursor-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 18 18 6" />
              <path d="M8.5 6H18v9.5" />
            </svg>
          </>
        }
      />
    </section>
  );
}
