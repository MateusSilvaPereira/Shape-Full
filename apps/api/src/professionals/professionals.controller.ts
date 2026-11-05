import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { ProfessionalsService } from "./professionals.service";
import { CreateProfessionalDto } from "./dto/create-professional.dto";
import { UpdateProfessionalDto } from "./dto/update-professional.dto";

function requireAcademy(user: JwtPayload): string {
  if (!user.academyId)
    throw new ForbiddenException("Usuário não está vinculado a uma academia");
  return user.academyId;
}

@ApiTags("Profissionais")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ACADEMY_ADMIN)
@Controller("professionals")
export class ProfessionalsController {
  constructor(private professionals: ProfessionalsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query("search") search?: string) {
    return this.professionals.list(requireAcademy(user), search);
  }

  @Get(":id")
  findOne(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.professionals.findOne(requireAcademy(user), id);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateProfessionalDto) {
    return this.professionals.create(requireAcademy(user), dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateProfessionalDto,
  ) {
    return this.professionals.update(requireAcademy(user), id, dto);
  }

  @Delete(":id")
  deactivate(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.professionals.deactivate(requireAcademy(user), id, user.sub);
  }

  @Post(":id/avatar")
  @UseInterceptors(
    FileInterceptor("avatar", {
      storage: memoryStorage(),
      limits: { fileSize: MAX_AVATAR_SIZE },
    }),
  )
  uploadAvatar(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("Nenhum arquivo enviado");
    return this.professionals.updateAvatar(
      requireAcademy(user),
      id,
      file.buffer,
    );
  }
}
