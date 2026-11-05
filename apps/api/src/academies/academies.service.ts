import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { deleteLogoFile, saveLogoFile } from "../common/avatar-storage";
import { UpdateAcademyDto } from "./dto/update-academy.dto";

const academySelect = {
  id: true,
  name: true,
  slug: true,
  email: true,
  phone: true,
  logoUrl: true,
  primaryColor: true,
  status: true,
  createdAt: true,
};

@Injectable()
export class AcademiesService {
  constructor(private prisma: PrismaService) {}

  async findBySlug(slug: string) {
    const academy = await this.prisma.academy.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        primaryColor: true,
        status: true,
      },
    });
    if (!academy) throw new NotFoundException("Academia não encontrada");
    return academy;
  }

  async findMine(academyId: string | null) {
    if (!academyId)
      throw new ForbiddenException("Usuário não está vinculado a uma academia");
    const academy = await this.prisma.academy.findUnique({
      where: { id: academyId },
      select: academySelect,
    });
    if (!academy) throw new NotFoundException("Academia não encontrada");
    return academy;
  }

  async updateMine(academyId: string | null, dto: UpdateAcademyDto) {
    if (!academyId)
      throw new ForbiddenException("Usuário não está vinculado a uma academia");
    return this.prisma.academy.update({
      where: { id: academyId },
      data: dto,
      select: academySelect,
    });
  }

  async updateLogo(academyId: string | null, buffer: Buffer) {
    if (!academyId)
      throw new ForbiddenException("Usuário não está vinculado a uma academia");
    const academy = await this.prisma.academy.findUniqueOrThrow({
      where: { id: academyId },
    });
    const logoUrl = await saveLogoFile(buffer);
    deleteLogoFile(academy.logoUrl);
    return this.prisma.academy.update({
      where: { id: academyId },
      data: { logoUrl },
      select: academySelect,
    });
  }
}
