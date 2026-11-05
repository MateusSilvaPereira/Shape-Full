import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import * as bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { deleteAvatarFile, saveAvatarFile } from "../common/avatar-storage";
import { EmailService } from "../email/email.service";
import { welcomeEmailTemplate } from "../email/email-templates";
import { CreateProfessionalDto } from "./dto/create-professional.dto";
import { UpdateProfessionalDto } from "./dto/update-professional.dto";

const professionalSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  avatarUrl: true,
  createdAt: true,
};

function generateTempPassword() {
  return randomBytes(6).toString("base64url");
}

@Injectable()
export class ProfessionalsService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  list(academyId: string, search?: string) {
    return this.prisma.user.findMany({
      where: {
        academyId,
        role: { not: Role.STUDENT },
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { email: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      select: professionalSelect,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async findOne(academyId: string, id: string) {
    const professional = await this.prisma.user.findFirst({
      where: { id, academyId, role: { not: Role.STUDENT } },
      select: professionalSelect,
    });
    if (!professional)
      throw new NotFoundException("Profissional não encontrado");
    return professional;
  }

  async create(academyId: string, dto: CreateProfessionalDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing)
      throw new ConflictException("Já existe um usuário com este e-mail");

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const professional = await this.prisma.user.create({
      data: {
        academyId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: dto.role,
      },
      select: professionalSelect,
    });

    const academy = await this.prisma.academy.findUnique({
      where: { id: academyId },
      select: { name: true, primaryColor: true },
    });
    const emailSent = await this.email.send({
      to: dto.email,
      subject: `Bem-vindo(a) à ${academy?.name ?? "academia"}`,
      html: welcomeEmailTemplate({
        academyName: academy?.name ?? "Sua academia",
        primaryColor: academy?.primaryColor,
        studentName: dto.name,
        email: dto.email,
        tempPassword,
        loginUrl: process.env.WEB_ORIGIN || "http://localhost:5173",
      }),
    });

    return { professional, tempPassword, emailSent };
  }

  async update(academyId: string, id: string, dto: UpdateProfessionalDto) {
    await this.findOne(academyId, id);
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.role !== undefined ? { role: dto.role } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      select: professionalSelect,
    });
  }

  async deactivate(academyId: string, id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new BadRequestException("Você não pode desativar a si mesmo");
    }
    await this.findOne(academyId, id);
    await this.prisma.user.update({
      where: { id },
      data: { status: "INACTIVE" },
    });
    return { success: true };
  }

  async updateAvatar(academyId: string, id: string, buffer: Buffer) {
    const professional = await this.findOne(academyId, id);
    const avatarUrl = await saveAvatarFile(buffer);
    deleteAvatarFile(professional.avatarUrl);
    return this.prisma.user.update({
      where: { id },
      data: { avatarUrl },
      select: professionalSelect,
    });
  }
}
