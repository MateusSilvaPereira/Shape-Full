import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Role } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { CreateMealPlanDto } from "./dto/create-meal-plan.dto";
import { UpdateMealPlanDto } from "./dto/update-meal-plan.dto";

const AUTHOR_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ACADEMY_ADMIN, Role.NUTRITIONIST];

const mealPlanInclude = {
  meals: { orderBy: { order: "asc" as const } },
  student: {
    select: {
      id: true,
      user: { select: { id: true, name: true } },
    },
  },
  nutritionist: {
    select: { id: true, name: true, role: true },
  },
};

@Injectable()
export class NutritionService {
  constructor(private prisma: PrismaService) {}

  private async assertStudentInAcademy(academyId: string, studentId: string) {
    const student = await this.prisma.studentProfile.findFirst({
      where: { id: studentId, academyId },
    });
    if (!student)
      throw new BadRequestException("Aluno não encontrado nesta academia");
  }

  private async assertNutritionistInAcademy(
    academyId: string,
    nutritionistId: string,
  ) {
    const nutritionist = await this.prisma.user.findFirst({
      where: { id: nutritionistId, academyId, role: { in: AUTHOR_ROLES } },
    });
    if (!nutritionist)
      throw new BadRequestException(
        "Profissional responsável não encontrado nesta academia",
      );
  }

  async list(academyId: string, search?: string) {
    return this.prisma.mealPlan.findMany({
      where: {
        academyId,
        ...(search
          ? { title: { contains: search, mode: "insensitive" as const } }
          : {}),
      },
      include: mealPlanInclude,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async findOne(academyId: string, id: string) {
    const plan = await this.prisma.mealPlan.findFirst({
      where: { id, academyId },
      include: mealPlanInclude,
    });
    if (!plan) throw new NotFoundException("Plano alimentar não encontrado");
    return plan;
  }

  async create(academyId: string, dto: CreateMealPlanDto) {
    if (dto.studentId) {
      await this.assertStudentInAcademy(academyId, dto.studentId);
    }
    if (dto.nutritionistId) {
      await this.assertNutritionistInAcademy(academyId, dto.nutritionistId);
    }
    return this.prisma.mealPlan.create({
      data: {
        academyId,
        title: dto.title,
        description: dto.description,
        goal: dto.goal,
        status: dto.status,
        dailyWaterLiters: dto.dailyWaterLiters,
        studentId: dto.studentId,
        nutritionistId: dto.nutritionistId,
        meals: {
          create: dto.meals.map((meal, index) => ({
            name: meal.name,
            time: meal.time,
            description: meal.description,
            calories: meal.calories,
            order: meal.order ?? index,
          })),
        },
      },
      include: mealPlanInclude,
    });
  }

  async update(academyId: string, id: string, dto: UpdateMealPlanDto) {
    await this.findOne(academyId, id);
    if (dto.studentId) {
      await this.assertStudentInAcademy(academyId, dto.studentId);
    }
    if (dto.nutritionistId) {
      await this.assertNutritionistInAcademy(academyId, dto.nutritionistId);
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.meals) {
        await tx.meal.deleteMany({ where: { mealPlanId: id } });
      }
      return tx.mealPlan.update({
        where: { id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
          ...(dto.goal !== undefined ? { goal: dto.goal } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.dailyWaterLiters !== undefined
            ? { dailyWaterLiters: dto.dailyWaterLiters }
            : {}),
          ...(dto.studentId !== undefined
            ? { studentId: dto.studentId || null }
            : {}),
          ...(dto.nutritionistId !== undefined
            ? { nutritionistId: dto.nutritionistId || null }
            : {}),
          ...(dto.meals
            ? {
                meals: {
                  create: dto.meals.map((meal, index) => ({
                    name: meal.name,
                    time: meal.time,
                    description: meal.description,
                    calories: meal.calories,
                    order: meal.order ?? index,
                  })),
                },
              }
            : {}),
        },
        include: mealPlanInclude,
      });
    });
  }

  async remove(academyId: string, id: string) {
    await this.findOne(academyId, id);
    await this.prisma.mealPlan.delete({ where: { id } });
    return { success: true };
  }
}
