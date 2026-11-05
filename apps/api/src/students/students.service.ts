import {
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
import { CreateStudentDto } from "./dto/create-student.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";

const studentInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      createdAt: true,
      avatarUrl: true,
    },
  },
  memberships: { orderBy: { startDate: "desc" as const }, take: 1 },
};

function generateTempPassword() {
  return randomBytes(6).toString("base64url");
}

@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  async list(academyId: string, search?: string) {
    return this.prisma.studentProfile.findMany({
      where: {
        academyId,
        ...(search
          ? {
              user: {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { email: { contains: search, mode: "insensitive" } },
                ],
              },
            }
          : {}),
      },
      include: studentInclude,
      orderBy: { user: { createdAt: "desc" } },
      take: 200,
    });
  }

  async findOne(academyId: string, id: string) {
    const student = await this.prisma.studentProfile.findFirst({
      where: { id, academyId },
      include: studentInclude,
    });
    if (!student) throw new NotFoundException("Aluno não encontrado");
    return student;
  }

  async create(academyId: string, dto: CreateStudentDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing)
      throw new ConflictException("Já existe um usuário com este e-mail");

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const student = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          academyId,
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          role: Role.STUDENT,
        },
      });
      return tx.studentProfile.create({
        data: {
          userId: user.id,
          academyId,
          birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
          gender: dto.gender,
          heightCm: dto.heightCm,
          goal: dto.goal,
          ...(dto.planName
            ? {
                memberships: {
                  create: {
                    academyId,
                    planName: dto.planName,
                    monthlyPrice: dto.monthlyPrice ?? 0,
                  },
                },
              }
            : {}),
        },
        include: studentInclude,
      });
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

    return { student, tempPassword, emailSent };
  }

  async update(academyId: string, id: string, dto: UpdateStudentDto) {
    await this.findOne(academyId, id);
    const { status, phone, name, ...profileFields } = dto;
    return this.prisma.studentProfile.update({
      where: { id },
      data: {
        ...profileFields,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        user: {
          update: {
            ...(name ? { name } : {}),
            ...(phone !== undefined ? { phone } : {}),
            ...(status ? { status } : {}),
          },
        },
      },
      include: studentInclude,
    });
  }

  async deactivate(academyId: string, id: string) {
    const student = await this.findOne(academyId, id);
    await this.prisma.user.update({
      where: { id: student.userId },
      data: { status: "INACTIVE" },
    });
    return { success: true };
  }

  async updateAvatar(academyId: string, id: string, buffer: Buffer) {
    const student = await this.findOne(academyId, id);
    const avatarUrl = await saveAvatarFile(buffer);
    deleteAvatarFile(student.user.avatarUrl);
    await this.prisma.user.update({
      where: { id: student.userId },
      data: { avatarUrl },
    });
    return this.findOne(academyId, id);
  }
}
