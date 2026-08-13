import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import rawProjects from "./projects.json";
import { slugify } from "./src/lib/slug";

const SITE = "https://dinamousdev.com.br";

// crawler sem JS (LinkedIn, WhatsApp, Slack, Bing) só lê o HTML servido, e o app
// é 100% client-side. O build escreve um .html por projeto com title/description/OG
// próprios — mesmo bundle e mesmo #root, só o <head> muda. Sem isso, todo link de
// projeto compartilhado mostrava o card genérico da home.
function seoPlugin(): Plugin {
  let dist = "dist";
  return {
    name: "seo-static-pages",
    apply: "build",
    configResolved(config) {
      dist = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const html = readFileSync(resolve(dist, "index.html"), "utf8");
      const urls = [`${SITE}/`];

      mkdirSync(resolve(dist, "projetos"), { recursive: true });
      for (const p of rawProjects as { titulo: string; descricao: string; img?: string }[]) {
        const slug = slugify(p.titulo);
        const url = `${SITE}/projetos/${slug}`;
        const title = `${p.titulo} — Matheus Simões`;
        // capa 1200x630 gerada por `npm run media` (a mídia do projeto em si vive em
        // src/assets e sai hasheada do build, então não serve de og:image direto).
        const cover = `/og/${slug}.jpg`;
        const image = SITE + (existsSync(resolve(dist, `.${cover}`)) ? cover : "/og/home.jpg");
        const meta: Record<string, string> = {
          description: p.descricao,
          "og:title": title,
          "og:description": p.descricao,
          "og:url": url,
          "og:image": image,
          "twitter:title": title,
          "twitter:description": p.descricao,
          "twitter:image": image,
        };

        const page = html
          .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
          .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${url}"`)
          // \s+ e não " ": no index.html as meta longas quebram linha entre os
          // atributos. A tag reescrita sai numa linha só e o `/>` original fecha ela.
          .replace(
            /<meta\s+(name|property)="([^"]+)"\s+content="[^"]*"/g,
            (whole: string, attr: string, key: string) =>
              meta[key] ? `<meta ${attr}="${key}" content="${esc(meta[key])}"` : whole,
          );

        writeFileSync(resolve(dist, "projetos", `${slug}.html`), page);
        urls.push(url);
      }

      writeFileSync(
        resolve(dist, "sitemap.xml"),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map((u) => `  <url><loc>${u}</loc></url>`)
          .join("\n")}\n</urlset>\n`,
      );
    },
  };
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seoPlugin()],
});
