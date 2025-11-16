// src/app.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CalendarModule } from './calendar/calendar.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { NonVerbalCommunicationModule } from './non-verbal-communication/non-verbal-communication.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EmailModule } from './email/email.module';

import { PictogramsModule } from './pictograms/pictograms.module';
import { CoinsModule } from './coins/coins.module';
import { SelfRegulationModule } from './self-regulation/self-regulation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/self-regulation-app'),
    AuthModule,
    UsersModule,
    CalendarModule,
    DashboardModule,
    RecommendationsModule,
    NonVerbalCommunicationModule,
    NotificationsModule,
    PictogramsModule, 
    SelfRegulationModule,
    EmailModule,
    CoinsModule,
  ],
})
export class AppModule {}
