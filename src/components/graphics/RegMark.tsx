import type { CSSProperties, ReactNode } from "react";
import "./RegMark.css";

// className é o gancho da seção: posicionamento no CSS e alvo do GSAP quando a marca entra animada
export default function RegMark({
  glyph = "+",
  shape = "circle",
  tone,
  size,
  id,
  className = "",
}: {
  glyph?: ReactNode;
  shape?: "circle" | "square" | "bare";
  tone?: "accent" | "solid";
  size?: string;
  id?: string;
  className?: string;
}) {
  return (
    <span
      className={`gfx-mark gfx-mark--${shape}${tone ? ` gfx-mark--${tone}` : ""} ${className}`}
      style={size ? ({ "--gfx-mark-size": size } as CSSProperties) : undefined}
      id={id}
      aria-hidden="true"
    >
      {glyph}
    </span>
  );
}
