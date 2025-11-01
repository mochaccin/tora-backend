// src/whatsapp/whatsapp.service.ts
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import { WhatsAppConfig, WhatsAppConfigDocument } from '../shared/schemas/whatsapp-config.schema';
import { EmergencyContact, EmergencyContactDocument } from '../shared/schemas/emergency-contact.schema';

@Injectable()
export class WhatsAppService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsAppService.name);
  private whatsappClient: Client;
  private isClientReady = false;

  constructor(
    @InjectModel(WhatsAppConfig.name) 
    private whatsappConfigModel: Model<WhatsAppConfigDocument>,
    @InjectModel(EmergencyContact.name)
    private emergencyContactModel: Model<EmergencyContactDocument>,
  ) {}

  async onModuleInit() {
    await this.initializeWhatsApp();
  }

  onModuleDestroy() {
    if (this.whatsappClient) {
      this.whatsappClient.destroy();
    }
  }

  private async initializeWhatsApp() {
    try {
      this.logger.log('Initializing WhatsApp client...');

      this.whatsappClient = new Client({
        authStrategy: new LocalAuth({
          clientId: 'tora-app'
        }),
        puppeteer: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      });

      this.setupEventListeners();
      
      await this.whatsappClient.initialize();
      this.logger.log('WhatsApp client initialized');
    } catch (error) {
      this.logger.error('Failed to initialize WhatsApp client:', error);
    }
  }

  private setupEventListeners() {
    this.whatsappClient.on('qr', async (qr) => {
      this.logger.log('QR Code received, generating terminal QR...');
      qrcode.generate(qr, { small: true });
      
      // Guardar QR en la base de datos para mostrarlo en el frontend
      await this.saveQrCode(qr);
    });

    this.whatsappClient.on('ready', async () => {
      this.logger.log('✅ WhatsApp client is ready!');
      this.isClientReady = true;
      await this.markAsAuthenticated();
    });

    this.whatsappClient.on('authenticated', async () => {
      this.logger.log('✅ WhatsApp client authenticated!');
      this.isClientReady = true;
      await this.markAsAuthenticated();
    });

    this.whatsappClient.on('auth_failure', (error) => {
      this.logger.error('❌ WhatsApp authentication failed:', error);
      this.isClientReady = false;
    });

    this.whatsappClient.on('disconnected', (reason) => {
      this.logger.log(`WhatsApp client disconnected: ${reason}`);
      this.isClientReady = false;
    });

    this.whatsappClient.on('message', async (message) => {
      await this.handleIncomingMessage(message);
    });
  }

  private async saveQrCode(qr: string) {
    try {
      // Guardar el QR para todos los padres (en una app real, manejarías múltiples sesiones)
      await this.whatsappConfigModel.updateMany(
        {},
        { 
          lastQrCode: qr,
          whatsappAuthenticated: false 
        },
        { upsert: true }
      );
      this.logger.log('QR code saved to database');
    } catch (error) {
      this.logger.error('Error saving QR code:', error);
    }
  }

  private async markAsAuthenticated() {
    try {
      await this.whatsappConfigModel.updateMany(
        {},
        { 
          whatsappAuthenticated: true,
          lastQrCode: null 
        }
      );
      this.logger.log('WhatsApp marked as authenticated in database');
    } catch (error) {
      this.logger.error('Error marking WhatsApp as authenticated:', error);
    }
  }

  async getQrCode(): Promise<string | null> {
    try {
      const config = await this.whatsappConfigModel.findOne().exec();
      return config?.lastQrCode || null;
    } catch (error) {
      this.logger.error('Error getting QR code:', error);
      return null;
    }
  }

  async getWhatsAppStatus(): Promise<{ authenticated: boolean; ready: boolean }> {
    return {
      authenticated: this.isClientReady,
      ready: this.isClientReady
    };
  }

  async sendWhatsAppMessage(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.isClientReady) {
      this.logger.error('WhatsApp client is not ready');
      return false;
    }

    try {
      // Formatear número de teléfono (eliminar caracteres no numéricos y agregar código de país)
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      
      if (!formattedNumber) {
        this.logger.error(`Invalid phone number: ${phoneNumber}`);
        return false;
      }

      this.logger.log(`Sending WhatsApp message to ${formattedNumber}`);
      
      const chatId = `${formattedNumber}@c.us`;
      const result = await this.whatsappClient.sendMessage(chatId, message);
      
      this.logger.log(`✅ WhatsApp message sent to ${formattedNumber}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send WhatsApp message to ${phoneNumber}:`, error);
      return false;
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
    if (!this.isClientReady) {
      this.logger.error('WhatsApp client is not ready, cannot send emergency alerts');
      return { sent: 0, failed: emergencyContacts.length };
    }

    let sentCount = 0;
    let failedCount = 0;

    const message = this.createEmergencyMessage(childName, level, additionalInfo);

    for (const contact of emergencyContacts) {
      if (contact.receiveAlerts && contact.phone) {
        const success = await this.sendWhatsAppMessage(contact.phone, message);
        if (success) {
          sentCount++;
          this.logger.log(`✅ Emergency alert sent to ${contact.name} (${contact.phone})`);
        } else {
          failedCount++;
          this.logger.error(`❌ Failed to send emergency alert to ${contact.name} (${contact.phone})`);
        }

        // Pequeña pausa para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    this.logger.log(`📊 Emergency alerts summary: ${sentCount} sent, ${failedCount} failed`);
    return { sent: sentCount, failed: failedCount };
  }

  private createEmergencyMessage(
    childName: string, 
    level: string, 
    additionalInfo?: {
      emotion?: string;
      trigger?: string;
      assistanceRequested?: boolean;
    }
  ): string {
    const levelEmojis = {
      LOW: '🟡',
      MEDIUM: '🟠', 
      HIGH: '🔴',
      CRITICAL: '🚨'
    };

    const emoji = levelEmojis[level] || '🚨';

    let message = `${emoji} *ALERTA DE AUTORREGULACIÓN* ${emoji}\n\n`;
    message += `*Niño/a:* ${childName}\n`;
    message += `*Nivel de alerta:* ${level}\n`;
    message += `*Hora:* ${new Date().toLocaleString('es-ES')}\n\n`;

    if (additionalInfo?.emotion) {
      message += `*Emoción:* ${additionalInfo.emotion}\n`;
    }

    if (additionalInfo?.trigger) {
      message += `*Desencadenante:* ${additionalInfo.trigger}\n`;
    }

    if (additionalInfo?.assistanceRequested) {
      message += `*🚨 SOLICITA AYUDA INMEDIATA*`;
    }

    message += `\n\n_Por favor, contacta a los padres inmediatamente._`;

    return message;
  }

  private formatPhoneNumber(phoneNumber: string): string | null {
    // Eliminar todos los caracteres no numéricos excepto el +
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Si no tiene código de país, asumir Chile (+56)
    if (!cleaned.startsWith('+')) {
      // Remover leading zeros y agregar código de Chile
      const withoutZero = cleaned.replace(/^0+/, '');
      return `+56${withoutZero}`;
    }
    
    return cleaned;
  }

  private async handleIncomingMessage(message: Message) {
    try {
      this.logger.log(`Received WhatsApp message from ${message.from}: ${message.body}`);
      
      // Aquí puedes agregar lógica para responder mensajes automáticamente
      if (message.body.toLowerCase().includes('estado') || 
          message.body.toLowerCase().includes('status')) {
        const reply = `🤖 *BOT TORA APP*\n\nSoy un bot automático del sistema TORA.\n\n` +
                     `Si recibes esta alerta, es porque un niño ha activado el botón de autorregulación.\n\n` +
                     `Por favor, contacta a los padres inmediatamente.`;
        
        await this.whatsappClient.sendMessage(message.from, reply);
      }
    } catch (error) {
      this.logger.error('Error handling incoming message:', error);
    }
  }
}