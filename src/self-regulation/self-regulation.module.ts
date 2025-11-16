import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SelfRegulationService } from './self-regulation.service';
import { SelfRegulationController } from './self-regulation.controller';
import { SelfRegulationButton, SelfRegulationButtonSchema } from '../shared/schemas/self-regulation-button.schema';
import { EmergencyContact, EmergencyContactSchema } from '../shared/schemas/emergency-contact.schema';
import { Child, ChildSchema } from '../shared/schemas/user.schema';
import { Parent, ParentSchema } from '../shared/schemas/user.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SelfRegulationButton.name, schema: SelfRegulationButtonSchema },
      { name: EmergencyContact.name, schema: EmergencyContactSchema },
      { name: Child.name, schema: ChildSchema },
      { name: Parent.name, schema: ParentSchema },
    ]),
    NotificationsModule,
    EmailModule,
  ],
  controllers: [SelfRegulationController],
  providers: [SelfRegulationService],
  exports: [SelfRegulationService],
})
export class SelfRegulationModule {}
