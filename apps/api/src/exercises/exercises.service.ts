import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import {
  deleteExerciseImageFile,
  saveExerciseImageFile,
} from "../common/avatar-storage";
import { CreateExerciseDto } from "./dto/create-exercise.dto";
import { UpdateExerciseDto } from "./dto/update-exercise.dto";

@Injectable()
export class ExercisesService {
  constructor(private prisma: PrismaService) {}

  list(academyId: string, search?: string) {
    return this.prisma.exercise.findMany({
      where: {
        academyId,
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { muscleGroup: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 600,
    });
  }

  async findOne(academyId: string, id: string) {
    const exercise = await this.prisma.exercise.findFirst({
      where: { id, academyId },
    });
    if (!exercise) throw new NotFoundException("Exercício não encontrado");
    return exercise;
  }

  create(academyId: string, dto: CreateExerciseDto) {
    return this.prisma.exercise.create({ data: { academyId, ...dto } });
  }

  async update(academyId: string, id: string, dto: UpdateExerciseDto) {
    await this.findOne(academyId, id);
    return this.prisma.exercise.update({ where: { id }, data: dto });
  }

  async updateImage(academyId: string, id: string, buffer: Buffer) {
    const exercise = await this.findOne(academyId, id);
    const imageUrl = await saveExerciseImageFile(buffer);
    deleteExerciseImageFile(exercise.imageUrl);
    return this.prisma.exercise.update({ where: { id }, data: { imageUrl } });
  }

  async remove(academyId: string, id: string) {
    const exercise = await this.findOne(academyId, id);
    await this.prisma.exercise.delete({ where: { id } });
    deleteExerciseImageFile(exercise.imageUrl);
    return { success: true };
  }
}
