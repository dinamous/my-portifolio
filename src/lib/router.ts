// navegação client-side mínima pro overlay de projeto (History API nativa —
// não precisa de react-router só pra uma rota) — cada projeto fica acessível
// em /projetos/:slug, compartilhável e recarregável direto.
const BASE = "/projetos/";

export function projectPath(slug: string) {
  return `${BASE}${slug}`;
}

export function getSlugFromLocation(): string | null {
  const { pathname } = window.location;
  if (!pathname.startsWith(BASE)) return null;
  return pathname.slice(BASE.length).replace(/\/$/, "") || null;
}

export function pushProjectUrl(slug: string) {
  history.pushState({ slug }, "", projectPath(slug));
}

export function popProjectUrl() {
  history.pushState({}, "", "/");
}

const SITE = "https://dinamousdev.com.br";
// espelham o <head> de index.html (fonte pro crawler sem JS); aqui servem só pra
// restaurar o estado da home quando o overlay fecha sem recarregar a página.
const HOME_TITLE = "Matheus Simões, Motion Frontend";
const HOME_DESCRIPTION =
  "Matheus Simões — desenvolvedor frontend especializado em interfaces com motion design. Portfólio de projetos com GSAP, React e animação de interface.";

// o Googlebot indexa o DOM já renderizado, então trocar title/description/canonical
// na abertura do overlay é o que faz /projetos/:slug valer como página própria numa
// navegação client-side (no load direto o HTML estático do build já vem certo).
export function applyProjectMeta(project: { slug: string; title: string; description: string } | null) {
  const title = project ? `${project.title} — Matheus Simões` : HOME_TITLE;
  const description = project ? project.description : HOME_DESCRIPTION;
  const url = project ? SITE + projectPath(project.slug) : `${SITE}/`;

  document.title = title;
  for (const [selector, value] of [
    ['meta[name="description"]', description],
    ['meta[property="og:title"]', title],
    ['meta[property="og:description"]', description],
    ['meta[property="og:url"]', url],
    ['meta[name="twitter:title"]', title],
    ['meta[name="twitter:description"]', description],
  ] as const) {
    document.querySelector(selector)?.setAttribute("content", value);
  }
  document.querySelector('link[rel="canonical"]')?.setAttribute("href", url);
}
