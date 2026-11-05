import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { CreateProgressDto } from "./dto/create-progress.dto";
import { UpdateProgressDto } from "./dto/update-progress.dto";

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  private async assertStudentInAcademy(academyId: string, studentId: string) {
    const student = await this.prisma.studentProfile.findFirst({
      where: { id: studentId, academyId },
    });
    if (!student)
      throw new BadRequestException("Aluno não encontrado nesta academia");
  }

  async listByStudent(academyId: string, studentId: string) {
    await this.assertStudentInAcademy(academyId, studentId);
    return this.prisma.progressEntry.findMany({
      where: { academyId, studentId },
      orderBy: { measuredAt: "asc" },
    });
  }

  async findOne(academyId: string, id: string) {
    const entry = await this.prisma.progressEntry.findFirst({
      where: { id, academyId },
    });
    if (!entry) throw new NotFoundException("Registro de evolução não encontrado");
    return entry;
  }

  async create(academyId: string, dto: CreateProgressDto) {
    await this.assertStudentInAcademy(academyId, dto.studentId);
    return this.prisma.progressEntry.create({
      data: {
        academyId,
        studentId: dto.studentId,
        weightKg: dto.weightKg,
        bodyFatPct: dto.bodyFatPct,
        waistCm: dto.waistCm,
        notes: dto.notes,
        measuredAt: dto.measuredAt ? new Date(dto.measuredAt) : undefined,
      },
    });
  }

  async update(academyId: string, id: string, dto: UpdateProgressDto) {
    await this.findOne(academyId, id);
    return this.prisma.progressEntry.update({
      where: { id },
      data: {
        ...(dto.weightKg !== undefined ? { weightKg: dto.weightKg } : {}),
        ...(dto.bodyFatPct !== undefined ? { bodyFatPct: dto.bodyFatPct } : {}),
        ...(dto.waistCm !== undefined ? { waistCm: dto.waistCm } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.measuredAt !== undefined
          ? { measuredAt: new Date(dto.measuredAt) }
          : {}),
      },
    });
  }

  async remove(academyId: string, id: string) {
    await this.findOne(academyId, id);
    await this.prisma.progressEntry.delete({ where: { id } });
    return { success: true };
  }
}
