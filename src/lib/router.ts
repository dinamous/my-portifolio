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
