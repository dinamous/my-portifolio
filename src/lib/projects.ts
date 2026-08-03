import rawProjects from "../../projects.json";

export type ProjectAction = { label: string; link: string };

export type Project = {
  slug: string;
  title: string;
  description: string;
  tag: string;
  techs: string[];
  images: string[];
  actions: ProjectAction[];
};

type RawProject = {
  titulo: string;
  img: string;
  descricao: string;
  techs: string[];
  actions?: ProjectAction[];
};

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// dados reais (hoje projects.json na raiz); mesmo shape que vai alimentar o
// fetch do Sanity ([sanity.ts](./sanity.ts)) quando migrar pra lá — `images`
// já é array pra caber o carrossel mesmo com 1 imagem só por projeto hoje.
export const projects: Project[] = (rawProjects as RawProject[]).map((p) => ({
  slug: slugify(p.titulo),
  title: p.titulo,
  description: p.descricao,
  tag: p.techs.join(" / "),
  techs: p.techs,
  images: [p.img],
  actions: p.actions ?? [],
}));

export function getProjectBySlug(slug: string) {
  return projects.find((p) => p.slug === slug);
}
