import { Module } from "@nestjs/common";
import { ProfessionalsController } from "./professionals.controller";
import { ProfessionalsService } from "./professionals.service";
import { PrismaService } from "../prisma.service";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [EmailModule],
  controllers: [ProfessionalsController],
  providers: [ProfessionalsService, PrismaService],
})
export class ProfessionalsModule {}
