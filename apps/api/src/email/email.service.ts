import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";

interface SendMailInput {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromAddress: string;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    this.fromAddress = process.env.SMTP_FROM || user || "";

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    } else {
      this.logger.warn(
        "SMTP não configurado (SMTP_HOST/SMTP_USER/SMTP_PASS ausentes) — e-mails serão apenas registrados no log, não enviados de verdade.",
      );
    }
  }

  async send({ to, subject, html }: SendMailInput): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(`[e-mail não enviado, SMTP ausente] para=${to} assunto="${subject}"`);
      return false;
    }
    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html,
      });
      return true;
    } catch (error) {
      this.logger.error(`Falha ao enviar e-mail para ${to}: ${(error as Error).message}`);
      return false;
    }
  }
}
