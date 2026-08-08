import { useEffect, useState } from "react";
import gsap from "gsap";
import { Observer } from "gsap/Observer";
import { prefersReducedMotion } from "../../lib/motion";
import { CropMarks, DashedLine, RegMark } from "../graphics";
import "./ProjectGallery.css";

const isVideo = (src: string) => /\.(mp4|webm|mov)$/i.test(src);

// ordem dos cantos vem do CropMarks (tl, tr, br, bl), então a diagonal de cada um
// é indexada — mesma tabela do cursor da lista de projetos
const CORNER_X = [-1, 1, 1, -1];
const CORNER_Y = [-1, -1, 1, 1];

// cursor de zoom: a mesma marca de registro que substitui o ponteiro na lista de
// projetos (ver Projects.tsx), aqui como afordância de ampliar. Os colchetes esperam
// afastados nas diagonais e fecham sobre a marca — o ponteiro "enquadra" a mídia.
// Devolve o cleanup; devolve `undefined` quando não há hover real ou o usuário pediu
// menos movimento, e aí o cursor nativo (zoom-in do CSS) continua valendo.
function attachCursor(mark: HTMLElement | null, target: HTMLElement | null) {
  if (!mark || !target || prefersReducedMotion() || !window.matchMedia("(hover: hover)").matches) return;

  const corners = mark.querySelectorAll<HTMLElement>(".gfx-crop");
  // a rotação de cada canto vem do CSS do CropMarks (i * 90deg); reescrita aqui porque
  // quem tweena x/y passa a ser dono do transform inteiro, e deixar o GSAP decompor a
  // matriz existente é o que vira canto apontando pro lado
  gsap.set(corners, {
    rotate: (i: number) => i * 90,
    x: (i: number) => CORNER_X[i] * 10,
    y: (i: number) => CORNER_Y[i] * 10,
    opacity: 0,
  });
  // xPercent/yPercent centralizam no próprio tamanho (uma vez só); x/y seguem o
  // ponteiro em px puro
  gsap.set(mark, {
    autoAlpha: 0,
    scale: 0.6,
    rotate: -45,
    xPercent: -50,
    yPercent: -50,
  });

  const x = gsap.quickTo(mark, "x", { duration: 0.35, ease: "power3" });
  const y = gsap.quickTo(mark, "y", { duration: 0.35, ease: "power3" });
  // timeline pausada com play/reverse em vez de um gsap.to() por evento: entrar e sair
  // depressa dispara enter+leave a poucos ms, e dois tweens novos nessa janela ficam
  // presos no valor do primeiro
  const show = gsap
    .timeline({ paused: true })
    .to(
      mark,
      {
        autoAlpha: 1,
        scale: 1,
        rotate: 0,
        duration: 0.42,
        ease: "back.out(2)",
      },
      0,
    )
    .to(corners, { x: 0, y: 0, opacity: 0.85, duration: 0.34, ease: "power3.out" }, 0.1);

  const onMousemove = (e: MouseEvent) => {
    x(e.clientX);
    y(e.clientY);
  };
  const onMouseenter = (e: MouseEvent) => {
    gsap.set(mark, { x: e.clientX, y: e.clientY });
    show.play();
  };
  const onMouseleave = () => show.reverse();

  target.addEventListener("mousemove", onMousemove);
  target.addEventListener("mouseenter", onMouseenter);
  target.addEventListener("mouseleave", onMouseleave);
  // classe e não style inline: o cursor:none precisa alcançar também os filhos (o
  // slide tem zoom-in próprio, que ganharia do cursor do pai)
  target.classList.add("is-cursor-marked");

  return () => {
    target.removeEventListener("mousemove", onMousemove);
    target.removeEventListener("mouseenter", onMouseenter);
    target.removeEventListener("mouseleave", onMouseleave);
    target.classList.remove("is-cursor-marked");
    show.kill();
    gsap.killTweensOf(mark);
  };
}

// lupa: a barra vertical some via CSS quando a mídia já está ampliada, e o + vira −
const cursorGlyph = (
  <>
    {/* colchetes por fora da caixa: o cursor vira visor de enquadramento */}
    <CropMarks corners="all" x="-7px" size="7px" />
    <svg
      className="gallery__cursor-glyph"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    >
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 20.5 20.5" />
      <path d="M7.5 10.5h6" />
      <path className="gallery__cursor-plus" d="M10.5 7.5v6" />
    </svg>
  </>
);

const cursorSize = "clamp(34px, 2.6vw, 42px)";

// galeria da ficha de projeto: carrossel + lightbox <dialog> com zoom/pan. Dona do
// próprio índice e do próprio estado de ampliação — a ficha só passa as mídias.
export default function ProjectGallery({ images, title }: { images: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  const total = images.length;
  const current = images[index];
  const step = (delta: number) => setIndex((i) => (i + delta + total) % total);

  // setas navegam a galeria: quem chegou aqui pelo teclado não deveria precisar
  // caçar os ‹ › no cabeçalho do quadro
  useEffect(() => {
    if (total < 2) return;
    // o passo aqui é o mesmo do `step`, escrito à mão: `step` nasce de novo a cada
    // render, e depender dele reassinaria o listener em toda troca de slide
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + total) % total);
      else if (e.key === "ArrowRight") setIndex((i) => (i + 1) % total);
    };
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [total]);

  // transição do slide — translateX em px (não xPercent: o track é mais largo que o
  // viewport, xPercent seria relativo à própria largura dele). O foco (opacity/scale
  // dos slides) sai do mesmo tween: quem entra abre, quem sai recua, sem precisar
  // guardar a direção do passo.
  useEffect(() => {
    const viewport = document.getElementById("gallery-viewport");
    const track = document.getElementById("gallery-track");
    if (!viewport || !track) return;
    const slides = Array.from(track.children);
    const focus = {
      opacity: (i: number) => (i === index ? 1 : 0.12),
      scale: (i: number) => (i === index ? 1 : 0.92),
    };
    const apply = (animate: boolean) => {
      const x = -index * viewport.clientWidth;
      if (animate) {
        gsap.to(track, {
          x,
          duration: 0.7,
          ease: "power3.inOut",
          overwrite: true,
        });
        gsap.to(slides, {
          ...focus,
          duration: 0.7,
          ease: "power2.inOut",
          overwrite: true,
        });
      } else {
        gsap.set(track, { x });
        gsap.set(slides, focus);
      }
    };
    apply(!prefersReducedMotion());
    // o offset é medido em px: sem remedir no resize o slide fica no meio de dois
    const onResize = () => apply(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [index, total]);

  // miniatura ativa: opacity só daqui (o hover é o [data-lift] da ficha, em y), então
  // nunca há dois donos da mesma propriedade
  useEffect(() => {
    const thumbs = gsap.utils.toArray<HTMLElement>(".gallery__thumb");
    if (!thumbs.length) return;
    gsap.to(thumbs, {
      opacity: (i: number) => (i === index ? 1 : 0.4),
      duration: prefersReducedMotion() ? 0 : 0.35,
      ease: "power2.out",
      overwrite: "auto",
    });
  }, [index, total]);

  // cursor do quadro: só sobre slide de imagem — vídeo tem controles próprios e não
  // abre o lightbox, então prometer zoom ali seria mentira
  useEffect(() => {
    if (!current || isVideo(current)) return;
    return attachCursor(
      document.getElementById("gallery-cursor"),
      document.getElementById("gallery-viewport"),
    );
  }, [current]);

  // abrir/fechar o lightbox. <dialog> nativo: top layer (não é recortado pelo
  // clip-path do overlay), backdrop, foco preso e Esc de graça — nada disso precisa
  // de código aqui. O GSAP só cobre entrada e saída.
  useEffect(() => {
    const dlg = document.getElementById("gallery-lightbox") as HTMLDialogElement | null;
    if (!dlg) return;
    const stage = document.getElementById("gallery-stage");
    const bar = document.getElementById("gallery-lightbox-bar");
    const reduce = prefersReducedMotion();

    if (zoomOpen) {
      dlg.showModal();
      if (reduce) {
        gsap.set(dlg, { opacity: 1 });
        gsap.set([stage, bar], { opacity: 1, scale: 1, y: 0 });
        return;
      }
      // o fundo entra por opacity e o palco cresce por trás dele: a mídia parece vir
      // do quadro da ficha em vez de aparecer pronta
      gsap
        .timeline()
        .fromTo(dlg, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" }, 0)
        .fromTo(
          stage,
          { opacity: 0, scale: 0.9 },
          { opacity: 1, scale: 1, duration: 0.6, ease: "power3.out" },
          0,
        )
        .fromTo(bar, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0.14);
    } else if (dlg.open) {
      const close = () => {
        dlg.close();
        gsap.set(dlg, { opacity: 1 });
      };
      if (reduce) close();
      else
        gsap
          .timeline({ onComplete: close })
          .to(stage, { opacity: 0, scale: 0.94, duration: 0.26, ease: "power2.in" }, 0)
          .to(bar, { opacity: 0, y: 10, duration: 0.2, ease: "power2.in" }, 0)
          .to(dlg, { opacity: 0, duration: 0.24, ease: "power2.in" }, 0.08);
    }
  }, [zoomOpen]);

  // zoom + pan da mídia ampliada: um estado {scale,x,y} e um tween retargetado a cada
  // evento (overwrite "auto", então nunca há dois donos do transform — e o fade de
  // troca de slide, que mexe só em opacity, sobrevive a um wheel no meio dele).
  useEffect(() => {
    if (!zoomOpen || !current) return;
    const stage = document.getElementById("gallery-stage")!;
    const media = document.getElementById("gallery-media")!;
    const reduce = prefersReducedMotion();

    // trocar de slide com o lightbox aberto trocava a mídia num corte seco
    if (!reduce) gsap.fromTo(media, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" });

    // vídeo tem controles próprios: arrastar/dar zoom neles seria briga, e um player
    // já é legível em tela cheia
    if (isVideo(current)) return;

    const cursorCleanup = attachCursor(document.getElementById("gallery-cursor-zoom"), stage);

    const st = { scale: 1, x: 0, y: 0 };
    const duration = reduce ? 0 : 0.35;
    gsap.set(media, { scale: 1, x: 0, y: 0 });

    const apply = () => {
      // ponytail: o limite de pan usa o box do elemento, não a área pintada da imagem
      // (object-fit deixa faixa vazia) — sobra folga, mas nunca some.
      const max = (size: number) => (size * (st.scale - 1)) / 2;
      st.x = gsap.utils.clamp(-max(media.offsetWidth), max(media.offsetWidth), st.x);
      st.y = gsap.utils.clamp(-max(media.offsetHeight), max(media.offsetHeight), st.y);
      gsap.to(media, {
        ...st,
        duration,
        ease: "power3.out",
        overwrite: "auto",
      });
      stage.dataset.zoomed = st.scale > 1 ? "1" : "";
    };

    // wheel à mão em vez do preventDefault do Observer: precisa ser passive:false pra
    // cancelar o scroll nativo sem o browser reclamar
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      st.scale = gsap.utils.clamp(1, 4, st.scale * (1 - e.deltaY * 0.0015));
      if (st.scale === 1) st.x = st.y = 0;
      apply();
    };
    stage.addEventListener("wheel", onWheel, { passive: false });

    const observer = Observer.create({
      target: stage,
      type: "touch,pointer",
      dragMinimum: 3,
      onDrag: (self) => {
        if (st.scale === 1) return;
        st.x += self.deltaX;
        st.y += self.deltaY;
        apply();
      },
      onClick: (self) => {
        if (st.scale > 1) {
          st.scale = 1;
          st.x = st.y = 0;
        } else {
          // leva o ponto clicado pro centro: depois do scale s, um ponto a p do centro
          // cai em p*s, então o translate que o traz de volta é -p*s
          const e = self.event as PointerEvent;
          const r = media.getBoundingClientRect();
          st.scale = 2.4;
          st.x = -(e.clientX - r.left - r.width / 2) * st.scale;
          st.y = -(e.clientY - r.top - r.height / 2) * st.scale;
        }
        apply();
      },
    });

    return () => {
      stage.removeEventListener("wheel", onWheel);
      observer.kill();
      cursorCleanup?.();
      gsap.killTweensOf(media);
      delete stage.dataset.zoomed;
    };
  }, [zoomOpen, current]);

  const counter = (
    <span className="gallery__counter">
      {String(Math.min(index + 1, total)).padStart(2, "0")} / {String(total).padStart(2, "0")}
    </span>
  );

  return (
    <>
      <section className="gallery" aria-label="Galeria do projeto" data-reveal>
        {/* canhoto do quadro, picotado embaixo em vez de um border-bottom reto */}
        <div className="gallery__stub">
          <span>↠ Galeria</span>
          {counter}
          <span className="gallery__nav">
            {total > 0 && (
              <button type="button" onClick={() => setZoomOpen(true)} aria-label="Ampliar item" data-lift>
                ⤢
              </button>
            )}
            {total > 1 && (
              <>
                <button type="button" onClick={() => step(-1)} aria-label="Anterior" data-lift>
                  ‹
                </button>
                <button type="button" onClick={() => step(1)} aria-label="Próximo" data-lift>
                  ›
                </button>
              </>
            )}
          </span>
          <DashedLine className="gallery__stub-edge" />
        </div>

        <div className="gallery__frame">
          <CropMarks corners="all" x="8px" opacity={0.4} />
          <div className="gallery__viewport" id="gallery-viewport">
            <div className="gallery__track" id="gallery-track">
              {images.map((src, i) =>
                isVideo(src) ? (
                  <video
                    key={src + i}
                    className="gallery__slide"
                    src={src}
                    controls
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <img
                    key={src + i}
                    className="gallery__slide gallery__slide--zoomable"
                    src={src}
                    alt={`${title} — imagem ${i + 1} de ${total}`}
                    onClick={() => setZoomOpen(true)}
                  />
                ),
              )}
            </div>
          </div>
        </div>

        {total > 1 && (
          <div className="gallery__thumbs">
            {images.map((src, i) => (
              <button
                key={src + i}
                type="button"
                className={`gallery__thumb${i === index ? " is-active" : ""}`}
                onClick={() => setIndex(i)}
                aria-label={`Ir para o item ${i + 1}`}
                aria-current={i === index}
                data-lift
              >
                {isVideo(src) ? (
                  <>
                    <video src={src} preload="metadata" muted />
                    <span className="gallery__thumb-play" aria-hidden="true">
                      ▶
                    </span>
                  </>
                ) : (
                  <img src={src} alt="" loading="lazy" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* modal nativo: fica na top layer, então o clip-path do overlay não o recorta
          mesmo estando aqui dentro da árvore */}
        <dialog
          className="gallery__lightbox"
          id="gallery-lightbox"
          aria-label={`${title} — mídia ampliada`}
          onClose={() => setZoomOpen(false)}
          onClick={(e) => {
            if (e.target === e.currentTarget) setZoomOpen(false);
          }}
        >
          <div className="gallery__lightbox-stage" id="gallery-stage">
            {current &&
              (isVideo(current) ? (
                <video
                  className="gallery__lightbox-media"
                  id="gallery-media"
                  src={current}
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                <img
                  className="gallery__lightbox-media"
                  id="gallery-media"
                  src={current}
                  alt={`${title} — imagem ${index + 1} de ${total}`}
                  draggable={false}
                />
              ))}
          </div>

          {/* irmão do palco de propósito: o seletor do glifo (+ vira −) lê o
            data-zoomed que o pan escreve ali */}
          <RegMark
            id="gallery-cursor-zoom"
            className="gallery__cursor"
            shape="square"
            size={cursorSize}
            glyph={cursorGlyph}
          />

          <div className="gallery__lightbox-bar" id="gallery-lightbox-bar">
            <span className="gallery__lightbox-hint">
              {current && !isVideo(current) ? "clique ou role para dar zoom · arraste para mover" : "vídeo"}
            </span>
            {counter}
            <span className="gallery__nav">
              {total > 1 && (
                <>
                  <button type="button" onClick={() => step(-1)} aria-label="Anterior" data-lift>
                    ‹
                  </button>
                  <button type="button" onClick={() => step(1)} aria-label="Próximo" data-lift>
                    ›
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setZoomOpen(false)}
                aria-label="Fechar ampliação"
                data-lift
              >
                ×
              </button>
            </span>
          </div>
        </dialog>
      </section>

      {/* fora da <section> de propósito: ela carrega will-change/transform da entrada
       da ficha, e um ancestral transformado vira o bloco de contenção do
       position:fixed — dentro dela o cursor grudava na caixa da galeria em vez do
       viewport. Aqui a âncora é a mesma do tooltip de npm da ficha. */}
      <RegMark
        id="gallery-cursor"
        className="gallery__cursor"
        shape="square"
        size={cursorSize}
        glyph={cursorGlyph}
      />
    </>
  );
}
