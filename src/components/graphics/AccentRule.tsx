import type { CSSProperties } from "react";
import "./AccentRule.css";

// id/className são os ganchos da seção: scaleX pelo GSAP e margem no CSS local
export default function AccentRule({
  vertical = false,
  variant,
  length,
  thickness,
  id,
  className = "",
}: {
  vertical?: boolean;
  variant?: "full" | "dim" | "plain";
  length?: string;
  thickness?: string;
  id?: string;
  className?: string;
}) {
  const style = {
    ...(length && { "--gfx-rule-len": length }),
    ...(thickness && { "--gfx-rule-thick": thickness }),
  } as CSSProperties;

  return (
    <span
      className={`gfx-rule${vertical ? " gfx-rule--v" : ""}${variant ? ` gfx-rule--${variant}` : ""} ${className}`}
      style={length || thickness ? style : undefined}
      id={id}
      aria-hidden="true"
    ></span>
  );
}
