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
import { MembershipsService } from "./memberships.service";
import { CreateMembershipDto } from "./dto/create-membership.dto";
import { UpdateMembershipDto } from "./dto/update-membership.dto";

function requireAcademy(user: JwtPayload): string {
  if (!user.academyId)
    throw new ForbiddenException("Usuário não está vinculado a uma academia");
  return user.academyId;
}

@ApiTags("Matrículas")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  Role.SUPER_ADMIN,
  Role.ACADEMY_ADMIN,
  Role.TRAINER,
  Role.NUTRITIONIST,
  Role.RECEPTIONIST,
)
@Controller("memberships")
export class MembershipsController {
  constructor(private memberships: MembershipsService) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query("studentId") studentId?: string,
    @Query("status") status?: string,
  ) {
    return this.memberships.list(requireAcademy(user), studentId, status);
  }

  @Get(":id")
  findOne(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.memberships.findOne(requireAcademy(user), id);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACADEMY_ADMIN, Role.RECEPTIONIST)
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateMembershipDto) {
    return this.memberships.create(requireAcademy(user), dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACADEMY_ADMIN, Role.RECEPTIONIST)
  @Patch(":id")
  update(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateMembershipDto,
  ) {
    return this.memberships.update(requireAcademy(user), id, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACADEMY_ADMIN)
  @Delete(":id")
  remove(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.memberships.remove(requireAcademy(user), id);
  }
}
