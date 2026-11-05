import {
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
import { TrainingService } from "./training.service";
import { CreateTrainingProgramDto } from "./dto/create-training-program.dto";
import { UpdateTrainingProgramDto } from "./dto/update-training-program.dto";

function requireAcademy(user: JwtPayload): string {
  if (!user.academyId)
    throw new ForbiddenException("Usuário não está vinculado a uma academia");
  return user.academyId;
}

@ApiTags("Treinos")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  Role.SUPER_ADMIN,
  Role.ACADEMY_ADMIN,
  Role.TRAINER,
  Role.NUTRITIONIST,
  Role.RECEPTIONIST,
)
@Controller("training-programs")
export class TrainingController {
  constructor(private training: TrainingService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query("search") search?: string) {
    return this.training.list(requireAcademy(user), search);
  }

  @Roles(Role.STUDENT)
  @Get("me")
  listMine(@CurrentUser() user: JwtPayload) {
    return this.training.listMine(requireAcademy(user), user.sub);
  }

  @Get(":id")
  findOne(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.training.findOne(requireAcademy(user), id);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACADEMY_ADMIN, Role.TRAINER)
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTrainingProgramDto) {
    return this.training.create(requireAcademy(user), user.sub, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACADEMY_ADMIN, Role.TRAINER)
  @Patch(":id")
  update(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateTrainingProgramDto,
  ) {
    return this.training.update(requireAcademy(user), id, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACADEMY_ADMIN, Role.TRAINER)
  @Delete(":id")
  remove(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.training.remove(requireAcademy(user), id);
  }
}
