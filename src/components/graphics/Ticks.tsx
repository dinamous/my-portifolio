import type { CSSProperties } from "react";
import "./Ticks.css";

export default function Ticks({
  vertical = false,
  bars = false,
  step,
  length,
  tone,
  id,
  className = "",
}: {
  vertical?: boolean;
  /** passo irregular, leitura de código de barras em vez de régua */
  bars?: boolean;
  step?: string;
  length?: string;
  tone?: number;
  id?: string;
  className?: string;
}) {
  const style = {
    ...(step && { "--gfx-ticks-step": step }),
    ...(length && { "--gfx-ticks-len": length }),
    ...(tone !== undefined && { "--gfx-ticks-alpha": tone }),
  } as CSSProperties;

  return (
    <span
      className={[
        "gfx-ticks",
        vertical ? "gfx-ticks--v" : "gfx-ticks--h",
        bars && "gfx-ticks--bars",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={step || length || tone !== undefined ? style : undefined}
      id={id}
      aria-hidden="true"
    ></span>
  );
}
