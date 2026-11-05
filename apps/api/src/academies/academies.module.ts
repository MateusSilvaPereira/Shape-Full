import { Module } from "@nestjs/common";
import { AcademiesController } from "./academies.controller";
import { AcademiesService } from "./academies.service";
import { PrismaService } from "../prisma.service";
@Module({
  controllers: [AcademiesController],
  providers: [AcademiesService, PrismaService],
})
export class AcademiesModule {}
