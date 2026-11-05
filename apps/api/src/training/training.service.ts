import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { CreateTrainingProgramDto } from "./dto/create-training-program.dto";
import { UpdateTrainingProgramDto } from "./dto/update-training-program.dto";

const programInclude = {
  items: {
    orderBy: { order: "asc" as const },
    include: {
      exercise: {
        select: {
          id: true,
          imageUrl: true,
          videoUrl: true,
          instructions: true,
          muscleGroup: true,
        },
      },
    },
  },
  student: {
    select: { id: true, user: { select: { id: true, name: true } } },
  },
  createdBy: { select: { id: true, name: true } },
};

@Injectable()
export class TrainingService {
  constructor(private prisma: PrismaService) {}

  async listMine(academyId: string, userId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (!student || student.academyId !== academyId) return [];
    return this.prisma.trainingProgram.findMany({
      where: { academyId, studentId: student.id, active: true },
      include: programInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  private async assertStudentInAcademy(academyId: string, studentId: string) {
    const student = await this.prisma.studentProfile.findFirst({
      where: { id: studentId, academyId },
    });
    if (!student)
      throw new BadRequestException("Aluno não encontrado nesta academia");
  }

  list(academyId: string, search?: string) {
    return this.prisma.trainingProgram.findMany({
      where: {
        academyId,
        ...(search
          ? { title: { contains: search, mode: "insensitive" as const } }
          : {}),
      },
      include: programInclude,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async findOne(academyId: string, id: string) {
    const program = await this.prisma.trainingProgram.findFirst({
      where: { id, academyId },
      include: programInclude,
    });
    if (!program) throw new NotFoundException("Programa de treino não encontrado");
    return program;
  }

  async create(
    academyId: string,
    createdById: string,
    dto: CreateTrainingProgramDto,
  ) {
    if (dto.studentId) {
      await this.assertStudentInAcademy(academyId, dto.studentId);
    }
    return this.prisma.trainingProgram.create({
      data: {
        academyId,
        createdById,
        title: dto.title,
        description: dto.description,
        goal: dto.goal,
        active: dto.active ?? true,
        studentId: dto.studentId,
        items: {
          create: dto.items.map((item, index) => ({
            exerciseId: item.exerciseId,
            exerciseName: item.exerciseName,
            sets: item.sets,
            reps: item.reps,
            restSeconds: item.restSeconds,
            notes: item.notes,
            order: item.order ?? index,
          })),
        },
      },
      include: programInclude,
    });
  }

  async update(academyId: string, id: string, dto: UpdateTrainingProgramDto) {
    await this.findOne(academyId, id);
    if (dto.studentId) {
      await this.assertStudentInAcademy(academyId, dto.studentId);
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.items) {
        await tx.trainingItem.deleteMany({ where: { programId: id } });
      }
      return tx.trainingProgram.update({
        where: { id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
          ...(dto.goal !== undefined ? { goal: dto.goal } : {}),
          ...(dto.active !== undefined ? { active: dto.active } : {}),
          ...(dto.studentId !== undefined
            ? { studentId: dto.studentId || null }
            : {}),
          ...(dto.items
            ? {
                items: {
                  create: dto.items.map((item, index) => ({
                    exerciseId: item.exerciseId,
                    exerciseName: item.exerciseName,
                    sets: item.sets,
                    reps: item.reps,
                    restSeconds: item.restSeconds,
                    notes: item.notes,
                    order: item.order ?? index,
                  })),
                },
              }
            : {}),
        },
        include: programInclude,
      });
    });
  }

  async remove(academyId: string, id: string) {
    await this.findOne(academyId, id);
    await this.prisma.trainingProgram.delete({ where: { id } });
    return { success: true };
  }
}
