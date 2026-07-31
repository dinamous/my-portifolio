import { useEffect } from "react";
import gsap from "gsap";
import { goToSection } from "../../lib/sectionStack";
import { prefersReducedMotion } from "../../lib/motion";
import "./SectionNav.css";

// navbar persistente estilo lukebaffait.fr: fixo, minimalista, só aparece
// depois que o Hero termina de fechar e recolhe ao voltar para ele
const links = [
  { id: "aboutme-section", num: "01", label: "Sobre" },
  { id: "projects-section", num: "02", label: "Trabalhos" },
  { id: "skills-section", num: "03", label: "Skills" },
  { id: "contact-section", num: "04", label: "Contato" },
];

// o Hero (índice 0) está totalmente fechado quando o valor da pilha cruza ~1;
// 0.98 dispara a entrada ainda no finzinho do spin, emendando as duas animações
const HERO_GONE_T = 0.98;

export default function SectionNav() {
  useEffect(() => {
    const nav = document.getElementById("sectionnav")!;
    const items = Array.from(
      nav.querySelectorAll<HTMLElement>(".sectionnav__brand, .sectionnav__links li"),
    );
    const anchors = Array.from(
      nav.querySelectorAll<HTMLAnchorElement>(".sectionnav__links a"),
    );
    // resolve o índice de cada link contra a mesma ordem de seções da pilha,
    // sem duplicar aqui o mapeamento id -> índice
    const stackIds = Array.from(
      document.querySelectorAll<HTMLElement>("[data-stack]"),
    ).map((el) => el.id);

    // barra de progresso de cada link, mesmo comportamento do scroll-timeline
    // do lukebaffait.fr: passadas cheias, futuras vazias e SÓ a barra da seção
    // visível/ativa carrega. A janela de cada uma é a janela em que o link está
    // ativo — v de idx-0.5 a idx+0.5 (o round(v) do estado ativo vira nesses
    // mesmos pontos), então as janelas se emendam sem duas barras andarem juntas.
    // A última seção (v para no max) tem a janela comprimida em [max-0.5, max].
    const lastIdx = stackIds.length - 1;
    const bars = anchors.map((a) => ({
      el: a.querySelector<HTMLElement>(".sectionnav__progress")!,
      idx: stackIds.indexOf(a.getAttribute("href")!.slice(1)),
    }));

    const reduceMotion = prefersReducedMotion();

    gsap.set(nav, { yPercent: 110, autoAlpha: 0 });
    gsap.set(items, { y: 12, opacity: 0 });

    const reveal = gsap
      .timeline({ paused: true })
      .to(nav, { yPercent: 0, autoAlpha: 1, duration: 0.55, ease: "power3.out" })
      .to(items, { y: 0, opacity: 1, duration: 0.4, stagger: 0.06, ease: "power2.out" }, "-=0.25");

    let visible = false;
    const onStackValue = ((e: CustomEvent<{ value: number }>) => {
      const v = e.detail.value;

      const shouldShow = v >= HERO_GONE_T;
      if (shouldShow !== visible) {
        visible = shouldShow;
        if (reduceMotion) reveal.progress(visible ? 1 : 0);
        else if (visible) reveal.play();
        else reveal.reverse();
      }

      const active = Math.round(v);
      anchors.forEach((a) => {
        a.classList.toggle(
          "sectionnav__link--active",
          stackIds.indexOf(a.getAttribute("href")!.slice(1)) === active,
        );
      });

      bars.forEach(({ el, idx }) => {
        const fill = idx === lastIdx ? (v - idx + 0.5) * 2 : v - idx + 0.5;
        gsap.set(el, { scaleX: gsap.utils.clamp(0, 1, fill) });
      });
    }) as EventListener;
    window.addEventListener("stack:value", onStackValue);

    const onLinkClick = (e: MouseEvent) => {
      e.preventDefault();
      goToSection((e.currentTarget as HTMLAnchorElement).getAttribute("href")!.slice(1));
    };
    anchors.forEach((a) => a.addEventListener("click", onLinkClick));

    const brand = nav.querySelector<HTMLElement>(".sectionnav__brand")!;
    const onBrandClick = () => goToSection("hero-section");
    brand.addEventListener("click", onBrandClick);

    return () => {
      window.removeEventListener("stack:value", onStackValue);
      anchors.forEach((a) => a.removeEventListener("click", onLinkClick));
      brand.removeEventListener("click", onBrandClick);
      reveal.kill();
      bars.forEach(({ el }) => gsap.killTweensOf(el));
    };
  }, []);

  return (
    <header className="sectionnav" id="sectionnav">
      <button className="sectionnav__brand" type="button" aria-label="Voltar ao início">
        @dinamous<span className="sectionnav__brand-accent">;</span>
      </button>
      <nav aria-label="Navegação de seções">
        <ul className="sectionnav__links">
          {links.map((l) => (
            <li key={l.id}>
              <a href={`#${l.id}`}>
                <span className="sectionnav__num">{l.num}</span>
                {l.label}
                <span className="sectionnav__progress" aria-hidden="true"></span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
