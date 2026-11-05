import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma.service";
import { EmailService } from "../email/email.service";
import { passwordResetEmailTemplate } from "../email/email-templates";
import * as bcrypt from "bcrypt";
import { randomBytes, createHash } from "crypto";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private email: EmailService,
  ) {}
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { academy: true },
    });
    if (
      !user ||
      user.status !== "ACTIVE" ||
      !(await bcrypt.compare(password, user.passwordHash))
    )
      throw new UnauthorizedException("E-mail ou senha inválidos");
    const payload = {
      sub: user.id,
      role: user.role,
      academyId: user.academyId,
    };
    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        academyId: user.academyId,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      },
      academy: user.academy
        ? {
            id: user.academy.id,
            name: user.academy.name,
            slug: user.academy.slug,
            logoUrl: user.academy.logoUrl,
            primaryColor: user.academy.primaryColor,
          }
        : null,
    };
  }

  /** Sempre responde com a mesma mensagem, exista ou não o e-mail, para não revelar quais e-mails estão cadastrados. */
  async forgotPassword(email: string) {
    const genericResult = {
      message: "Se este e-mail estiver cadastrado, você receberá um link para redefinir a senha.",
    };
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { academy: true },
    });
    if (!user || user.status !== "ACTIVE") return genericResult;

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const webOrigin = process.env.WEB_ORIGIN || "http://localhost:5173";
    const resetUrl = `${webOrigin}/redefinir-senha?token=${rawToken}`;
    const sent = await this.email.send({
      to: user.email,
      subject: `Redefinição de senha · ${user.academy?.name ?? "Shape Full"}`,
      html: passwordResetEmailTemplate({
        academyName: user.academy?.name ?? "Sua academia",
        primaryColor: user.academy?.primaryColor,
        userName: user.name,
        resetUrl,
      }),
    });
    if (!sent) this.logger.warn(`Não foi possível enviar e-mail de redefinição para ${user.email}`);

    return genericResult;
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException("Link de redefinição inválido ou expirado");
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: "Senha redefinida com sucesso. Você já pode fazer login." };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { academy: true },
    });
    if (!user || user.status !== "ACTIVE")
      throw new UnauthorizedException("Usuário não encontrado ou inativo");
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        academyId: user.academyId,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
      },
      academy: user.academy
        ? {
            id: user.academy.id,
            name: user.academy.name,
            slug: user.academy.slug,
            logoUrl: user.academy.logoUrl,
            primaryColor: user.academy.primaryColor,
          }
        : null,
    };
  }
}
