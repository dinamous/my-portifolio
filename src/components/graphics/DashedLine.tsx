import type { CSSProperties } from "react";
import "./DashedLine.css";

export default function DashedLine({
  vertical = false,
  dots = false,
  accent = false,
  gap,
  tone,
  id,
  className = "",
}: {
  vertical?: boolean;
  dots?: boolean;
  accent?: boolean;
  gap?: string;
  /** alfa do traço (0–1) — o padrão 0.26 é o picote das fichas */
  tone?: number;
  id?: string;
  className?: string;
}) {
  const style = {
    ...(gap && { "--gfx-dash-gap": gap }),
    ...(tone !== undefined && { "--gfx-dash-alpha": tone }),
  } as CSSProperties;

  return (
    <span
      className={[
        "gfx-dash",
        vertical ? "gfx-dash--v" : "gfx-dash--h",
        dots && "gfx-dash--dots",
        accent && "gfx-dash--accent",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={gap || tone !== undefined ? style : undefined}
      id={id}
      aria-hidden="true"
    ></span>
  );
}
