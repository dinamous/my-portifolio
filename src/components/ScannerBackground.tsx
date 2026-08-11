import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";
import { prefersReducedMotion } from "../lib/motion";

const hexToRgb = (hex: string) =>
  new Float32Array([1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255));

const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uSweepSpeed;
uniform float uSweepWidth;
uniform float uSweepFalloff;
uniform float uScale;
uniform float uFrequency;
uniform float uRipple;
uniform float uBandDensity;
uniform float uLineSharpness;
uniform float uGlow;
uniform float uColorSpread;
uniform float uBrightness;
uniform float uContrast;
uniform float uSoftness;
uniform float uVignette;
uniform float uOpacity;
uniform float uScanline;
uniform float uGrain;
uniform float uGrainIntensity;
uniform float uDirection;
uniform vec2 uMouse;
uniform float uMouseEnabled;
uniform float uMouseRadius;
uniform float uMouseStrength;
uniform float uMouseActive;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
out vec4 fragColor;

const float TAU = 6.2831853;

float signalField(vec2 p, float t) {
  float w = sin(p.x * 1.3 + t * 0.7);
  w += sin(p.y * 1.7 - t * 0.52) * 0.8;
  w += sin((p.x + p.y) * 0.9 + t * 0.91) * 0.6;
  w += sin((p.x - p.y) * 1.53 - t * 0.63) * 0.42;
  return w * 0.35;
}

vec3 palette(float f) {
  f = clamp(f, 0.0, 1.0);
  f = pow(f, uContrast);
  vec3 c = mix(uColor1, uColor2, smoothstep(0.08, 0.6, f));
  return mix(c, uColor3, smoothstep(0.68, 1.0, f));
}

float scanBand(float x, float aa, float sharp) {
  float v = mix(0.5, 0.5 + 0.5 * cos(x * TAU), aa);
  return pow(v, sharp);
}

void main() {
  float aspect = iResolution.x / iResolution.y;
  vec2 uv0 = (gl_FragCoord.xy * 2.0 - iResolution.xy) / iResolution.y;
  vec2 p = uv0 / max(uScale, 0.001);

  float t = iTime * uSpeed;

  float mouseBoost = 0.0;
  if (uMouseEnabled > 0.5) {
    vec2 mUv = vec2((uMouse.x * 2.0 - 1.0) * aspect, uMouse.y * 2.0 - 1.0);
    vec2 md = uv0 - mUv;
    float r = max(uMouseRadius, 0.001);
    mouseBoost = exp(-dot(md, md) / (r * r)) * uMouseStrength * uMouseActive;
  }

  float axis;
  if (uDirection < 0.5) axis = p.y;
  else if (uDirection < 1.5) axis = p.x;
  else axis = (p.x + p.y) * 0.70710678;

  float sig = signalField(p * uFrequency, t);
  float coord = axis + sig * uRipple;

  float phase = coord / max(uSweepWidth, 0.05) - t * uSweepSpeed;
  float sweep = pow(0.5 + 0.5 * cos(phase * TAU), max(uSweepFalloff, 0.1));

  float lc = coord * uBandDensity;
  float aa = 1.0 / (1.0 + uSoftness * fwidth(lc) * 3.0);
  aa = clamp(aa * (1.0 + mouseBoost * 0.6), 0.0, 1.0);

  float bodyBase = clamp(0.5 + 0.5 * sig, 0.0, 1.0);
  float body = bodyBase * bodyBase * uGlow * sweep;

  float sharp = max(uLineSharpness, 0.1);
  float split = uColorSpread * 0.16;
  float fr = clamp(scanBand(lc + split, aa, sharp) * sweep + body, 0.0, 1.0);
  float fg = clamp(scanBand(lc, aa, sharp) * sweep + body, 0.0, 1.0);
  float fb = clamp(scanBand(lc - split, aa, sharp) * sweep + body, 0.0, 1.0);

  vec3 col = vec3(palette(fr).r, palette(fg).g, palette(fb).b);

  float inten = (fr + fg + fb) * 0.3333333 * uBrightness;
  inten *= 1.0 + mouseBoost * 0.9;

  if (uScanline > 0.5) {
    inten *= 1.0 - 0.18 * (0.5 + 0.5 * cos(gl_FragCoord.y * 1.7));
  }

  if (uGrain > 0.5) {
    float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + iTime) * 43758.5453);
    inten += (g - 0.5) * uGrainIntensity;
  }

  inten *= clamp(1.0 - uVignette * smoothstep(0.55, 1.65, length(uv0)), 0.0, 1.0);
  inten = clamp(inten, 0.0, 1.0);

  float a = clamp(inten * uOpacity, 0.0, 1.0);
  fragColor = vec4(clamp(col, 0.0, 1.0) * a, a);
}
`;

// ponytail: config fixa em vez da API de props do React Bits — é fundo de uma
// seção só, como o HeroBackground. Vira prop no dia em que a segunda seção usar
const uniforms = {
  iTime: { value: 0 },
  iResolution: { value: new Float32Array([1, 1]) },
  uSpeed: { value: 0.45 },
  uSweepSpeed: { value: 0.2 },
  uSweepWidth: { value: 1.1 },
  uSweepFalloff: { value: 3 },
  uScale: { value: 2.65 },
  uFrequency: { value: 1.5 },
  uRipple: { value: 0.5 },
  uBandDensity: { value: 7 },
  uLineSharpness: { value: 5.5 },
  uGlow: { value: 0.22 },
  uColorSpread: { value: 0.7 },
  uBrightness: { value: 1 },
  uContrast: { value: 1.75 },
  uSoftness: { value: 5 },
  uVignette: { value: 1 },
  // fundo atrás de formulário: opacidade baixa pra não competir com o texto
  uOpacity: { value: 0.5 },
  uScanline: { value: 1 },
  uGrain: { value: 0 },
  uGrainIntensity: { value: 0 },
  uDirection: { value: 2 },
  uMouse: { value: new Float32Array([0.5, 0.5]) },
  uMouseEnabled: { value: 1 },
  uMouseRadius: { value: 0.24 },
  uMouseStrength: { value: 1.05 },
  uMouseActive: { value: 1 },
  uColor1: { value: hexToRgb("#0891b2") },
  uColor2: { value: hexToRgb("#34d399") },
  uColor3: { value: hexToRgb("#a3e635") },
};

export default function ScannerBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({
      webgl: 2,
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    const canvas = gl.canvas;
    canvas.style.cssText = "width:100%;height:100%;display:block";
    container.appendChild(canvas);

    const program = new Program(gl, { vertex, fragment, uniforms });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    const render = () => renderer.render({ scene: mesh });

    const ro = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();
      renderer.setSize(Math.max(1, width | 0), Math.max(1, height | 0));
      uniforms.iResolution.value[0] = gl.drawingBufferWidth;
      uniforms.iResolution.value[1] = gl.drawingBufferHeight;
      render();
    });
    ro.observe(container);

    const cleanups: Array<() => void> = [
      () => ro.disconnect(),
      () => container.removeChild(canvas),
      () => gl.getExtension("WEBGL_lose_context")?.loseContext(),
    ];

    // reduced motion: um frame estático e pronto. Este campo não tem "estado
    // final" pra onde pular — é ruído contínuo, mesmo caso do HeroBackground
    if (!prefersReducedMotion()) {
      let raf = 0;
      const t0 = performance.now();
      const mouse = uniforms.uMouse.value;

      const loop = (t: number) => {
        uniforms.iTime.value = (t - t0) * 0.001;
        render();
        raf = requestAnimationFrame(loop);
      };
      const stop = () => {
        cancelAnimationFrame(raf);
        raf = 0;
      };
      // a seção fica fixa no DOM o tempo todo (sectionStack), então sem este gate
      // o shader queima GPU escondido atrás das outras seções
      const sync = () => {
        const visible = !document.hidden && container.getBoundingClientRect().top < window.innerHeight;
        if (visible && !raf) raf = requestAnimationFrame(loop);
        else if (!visible && raf) stop();
      };

      const io = new IntersectionObserver(sync);
      io.observe(container);
      document.addEventListener("visibilitychange", sync);
      // o canvas é pointer-events:none, então o foco do cursor vem da janela,
      // como os outros paralaxes do site
      const onMove = (e: MouseEvent) => {
        mouse[0] = e.clientX / window.innerWidth;
        mouse[1] = 1 - e.clientY / window.innerHeight;
      };
      window.addEventListener("mousemove", onMove, { passive: true });

      cleanups.unshift(
        stop,
        () => io.disconnect(),
        () => document.removeEventListener("visibilitychange", sync),
        () => window.removeEventListener("mousemove", onMove),
      );
    }

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    />
  );
}
