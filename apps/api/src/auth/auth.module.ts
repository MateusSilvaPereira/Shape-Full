import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from '../common/strategies/jwt.strategy';
import { PrismaService } from '../prisma.service';
import { EmailModule } from '../email/email.module';
@Module({imports:[PassportModule,EmailModule,JwtModule.register({secret:process.env.JWT_SECRET || 'dev-only-change-me',signOptions:{expiresIn:process.env.JWT_EXPIRES_IN || '8h'}})],controllers:[AuthController],providers:[AuthService,JwtStrategy,PrismaService],exports:[AuthService]})
export class AuthModule {}
