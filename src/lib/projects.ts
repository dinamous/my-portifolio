import rawProjects from "../../projects.json";
import { slugify } from "./slug";

export type ProjectAction = { label: string; link: string };

export type Project = {
  slug: string;
  title: string;
  description: string;
  tag: string;
  techs: string[];
  categories: string[];
  images: string[];
  actions: ProjectAction[];
};

type RawProject = {
  titulo: string;
  img: string;
  pasta?: string;
  descricao: string;
  techs: string[];
  categoria?: string[];
  actions?: ProjectAction[];
};

// toda imagem/vídeo dentro de src/assets/projects/<pasta>/ vira mídia da galeria
// automaticamente — soltar um arquivo novo na pasta já basta, sem tocar aqui ou
// no projects.json. eager + "?url": Vite copia o binário pro build e devolve a
// URL final, sem inlinar como base64 (isso só valeria pra arquivos < 4KB).
const mediaModules = import.meta.glob("../assets/projects/*/*.{png,jpg,jpeg,webp,mp4,webm,mov}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

// ordem estável por nome de arquivo (a URL final do Vite leva um hash, então não
// serve de critério — ordena pelo path original antes de agrupar). thumb sempre
// leva o prefixo "a0-" (minúsculo) pra vir primeiro nessa ordenação.
const mediaByFolder = new Map<string, string[]>();
for (const [path, url] of Object.entries(mediaModules).sort(([a], [b]) => a.localeCompare(b))) {
  const folder = path.split("/").at(-2)!;
  if (!mediaByFolder.has(folder)) mediaByFolder.set(folder, []);
  mediaByFolder.get(folder)!.push(url);
}

// o campo `categoria` do JSON tem grafia inconsistente (Front-end / Front-End);
// normaliza pros rótulos usados no filtro. "Fullstack" não existe no dado — é
// derivado de o projeto ter as duas pontas.
const CATEGORY_LABEL: Record<string, string> = {
  "front-end": "Frontend",
  frontend: "Frontend",
  "back-end": "Backend",
  backend: "Backend",
  "ui/ux": "UI/UX",
  mobile: "Mobile",
};

export const PROJECT_FILTERS = ["Todos", "Fullstack", "Frontend", "Backend", "UI/UX"];

function categoriesOf(raw: string[] = []) {
  const list = Array.from(new Set(raw.map((c) => CATEGORY_LABEL[c.trim().toLowerCase()] ?? c)));
  if (list.includes("Frontend") && list.includes("Backend")) list.push("Fullstack");
  return list;
}

// dados reais (hoje projects.json na raiz); mesmo shape que vai alimentar o
// fetch do Sanity quando migrar pra lá — `images` já é array pra caber o
// carrossel mesmo com 1 imagem só por projeto hoje.
export const projects: Project[] = (rawProjects as RawProject[]).map((p) => ({
  slug: slugify(p.titulo),
  title: p.titulo,
  description: p.descricao,
  tag: p.techs.join(" / "),
  techs: p.techs,
  categories: categoriesOf(p.categoria),
  images: (p.pasta && mediaByFolder.get(p.pasta)) || [p.img],
  actions: p.actions ?? [],
}));

export function filterProjects(filter: string) {
  return filter === "Todos" ? projects : projects.filter((p) => p.categories.includes(filter));
}

export function getProjectBySlug(slug: string) {
  return projects.find((p) => p.slug === slug);
}
