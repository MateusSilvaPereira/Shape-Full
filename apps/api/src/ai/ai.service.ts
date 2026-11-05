import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { GenerateTrainingProgramDto } from "./dto/generate-training-program.dto";
import { GenerateMealPlanDto } from "./dto/generate-meal-plan.dto";
import { ChatMessageDto } from "./dto/ai-chat.dto";

const MEAL_PLAN_GOAL_OPTIONS = [
  "Emagrecimento",
  "Hipertrofia",
  "Manutenção",
  "Performance esportiva",
  "Reeducação alimentar",
];

// Usamos a variante "flash-lite": a cota diária gratuita do "flash" padrão
// é de apenas 20 requisições/dia (se esgota rápido com uso real), enquanto a
// "flash-lite" tem uma cota muito mais alta, suficiente para o dia a dia de
// uma academia, mantendo boa qualidade de resposta e suporte a saída em JSON.
const GEMINI_MODEL = "gemini-3.1-flash-lite";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface GeneratedTrainingItem {
  exerciseName: string;
  sets: number;
  reps: string;
  restSeconds?: number;
  notes?: string;
}

export interface GeneratedTrainingProgram {
  title: string;
  description?: string;
  goal?: string;
  items: GeneratedTrainingItem[];
}

export interface GeneratedMeal {
  name: string;
  time?: string;
  description: string;
  calories?: number;
}

export interface GeneratedMealPlan {
  title: string;
  description?: string;
  goal?: string;
  dailyWaterLiters?: number;
  meals: GeneratedMeal[];
}

const TRAINING_PROGRAM_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    goal: { type: "string" },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          exerciseName: { type: "string" },
          sets: { type: "integer" },
          reps: { type: "string" },
          restSeconds: { type: "integer" },
          notes: { type: "string" },
        },
        required: ["exerciseName", "sets", "reps"],
      },
    },
  },
  required: ["title", "items"],
};

const MEAL_PLAN_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    goal: { type: "string", enum: MEAL_PLAN_GOAL_OPTIONS },
    dailyWaterLiters: { type: "number" },
    meals: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          time: { type: "string" },
          description: { type: "string" },
          calories: { type: "integer" },
        },
        required: ["name", "description"],
      },
    },
  },
  required: ["title", "meals"],
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private prisma: PrismaService) {}

  private get apiKey(): string {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new ServiceUnavailableException(
        "O assistente de IA ainda não foi configurado nesta instalação.",
      );
    }
    return key;
  }

  private async callGemini(
    contents: { role?: string; parts: { text: string }[] }[],
    responseSchema?: object,
  ): Promise<string> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const res = await fetch(`${GEMINI_URL}?key=${this.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: responseSchema
            ? { responseMimeType: "application/json", responseSchema }
            : undefined,
        }),
      });

      if (res.status === 429) {
        const body = await res.text();
        this.logger.warn(`Gemini 429: ${body.slice(0, 500)}`);
        const isDailyQuota = /per.?day|RESOURCE_EXHAUSTED/i.test(body);
        throw new HttpException(
          isDailyQuota
            ? "O assistente de IA atingiu o limite de uso gratuito de hoje. Tente novamente amanhã."
            : "O assistente de IA está com muitas solicitações no momento. Tente novamente em instantes.",
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // O modelo às vezes fica temporariamente sobrecarregado (503); vale a
      // pena tentar de novo algumas vezes antes de desistir.
      if (res.status === 503 && attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }

      if (!res.ok) {
        const body = await res.text();
        this.logger.error(`Falha ao chamar o Gemini (HTTP ${res.status}): ${body.slice(0, 500)}`);
        throw new ServiceUnavailableException(
          "Não foi possível falar com o assistente de IA agora. Tente novamente em instantes.",
        );
      }

      const data = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] } }[];
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new ServiceUnavailableException("A IA não retornou uma resposta válida.");
      }
      return text;
    }
    throw new ServiceUnavailableException("O assistente de IA está indisponível no momento.");
  }

  private async callGeminiJson<T>(prompt: string, schema: object): Promise<T> {
    const text = await this.callGemini([{ parts: [{ text: prompt }] }], schema);
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new ServiceUnavailableException("A IA retornou um conteúdo em formato inesperado.");
    }
  }

  async generateTrainingProgram(academyId: string, dto: GenerateTrainingProgramDto) {
    if (dto.studentId) {
      const student = await this.prisma.studentProfile.findFirst({
        where: { id: dto.studentId, academyId },
      });
      if (!student) throw new BadRequestException("Aluno não encontrado nesta academia");
    }

    const library = await this.prisma.exercise.findMany({
      where: { academyId },
      select: { id: true, name: true, muscleGroup: true },
      take: 600,
    });

    const catalogLines = library.map((ex) => `- ${ex.name} (${ex.muscleGroup})`).join("\n");

    const prompt = `Você é um personal trainer experiente. Monte um programa de treino em português do Brasil.

Objetivo do aluno: ${dto.goal}
Dias de treino por semana: ${dto.daysPerWeek}
Nível de experiência: ${dto.experienceLevel ?? "não informado"}
Observações adicionais: ${dto.notes ?? "nenhuma"}

Sempre que possível, escolha exercícios EXATAMENTE como escritos nesta biblioteca disponível na academia (copie o nome com a grafia idêntica). Só sugira um exercício fora da lista se realmente não houver nenhuma opção adequada nela:
${catalogLines || "(biblioteca vazia)"}

Monte entre 6 e 10 exercícios, com séries, repetições e descanso em segundos adequados ao objetivo e nível informado. Responda apenas com o JSON pedido, sem markdown.`;

    const result = await this.callGeminiJson<GeneratedTrainingProgram>(
      prompt,
      TRAINING_PROGRAM_SCHEMA,
    );

    const libraryByName = new Map(library.map((ex) => [ex.name.trim().toLowerCase(), ex]));

    return {
      title: result.title,
      description: result.description,
      goal: result.goal ?? dto.goal,
      items: result.items.map((item) => {
        const match = libraryByName.get(item.exerciseName.trim().toLowerCase());
        return {
          exerciseId: match?.id,
          exerciseName: match?.name ?? item.exerciseName,
          sets: item.sets,
          reps: item.reps,
          restSeconds: item.restSeconds,
          notes: item.notes,
        };
      }),
    };
  }

  async generateMealPlan(academyId: string, dto: GenerateMealPlanDto) {
    if (dto.studentId) {
      const student = await this.prisma.studentProfile.findFirst({
        where: { id: dto.studentId, academyId },
      });
      if (!student) throw new BadRequestException("Aluno não encontrado nesta academia");
    }

    const prompt = `Você é um nutricionista experiente. Monte um plano alimentar em português do Brasil.

Objetivo do aluno: ${dto.goal}
Meta calórica diária: ${dto.dailyCalories ? `${dto.dailyCalories} kcal` : "não informada, estime de forma saudável"}
Número de refeições por dia: ${dto.mealsPerDay ?? 5}
Restrições/alergias/preferências: ${dto.restrictions ?? "nenhuma"}

O campo "goal" da resposta deve ser EXATAMENTE uma destas opções (copie a grafia idêntica): ${MEAL_PLAN_GOAL_OPTIONS.join(", ")}.

Monte as refeições do dia com horário sugerido, descrição objetiva dos alimentos/porções e estimativa de calorias por refeição. Sugira também uma meta de água diária em litros. Responda apenas com o JSON pedido, sem markdown.`;

    const result = await this.callGeminiJson<GeneratedMealPlan>(prompt, MEAL_PLAN_SCHEMA);

    return {
      title: result.title,
      description: result.description,
      goal: result.goal ?? dto.goal,
      dailyWaterLiters: result.dailyWaterLiters,
      meals: result.meals,
    };
  }

  async chat(
    academyId: string,
    userId: string,
    message: string,
    history: ChatMessageDto[] = [],
  ): Promise<string> {
    const [academy, user] = await Promise.all([
      this.prisma.academy.findUnique({ where: { id: academyId }, select: { name: true } }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { name: true, role: true } }),
    ]);

    const academyName = academy?.name ?? "a academia";
    const firstName = user?.name?.split(" ")[0];
    const roleContext =
      user?.role === "STUDENT"
        ? "Você está falando com um aluno da academia."
        : "Você está falando com um membro da equipe (staff) da academia.";

    const systemPreamble = {
      role: "user",
      parts: [
        {
          text:
            `A partir de agora você é o assistente virtual oficial da ${academyName}, incorporado dentro do ` +
            `sistema de gestão dessa academia. Fale em primeira pessoa como parte da equipe da ${academyName} ` +
            `(ex: "aqui na ${academyName} recomendamos...", nunca diga que é um modelo de IA genérico ou mencione o Gemini/Google). ` +
            `${roleContext}${firstName ? ` O nome da pessoa é ${firstName} — pode usar o nome dela com naturalidade, sem exagerar.` : ""} ` +
            "Responda sempre em português do Brasil, em tom caloroso, motivador e direto ao ponto (evite textos longos " +
            "a menos que a pergunta realmente exija detalhe). Ajude com dúvidas sobre treino, nutrição e uso do sistema. " +
            "Para qualquer sintoma, lesão ou condição de saúde, oriente a pessoa a procurar um profissional " +
            "(médico, nutricionista ou educador físico da própria academia) em vez de dar diagnósticos ou prescrições médicas.",
        },
      ],
    };
    const modelAck = {
      role: "model",
      parts: [
        {
          text: `Combinado! Sou o assistente da ${academyName} e vou responder como parte da equipe, de forma direta e motivadora.`,
        },
      ],
    };

    const contents = [
      systemPreamble,
      modelAck,
      ...history.map((h) => ({ role: h.role, parts: [{ text: h.text }] })),
      { role: "user", parts: [{ text: message }] },
    ];

    return this.callGemini(contents);
  }
}
