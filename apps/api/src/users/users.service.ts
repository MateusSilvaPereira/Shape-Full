import { Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { PrismaService } from "../prisma.service";
import { deleteAvatarFile, saveAvatarFile } from "../common/avatar-storage";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";

function sanitize(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  academyId: string | null;
  phone: string | null;
  avatarUrl: string | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    academyId: user.academyId,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
  };
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findMe(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    return sanitize(user);
  }

  async listStaff(academyId: string | null) {
    if (!academyId) return [];
    return this.prisma.user.findMany({
      where: { academyId, status: "ACTIVE", role: { not: Role.STUDENT } },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
      },
    });
    return sanitize(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException("Senha atual incorreta");
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    return { success: true };
  }

  async updateAvatar(userId: string, buffer: Buffer) {
    const avatarUrl = await saveAvatarFile(buffer);
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    deleteAvatarFile(user.avatarUrl);
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
    return sanitize(updated);
  }
}
