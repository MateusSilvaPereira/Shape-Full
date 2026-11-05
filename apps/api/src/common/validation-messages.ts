import { BadRequestException } from "@nestjs/common";
import type { ValidationError } from "class-validator";

/** Rótulo em português de cada campo usado em algum DTO da aplicação. */
const FIELD_LABELS: Record<string, string> = {
  name: "Nome",
  email: "E-mail",
  phone: "Telefone",
  password: "Senha",
  currentPassword: "Senha atual",
  newPassword: "Nova senha",
  birthDate: "Data de nascimento",
  gender: "Gênero",
  heightCm: "Altura",
  goal: "Objetivo",
  planName: "Nome do plano",
  monthlyPrice: "Valor mensal",
  status: "Status",
  startDate: "Data de início",
  endDate: "Data de término",
  studentId: "Aluno",
  nutritionistId: "Nutricionista",
  role: "Função",
  muscleGroup: "Grupo muscular",
  instructions: "Instruções",
  videoUrl: "Link do vídeo",
  imageUrl: "Imagem",
  exerciseId: "Exercício",
  exerciseName: "Nome do exercício",
  sets: "Séries",
  reps: "Repetições",
  restSeconds: "Descanso",
  notes: "Observações",
  title: "Título",
  description: "Descrição",
  items: "Itens",
  meals: "Refeições",
  calories: "Calorias",
  time: "Horário",
  dailyWaterLiters: "Meta de água",
  dailyCalories: "Meta calórica",
  mealsPerDay: "Refeições por dia",
  restrictions: "Restrições",
  daysPerWeek: "Dias por semana",
  experienceLevel: "Nível de experiência",
  active: "Status",
  order: "Ordem",
  linkUrl: "Link",
  primaryColor: "Cor principal",
  weightKg: "Peso",
  bodyFatPct: "Percentual de gordura",
  waistCm: "Cintura",
  measuredAt: "Data da medição",
  message: "Mensagem",
  history: "Histórico",
  slug: "Identificador",
  token: "Código de redefinição",
};

function labelFor(property: string): string {
  return FIELD_LABELS[property] ?? "Um dos campos";
}

/** Converte os erros técnicos do class-validator numa lista legível em português. */
function collectMessages(errors: ValidationError[], seen = new Set<string>()): string[] {
  const messages: string[] = [];
  for (const error of errors) {
    if (error.constraints) {
      const label = labelFor(error.property);
      const firstConstraint = Object.keys(error.constraints)[0];
      const text = `${label}: ${friendlyConstraint(firstConstraint)}`;
      if (!seen.has(text)) {
        seen.add(text);
        messages.push(text);
      }
    }
    if (error.children?.length) {
      messages.push(...collectMessages(error.children, seen));
    }
  }
  return messages;
}

/**
 * Mapa fechado de regra técnica do class-validator -> frase em português.
 * Nunca repassamos a mensagem original (em inglês) do class-validator: se a
 * regra não estiver aqui, caímos sempre no texto genérico seguro no final.
 */
const CONSTRAINT_PHRASES: Record<string, string> = {
  isNotEmpty: "campo obrigatório",
  isDefined: "campo obrigatório",
  isEmail: "informe um e-mail válido",
  isUrl: "informe um link válido",
  isDateString: "informe uma data válida",
  isString: "formato inválido",
  isInt: "deve ser um número inteiro",
  isNumber: "deve ser um número",
  isNumberString: "deve ser um número",
  isBoolean: "valor deve ser verdadeiro ou falso",
  isArray: "formato inválido",
  isIn: "valor inválido para este campo",
  isEnum: "valor inválido para este campo",
  whitelistValidation: "campo não permitido",
  minLength: "muito curto",
  maxLength: "muito longo",
  min: "valor abaixo do mínimo permitido",
  max: "valor acima do máximo permitido",
  arrayMinSize: "selecione ao menos um item",
};

function friendlyConstraint(constraintKey: string): string {
  return CONSTRAINT_PHRASES[constraintKey] ?? "valor inválido";
}

export function validationExceptionFactory(errors: ValidationError[]): BadRequestException {
  const messages = collectMessages(errors);
  const summary =
    messages.length > 0
      ? messages.slice(0, 5).join(" · ")
      : "Verifique os dados informados e tente novamente.";
  return new BadRequestException(summary);
}
