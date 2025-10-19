// src/shared/dtos/notification.dto.ts
import { DeviceType } from '../schemas/device-token.schema';

export class RegisterDeviceTokenDto {
  token: string;
  deviceType: DeviceType;
}

export class SendNotificationDto {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export class SendToUserDto extends SendNotificationDto {
  userId: string;
}

export class SendToChildDto extends SendNotificationDto {
  childId: string;
}

export class SendToParentDto extends SendNotificationDto {
  parentId: string;
}