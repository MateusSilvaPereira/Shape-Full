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
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { JwtPayload } from "../common/strategies/jwt.strategy";
import { ProgressService } from "./progress.service";
import { CreateProgressDto } from "./dto/create-progress.dto";
import { UpdateProgressDto } from "./dto/update-progress.dto";

function requireAcademy(user: JwtPayload): string {
  if (!user.academyId)
    throw new ForbiddenException("Usuário não está vinculado a uma academia");
  return user.academyId;
}

@ApiTags("Evolução")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  Role.SUPER_ADMIN,
  Role.ACADEMY_ADMIN,
  Role.TRAINER,
  Role.NUTRITIONIST,
  Role.RECEPTIONIST,
)
@Controller("progress")
export class ProgressController {
  constructor(private progress: ProgressService) {}

  @Get()
  listByStudent(
    @CurrentUser() user: JwtPayload,
    @Query("studentId") studentId?: string,
  ) {
    if (!studentId) throw new BadRequestException("studentId é obrigatório");
    return this.progress.listByStudent(requireAcademy(user), studentId);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACADEMY_ADMIN, Role.TRAINER, Role.NUTRITIONIST)
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateProgressDto) {
    return this.progress.create(requireAcademy(user), dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACADEMY_ADMIN, Role.TRAINER, Role.NUTRITIONIST)
  @Patch(":id")
  update(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.progress.update(requireAcademy(user), id, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACADEMY_ADMIN, Role.TRAINER, Role.NUTRITIONIST)
  @Delete(":id")
  remove(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.progress.remove(requireAcademy(user), id);
  }
}
