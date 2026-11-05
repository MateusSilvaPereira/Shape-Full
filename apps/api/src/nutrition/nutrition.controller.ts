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
import { NutritionService } from "./nutrition.service";
import { CreateMealPlanDto } from "./dto/create-meal-plan.dto";
import { UpdateMealPlanDto } from "./dto/update-meal-plan.dto";

function requireAcademy(user: JwtPayload): string {
  if (!user.academyId)
    throw new ForbiddenException("Usuário não está vinculado a uma academia");
  return user.academyId;
}

@ApiTags("Nutrição")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  Role.SUPER_ADMIN,
  Role.ACADEMY_ADMIN,
  Role.TRAINER,
  Role.NUTRITIONIST,
  Role.RECEPTIONIST,
)
@Controller("meal-plans")
export class NutritionController {
  constructor(private nutrition: NutritionService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query("search") search?: string) {
    return this.nutrition.list(requireAcademy(user), search);
  }

  @Get(":id")
  findOne(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.nutrition.findOne(requireAcademy(user), id);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACADEMY_ADMIN, Role.NUTRITIONIST)
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateMealPlanDto) {
    return this.nutrition.create(requireAcademy(user), dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACADEMY_ADMIN, Role.NUTRITIONIST)
  @Patch(":id")
  update(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateMealPlanDto,
  ) {
    return this.nutrition.update(requireAcademy(user), id, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACADEMY_ADMIN, Role.NUTRITIONIST)
  @Delete(":id")
  remove(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.nutrition.remove(requireAcademy(user), id);
  }
}
