import type { CSSProperties } from "react";
import "./Perforation.css";

export default function Perforation({
  vertical = false,
  ink,
  hole,
  step,
  className = "",
}: {
  vertical?: boolean;
  /** cor do fundo atrás da ficha — é ela que "abre" o furo */
  ink?: string;
  hole?: string;
  step?: string;
  className?: string;
}) {
  const style = {
    ...(ink && { "--gfx-perf-ink": ink }),
    ...(hole && { "--gfx-perf-hole": hole }),
    ...(step && { "--gfx-perf-step": step }),
  } as CSSProperties;

  return (
    <span
      className={`gfx-perf ${vertical ? "gfx-perf--v" : "gfx-perf--h"} ${className}`}
      style={ink || hole || step ? style : undefined}
      aria-hidden="true"
    ></span>
  );
}
