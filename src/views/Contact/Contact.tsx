import { useEffect } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "../../lib/motion";
import { scrubTimeline } from "../../lib/scrub";
import AnimatedLetters from "../../components/AnimatedLetters";
import "./Contact.css";

const socials = [
  { label: "LinkedIn", href: "#" },
  { label: "GitHub", href: "#" },
  { label: "Email", href: "mailto:dinamous.dev@gmail.com" },
];
const headline = "Vamos criar movimento";

export default function Contact() {
  useEffect(() => {
    const glow = document.getElementById("contact-glow")!;
    const headlineEl = document.getElementById("contact-headline")!;
    const mail = document.getElementById("contact-mail")!;
    const mailUnderline = mail.querySelector<HTMLElement>(".contact__mail-underline")!;
    const social = document.getElementById("contact-social")!;
    const tag = document.getElementById("contact-tag")!;
    const letters = headlineEl.querySelectorAll<HTMLElement>(".contact__letter");
    const accent = headlineEl.querySelector<HTMLElement>(".contact__accent")!;
    const revealTargets = [mail, social, tag];

    const reduceMotion = prefersReducedMotion();

    const cleanups: Array<() => void> = [];

    if (reduceMotion) {
      gsap.set(letters, { y: 0, opacity: 1 });
      gsap.set(accent, { opacity: 1, scale: 1 });
      gsap.set(revealTargets, { opacity: 1, y: 0 });
      gsap.set(glow, { opacity: 1 });
    } else {
      gsap.set(letters, { yPercent: 110, opacity: 0 });
      gsap.set(accent, { opacity: 0, scale: 0.4 });
      gsap.set(revealTargets, { opacity: 0, y: 16 });
      gsap.set(glow, { opacity: 0 });

      const reveal = gsap
        .timeline({ paused: true })
        .to(glow, { opacity: 1, duration: 0.8, ease: "power2.out" }, 0)
        .to(letters, { yPercent: 0, opacity: 1, duration: 0.7, stagger: 0.02, ease: "power3.out" }, 0.1)
        .to(accent, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(3)" }, "-=0.2")
        .to(revealTargets, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }, "-=0.2");

      const setProgress = scrubTimeline(reveal);

      const onSkillsProgress = ((e: CustomEvent<{ progress: number }>) => {
        setProgress(e.detail.progress);
      }) as EventListener;
      window.addEventListener("skills:progress", onSkillsProgress);
      cleanups.push(() => window.removeEventListener("skills:progress", onSkillsProgress));

      // ultima secao da pilha: sem stack:progress/finale — sectionStack nunca
      // fecha a ultima (mesmo guard que a AboutMe usava antes da Task 2)

      // loop ambiente (cena de repouso final): respiracao do glow + paralaxe
      // sutil no mousemove, mesmo idiom que AboutMe.astro ja usa
      const breathe = gsap.to(glow, { scale: 1.08, duration: 4, yoyo: true, repeat: -1, ease: "sine.inOut" });
      cleanups.push(() => breathe.kill());

      const glowX = gsap.quickTo(glow, "x", { duration: 1.2, ease: "power3" });
      const glowY = gsap.quickTo(glow, "y", { duration: 1.2, ease: "power3" });
      const onMousemove = (e: MouseEvent) => {
        const dx = e.clientX / window.innerWidth - 0.5;
        const dy = e.clientY / window.innerHeight - 0.5;
        glowX(-dx * 40);
        glowY(-dy * 30);
      };
      window.addEventListener("mousemove", onMousemove);
      cleanups.push(() => window.removeEventListener("mousemove", onMousemove));

      // microinteracao: pull magnetico + underline wipe no mail/socials
      const onMailEnter = () => gsap.to(mailUnderline, { scaleX: 1, duration: 0.3, ease: "power2.out" });
      const onMailLeave = () => gsap.to(mailUnderline, { scaleX: 0, duration: 0.25, ease: "power2.inOut" });
      mail.addEventListener("mouseenter", onMailEnter);
      mail.addEventListener("mouseleave", onMailLeave);
      cleanups.push(() => {
        mail.removeEventListener("mouseenter", onMailEnter);
        mail.removeEventListener("mouseleave", onMailLeave);
      });

      [mail, ...Array.from(social.querySelectorAll<HTMLElement>("a"))].forEach((el) => {
        const moveX = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" });
        const moveY = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3" });
        const onElMousemove = (e: MouseEvent) => {
          const rect = el.getBoundingClientRect();
          moveX(((e.clientX - (rect.left + rect.width / 2)) / rect.width) * 10);
          moveY(((e.clientY - (rect.top + rect.height / 2)) / rect.height) * 6);
        };
        const onElMouseleave = () => {
          moveX(0);
          moveY(0);
        };
        el.addEventListener("mousemove", onElMousemove);
        el.addEventListener("mouseleave", onElMouseleave);
        cleanups.push(() => {
          el.removeEventListener("mousemove", onElMousemove);
          el.removeEventListener("mouseleave", onElMouseleave);
        });
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <section className="contact fixed inset-0 h-screen w-screen" id="contact-section" data-stack>
      <div className="contact__glow" id="contact-glow" aria-hidden="true"></div>
      <div className="contact__inner">
        <h2 className="contact__headline" id="contact-headline">
          <AnimatedLetters text={headline} prefix="contact" /><span className="contact__accent">;</span>
        </h2>
        <a className="contact__mail" id="contact-mail" href="mailto:dinamous.dev@gmail.com">
          dinamous.dev@gmail.com
          <span className="contact__mail-underline" aria-hidden="true"></span>
        </a>
        <ul className="contact__social" id="contact-social">
          {socials.map((s) => (
            <li key={s.label}><a href={s.href} target={s.href.startsWith("mailto:") ? undefined : "_blank"} rel="noopener">{s.label}</a></li>
          ))}
        </ul>
      </div>
      <div className="contact__tag" id="contact-tag">{"{ eof }"}</div>
    </section>
  );
}
