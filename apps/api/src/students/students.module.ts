import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { PrismaService } from '../prisma.service';
import { EmailModule } from '../email/email.module';
@Module({imports:[EmailModule],controllers:[StudentsController],providers:[StudentsService,PrismaService]})
export class StudentsModule {}
