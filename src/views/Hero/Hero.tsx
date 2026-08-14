import { useEffect } from "react";
import gsap from "gsap";
import Navbar from "../../components/Navbar/Navbar";
import AnimatedLetters from "../../components/AnimatedLetters";
import HeroBackground from "../../components/HeroBackground";
import { enableSectionStack, CLIP_CLOSE_T, getOverlay } from "../../lib/sectionStack";
import { startTextType } from "../../lib/textType";
import { prefersReducedMotion } from "../../lib/motion";
import { CropMarks } from "../../components/graphics";
import "./Hero.css";

const heroTypePhrases = [
  "Dev de poucas palavras, interfaces que falam por si.",
  "Criador silencioso no *front* das ideias, dando vida com movimento e suavidade.",
  "Calmo por fora, *keyframes* por dentro. Detalhes que ninguém nota, mas todo mundo sente.",
];

export default function Hero() {
  useEffect(() => {
    const heroSection = document.getElementById("hero-section")!;
    const row = document.getElementById("hero-row")!;
    const word1 = document.getElementById("hero-word-1")!;
    const word2 = document.getElementById("hero-word-2")!;
    const words = [word1, word2];
    const semi = document.getElementById("hero-semi")!;

    // ponytail: GSAP interpola cor literal, não var() — os tokens de global.css
    // são lidos uma vez aqui pra o hex do acento não viver em dois lugares.
    const rootStyle = getComputedStyle(document.documentElement);
    const accentCyan = rootStyle.getPropertyValue("--accent-cyan").trim();
    const accentGreen = rootStyle.getPropertyValue("--accent-green").trim();

    let semiBusy = false;
    // easter egg do ";": glitch nas letras do nome com o ScrambleTextPlugin já
    // registrado globalmente em Skills.tsx — "{original}" faz cada letra
    // embaralhar e assentar de volta em si mesma, então nada muda de lugar
    // ou vira caractere novo, só um flicker no lugar de cada uma
    const onSemiActivate = () => {
      if (semiBusy) return;
      semiBusy = true;
      const nameLetters = [...word1Letters, ...word2Letters];

      if (reduceMotion) {
        gsap.set(semi, { color: accentGreen });
        setTimeout(() => {
          gsap.set(semi, { color: "#1a1a1a" });
          semiBusy = false;
        }, 300);
        return;
      }

      gsap
        .timeline({ onComplete: () => (semiBusy = false) })
        .to(semi, { color: accentGreen, duration: 0.3 })
        .to(
          nameLetters,
          {
            duration: 1.4,
            scrambleText: { text: "{original}", chars: "upperAndLowerCase", speed: 0.25 },
            stagger: 0.05,
            ease: "none",
          },
          "<",
        )
        .to(semi, { color: "#1a1a1a", duration: 0.5 });
    };
    const onSemiKeydown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSemiActivate();
      }
    };
    semi.addEventListener("click", onSemiActivate);
    semi.addEventListener("keydown", onSemiKeydown);
    const scan = document.getElementById("hero-scan")!;
    const heroBg = document.getElementById("hero-bg")!;
    const heroType = document.getElementById("hero-type")!;
    const scrollHint = document.getElementById("hero-scroll")!;
    const scrollChevrons = Array.from(
      document.querySelectorAll<HTMLElement>("#hero-scroll .hero__scroll-chevron"),
    );

    const loader = document.getElementById("hero-loader")!;
    const loaderBar = document.getElementById("hero-loader-bar")!;
    const loaderCount = document.getElementById("hero-loader-count")!;

    const word1Letters = Array.from(
      document.querySelectorAll<HTMLElement>("#hero-word-1 .hero__letter"),
    ).reverse();
    const word2Letters = Array.from(
      document.querySelectorAll<HTMLElement>("#hero-word-2 .hero__letter"),
    );

    const reduceMotion = prefersReducedMotion();

    // ponytail: o loop mexe só em opacity dos chevrons — o rotate(45deg) deles é
    // CSS e o fade de entrada/saída é do container, então nada se sobrescreve
    let scrollLoop: ReturnType<typeof gsap.to> | undefined;
    const startScrollHint = () => {
      if (reduceMotion) {
        gsap.set(scrollHint, { autoAlpha: 1 });
        gsap.set(scrollChevrons, { opacity: 0.55 });
        return;
      }
      gsap.to(scrollHint, { autoAlpha: 1, duration: 0.6, ease: "power2.out" });
      scrollLoop = gsap.to(scrollChevrons, {
        opacity: 0.8,
        duration: 0.45,
        stagger: 0.16,
        repeat: -1,
        yoyo: true,
        repeatDelay: 0.4,
        ease: "power1.inOut",
      });
    };

    function runEntrance() {
      if (reduceMotion) {
        gsap.set([...word1Letters, ...word2Letters], { y: 0, opacity: 1 });
        gsap.set(words, { color: "#111111" });
        gsap.set(semi, { opacity: 1, scale: 1 });
        gsap.set(scan, { autoAlpha: 0 });
        gsap.set(heroBg, { autoAlpha: 1 });
        gsap.set(heroType, { autoAlpha: 1 });
        startTextType(heroType, heroTypePhrases);
        startScrollHint();
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

        // ponytail: mesma medida usada pra entrada e saída (offsetHeight da seção, não
        // do próprio .hero__scan) — 100vh no CSS pode divergir da altura real da seção
        // (toolbar dinâmica mobile, scrollbar), e usar duas fontes diferentes deixava
        // a barra saindo -scanHeight sem cobrir de fato heroSection.offsetHeight, então
        // uma fatia ficava visível no topo em algumas resoluções.
        const scanHeight = heroSection.offsetHeight;
        gsap.set(scan, { y: scanHeight });

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
          .to(words, { color: "#111111", duration: 2.4, ease: "power2.inOut" }, "<")
          .to(heroBg, { autoAlpha: 1, duration: 0.7, ease: "power2.in" }, "-=1.8")
          .to(heroType, { autoAlpha: 1, duration: 0.6, ease: "power2.out" }, "<")
          .call(() => startTextType(heroType, heroTypePhrases))
          .call(() => window.dispatchEvent(new CustomEvent("hero:reveal-nav")), [], "+=0.15");

        window.addEventListener(
          "navbar:revealed",
          () => {
            enableSectionStack();
            startScrollHint();
          },
          { once: true },
        );
      }
    }

    if (reduceMotion) {
      gsap.set(loader, { autoAlpha: 0 });
      runEntrance();
    } else {
      // proxy numérico só pra dirigir o contador via onUpdate — a barra em si
      // anima scaleX direto, sem ler esse valor de volta
      const counter = { value: 0 };
      const progressTween = gsap.to(loaderBar, {
        scaleX: 0.9,
        duration: 2.5,
        ease: "power1.out",
      });
      gsap.to(counter, {
        value: 90,
        duration: 2.5,
        ease: "power1.out",
        onUpdate: () => (loaderCount.textContent = String(Math.round(counter.value)).padStart(2, "0")),
      });

      const fontsReady = document.fonts.ready;
      const safetyTimeout = new Promise<void>((resolve) => setTimeout(resolve, 3000));

      Promise.race([fontsReady, safetyTimeout]).then(() => {
        progressTween.kill();
        gsap
          .timeline()
          .to(loaderBar, { scaleX: 1, duration: 0.3, ease: "power2.out" })
          .to(counter, {
            value: 100,
            duration: 0.3,
            ease: "power2.out",
            onUpdate: () => (loaderCount.textContent = String(Math.round(counter.value)).padStart(2, "0")),
          }, "<")
          .to(loader, { autoAlpha: 0, duration: 0.4, ease: "power2.out" }, "+=0.15")
          .call(runEntrance);
      });
    }

    // scroll-close parallax: liquid background drifts up and out, the name recedes with a slight scale-down
    const onStackProgress = ((e: CustomEvent<{ progress: number }>) => {
      const p = e.detail.progress;
      // sped up relative to p so the background/name are fully gone well before the
      // section finishes closing, instead of fading out across the whole range
      const exitT = gsap.utils.clamp(0, 1, p * 1.8);
      // scale (not translate) so the background shrinks toward its own center — the
      // black .hero behind it shows evenly on every edge as it recedes instead of only
      // at the bottom, reading as depth rather than a gap
      gsap.set(heroBg, { scale: 1 - exitT * 0.15, opacity: 1 - exitT * 0.5 });
      gsap.set(row, { y: -exitT * 50, scale: 1 - exitT * 0.15, opacity: 1 - exitT * 0.6 });
      // some no primeiro toque de scroll — já cumpriu a função de avisar que dá pra rolar
      gsap.set(scrollHint, { autoAlpha: 1 - gsap.utils.clamp(0, 1, p * 5) });

      // clip-path finishes closing (and the overlay is already fully black) by CLIP_CLOSE_T,
      // leaving the rest of the range for a subtle spin of that already-clipped bar — transform
      // is applied after clip-path in CSS, so rotating the whole section rotates the thin
      // clipped rectangle as a rigid shape instead of re-clipping it mid-spin
      const spinT = gsap.utils.clamp(0, 1, (p - CLIP_CLOSE_T) / (1 - CLIP_CLOSE_T));

      // bar shrinks away gradually across the whole spin (rather than snapping to 0
      // right at the end) so it disappears in step with the same scroll that pulls
      // WhatIDo's columns toward center — the shape is already a full-height vertical
      // strip from the clip-path by this point, so "thinner and taller" means pushing
      // scaleX further down while pushing scaleY above 1, then both fall away together
      // as the spin finishes
      const growT = Math.sin(spinT * Math.PI); // 0 -> 1 -> 0 across the spin
      const baseScaleX = 1 - spinT * 0.4 - growT * 0.15;
      const baseScaleY = 1 + growT * 0.25;

      // color migrates from black into WhatIDo's actual title gradient (see
      // .whatido__letter) — driven off p (not spinT) and starting before
      // CLIP_CLOSE_T so the migration is already underway once rotation kicks
      // in. Eased (not linear) over a wider band so it reads as a smooth wash
      // instead of a hard, narrow snap to green. Each stop is interpolated
      // from black independently (rather than handing gsap.utils.interpolate
      // the whole gradient string) since it's the same single-color call
      // already proven below for the overlay.
      const COLOR_START_T = CLIP_CLOSE_T - 0.2;
      const COLOR_END_T = CLIP_CLOSE_T + 0.15;
      const colorLinearT = gsap.utils.clamp(
        0,
        1,
        (p - COLOR_START_T) / (COLOR_END_T - COLOR_START_T),
      );
      const colorT = gsap.parseEase("power2.inOut")(colorLinearT);
      const barStop1 = gsap.utils.interpolate("#000000", accentCyan, colorT);
      const barStop2 = gsap.utils.interpolate("#000000", accentGreen, colorT);
      // 190deg (not the brand's 100deg) because by this point the section's
      // clip-path has already narrowed it to a strip that's thin horizontally
      // but full height (inset only ever touches left/right, see sectionStack) —
      // a near-horizontal gradient only ever shows its midpoint blend through
      // that narrow slice, reading as flat. Near-vertical actually shows both stops.
      const barColor = `linear-gradient(190deg, ${barStop1}, ${barStop2})`;

      gsap.set(heroSection, {
        rotation: spinT * 90,
        scaleX: baseScaleX * (1 - spinT),
        scaleY: baseScaleY * (1 - spinT),
        background: barColor,
      });
      // the section's own background is fully hidden behind sectionStack's black
      // overlay by the time spin starts (it's already opaque at CLIP_CLOSE_T), so
      // the color migration has to happen on the overlay itself to be visible —
      // looked up lazily (not cached at script init) since Hero's inline script
      // runs before BaseLayout's initSectionStack() creates the overlay elements
      const heroOverlay = getOverlay(heroSection);
      if (heroOverlay) gsap.set(heroOverlay, { background: barColor });
      // fires from the first scroll tick (p>0), as soon as the clip-path starts shrinking
      // the bar — WhatIDo listens on window to pull its own columns in from the border
      window.dispatchEvent(new CustomEvent("hero:bar-shrink", { detail: { progress: p } }));

      // once the spin has fully shrunk the bar away, pull it out of the layout so it
      // can't intercept scroll/clicks — driven by the same p that everything else here
      // reacts to, so scrolling back up (p < 1) restores display before the bar grows back
      gsap.set(heroSection, { display: spinT >= 1 ? "none" : "" });
    }) as EventListener;
    heroSection.addEventListener("stack:progress", onStackProgress);

    return () => {
      heroSection.removeEventListener("stack:progress", onStackProgress);
      semi.removeEventListener("click", onSemiActivate);
      semi.removeEventListener("keydown", onSemiKeydown);
      scrollLoop?.kill();
    };
  }, []);

  return (
    <section className="hero fixed inset-0 h-dvh w-screen" id="hero-section" data-stack>
      <HeroBackground />

      <div className="hero__loader" id="hero-loader" aria-hidden="true">
        <CropMarks corners="all" x="24px" opacity={0.25} />

        <div className="hero__loader-readout">
          <span className="hero__loader-label">carregando</span>
          <span className="hero__loader-count" id="hero-loader-count">00</span>
        </div>

        <div className="hero__loader-track">
          <div className="hero__loader-bar" id="hero-loader-bar"></div>
        </div>
      </div>

      <div className="hero__scan" id="hero-scan" aria-hidden="true"></div>

      <div className="hero__scroll" id="hero-scroll" aria-hidden="true">
        <span className="hero__scroll-chevron"></span>
        <span className="hero__scroll-chevron"></span>
        <span className="hero__scroll-chevron"></span>
      </div>

      <div className="hero__type" id="hero-type" aria-hidden="true"></div>
      <p className="sr-only">{heroTypePhrases[0].replace(/\*/g, "")}</p>

      <div className="hero__stack" id="hero-stack">
        <div className="hero__bottom">
          <h1 className="hero__row" id="hero-row">
            <span className="hero__word hero__word--first" id="hero-word-1">
              <AnimatedLetters text="Matheus" prefix="hero" />
            </span>
            <span className="hero__word hero__word--last" id="hero-word-2">
              <AnimatedLetters text="Simões" prefix="hero" /><span
                className="hero__semi"
                id="hero-semi"
                role="button"
                tabIndex={0}
                aria-label="Easter egg"
              >;</span>
            </span>
          </h1>
        </div>

        <Navbar />
      </div>
    </section>
  );
}
