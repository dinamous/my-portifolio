// Otimiza a mídia dos projetos in-place: PNG/JPG viram WebP redimensionado, os
// .webm são reencodados em VP9, e cada projeto ganha uma capa 1200x630 em
// public/og/<slug>.jpg (tamanho que LinkedIn/WhatsApp esperam no preview).
// Rodar depois de soltar arquivo novo em src/assets/projects/<pasta>/:
//   npm run media
// Idempotente: pula o que já está no formato/tamanho alvo.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { slugify } from "../src/lib/slug.ts";
import projects from "../projects.json" with { type: "json" };

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = join(root, "src/assets/projects");
const MAX_WIDTH = 1600; // maior que isso é screenshot em escala 2x, invisível na tela
const IMAGE_EXT = [".png", ".jpg", ".jpeg"];

const kb = (bytes) => `${Math.round(bytes / 1024)} kB`;

async function toWebp(file) {
  const out = file.replace(/\.(png|jpe?g)$/i, ".webp");
  const before = statSync(file).size;
  const image = sharp(file);
  const { width } = await image.metadata();

  await image
    .resize({ width: Math.min(width, MAX_WIDTH), withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(out + ".tmp");

  rmSync(file);
  renameSync(out + ".tmp", out);
  console.log(`  ${kb(before)} → ${kb(statSync(out).size)}  ${out.slice(root.length + 1)}`);
}

// VP8 2.4 Mbps de screen capture: VP9 no mesmo CRF entrega o mesmo frame por uma
// fração do bitrate. -row-mt + cpu-used 2 é o meio-termo entre tempo de encode e
// tamanho; áudio cai pra opus 64k (é narração/trilha, não material crítico).
function reencodeVideo(file) {
  const before = statSync(file).size;
  const tmp = file + ".tmp.webm";
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error", "-i", file,
    "-c:v", "libvpx-vp9", "-crf", "33", "-b:v", "0", "-row-mt", "1", "-deadline", "good", "-cpu-used", "2",
    "-c:a", "libopus", "-b:a", "64k",
    tmp,
  ]);
  const after = statSync(tmp).size;
  if (after >= before) {
    rmSync(tmp);
    console.log(`  já otimizado, mantido  ${file.slice(root.length + 1)}`);
    return;
  }
  rmSync(file);
  renameSync(tmp, file);
  console.log(`  ${kb(before)} → ${kb(after)}  ${file.slice(root.length + 1)}`);
}

function isVp9(file) {
  const codec = execFileSync("ffprobe", [
    "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=codec_name", "-of", "csv=p=0", file,
  ]).toString().trim();
  return codec === "vp9";
}

console.log("imagens:");
const folders = existsSync(ASSETS) ? readdirSync(ASSETS) : [];
for (const folder of folders) {
  for (const name of readdirSync(join(ASSETS, folder))) {
    const file = join(ASSETS, folder, name);
    if (IMAGE_EXT.includes(extname(name).toLowerCase())) await toWebp(file);
  }
}

console.log("vídeos:");
for (const folder of folders) {
  for (const name of readdirSync(join(ASSETS, folder))) {
    const file = join(ASSETS, folder, name);
    if (extname(name).toLowerCase() === ".webm" && !isVp9(file)) reencodeVideo(file);
  }
}

console.log("capas OG:");
const ogDir = join(root, "public/og");
mkdirSync(ogDir, { recursive: true });

// a home entra por um print à parte (src/assets/og/home.png): recorte pelo rodapé,
// que é onde o nome fecha a Hero — de cima só sobraria gradiente.
const homeShot = join(root, "src/assets/og/home.png");
if (existsSync(homeShot)) {
  const out = join(ogDir, "home.jpg");
  await sharp(homeShot).resize(1200, 630, { fit: "cover", position: "bottom" }).jpeg({ quality: 82 }).toFile(out);
  console.log(`  ${kb(statSync(out).size)}  og/home.jpg`);
}

// mesma resolução de mídia que src/lib/projects.ts faz em runtime: a pasta manda,
// o campo `img` (public/) é o fallback dos projetos antigos.
for (const p of projects) {
  const folder = p.pasta && join(ASSETS, p.pasta);
  const source =
    folder && existsSync(folder)
      ? readdirSync(folder)
          .sort()
          .map((n) => join(folder, n))
          .find((f) => [".webp", ".png", ".jpg", ".jpeg"].includes(extname(f).toLowerCase()))
      : p.img && existsSync(join(root, "public", p.img))
        ? join(root, "public", p.img)
        : null;

  if (!source) {
    console.log(`  sem imagem, pulado  ${p.titulo}`);
    continue;
  }
  const out = join(ogDir, `${slugify(p.titulo)}.jpg`);
  await sharp(source).resize(1200, 630, { fit: "cover", position: "top" }).jpeg({ quality: 82 }).toFile(out);
  console.log(`  ${kb(statSync(out).size)}  og/${slugify(p.titulo)}.jpg`);
}
