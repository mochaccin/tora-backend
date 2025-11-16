// src/self-regulation/self-regulation.service.ts
import { Injectable, Logger, Inject } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { Model, Types } from "mongoose"
import { NotificationsService } from "../notifications/notifications.service"
import { EmailService } from "../email/email.service"
import { 
  SelfRegulationButton, 
  SelfRegulationButtonDocument, 
  RegulationLevel 
} from "../shared/schemas/self-regulation-button.schema"
import { 
  EmergencyContact, 
  EmergencyContactDocument 
} from "../shared/schemas/emergency-contact.schema"
import { Child, ChildDocument } from "../shared/schemas/user.schema"
import { Parent, ParentDocument } from "../shared/schemas/user.schema"

@Injectable()
export class SelfRegulationService {
  private readonly logger = new Logger(SelfRegulationService.name)

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
    private emailService: EmailService,
  ) {}

  /**
   * Activar el botón de autorregulación
   */
  async activateButton(
    childId: string,
    data: {
      level: RegulationLevel
      emotion?: string
      trigger?: string
      strategyUsed?: string
      assistanceRequested?: boolean
      notes?: string
    },
  ) {
    try {
      this.logger.log(`🔘 Activating self-regulation button for child ${childId} with level ${data.level}`)

      // Crear registro del botón presionado
      const regulationRecord = new this.selfRegulationModel({
        childId: new Types.ObjectId(childId),
        level: data.level,
        emotion: data.emotion,
        trigger: data.trigger,
        strategyUsed: data.strategyUsed,
        assistanceRequested: data.assistanceRequested || false,
        notes: data.notes,
      })

      await regulationRecord.save()
      this.logger.log(`✅ Self-regulation record created with ID: ${regulationRecord._id}`)

      // Enviar alertas a padres y contactos
      await this.sendAlerts(childId, regulationRecord)

      this.logger.log(`✅ Self-regulation button activated by child ${childId} with level ${data.level}`)

      return regulationRecord
    } catch (error) {
      this.logger.error(`❌ Error activating self-regulation button: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * Enviar alertas a padres y contactos de emergencia
   */
  private async sendAlerts(childId: string, regulationRecord: SelfRegulationButtonDocument) {
    try {
      this.logger.log(`🚨 Starting alert process for child ${childId}`)

      let childObjectId: Types.ObjectId
      try {
        childObjectId = new Types.ObjectId(childId)
      } catch (error) {
        this.logger.error(`❌ Invalid child ID format: ${childId}`)
        return
      }

      // Obtener información del niño
      const child = await this.childModel.findById(childObjectId).populate("parentId").exec()

      if (!child || !child.parentId) {
        this.logger.warn(`❌ Child or parent not found for child ${childId}`)
        return
      }

      const parentId = (child.parentId as any)._id ? (child.parentId as any)._id.toString() : child.parentId.toString()

      this.logger.log(`✅ Extracted parent ID: ${parentId}`)
      const childName = child.name

      this.logger.log(`👨‍👦 Child ${childName} belongs to parent ${parentId}`)

      // Obtener contactos de emergencia
      const emergencyContacts = await this.emergencyContactModel
        .find({
          parentId: new Types.ObjectId(parentId),
          active: true,
          receiveAlerts: true,
        })
        .sort({ priority: 1 })
        .exec()

      this.logger.log(`📞 Found ${emergencyContacts.length} emergency contacts`)

      // Preparar mensaje según el nivel
      const { title, body } = this.getAlertMessage(regulationRecord.level, childName)

      const notificationData: Record<string, string> = {
        type: "SELF_REGULATION_ALERT",
        childId: childObjectId.toString(),
        childName: childName,
        regulationId: regulationRecord._id.toString(),
        level: regulationRecord.level,
        assistanceRequested: regulationRecord.assistanceRequested.toString(),
        timestamp: new Date().toISOString(),
      }

      // Agregar campos opcionales solo si existen
      if (regulationRecord.emotion) {
        notificationData.emotion = regulationRecord.emotion
      }
      if (regulationRecord.trigger) {
        notificationData.trigger = regulationRecord.trigger
      }
      if (regulationRecord.strategyUsed) {
        notificationData.strategyUsed = regulationRecord.strategyUsed
      }

      this.logger.log(`📤 Sending notification to parent: ${title} - ${body}`)

      // Enviar notificación al padre (FCM)
      const parentResult = await this.notificationsService.sendToParent(parentId, title, body, notificationData)

      this.logger.log(`✅ Parent notification result: ${JSON.stringify(parentResult)}`)

      if (emergencyContacts.length > 0) {
        this.logger.log(`📧 Sending email alerts to ${emergencyContacts.length} contacts`)

        const emailResult = await this.emailService.sendEmergencyAlerts(
          childName,
          regulationRecord.level,
          emergencyContacts,
          {
            emotion: regulationRecord.emotion,
            trigger: regulationRecord.trigger,
            assistanceRequested: regulationRecord.assistanceRequested,
          },
        )

        this.logger.log(`✅ Email alerts: ${emailResult.sent} sent, ${emailResult.failed} failed`)
      } else {
        this.logger.log("ℹ️ No emergency contacts configured for email alerts")
      }

      this.logger.log(`✅ All alerts processed for child ${childName}`)
    } catch (error) {
      this.logger.error(`❌ Error sending alerts: ${error.message}`, error.stack)
    }
  }

  /**
   * Obtener mensaje de alerta según el nivel
   */
  private getAlertMessage(level: RegulationLevel, childName: string): { title: string; body: string } {
    const baseTitle = "🚨 Alerta de Autorregulación"

    switch (level) {
      case RegulationLevel.LOW:
        return {
          title: baseTitle,
          body: `${childName} está experimentando ansiedad leve y está usando estrategias de autorregulación.`,
        }

      case RegulationLevel.MEDIUM:
        return {
          title: baseTitle,
          body: `${childName} tiene dificultad para concentrarse y necesita apoyo en autorregulación.`,
        }

      case RegulationLevel.HIGH:
        return {
          title: "🚨🚨 Alerta Importante",
          body: `${childName} está experimentando una crisis emocional y necesita ayuda inmediata.`,
        }

      case RegulationLevel.CRITICAL:
        return {
          title: "🚨🚨🚨 ALERTA CRÍTICA",
          body: `${childName} necesita intervención URGENTE. Está experimentando una crisis severa.`,
        }

      default:
        return {
          title: baseTitle,
          body: `${childName} ha activado el botón de autorregulación.`,
        }
    }
  }

  /**
   * Marcar un evento como resuelto
   */
  async resolveEvent(regulationId: string, resolvedBy: string, notes?: string) {
    try {
      const regulationRecord = await this.selfRegulationModel
        .findByIdAndUpdate(
          regulationId,
          {
            resolved: true,
            resolvedAt: new Date(),
            resolvedBy,
            ...(notes && { resolutionNotes: notes }),
          },
          { new: true },
        )
        .exec()

      if (!regulationRecord) {
        throw new Error("Self-regulation record not found")
      }

      this.logger.log(`✅ Self-regulation event ${regulationId} marked as resolved by ${resolvedBy}`)

      return regulationRecord
    } catch (error) {
      this.logger.error(`❌ Error resolving self-regulation event: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * Obtener historial de activaciones del botón
   */
  async getButtonHistory(childId: string, days = 30) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const history = await this.selfRegulationModel
        .find({
          childId: new Types.ObjectId(childId),
          createdAt: { $gte: startDate },
        })
        .sort({ createdAt: -1 })
        .exec()

      this.logger.log(`📊 Retrieved ${history.length} self-regulation records for child ${childId}`)
      return history
    } catch (error) {
      this.logger.error(`❌ Error getting button history: ${error.message}`, error.stack)
      throw error
    }
  }

  /**
   * Gestionar contactos de emergencia
   */
  async addEmergencyContact(
    parentId: string,
    contactData: {
      name: string
      phone: string
      email: string
      relationship: string
      receiveAlerts?: boolean
      priority?: number
    },
  ) {
    try {
      const contact = new this.emergencyContactModel({
        parentId: new Types.ObjectId(parentId),
        ...contactData,
        active: true,
        receiveAlerts: contactData.receiveAlerts !== false,
        priority: contactData.priority || 0,
      })

      await contact.save()
      this.logger.log(`✅ Added emergency contact: ${contactData.name} for parent ${parentId}`)
      return contact
    } catch (error) {
      this.logger.error(`❌ Error adding emergency contact: ${error.message}`, error.stack)
      throw error
    }
  }

  async getEmergencyContacts(parentId: string) {
    try {
      const contacts = await this.emergencyContactModel
        .find({
          parentId: new Types.ObjectId(parentId),
          active: true,
        })
        .sort({ priority: 1, name: 1 })
        .exec()

      this.logger.log(`📞 Retrieved ${contacts.length} emergency contacts for parent ${parentId}`)
      return contacts
    } catch (error) {
      this.logger.error(`❌ Error getting emergency contacts: ${error.message}`, error.stack)
      throw error
    }
  }

  async updateEmergencyContact(contactId: string, updateData: Partial<EmergencyContact>) {
    try {
      const contact = await this.emergencyContactModel.findByIdAndUpdate(contactId, updateData, { new: true }).exec()

      if (!contact) {
        throw new Error("Emergency contact not found")
      }

      this.logger.log(`✅ Updated emergency contact: ${contactId}`)
      return contact
    } catch (error) {
      this.logger.error(`❌ Error updating emergency contact: ${error.message}`, error.stack)
      throw error
    }
  }

  async deleteEmergencyContact(contactId: string) {
    try {
      const contact = await this.emergencyContactModel
        .findByIdAndUpdate(contactId, { active: false }, { new: true })
        .exec()

      if (!contact) {
        throw new Error("Emergency contact not found")
      }

      this.logger.log(`✅ Deleted emergency contact: ${contactId}`)
      return contact
    } catch (error) {
      this.logger.error(`❌ Error deleting emergency contact: ${error.message}`, error.stack)
      throw error
    }
  }
}
