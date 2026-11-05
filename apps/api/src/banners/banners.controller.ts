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
import { BannersService } from "./banners.service";
import { CreateBannerDto } from "./dto/create-banner.dto";
import { UpdateBannerDto } from "./dto/update-banner.dto";

function requireAcademy(user: JwtPayload): string {
  if (!user.academyId)
    throw new ForbiddenException("Usuário não está vinculado a uma academia");
  return user.academyId;
}

@ApiTags("Conteúdo")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ACADEMY_ADMIN)
@Controller("banners")
export class BannersController {
  constructor(private banners: BannersService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    return this.banners.list(requireAcademy(user));
  }

  @Post()
  @UseInterceptors(
    FileInterceptor("image", {
      storage: memoryStorage(),
      limits: { fileSize: MAX_AVATAR_SIZE },
    }),
  )
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBannerDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("Nenhuma imagem enviada");
    return this.banners.create(requireAcademy(user), dto, file.buffer);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateBannerDto,
  ) {
    return this.banners.update(requireAcademy(user), id, dto);
  }

  @Post(":id/image")
  @UseInterceptors(
    FileInterceptor("image", {
      storage: memoryStorage(),
      limits: { fileSize: MAX_AVATAR_SIZE },
    }),
  )
  updateImage(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("Nenhuma imagem enviada");
    return this.banners.updateImage(requireAcademy(user), id, file.buffer);
  }

  @Delete(":id")
  remove(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.banners.remove(requireAcademy(user), id);
  }
}
