import type { CSSProperties, ReactNode } from "react";
import "./Stamp.css";

export default function Stamp({
  children,
  variant,
  tilt,
  className = "",
}: {
  children: ReactNode;
  variant?: "accent" | "solid" | "bare";
  /** inclinação em graus; 0 deixa reto */
  tilt?: number;
  className?: string;
}) {
  return (
    <span
      className={`gfx-stamp${variant ? ` gfx-stamp--${variant}` : ""} ${className}`}
      style={tilt !== undefined ? ({ "--gfx-stamp-tilt": `${tilt}deg` } as CSSProperties) : undefined}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}
