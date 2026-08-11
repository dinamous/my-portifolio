# NEXT26 Superlógica — novo projeto no portfólio

## Contexto

Novo item para a lista de projetos: a landing page do NEXT26, evento da
Superlógica para o mercado de moradia (React + Gatsby + design system
próprio), reunindo marcas como Superlógica, Gruvi e Imobi. Assets já
recebidos em `public/projects/next/`: `next-hero.png`, `next-full-page.png`,
`next.webm`.

O sistema de projetos já é data-driven (`projects.json` → `src/lib/projects.ts`
→ `Projects.tsx`/`ProjectDetail.tsx`). Adicionar um projeto normalmente é só
uma entrada no JSON. Este projeto tem uma particularidade: um vídeo de demo
que deve aparecer como bloco dedicado na ficha, não misturado no carrossel
de imagens (que já suporta vídeo, mas o usuário quer destaque próprio).

## Dados

Nova entrada em `projects.json`:

```json
{
  "titulo": "NEXT26 Superlógica",
  "img": "/projects/next/next-hero.png",
  "descricao": "Landing page do NEXT26, evento da Superlógica para o mercado de moradia, reunindo marcas como Superlógica, Gruvi e Imobi num festival de conteúdo sobre tecnologia para o setor.",
  "techs": ["React", "Gatsby", "GraphQL", "Design System"],
  "categoria": ["Front-End"],
  "actions": [{ "label": "Link", "link": "https://next.superlogica.com/" }],
  "video": "/projects/next/next.webm"
}
```

- `images` no card/galeria: `next-hero.png` (thumb principal) +
  `next-full-page.png` (segunda imagem do carrossel).
- Campo novo e opcional `video` — só este projeto usa; os demais seguem sem
  ele.
- `actions`: só o link ao vivo (`https://next.superlogica.com/`), sem repo.

## Mudanças de código

### `src/lib/projects.ts`

- `RawProject` ganha `video?: string`.
- `Project` ganha `video?: string`.
- `.map()` repassa `video: p.video` direto (sem transformação).

### `src/views/ProjectDetail/ProjectDetail.tsx`

Novo bloco "Demo", renderizado só quando `project.video` existe, posicionado
logo após `<ProjectGallery>` e antes do bloco de Tecnologias. Segue o mesmo
idioma visual do canhoto da galeria (`gallery__stub`: rótulo monospace
uppercase + `DashedLine`), com `CropMarks` no frame do vídeo. Entra na
cascata de reveal via `data-reveal`, igual aos outros blocos da ficha.

```
<section className="projectdetail__demo" data-reveal>
  <div className="projectdetail__demo-stub">
    <span>↠ Demo</span>
    <DashedLine className="projectdetail__demo-stub-edge" />
  </div>
  <div className="projectdetail__demo-frame">
    <CropMarks corners="all" x="8px" opacity={0.4} />
    <video
      className="projectdetail__demo-video"
      src={project.video}
      controls
      playsInline
      preload="metadata"
    />
  </div>
</section>
```

### `src/views/ProjectDetail/ProjectDetail.css`

Bloco `.projectdetail__demo*` novo, reaproveitando os tokens visuais já
usados na ficha: borda `1px solid rgba(244, 247, 245, 0.14)`, fundo
`#080a09`, eyebrow monospace uppercase igual ao `.gallery__stub`. Vídeo
contido em `max-width` (não full-bleed) com `aspect-ratio` fixo para não
pular layout durante o carregamento.

### `TECH_NPM` (mesma seção do `ProjectDetail.tsx`)

Adiciona `Gatsby: "gatsby"`. `React` já existe no mapa. `GraphQL` e
`Design System` ficam sem entrada — chips simples, sem tooltip do npm
(mesmo tratamento que "Figma"/"SQL" recebem hoje).

## Fora de escopo

- Suporte a vídeo dentro do carrossel da `ProjectGallery` já existe (não
  precisa de mudança lá) — só não é o caminho escolhido para este vídeo.
- Nenhuma mudança em `Projects.tsx`/`Projects.css`: a listagem e o filtro já
  funcionam via `categories`/`filterProjects`, sem código novo.

## Teste

- Rodar o dev server, abrir a lista de projetos, filtrar por "Frontend" e
  confirmar que o card do NEXT26 aparece com a thumb correta.
- Abrir a ficha do projeto: conferir carrossel (2 imagens), bloco Demo
  (vídeo com controles, aspect-ratio estável) e chips de tecnologia (React e
  Gatsby com tooltip do npm; GraphQL e Design System sem tooltip).
- Conferir responsividade do bloco Demo em mobile (`max-width: 640px`).
