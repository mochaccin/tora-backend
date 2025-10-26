// src/self-regulation/self-regulation.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotificationsService } from '../notifications/notifications.service';
import { 
  SelfRegulationButton, 
  SelfRegulationButtonDocument, 
  RegulationLevel 
} from '../shared/schemas/self-regulation-button.schema';
import { EmergencyContact, EmergencyContactDocument } from '../shared/schemas/emergency-contact.schema';
import { Child, ChildDocument } from '../shared/schemas/user.schema';
import { Parent, ParentDocument } from '../shared/schemas/user.schema';

@Injectable()
export class SelfRegulationService {
  private readonly logger = new Logger(SelfRegulationService.name);

  constructor(
    @InjectModel(SelfRegulationButton.name) 
    private selfRegulationModel: Model<SelfRegulationButtonDocument>,
    @InjectModel(EmergencyContact.name) 
    private emergencyContactModel: Model<EmergencyContactDocument>,
    @InjectModel(Child.name) 
    private childModel: Model<ChildDocument>,
    @InjectModel(Parent.name) 
    private parentModel: Model<ParentDocument>,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Activar el botón de autorregulación
   */
  async activateButton(childId: string, data: {
    level: RegulationLevel;
    emotion?: string;
    trigger?: string;
    strategyUsed?: string;
    assistanceRequested?: boolean;
    notes?: string;
  }) {
    try {
      // Crear registro del botón presionado
      const regulationRecord = new this.selfRegulationModel({
        childId: new Types.ObjectId(childId),
        level: data.level,
        emotion: data.emotion,
        trigger: data.trigger,
        strategyUsed: data.strategyUsed,
        assistanceRequested: data.assistanceRequested || false,
        notes: data.notes,
      });

      await regulationRecord.save();

      // Enviar alertas a padres y contactos
      await this.sendAlerts(childId, regulationRecord);

      this.logger.log(`Self-regulation button activated by child ${childId} with level ${data.level}`);

      return regulationRecord;
    } catch (error) {
      this.logger.error(`Error activating self-regulation button: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Enviar alertas a padres y contactos de emergencia
   */
  private async sendAlerts(childId: string, regulationRecord: SelfRegulationButtonDocument) {
    try {
      // Obtener información del niño
      const child = await this.childModel
        .findById(childId)
        .populate('parentId')
        .exec();

      if (!child || !child.parentId) {
        this.logger.warn(`Child or parent not found for child ${childId}`);
        return;
      }

      const parentId = (child.parentId as any)._id?.toString() || child.parentId.toString();
      const childName = child.name;

      // Obtener contactos de emergencia
      const emergencyContacts = await this.emergencyContactModel
        .find({ 
          parentId: new Types.ObjectId(parentId),
          active: true,
          receiveAlerts: true 
        })
        .sort({ priority: 1 })
        .exec();

      // Preparar mensaje según el nivel
      const { title, body } = this.getAlertMessage(regulationRecord.level, childName);

      // Datos para la notificación - convertir boolean a string
      const notificationData = {
        type: 'SELF_REGULATION_ALERT',
        childId: childId,
        childName: childName,
        regulationId: regulationRecord._id.toString(),
        level: regulationRecord.level,
        assistanceRequested: regulationRecord.assistanceRequested.toString(), // Convertir a string
        timestamp: new Date().toISOString(),
      };

      // Enviar notificación al padre
      await this.notificationsService.sendToParent(
        parentId,
        title,
        body,
        notificationData
      );

      this.logger.log(`Alert sent to parent ${parentId} for self-regulation event`);

      // Enviar notificaciones a contactos de emergencia
      for (const contact of emergencyContacts) {
        await this.sendContactAlert(contact, title, body, notificationData);
      }

      this.logger.log(`Alerts sent to ${emergencyContacts.length} emergency contacts`);
    } catch (error) {
      this.logger.error(`Error sending alerts: ${error.message}`, error.stack);
    }
  }

  /**
   * Enviar alerta a un contacto específico
   */
  private async sendContactAlert(
    contact: EmergencyContact, 
    title: string, 
    body: string, 
    data: Record<string, string> // Asegurar que es Record<string, string>
  ) {
    try {
      // En una implementación real, aquí enviarías SMS/email/llamada
      // Por ahora solo logramos la acción
      this.logger.log(`ALERT for ${contact.name} (${contact.phone}): ${title} - ${body}`);

      // Podrías integrar con un servicio de SMS como Twilio aquí
      // await this.smsService.sendSMS(contact.phone, `${title}: ${body}`);

    } catch (error) {
      this.logger.error(`Error sending alert to contact ${contact.name}: ${error.message}`);
    }
  }

  /**
   * Obtener mensaje de alerta según el nivel
   */
  private getAlertMessage(level: RegulationLevel, childName: string): { title: string; body: string } {
    const baseTitle = '🚨 Alerta de Autorregulación';
    
    switch (level) {
      case RegulationLevel.LOW:
        return {
          title: baseTitle,
          body: `${childName} está experimentando ansiedad leve y está usando estrategias de autorregulación.`
        };
      
      case RegulationLevel.MEDIUM:
        return {
          title: baseTitle,
          body: `${childName} tiene dificultad para concentrarse y necesita apoyo en autorregulación.`
        };
      
      case RegulationLevel.HIGH:
        return {
          title: '🚨🚨 Alerta Importante',
          body: `${childName} está experimentando una crisis emocional y necesita ayuda inmediata.`
        };
      
      case RegulationLevel.CRITICAL:
        return {
          title: '🚨🚨🚨 ALERTA CRÍTICA',
          body: `${childName} necesita intervención URGENTE. Está experimentando una crisis severa.`
        };
      
      default:
        return {
          title: baseTitle,
          body: `${childName} ha activado el botón de autorregulación.`
        };
    }
  }

  /**
   * Marcar un evento como resuelto
   */
  async resolveEvent(regulationId: string, resolvedBy: string, notes?: string) {
    try {
      const regulationRecord = await this.selfRegulationModel.findByIdAndUpdate(
        regulationId,
        {
          resolved: true,
          resolvedAt: new Date(),
          resolvedBy,
          ...(notes && { resolutionNotes: notes })
        },
        { new: true }
      ).exec();

      if (!regulationRecord) {
        throw new Error('Self-regulation record not found');
      }

      this.logger.log(`Self-regulation event ${regulationId} marked as resolved by ${resolvedBy}`);

      return regulationRecord;
    } catch (error) {
      this.logger.error(`Error resolving self-regulation event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Obtener historial de activaciones del botón
   */
  async getButtonHistory(childId: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const history = await this.selfRegulationModel
        .find({
          childId: new Types.ObjectId(childId),
          createdAt: { $gte: startDate }
        })
        .sort({ createdAt: -1 })
        .exec();

      return history;
    } catch (error) {
      this.logger.error(`Error getting button history: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Gestionar contactos de emergencia
   */
  async addEmergencyContact(parentId: string, contactData: {
    name: string;
    phone: string;
    email: string;
    relationship: string;
    receiveAlerts?: boolean;
    priority?: number;
  }) {
    try {
      const contact = new this.emergencyContactModel({
        parentId: new Types.ObjectId(parentId),
        ...contactData,
        active: true,
        receiveAlerts: contactData.receiveAlerts !== false,
        priority: contactData.priority || 0,
      });

      await contact.save();
      return contact;
    } catch (error) {
      this.logger.error(`Error adding emergency contact: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getEmergencyContacts(parentId: string) {
    try {
      return await this.emergencyContactModel
        .find({ 
          parentId: new Types.ObjectId(parentId),
          active: true 
        })
        .sort({ priority: 1, name: 1 })
        .exec();
    } catch (error) {
      this.logger.error(`Error getting emergency contacts: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateEmergencyContact(contactId: string, updateData: Partial<EmergencyContact>) {
    try {
      const contact = await this.emergencyContactModel.findByIdAndUpdate(
        contactId,
        updateData,
        { new: true }
      ).exec();

      if (!contact) {
        throw new Error('Emergency contact not found');
      }

      return contact;
    } catch (error) {
      this.logger.error(`Error updating emergency contact: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteEmergencyContact(contactId: string) {
    try {
      const contact = await this.emergencyContactModel.findByIdAndUpdate(
        contactId,
        { active: false },
        { new: true }
      ).exec();

      if (!contact) {
        throw new Error('Emergency contact not found');
      }

      return contact;
    } catch (error) {
      this.logger.error(`Error deleting emergency contact: ${error.message}`, error.stack);
      throw error;
    }
  }
}