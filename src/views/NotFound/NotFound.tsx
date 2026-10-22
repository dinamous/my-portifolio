import { useEffect } from "react";
import gsap from "gsap";
import AnimatedLetters from "../../components/AnimatedLetters";
import { AccentRule, CropMarks, Stamp, Ticks } from "../../components/graphics";
import { prefersReducedMotion } from "../../lib/motion";
import { applyNotFoundMeta } from "../../lib/router";
import "./NotFound.css";

export default function NotFound() {
  const { pathname } = window.location;
  let path = pathname;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    // %-escape malformado é justamente o tipo de URL que cai aqui; mostra crua
  }

  useEffect(() => {
    applyNotFoundMeta();

    const codeEl = document.getElementById("notfound-code")!;
    const codeLetters = Array.from(codeEl.querySelectorAll<HTMLElement>(".notfound__letter"));
    const serifLetters = Array.from(
      document.querySelectorAll<HTMLElement>("#notfound-serif .notfound__letter"),
    );
    const dot = document.getElementById("notfound-dot")!;
    const rule = document.getElementById("notfound-rule")!;
    const pathEl = document.getElementById("notfound-path")!;
    const fades = ["notfound-head", "notfound-sub", "notfound-cta", "notfound-foot"].map(
      (id) => document.getElementById(id)!,
    );
    const stamp = document.getElementById("notfound-stamp")!;

    if (prefersReducedMotion()) {
      gsap.set([...codeLetters, ...serifLetters], { y: 0, opacity: 1 });
      gsap.set(dot, { opacity: 1, scale: 1 });
      gsap.set(rule, { scaleX: 1 });
      gsap.set(fades, { autoAlpha: 1, y: 0 });
      gsap.set(stamp, { autoAlpha: 1, scale: 1 });
      return;
    }

    const tl = gsap
      .timeline({ defaults: { ease: "power3.out" } })
      .to(codeLetters, { y: "0%", opacity: 1, duration: 1.1, stagger: 0.09 }, 0.2)
      .to(serifLetters, { y: "0%", opacity: 1, duration: 0.9, stagger: 0.035 }, "-=0.7")
      .to(dot, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(3)" }, "-=0.3")
      .to(rule, { scaleX: 1, duration: 0.8, ease: "power3.inOut" }, "-=0.2")
      .to(fades, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08 }, "<0.2")
      .to(stamp, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "back.out(2.5)" }, "-=0.3")
      // a rota "decodifica" no lugar: mesmo texto, só o flicker de leitura
      .to(pathEl, {
        duration: 1.2,
        scrambleText: { text: "{original}", chars: "/abcdefghijklmnopqrstuvwxyz0123456789-", speed: 0.4 },
        ease: "none",
      }, "<");

    // mesmo easter egg do ";" do Hero: os dígitos embaralham e assentam em si mesmos
    let scrambling: gsap.core.Tween | undefined;
    const onCodeEnter = () => {
      if (scrambling?.isActive() || tl.isActive()) return;
      scrambling = gsap.to(codeLetters, {
        duration: 0.9,
        scrambleText: { text: "{original}", chars: "0123456789", speed: 0.5 },
        stagger: 0.08,
        ease: "none",
      });
    };
    codeEl.addEventListener("mouseenter", onCodeEnter);

    return () => {
      codeEl.removeEventListener("mouseenter", onCodeEnter);
      tl.kill();
      scrambling?.kill();
    };
  }, []);

  return (
    <main className="notfound fixed inset-0 h-dvh w-screen" id="notfound">
      <CropMarks corners="all" x="24px" opacity={0.25} />

      <div className="notfound__head" id="notfound-head" aria-hidden="true">
        <span className="notfound__label">erro</span>
        <span className="notfound__count">404</span>
      </div>

      <span className="notfound__stamp" id="notfound-stamp">
        <Stamp variant="accent">rota inexistente</Stamp>
      </span>

      <div className="notfound__body">
        <h1 className="notfound__title" aria-label="404, fora do mapa">
          <span className="notfound__code" id="notfound-code" aria-hidden="true">
            <AnimatedLetters text="404" prefix="notfound" />
          </span>
          <span className="notfound__line" aria-hidden="true">
            <span className="notfound__serif" id="notfound-serif">
              <AnimatedLetters text="fora do mapa" prefix="notfound" />
            </span>
            <span className="notfound__dot" id="notfound-dot">.</span>
          </span>
        </h1>

        <AccentRule id="notfound-rule" className="notfound__rule" />

        <p className="notfound__sub" id="notfound-sub">
          Esse endereço não leva a lugar nenhum. Talvez o link tenha mudado, ou nunca tenha existido.
        </p>

        <a className="notfound__cta" id="notfound-cta" href="/">
          <span className="notfound__cta-term">voltar</span>
          <span className="notfound__cta-value">ao início</span>
        </a>
      </div>

      <div className="notfound__foot" id="notfound-foot">
        <Ticks className="notfound__ticks" tone={0.22} />
        <div className="notfound__readout">
          <span className="notfound__label">rota</span>
          <span className="notfound__path" id="notfound-path">{path}</span>
        </div>
      </div>
    </main>
  );
}
