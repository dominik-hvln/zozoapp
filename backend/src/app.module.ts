import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ChildrenController } from './children/children.controller';
import { ChildrenService } from './children/children.service';
import { ChildrenModule } from './children/children.module';
import { TattoosModule } from './tattoos/tattoos.module';
import { ScansModule } from './scans/scans.module';
import { MailModule } from './mail/mail.module';
import { AdminModule } from './admin/admin.module';
import { StoreModule } from './store/store.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ConfigModule } from '@nestjs/config';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), UsersModule, AuthModule, PrismaModule, ChildrenModule, TattoosModule, ScansModule, MailModule, AdminModule, StoreModule, DashboardModule, ProfileModule],
  controllers: [AppController, ChildrenController],
  providers: [AppService, ChildrenService],
})
export class AppModule {}
