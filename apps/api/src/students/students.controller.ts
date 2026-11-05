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
import { StudentsService } from "./students.service";
import { CreateStudentDto } from "./dto/create-student.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";

function requireAcademy(user: JwtPayload): string {
  if (!user.academyId)
    throw new ForbiddenException("Usuário não está vinculado a uma academia");
  return user.academyId;
}

@ApiTags("Alunos")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  Role.SUPER_ADMIN,
  Role.ACADEMY_ADMIN,
  Role.TRAINER,
  Role.NUTRITIONIST,
  Role.RECEPTIONIST,
)
@Controller("students")
export class StudentsController {
  constructor(private students: StudentsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query("search") search?: string) {
    return this.students.list(requireAcademy(user), search);
  }

  @Get(":id")
  findOne(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.students.findOne(requireAcademy(user), id);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACADEMY_ADMIN, Role.RECEPTIONIST)
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateStudentDto) {
    return this.students.create(requireAcademy(user), dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACADEMY_ADMIN, Role.RECEPTIONIST)
  @Patch(":id")
  update(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.students.update(requireAcademy(user), id, dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACADEMY_ADMIN, Role.RECEPTIONIST)
  @Delete(":id")
  deactivate(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.students.deactivate(requireAcademy(user), id);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACADEMY_ADMIN, Role.RECEPTIONIST)
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
    return this.students.updateAvatar(requireAcademy(user), id, file.buffer);
  }
}
