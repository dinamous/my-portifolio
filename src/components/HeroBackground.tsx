import { useEffect, useRef } from "react";
import { NeatGradient } from "@firecms/neat";
import { prefersReducedMotion } from "../lib/motion";

const NEAT_COLORS = [
  { color: "#005F73", enabled: true },
  { color: "#0A9396", enabled: true },
  { color: "#94D2BD", enabled: true },
  { color: "#E9D8A6", enabled: true },
  { color: "#EE9B00", enabled: false },
];

export default function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gradient = new NeatGradient({
      ref: canvas,
      colors: NEAT_COLORS,
      backgroundColor: "#004E64",
      backgroundAlpha: 1,
      // reduced motion: near-zero speed freezes the field on its current frame
      // instead of jumping to a designed "final" state, since this animation
      // has no such state — it's a continuously evolving noise field
      speed: prefersReducedMotion() ? 0 : 3,
      horizontalPressure: 5,
      verticalPressure: 7,
      waveFrequencyX: 2,
      waveFrequencyY: 2,
      waveAmplitude: 8,
      shadows: 6,
      highlights: 8,
      colorBrightness: 1,
      colorSaturation: 7,
      colorBlending: 10,
      grainScale: 3,
      grainSparsity: 0,
      grainIntensity: 0.3,
      grainSpeed: 1,
      resolution: 1,
    });

    return () => gradient.destroy();
  }, []);

  return (
    <div className="hero__bg" id="hero-bg" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
