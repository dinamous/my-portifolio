import { useEffect } from "react";
import gsap from "gsap";
import { goToSection } from "../../lib/sectionStack";
import { prefersReducedMotion } from "../../lib/motion";
import { contact } from "../../lib/contact";
import "./Navbar.css";

const linkedin = contact.socials.find((s) => s.label === "LinkedIn")!;
const github = contact.socials.find((s) => s.label === "GitHub")!;

export default function Navbar() {
  useEffect(() => {
    const bar = document.getElementById("navbar-bar")!;
    const items = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".navbar__brand, .navbar__social li, .navbar__pages li",
      ),
    );

    const onPageLinkClick = (e: MouseEvent) => {
      // ctrl/cmd/middle-click seguem o <a> normal (abrir em nova aba etc.) —
      // só o clique simples troca de seção pela pilha GSAP em vez de navegar
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.currentTarget as HTMLAnchorElement;
      e.preventDefault();
      goToSection(a.getAttribute("href")!.slice(1));
    };
    const pageLinks = Array.from(
      document.querySelectorAll<HTMLAnchorElement>(".navbar__pages a"),
    );
    pageLinks.forEach((a) => a.addEventListener("click", onPageLinkClick));

    const reduceMotion = prefersReducedMotion();

    if (reduceMotion) {
      gsap.set(bar, { scaleX: 1, opacity: 1 });
      gsap.set(items, { y: 0, opacity: 1 });
    } else {
      window.addEventListener(
        "hero:reveal-nav",
        () => {
          gsap
            .timeline({ defaults: { ease: "power3.out" } })
            .to(bar, { scaleX: 1, opacity: 1, duration: 0.7, ease: "power3.inOut" })
            .to(items, { y: 0, opacity: 1, duration: 0.6, stagger: 0.22, ease: "power3.out" }, "+=0.1")
            .call(() => window.dispatchEvent(new CustomEvent("navbar:revealed")));
        },
        { once: true },
      );
    }

    // recedes together with the section it lives in, same treatment as the hero's own content
    const navbar = document.querySelector<HTMLElement>(".navbar")!;
    const onStackProgress = ((e: CustomEvent<{ progress: number }>) => {
      const p = e.detail.progress;
      gsap.set(navbar, { y: p * 40, opacity: 1 - p * 0.6 });
    }) as EventListener;
    navbar.closest("[data-stack]")?.addEventListener("stack:progress", onStackProgress);

    return () => {
      pageLinks.forEach((a) => a.removeEventListener("click", onPageLinkClick));
      navbar.closest("[data-stack]")?.removeEventListener("stack:progress", onStackProgress);
    };
  }, []);

  return (
    <div className="navbar">
      <div className="navbar__bar" id="navbar-bar" aria-hidden="true"></div>
      <nav className="navbar__nav" aria-label="Navegação principal">
        <span className="navbar__brand">@dinamous</span>
        <ul className="navbar__social">
          <li><a href={linkedin.href} target="_blank" rel="noopener">LinkedIn</a></li>
          <li><a href={github.href} target="_blank" rel="noopener">GitHub</a></li>
          <li><a href={`mailto:${contact.email}`}>Email</a></li>
        </ul>
        <ul className="navbar__pages">
          <li><a href="#aboutme-section">Sobre</a></li>
          <li><a href="#projects-section">Trabalhos</a></li>
          <li><a href="#skills-section">Skills</a></li>
          <li><a href="#contact-section">Contato</a></li>
        </ul>
      </nav>
    </div>
  );
}
