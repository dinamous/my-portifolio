// usado no runtime (projects.ts) e no build (vite.config.ts, sitemap + páginas
// estáticas por projeto) — as duas pontas precisam gerar a mesma URL.
export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
