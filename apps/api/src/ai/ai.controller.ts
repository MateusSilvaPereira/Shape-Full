import { Body, Controller, ForbiddenException, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { JwtPayload } from "../common/strategies/jwt.strategy";
import { AiService } from "./ai.service";
import { GenerateTrainingProgramDto } from "./dto/generate-training-program.dto";
import { GenerateMealPlanDto } from "./dto/generate-meal-plan.dto";
import { AiChatDto } from "./dto/ai-chat.dto";

function requireAcademy(user: JwtPayload): string {
  if (!user.academyId)
    throw new ForbiddenException("Usuário não está vinculado a uma academia");
  return user.academyId;
}

@ApiTags("IA")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("ai")
export class AiController {
  constructor(private ai: AiService) {}

  @Roles(Role.SUPER_ADMIN, Role.ACADEMY_ADMIN, Role.TRAINER)
  @Post("training-program")
  generateTrainingProgram(
    @CurrentUser() user: JwtPayload,
    @Body() dto: GenerateTrainingProgramDto,
  ) {
    return this.ai.generateTrainingProgram(requireAcademy(user), dto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ACADEMY_ADMIN, Role.NUTRITIONIST)
  @Post("meal-plan")
  generateMealPlan(@CurrentUser() user: JwtPayload, @Body() dto: GenerateMealPlanDto) {
    return this.ai.generateMealPlan(requireAcademy(user), dto);
  }

  @Post("chat")
  async chat(@CurrentUser() user: JwtPayload, @Body() dto: AiChatDto) {
    const reply = await this.ai.chat(
      requireAcademy(user),
      user.sub,
      dto.message,
      dto.history,
    );
    return { reply };
  }
}
