import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmailService } from './email.service';
import { UserRole } from '../shared/schemas/user.schema';

@Controller('email')
@UseGuards(JwtAuthGuard)
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Post('test-email')
  async sendTestEmail(@Request() req, @Body() body: { email: string }) {
    if (req.user.role !== UserRole.PARENT) {
      throw new Error('Only parents can send test emails');
    }

    const success = await this.emailService.sendTestEmail(body.email);

    return {
      success,
      message: success ? 'Test email sent successfully' : 'Failed to send test email',
    };
  }
}
