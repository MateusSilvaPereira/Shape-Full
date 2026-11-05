/**
 * Importa exercícios com nome, grupo muscular e um diagrama anatômico
 * (silhueta do corpo com o músculo trabalhado destacado em vermelho/laranja)
 * do wger.de — banco de exercícios open-source, licença CC-BY-SA 4.0.
 *
 * O diagrama é composto localmente a partir dos SVGs de corpo/músculo do
 * próprio wger.de, garantindo um visual consistente em todos os exercícios
 * (ao contrário das fotos enviadas pela comunidade, que variam muito).
 *
 * Idempotente: reexecutar atualiza os exercícios já existentes (mesmo nome)
 * em vez de duplicá-los. Rode com `npm run db:seed:exercises`.
 */
import { PrismaClient } from "@prisma/client";
// O pacote `sharp` tem uma incompatibilidade de tipos entre sua declaração
// ESM e a resolução CommonJS usada pelo ts-node; em runtime é sempre uma
// função chamável, então usamos require + cast para contornar o conflito.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require("sharp") as (
  input: Buffer,
  options?: { density?: number },
) => { webp: (opts: { quality: number }) => { toBuffer: () => Promise<Buffer> } };
import {
  saveExerciseImageFile,
  deleteExerciseImageFile,
} from "../src/common/avatar-storage";

const prisma = new PrismaClient();

const WGER_LANGUAGE_PT = 7;
const WGER_BASE = "https://wger.de/api/v2/exerciseinfo/?limit=100&format=json";
const WGER_STATIC = "https://wger.de/static/images/muscles";

const MUSCLE_LABELS: Record<string, string> = {
  Triceps: "Tríceps",
  Chest: "Peito",
  Lats: "Costas",
  Biceps: "Bíceps",
  Calves: "Panturrilha",
  Abs: "Abdômen",
  Quads: "Quadríceps",
  Glutes: "Glúteos",
  Shoulders: "Ombros",
  Hamstrings: "Posterior de coxa",
};

const CATEGORY_LABELS: Record<string, string> = {
  Arms: "Braços",
  Abs: "Abdômen",
  Chest: "Peito",
  Shoulders: "Ombros",
  Back: "Costas",
  Calves: "Panturrilha",
  Legs: "Pernas",
  Cardio: "Cardio",
};

/** Músculo representativo para exercícios sem músculo primário cadastrado no wger. */
const CATEGORY_FALLBACK_MUSCLE_ID: Record<string, number | null> = {
  Arms: 1, // Biceps
  Abs: 6,
  Chest: 4,
  Shoulders: 2,
  Back: 12, // Lats
  Calves: 7,
  Legs: 10, // Quads
  Cardio: null,
};

interface WgerMuscle {
  id: number;
  name_en: string;
  is_front: boolean;
}

interface WgerTranslation {
  language: number;
  name: string;
  description: string;
}

interface WgerExercise {
  category: { name: string };
  muscles: WgerMuscle[];
  muscles_secondary: WgerMuscle[];
  translations: WgerTranslation[];
}

function htmlToText(html: string): string {
  return html
    .replace(/<li>/gi, "")
    .replace(/<\/li>/gi, " / ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .replace(/\s*\/\s*$/, "")
    .trim();
}

function muscleGroupFor(exercise: WgerExercise): string {
  const primary = exercise.muscles[0]?.name_en;
  if (primary && MUSCLE_LABELS[primary]) return MUSCLE_LABELS[primary];
  return CATEGORY_LABELS[exercise.category.name] ?? exercise.category.name;
}

async function fetchAllExercises(): Promise<WgerExercise[]> {
  const all: WgerExercise[] = [];
  let url: string | null = WGER_BASE;
  while (url) {
    const res = await fetch(url, {
      headers: { "User-Agent": "shapefull-exercise-import/1.0" },
    });
    if (!res.ok) throw new Error(`wger.de respondeu ${res.status} em ${url}`);
    const page = (await res.json()) as { results: WgerExercise[]; next: string | null };
    all.push(...page.results);
    url = page.next;
  }
  return all;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "shapefull-exercise-import/1.0" } });
  if (!res.ok) throw new Error(`Falha ao baixar ${url}: HTTP ${res.status}`);
  return res.text();
}

function extractSvgInner(svgText: string): string {
  const openEnd = svgText.indexOf(">", svgText.indexOf("<svg")) + 1;
  const closeStart = svgText.lastIndexOf("</svg>");
  return svgText.slice(openEnd, closeStart);
}

const SVG_NAMESPACES = [
  'xmlns="http://www.w3.org/2000/svg"',
  'xmlns:dc="http://purl.org/dc/elements/1.1/"',
  'xmlns:cc="http://creativecommons.org/ns#"',
  'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"',
  'xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"',
  'xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"',
].join(" ");

/** Baixa e armazena em cache os SVGs-base (corpo e músculos) do wger.de. */
class MuscleAssets {
  private cache = new Map<string, string>();

  async bodyInner(side: "front" | "back"): Promise<string> {
    return this.load(`${WGER_STATIC}/muscular_system_${side}.svg`);
  }

  async muscleInner(muscleId: number, variant: "main" | "secondary"): Promise<string> {
    return this.load(`${WGER_STATIC}/${variant}/muscle-${muscleId}.svg`);
  }

  private async load(url: string): Promise<string> {
    const cached = this.cache.get(url);
    if (cached !== undefined) return cached;
    const raw = await fetchText(url);
    const inner = extractSvgInner(raw);
    this.cache.set(url, inner);
    return inner;
  }
}

/** Monta o diagrama (corpo + músculos destacados) e retorna um PNG em buffer. */
async function renderMuscleDiagram(
  assets: MuscleAssets,
  exercise: WgerExercise,
): Promise<Buffer> {
  const primary = exercise.muscles[0];
  const fallbackMuscleId = CATEGORY_FALLBACK_MUSCLE_ID[exercise.category.name];
  const isFront = primary ? primary.is_front : true;
  const side: "front" | "back" = isFront ? "front" : "back";

  const overlays: string[] = [];

  if (primary) {
    for (const muscle of exercise.muscles) {
      if (muscle.is_front === isFront) {
        overlays.push(await assets.muscleInner(muscle.id, "main"));
      }
    }
    for (const muscle of exercise.muscles_secondary) {
      if (muscle.is_front === isFront) {
        overlays.push(await assets.muscleInner(muscle.id, "secondary"));
      }
    }
  } else if (fallbackMuscleId) {
    overlays.push(await assets.muscleInner(fallbackMuscleId, "main"));
  }

  const bodyInner = await assets.bodyInner(side);

  const svg = `<svg ${SVG_NAMESPACES} width="500" height="922" viewBox="0 0 200 369">
    <rect width="200" height="369" fill="#ffffff" />
    ${bodyInner}
    ${overlays.join("\n")}
  </svg>`;

  return sharp(Buffer.from(svg), { density: 300 }).webp({ quality: 88 }).toBuffer();
}

async function main() {
  console.log("Buscando exercícios do wger.de...");
  const all = await fetchAllExercises();

  const usable = all
    .map((ex) => ({
      exercise: ex,
      pt: ex.translations.find((t) => t.language === WGER_LANGUAGE_PT),
    }))
    .filter(
      (entry): entry is { exercise: WgerExercise; pt: WgerTranslation } =>
        !!entry.pt && entry.pt.name.trim().length > 0,
    );

  console.log(`${usable.length} exercícios com nome em português.`);

  const academies = await prisma.academy.findMany({ select: { id: true, name: true } });
  if (academies.length === 0) {
    console.log("Nenhuma academia cadastrada. Rode o seed principal primeiro.");
    return;
  }

  const assets = new MuscleAssets();

  for (const academy of academies) {
    console.log(`\n--- Academia: ${academy.name} ---`);
    let created = 0;
    let updated = 0;
    let failed = 0;

    for (const { exercise, pt } of usable) {
      const name = pt.name.trim();

      try {
        const buffer = await renderMuscleDiagram(assets, exercise);
        const imageUrl = await saveExerciseImageFile(buffer);

        const existing = await prisma.exercise.findFirst({
          where: { academyId: academy.id, name },
        });

        if (existing) {
          deleteExerciseImageFile(existing.imageUrl);
          await prisma.exercise.update({
            where: { id: existing.id },
            data: {
              muscleGroup: muscleGroupFor(exercise),
              instructions: pt.description ? htmlToText(pt.description) : undefined,
              imageUrl,
            },
          });
          updated++;
        } else {
          await prisma.exercise.create({
            data: {
              academyId: academy.id,
              name,
              muscleGroup: muscleGroupFor(exercise),
              instructions: pt.description ? htmlToText(pt.description) : undefined,
              imageUrl,
            },
          });
          created++;
        }
        process.stdout.write(`  + ${name}\n`);
      } catch (err) {
        failed++;
        console.warn(`  ! falha ao importar "${name}":`, (err as Error).message);
      }
    }

    console.log(
      `Academia "${academy.name}": ${created} criados, ${updated} atualizados, ${failed} falharam.`,
    );
  }

  console.log(
    "\nImportação concluída. Diagramas compostos a partir de ilustrações do wger.de sob licença CC-BY-SA 4.0 (https://wger.de).",
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
