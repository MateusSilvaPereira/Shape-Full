import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { AuthModule } from './auth/auth.module';
import { AcademiesModule } from './academies/academies.module';
import { StudentsModule } from './students/students.module';
import { UsersModule } from './users/users.module';
import { NutritionModule } from './nutrition/nutrition.module';
import { ProfessionalsModule } from './professionals/professionals.module';
import { ProgressModule } from './progress/progress.module';
import { ExercisesModule } from './exercises/exercises.module';
import { TrainingModule } from './training/training.module';
import { MembershipsModule } from './memberships/memberships.module';
import { BannersModule } from './banners/banners.module';
import { AiModule } from './ai/ai.module';
import { HealthController } from './health.controller';
@Module({imports:[ConfigModule.forRoot({isGlobal:true}),AuthModule,AcademiesModule,StudentsModule,UsersModule,NutritionModule,ProfessionalsModule,ProgressModule,ExercisesModule,TrainingModule,MembershipsModule,BannersModule,AiModule],controllers:[HealthController],providers:[PrismaService],exports:[PrismaService]})
export class AppModule {}
