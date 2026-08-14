import { lazy, Suspense, useEffect, useState } from "react";
import gsap from "gsap";
import { prefersReducedMotion } from "../../lib/motion";
import { scrubTimeline } from "../../lib/scrub";
import { contact } from "../../lib/contact";
import { AccentRule, CropMarks, DashedLine, RegMark } from "../../components/graphics";
import "./Contact.css";

// ogl (~40 kB) sai do bundle inicial: a Contact é a última da pilha, então o
// shader não tem o que pintar até a Skills começar a fechar. O gate de
// visibilidade interno do ScannerBackground não serve aqui — a seção é
// fixed inset-0, o rect nunca sai da viewport e o rAF nunca pausaria.
const ScannerBackground = lazy(() => import("../../components/ScannerBackground"));

const projectTypes = ["Site / Landing", "Web App", "Motion / 3D", "Outro"];

const textFields = [
  {
    name: "nome",
    label: "Como te chamo",
    placeholder: "seu nome · empresa",
    type: "text",
    autoComplete: "name",
  },
  {
    name: "email",
    label: "E-mail",
    placeholder: "voce@empresa.com.br",
    type: "email",
    autoComplete: "email",
    spellCheck: false,
  },
];

export default function Contact() {
  const [scanner, setScanner] = useState(false);

  useEffect(() => {
    const section = document.getElementById("contact-section")!;
    const q = <T extends HTMLElement>(sel: string) => section.querySelector<T>(sel)!;
    const qa = <T extends HTMLElement>(sel: string) => Array.from(section.querySelectorAll<T>(sel));

    const words = qa(".contact__word-inner");
    const dot = q("#contact-dot");
    const bar = q("#contact-bar");
    const sub = q("#contact-sub");
    const channels = qa(".contact__channel");
    const socials = qa(".contact__social");
    const card = q("#contact-card");
    const divider = q("#contact-divider");
    const rows = qa(".contact__row");

    const form = q<HTMLFormElement>("#contact-form");
    const body = q("#contact-body");
    const rail = q("#contact-rail");
    const meterFill = q("#contact-meter-fill");
    const chips = qa<HTMLButtonElement>(".contact__chip");
    const sent = q("#contact-sent");
    const submit = q<HTMLButtonElement>("#contact-submit");
    const submitFill = q("#contact-submit-fill");
    const submitText = q(".contact__submit-text");
    const inputs = qa<HTMLInputElement | HTMLTextAreaElement>(".contact__input");

    const reduceMotion = prefersReducedMotion();
    const cleanups: Array<() => void> = [];
    // registra o listener e já enfileira a remoção: o `return` do efeito é uma
    // linha só, sem par manual de add/remove por evento
    const on = <K extends keyof HTMLElementEventMap>(
      el: HTMLElement,
      type: K,
      fn: (e: HTMLElementEventMap[K]) => void,
    ) => {
      el.addEventListener(type, fn as EventListener);
      cleanups.push(() => el.removeEventListener(type, fn as EventListener));
    };
    const onWindow = (type: string, fn: EventListener, opts?: AddEventListenerOptions) => {
      window.addEventListener(type, fn, opts);
      cleanups.push(() => window.removeEventListener(type, fn));
    };

    // ---------------------------------------------------------------- entrada
    // estado inicial: tudo fora de quadro. A Contact é a última da pilha (nunca
    // fecha), então só existe entrada — escrubada pelo progresso da Skills.
    gsap.set([sub, dot], { opacity: 0 });
    gsap.set(words, { yPercent: 115 });
    gsap.set(bar, { scaleX: 0 });
    gsap.set([...channels, ...socials], { opacity: 0, y: 18 });
    gsap.set(card, { opacity: 0, yPercent: 8, rotateX: 12 });
    gsap.set(divider, { scaleY: 0 });
    gsap.set(rows, { opacity: 0, y: 22 });
    gsap.set(sent, { autoAlpha: 0 });
    gsap.set(rail, { scaleY: 0, opacity: 0 });
    gsap.set(meterFill, { scaleX: 0 });
    gsap.set(submitFill, { scaleX: 0 });

    const reveal = gsap
      .timeline({ paused: true })
      .to(words, { yPercent: 0, duration: 0.9, stagger: 0.09, ease: "power4.out" }, 0.2)
      .to(dot, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(3.5)" }, 0.62)
      .to(bar, { scaleX: 1, duration: 0.5, ease: "power2.inOut" }, 0.55)
      .to(sub, { opacity: 1, duration: 0.45 }, 0.6)
      .to(divider, { scaleY: 1, duration: 0.7, ease: "power2.inOut" }, 0.3)
      .to(card, { opacity: 1, yPercent: 0, rotateX: 0, duration: 0.85, ease: "power3.out" }, 0.35)
      .to(rows, { opacity: 1, y: 0, duration: 0.55, stagger: 0.07, ease: "power2.out" }, 0.55)
      .to(channels, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power2.out" }, 0.7)
      .to(socials, { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: "power2.out" }, 0.85);

    if (reduceMotion) {
      reveal.progress(1);
    } else {
      const setProgress = scrubTimeline(reveal);
      // o reveal só roda na segunda metade da transição (p 0.45→1), janela em que
      // o fundo da Skills já desvaneceu — escrubar em 0→1 faria a entrada inteira
      // acontecer escondida atrás do fundo opaco dela
      onWindow("skills:progress", ((e: CustomEvent<{ progress: number }>) => {
        setProgress(gsap.utils.clamp(0, 1, (e.detail.progress - 0.45) / 0.55));
      }) as EventListener);
    }

    // o shader existe só enquanto a seção está a caminho ou em cena: montar puxa
    // o chunk do ogl, desmontar solta o contexto WebGL pelo cleanup do próprio
    // componente. Fora daqui não há nada visível pra ele pintar.
    // ponytail: liga/desliga no p === 0 exato; vai e volta bem em cima dessa
    // borda recria o contexto — colocar histerese se algum dia piscar.
    onWindow("skills:progress", ((e: CustomEvent<{ progress: number }>) => {
      setScanner(e.detail.progress > 0);
    }) as EventListener);

    // ------------------------------------------------------------- ambiente
    if (!reduceMotion) {
      // paralaxe de mouse por camada: cada uma declara sua profundidade no HTML,
      // então acrescentar um elemento novo não exige tocar neste efeito.
      // x/y aqui, yPercent/rotate na entrada e no loop — canais separados, sem
      // dois donos da mesma prop (mesmo motivo documentado na AboutMe)
      const layers = qa("[data-depth]").map((el) => ({
        depth: Number(el.dataset.depth),
        x: gsap.quickTo(el, "x", { duration: 1.2, ease: "power3" }),
        y: gsap.quickTo(el, "y", { duration: 1.2, ease: "power3" }),
      }));
      onWindow(
        "mousemove",
        ((e: MouseEvent) => {
          const dx = e.clientX / window.innerWidth - 0.5;
          const dy = e.clientY / window.innerHeight - 0.5;
          layers.forEach((l) => {
            l.x(dx * l.depth);
            l.y(dy * l.depth * 0.6);
          });
        }) as EventListener,
        { passive: true },
      );

      // pull magnético nos alvos clicáveis
      qa("[data-magnetic]").forEach((el) => {
        const mx = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" });
        const my = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3" });
        on(el, "mousemove", (e) => {
          const r = el.getBoundingClientRect();
          mx(((e.clientX - (r.left + r.width / 2)) / r.width) * 16);
          my(((e.clientY - (r.top + r.height / 2)) / r.height) * 10);
        });
        on(el, "mouseleave", () => {
          mx(0);
          my(0);
        });
      });
    }

    // ------------------------------------------------------------ formulário
    // o anel de foco pertence a quem navega por teclado. Tab marca, qualquer
    // clique desmarca — o keydown do Tab chega antes do foco mudar, então a
    // classe já está lá quando o próximo campo recebe o foco
    const setKbd = (on: boolean) => section.classList.toggle("contact--kbd", on);
    onWindow("keydown", ((e: KeyboardEvent) => {
      if (e.key === "Tab") setKbd(true);
    }) as EventListener);
    onWindow("pointerdown", () => setKbd(false));

    // trilho luminoso: acompanha o campo em foco. scaleY sobre uma base fixa de
    // 100px em vez de height — transform não dispara layout
    const RAIL_BASE = 100;
    const railY = gsap.quickTo(rail, "y", { duration: 0.45, ease: "power3" });
    const railS = gsap.quickTo(rail, "scaleY", { duration: 0.45, ease: "power3" });
    const meterTo = gsap.quickTo(meterFill, "scaleX", { duration: 0.6, ease: "power2.out" });

    const moveRail = (row: HTMLElement) => {
      const r = row.getBoundingClientRect();
      const c = body.getBoundingClientRect();
      // "auto" e não true: o trilho também é alvo dos quickTo de y/scaleY, e
      // overwrite total mataria o movimento junto com o fade
      gsap.to(rail, { opacity: 1, duration: 0.25, overwrite: "auto" });
      railY(r.top - c.top);
      railS(r.height / RAIL_BASE);
    };

    // sem isto o trilho ficava aceso ao lado do último campo pra sempre. O delay
    // segura o apagão até o focus do próximo campo (que dispara logo depois do
    // blur) sobrescrever o tween — trocar de campo não pisca
    const hideRail = () => gsap.to(rail, { opacity: 0, duration: 0.3, delay: 0.06, overwrite: "auto" });

    let selectedType = projectTypes[0];

    const values = () => {
      const data = new FormData(form);
      return {
        nome: String(data.get("nome") ?? "").trim(),
        email: String(data.get("email") ?? "").trim(),
        mensagem: String(data.get("mensagem") ?? "").trim(),
      };
    };

    // medidor de preenchimento: sinal de progresso pra quem está respondendo
    const updateMeter = () => {
      const v = values();
      const filled = [v.nome, v.email, v.mensagem].filter(Boolean).length;
      meterTo(filled / 3);
    };

    // o erro vive no row: classe pro visual, texto pro que fazer, aria-invalid pro
    // leitor de tela. Sem isso o campo só ficava vermelho, sem dizer o motivo
    const clearError = (row: HTMLElement) => {
      row.classList.remove("contact__row--error");
      row.querySelector(".contact__err")!.textContent = "";
      row.querySelector(".contact__input")?.removeAttribute("aria-invalid");
    };

    inputs.forEach((input) => {
      const row = input.closest<HTMLElement>(".contact__row")!;
      const line = row.querySelector<HTMLElement>(".contact__line")!;
      const label = row.querySelector<HTMLElement>(".contact__label")!;
      gsap.set(line, { scaleX: 0 });

      // o erro não sai no foco: o submit inválido já joga o foco no primeiro campo
      // errado, e limpar aqui apagaria a mensagem antes de ela ser lida
      on(input, "focus", () => {
        gsap.to(line, { scaleX: 1, duration: 0.45, ease: "power3.out", overwrite: true });
        gsap.to(label, { color: "rgba(244,247,245,0.1)", x: 4, duration: 0.3, ease: "power2.out" });
        moveRail(row);
      });
      on(input, "blur", () => {
        gsap.to(line, {
          scaleX: 0,
          duration: 0.35,
          ease: "power2.inOut",
          transformOrigin: "right center",
          overwrite: true,
          onComplete: () => gsap.set(line, { transformOrigin: "left center" }),
        });
        gsap.to(label, { color: "rgba(244,247,245,0.45)", x: 0, duration: 0.3, ease: "power2.out" });
        hideRail();
      });

      // hover: um traço curto do mesmo gradiente, o mesmo elemento que o foco
      // preenche até o fim — o campo deixa de ser um sublinhado inerte até o clique.
      // o guard de activeElement evita que sair com o mouse apague a linha do campo
      // que está em foco
      const nib = (over: boolean) => {
        if (document.activeElement === input) return;
        gsap.to(line, { scaleX: over ? 0.16 : 0, duration: 0.3, ease: "power3.out", overwrite: true });
      };
      on(input, "mouseenter", () => nib(true));
      on(input, "mouseleave", () => nib(false));
      // o erro sai assim que a pessoa começa a corrigir, não só ao refocar
      on(input, "input", () => {
        clearError(row);
        updateMeter();
      });
    });

    // chips: o fundo de cada um escala em vez de um indicador compartilhado —
    // sobrevive à quebra de linha sem remedir nada
    const setType = (index: number) => {
      selectedType = projectTypes[index];
      chips.forEach((chip, i) => {
        const active = i === index;
        chip.setAttribute("aria-pressed", String(active));
        gsap.to(chip.querySelector(".contact__chip-bg"), {
          scaleX: active ? 1 : 0,
          duration: reduceMotion ? 0 : 0.4,
          ease: "power3.out",
          overwrite: true,
        });
        gsap.to(chip, { color: active ? "#04120c" : "rgba(244,247,245,0.6)", duration: 0.3, overwrite: "auto" });
      });
    };
    chips.forEach((chip, i) => on(chip, "click", () => setType(i)));
    setType(0);

    // preenchimento do botão: wipe da esquerda no hover, transform-only. A cor do
    // texto acompanha o wipe (overwrite pra não empilhar ao entrar/sair rápido)
    const hoverSubmit = (over: boolean) => {
      gsap.to(submitFill, {
        scaleX: over ? 1 : 0,
        duration: over ? 0.5 : 0.4,
        ease: over ? "power3.out" : "power2.inOut",
        overwrite: true,
      });
      gsap.to(submitText, {
        color: over ? "#04120c" : "#f4f7f5",
        duration: 0.3,
        overwrite: "auto",
      });
    };
    on(submit, "mouseenter", () => hoverSubmit(true));
    on(submit, "mouseleave", () => hoverSubmit(false));

    const shake = (row: HTMLElement, msg: string) => {
      row.classList.add("contact__row--error");
      row.querySelector(".contact__err")!.textContent = msg;
      row.querySelector(".contact__input")!.setAttribute("aria-invalid", "true");
      if (reduceMotion) return;
      gsap.fromTo(
        row,
        { x: -9 },
        { x: 0, duration: 0.6, ease: "elastic.out(1.6, 0.3)", clearProps: "x" },
      );
    };

    const message = ({ nome, email, mensagem }: ReturnType<typeof values>) =>
      [
        `Oi Matheus, vim pelo seu portfólio. Meu nome é ${nome} e gostaria de tratar de uma ideia de ${selectedType}.`,
        "",
        mensagem,
        email ? `\nE-mail para retorno: ${email}` : "",
      ].join("\n");

    const onSubmit = (e: Event) => {
      e.preventDefault();
      const v = values();

      // validação no clique, não a cada tecla: erro só depois que a pessoa
      // disse "terminei" incomoda menos do que rabiscar o campo enquanto digita
      const invalid = [
        !v.nome && ["nome", "Me diz como te chamar."],
        !v.mensagem && ["mensagem", "Escreve duas linhas sobre o projeto."],
        v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email) && ["email", "Esse e-mail parece incompleto."],
      ].filter(Boolean) as [string, string][];

      if (invalid.length) {
        invalid.forEach(([name, msg]) => {
          const el = form.querySelector<HTMLElement>(`[name="${name}"]`)!;
          shake(el.closest<HTMLElement>(".contact__row")!, msg);
        });
        form.querySelector<HTMLElement>(`[name="${invalid[0][0]}"]`)?.focus();
        return;
      }

      window.open(
        `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message(v))}`,
        "_blank",
        "noopener",
      );

      gsap
        .timeline()
        .to(rows, { opacity: 0, y: -18, duration: 0.35, stagger: 0.05, ease: "power2.in" })
        .to(rail, { opacity: 0, duration: 0.2 }, "<")
        // inert e não pointer-events: o form some pro mouse E pro teclado, senão dava
        // pra tabular pelos campos escondidos atrás do painel de enviado
        .call(() => body.setAttribute("inert", ""))
        .fromTo(
          sent,
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out" },
          "-=0.1",
        );
    };
    on(form, "submit", onSubmit);

    const onReset = () => {
      form.reset();
      qa(".contact__row--error").forEach(clearError);
      setType(0);
      updateMeter();
      gsap
        .timeline()
        .to(sent, { autoAlpha: 0, y: 16, duration: 0.3, ease: "power2.in" })
        .call(() => body.removeAttribute("inert"))
        .to(rows, { opacity: 1, y: 0, duration: 0.45, stagger: 0.05, ease: "power2.out" })
        .call(() => inputs[0].focus());
    };
    on(q("#contact-again"), "click", onReset);

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <section className="contact fixed inset-0 h-dvh w-screen" id="contact-section" data-stack>
      {scanner && (
        <Suspense fallback={null}>
          <ScannerBackground />
        </Suspense>
      )}

      <DashedLine vertical id="contact-divider" className="contact__divider" />

      <div className="contact__left" data-depth="-14">
        <h2 className="contact__headline">
          <span className="contact__line-row">
            <span className="contact__word contact__word--serif">
              <span className="contact__word-inner">é só</span>
            </span>
          </span>
          <span className="contact__line-row">
            <span className="contact__word">
              <span className="contact__word-inner">mandar</span>
            </span>
            <span className="contact__dot" id="contact-dot" aria-hidden="true">
              .
            </span>
          </span>
        </h2>

        <AccentRule id="contact-bar" className="contact__bar" />

        <p className="contact__sub" id="contact-sub">
          Conta em duas linhas o que você quer construir. {contact.replyTime}, {contact.availability},
          direto de {contact.location}.
        </p>

        <div className="contact__channels">
          <a
            className="contact__channel"
            href={`https://wa.me/${contact.whatsapp}`}
            target="_blank"
            rel="noopener"
            data-magnetic
          >
            <span className="contact__channel-term">WhatsApp</span>
            <span className="contact__channel-value">{contact.phoneLabel}</span>
          </a>
          <a className="contact__channel" href={`mailto:${contact.email}`} data-magnetic>
            <span className="contact__channel-term">E-mail</span>
            <span className="contact__channel-value">{contact.email}</span>
          </a>
        </div>

        <ul className="contact__socials">
          {contact.socials.map((s) => (
            <li className="contact__social" key={s.label}>
              <a href={s.href} target="_blank" rel="noopener" data-magnetic>
                {s.label}
                <span className="contact__social-handle">{s.handle}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="contact__card" id="contact-card" data-depth="12">
        <div className="contact__meter" aria-hidden="true">
          <span className="contact__meter-fill" id="contact-meter-fill"></span>
        </div>

        <div className="contact__stub" aria-hidden="true">
          <span>↠ Briefing</span>
          <span>Nº 04</span>
          <DashedLine className="contact__stub-edge" />
        </div>

        <form className="contact__form" id="contact-form" noValidate>
          <CropMarks x="8px" opacity={0.32} />
          <RegMark className="contact__mark" />

          <div className="contact__body" id="contact-body">
            <span className="contact__rail" id="contact-rail" aria-hidden="true"></span>

            {textFields.map((f) => (
              <label className="contact__row" key={f.name}>
                <span className="contact__label">{f.label}</span>
                <span className="contact__field">
                  <input
                    className="contact__input"
                    name={f.name}
                    type={f.type}
                    placeholder={f.placeholder}
                    autoComplete={f.autoComplete}
                    spellCheck={f.spellCheck}
                    enterKeyHint="next"
                  />
                  <span className="contact__line" aria-hidden="true"></span>
                </span>
                <span className="contact__err" role="alert"></span>
              </label>
            ))}

            <div className="contact__row contact__row--chips">
              <span className="contact__label">O que você precisa</span>
              <div className="contact__chips">
                {projectTypes.map((t) => (
                  <button className="contact__chip" type="button" key={t} aria-pressed="false">
                    <span className="contact__chip-bg" aria-hidden="true"></span>
                    <span className="contact__chip-text">{t}</span>
                  </button>
                ))}
              </div>
            </div>

            <label className="contact__row">
              <span className="contact__label">Sobre o projeto</span>
              <span className="contact__field">
                <textarea
                  className="contact__input contact__input--area"
                  name="mensagem"
                  rows={3}
                  placeholder="Landing do lançamento em outubro. Já temos identidade e copy — falta motion e integração com o CRM."
                />
                <span className="contact__line" aria-hidden="true"></span>
              </span>
              <span className="contact__err" role="alert"></span>
            </label>

            <div className="contact__row contact__row--actions">
              <button className="contact__submit" id="contact-submit" type="submit" data-magnetic>
                <span className="contact__submit-fill" id="contact-submit-fill" aria-hidden="true"></span>
                <span className="contact__submit-text">Mandar no WhatsApp ↠</span>
              </button>
              <a className="contact__alt" href={`mailto:${contact.email}?subject=Projeto novo`}>
                prefiro e-mail
              </a>
            </div>
          </div>

          <div className="contact__sent" id="contact-sent" role="status">
            <p className="contact__sent-title">Abri o WhatsApp pra você.</p>
            <p className="contact__sent-text">
              Sua mensagem já está escrita lá, só falta apertar enviar. Não abriu? Manda direto pra{" "}
              <a href={`mailto:${contact.email}`}>{contact.email}</a>.
            </p>
            <button className="contact__again" id="contact-again" type="button">
              escrever outra
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
