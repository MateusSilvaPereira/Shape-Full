import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { CreateMembershipDto } from "./dto/create-membership.dto";
import { UpdateMembershipDto } from "./dto/update-membership.dto";

const membershipInclude = {
  student: {
    select: { id: true, user: { select: { id: true, name: true, email: true } } },
  },
};

@Injectable()
export class MembershipsService {
  constructor(private prisma: PrismaService) {}

  private async assertStudentInAcademy(academyId: string, studentId: string) {
    const student = await this.prisma.studentProfile.findFirst({
      where: { id: studentId, academyId },
    });
    if (!student)
      throw new BadRequestException("Aluno não encontrado nesta academia");
  }

  list(academyId: string, studentId?: string, status?: string) {
    return this.prisma.membership.findMany({
      where: {
        academyId,
        ...(studentId ? { studentId } : {}),
        ...(status ? { status: status as never } : {}),
      },
      include: membershipInclude,
      orderBy: { startDate: "desc" },
      take: 200,
    });
  }

  async findOne(academyId: string, id: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { id, academyId },
      include: membershipInclude,
    });
    if (!membership) throw new NotFoundException("Matrícula não encontrada");
    return membership;
  }

  async create(academyId: string, dto: CreateMembershipDto) {
    await this.assertStudentInAcademy(academyId, dto.studentId);
    return this.prisma.membership.create({
      data: {
        academyId,
        studentId: dto.studentId,
        planName: dto.planName,
        monthlyPrice: dto.monthlyPrice,
        status: (dto.status as never) ?? undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: membershipInclude,
    });
  }

  async update(academyId: string, id: string, dto: UpdateMembershipDto) {
    await this.findOne(academyId, id);
    return this.prisma.membership.update({
      where: { id },
      data: {
        ...(dto.planName !== undefined ? { planName: dto.planName } : {}),
        ...(dto.monthlyPrice !== undefined
          ? { monthlyPrice: dto.monthlyPrice }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status as never } : {}),
        ...(dto.startDate !== undefined
          ? { startDate: new Date(dto.startDate) }
          : {}),
        ...(dto.endDate !== undefined
          ? { endDate: dto.endDate ? new Date(dto.endDate) : null }
          : {}),
      },
      include: membershipInclude,
    });
  }

  async remove(academyId: string, id: string) {
    await this.findOne(academyId, id);
    await this.prisma.membership.delete({ where: { id } });
    return { success: true };
  }
}
