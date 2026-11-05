import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { memoryStorage } from "multer";
import { Role } from "@prisma/client";
import { MAX_AVATAR_SIZE } from "../common/avatar-storage";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { JwtPayload } from "../common/strategies/jwt.strategy";
import { AcademiesService } from "./academies.service";
import { UpdateAcademyDto } from "./dto/update-academy.dto";

@ApiTags("Academias")
@Controller("academies")
export class AcademiesController {
  constructor(private academies: AcademiesService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("me")
  findMine(@CurrentUser() user: JwtPayload) {
    return this.academies.findMine(user.academyId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ACADEMY_ADMIN)
  @Patch("me")
  updateMine(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateAcademyDto,
  ) {
    return this.academies.updateMine(user.academyId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ACADEMY_ADMIN)
  @Post("me/logo")
  @UseInterceptors(
    FileInterceptor("logo", {
      storage: memoryStorage(),
      limits: { fileSize: MAX_AVATAR_SIZE },
    }),
  )
  updateLogo(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("Nenhum arquivo enviado");
    return this.academies.updateLogo(user.academyId, file.buffer);
  }

  @Get(":slug")
  findBySlug(@Param("slug") slug: string) {
    return this.academies.findBySlug(slug);
  }
}
