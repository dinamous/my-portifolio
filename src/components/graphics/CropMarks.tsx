import type { CSSProperties } from "react";
import "./CropMarks.css";

const SETS = {
  diagonal: ["tl", "br"],
  all: ["tl", "tr", "br", "bl"],
  top: ["tl", "tr"],
  bottom: ["bl", "br"],
} as const;

// marcas de corte nos cantos de uma foto ou card. Distância, tamanho e opacidade
// viajam como custom props pra o conjunto sair de uma chamada só
export default function CropMarks({
  x = "10px",
  y = x,
  size,
  opacity,
  corners = "diagonal",
  hair = false,
}: {
  x?: string;
  y?: string;
  size?: string;
  opacity?: number;
  corners?: keyof typeof SETS;
  hair?: boolean;
}) {
  const style = {
    "--gfx-crop-x": x,
    "--gfx-crop-y": y,
    ...(size && { "--gfx-crop-size": size }),
    ...(opacity !== undefined && { "--gfx-crop-opacity": opacity }),
  } as CSSProperties;

  return (
    <>
      {SETS[corners].map((corner) => (
        <span
          className={`gfx-crop gfx-crop--${corner}${hair ? " gfx-crop--hair" : ""}`}
          style={style}
          key={corner}
          aria-hidden="true"
        ></span>
      ))}
    </>
  );
}
