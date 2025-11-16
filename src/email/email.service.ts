import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmergencyContact, EmergencyContactDocument } from '../shared/schemas/emergency-contact.schema';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      this.logger.log('📧 Email service initialized with Gmail');
    } catch (error) {
      this.logger.error('Failed to initialize email transporter:', error);
    }
  }

  async sendEmergencyAlerts(
    childName: string,
    level: string,
    emergencyContacts: EmergencyContactDocument[],
    additionalInfo?: {
      emotion?: string;
      trigger?: string;
      assistanceRequested?: boolean;
    }
  ): Promise<{ sent: number; failed: number }> {
    let sentCount = 0;
    let failedCount = 0;

    const message = this.createEmergencyEmailContent(childName, level, additionalInfo);

    for (const contact of emergencyContacts) {
      if (contact.receiveAlerts && contact.email) {
        try {
          await this.transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: contact.email,
            subject: message.subject,
            html: message.html,
            text: message.text,
          });

          sentCount++;
          this.logger.log(`✅ Emergency alert email sent to ${contact.name} (${contact.email})`);
        } catch (error) {
          failedCount++;
          this.logger.error(
            `❌ Failed to send emergency alert email to ${contact.name} (${contact.email}):`,
            error.message
          );
        }

        // Small delay to prevent rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    this.logger.log(`📊 Emergency alerts summary: ${sentCount} sent, ${failedCount} failed`);
    return { sent: sentCount, failed: failedCount };
  }

  private createEmergencyEmailContent(
    childName: string,
    level: string,
    additionalInfo?: {
      emotion?: string;
      trigger?: string;
      assistanceRequested?: boolean;
    }
  ): { subject: string; html: string; text: string } {
    const levelEmojis = {
      LOW: '🟡',
      MEDIUM: '🟠',
      HIGH: '🔴',
      CRITICAL: '🚨',
    };

    const levelColors = {
      LOW: '#FFD700',
      MEDIUM: '#FF8C00',
      HIGH: '#FF0000',
      CRITICAL: '#8B0000',
    };

    const emoji = levelEmojis[level] || '🚨';
    const color = levelColors[level] || '#FF0000';

    let textContent = `${emoji} SELF-REGULATION ALERT ${emoji}\n\n`;
    textContent += `Child: ${childName}\n`;
    textContent += `Alert Level: ${level}\n`;
    textContent += `Time: ${new Date().toLocaleString()}\n\n`;

    if (additionalInfo?.emotion) {
      textContent += `Emotion: ${additionalInfo.emotion}\n`;
    }

    if (additionalInfo?.trigger) {
      textContent += `Trigger: ${additionalInfo.trigger}\n`;
    }

    if (additionalInfo?.assistanceRequested) {
      textContent += `🚨 REQUESTING IMMEDIATE ASSISTANCE\n`;
    }

    textContent += `\nPlease contact the parents immediately.`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: ${color};
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .content {
            background-color: #f9f9f9;
            padding: 20px;
            border-radius: 0 0 8px 8px;
            border: 1px solid ${color};
          }
          .alert-level {
            background-color: ${color};
            color: white;
            padding: 10px;
            border-radius: 4px;
            font-weight: bold;
            margin: 10px 0;
          }
          .details {
            background-color: white;
            padding: 15px;
            border-left: 4px solid ${color};
            margin: 15px 0;
          }
          .detail-item {
            margin: 10px 0;
          }
          .detail-label {
            font-weight: bold;
            color: ${color};
          }
          .urgency-notice {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            color: #856404;
            padding: 15px;
            border-radius: 4px;
            margin: 15px 0;
            text-align: center;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">${emoji} SELF-REGULATION ALERT ${emoji}</h1>
            <p style="margin: 10px 0 0 0;">Emergency notification from TORA App</p>
          </div>
          
          <div class="content">
            <div class="alert-level">
              Alert Level: ${level}
            </div>
            
            <div class="details">
              <div class="detail-item">
                <span class="detail-label">Child:</span> ${childName}
              </div>
              <div class="detail-item">
                <span class="detail-label">Time:</span> ${new Date().toLocaleString()}
              </div>
              ${
                additionalInfo?.emotion
                  ? `<div class="detail-item">
                <span class="detail-label">Emotion:</span> ${additionalInfo.emotion}
              </div>`
                  : ''
              }
              ${
                additionalInfo?.trigger
                  ? `<div class="detail-item">
                <span class="detail-label">Trigger:</span> ${additionalInfo.trigger}
              </div>`
                  : ''
              }
            </div>
            
            ${
              additionalInfo?.assistanceRequested
                ? `<div class="urgency-notice">
              🚨 REQUESTING IMMEDIATE ASSISTANCE 🚨<br>
              This child has indicated they need immediate help.
            </div>`
                : ''
            }
            
            <p style="text-align: center; font-weight: bold; color: ${color}; font-size: 16px;">
              Please contact the parents immediately.
            </p>
          </div>
          
          <div class="footer">
            <p>This is an automated alert from the TORA Self-Regulation App.</p>
            <p>If you received this email in error, please contact the app administrator.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return {
      subject: `${emoji} Self-Regulation Alert: ${childName} - ${level}`,
      html: htmlContent,
      text: textContent,
    };
  }

  async sendTestEmail(email: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: email,
        subject: '🧪 TORA App - Test Email',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2>Test Email from TORA App</h2>
            <p>This is a test email to confirm that email notifications are working correctly.</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <hr>
            <p style="font-size: 12px; color: #666;">This is an automated message from the TORA Self-Regulation App.</p>
          </div>
        `,
        text: 'This is a test email from TORA App. If you received this, email notifications are working correctly.',
      });

      this.logger.log(`✅ Test email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send test email to ${email}:`, error.message);
      return false;
    }
  }
}
