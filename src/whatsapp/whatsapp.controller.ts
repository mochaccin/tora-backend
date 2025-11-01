// src/whatsapp/whatsapp.controller.ts
import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WhatsAppService } from './whatsapp.service';
import { UserRole } from '../shared/schemas/user.schema';

@Controller('whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsAppController {
  constructor(private whatsappService: WhatsAppService) {}

  @Get('status')
  async getStatus(@Request() req) {
    if (req.user.role !== UserRole.PARENT) {
      throw new Error('Only parents can access WhatsApp status');
    }

    return this.whatsappService.getWhatsAppStatus();
  }

  @Get('qr')
  async getQrCode(@Request() req) {
    if (req.user.role !== UserRole.PARENT) {
      throw new Error('Only parents can access WhatsApp QR');
    }

    const qrCode = await this.whatsappService.getQrCode();
    return { qrCode };
  }

  @Post('test-message')
  async testMessage(
    @Request() req,
    @Body() body: { phoneNumber: string; message?: string }
  ) {
    if (req.user.role !== UserRole.PARENT) {
      throw new Error('Only parents can send test messages');
    }

    const success = await this.whatsappService.sendWhatsAppMessage(
      body.phoneNumber,
      body.message || '🧪 Este es un mensaje de prueba del sistema TORA'
    );

    return { 
      success,
      message: success ? 
        'Test message sent successfully' : 
        'Failed to send test message' 
    };
  }
}