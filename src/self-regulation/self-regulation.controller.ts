// src/self-regulation/self-regulation.controller.ts
import { 
  Controller, 
  Post, 
  Put, 
  Get, 
  Delete,
  Body, 
  Param, 
  UseGuards, 
  Request,
  Query 
} from '@nestjs/common';
import { SelfRegulationService } from './self-regulation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RegulationLevel } from '../shared/schemas/self-regulation-button.schema';
import { UserRole } from '../shared/schemas/user.schema';

class ActivateButtonDto {
  level: RegulationLevel;
  emotion?: string;
  trigger?: string;
  strategyUsed?: string;
  assistanceRequested?: boolean;
  notes?: string;
}

class AddEmergencyContactDto {
  name: string;
  phone: string;
  email: string;
  relationship: string;
  receiveAlerts?: boolean;
  priority?: number;
}

class ResolveEventDto {
  resolvedBy: string;
  notes?: string;
}

@Controller('self-regulation')
@UseGuards(JwtAuthGuard)
export class SelfRegulationController {
  constructor(private selfRegulationService: SelfRegulationService) {}

  /**
   * Activar el botón de autorregulación (SOLO para niños)
   */
  @Post('activate')
  async activateButton(
    @Body() activateDto: ActivateButtonDto,
    @Request() req,
  ) {
    if (req.user.role !== UserRole.CHILD) {
      throw new Error('Solo los niños pueden activar el botón de autorregulación');
    }

    return this.selfRegulationService.activateButton(
      req.user.userId.toString(),
      activateDto
    );
  }

  /**
   * Marcar evento como resuelto (SOLO padres)
   */
  @Put('resolve/:regulationId')
  async resolveEvent(
    @Param('regulationId') regulationId: string,
    @Body() resolveDto: ResolveEventDto,
    @Request() req,
  ) {
    if (req.user.role !== UserRole.PARENT) {
      throw new Error('Solo los padres pueden marcar eventos como resueltos');
    }

    return this.selfRegulationService.resolveEvent(
      regulationId,
      resolveDto.resolvedBy,
      resolveDto.notes
    );
  }

  /**
   * Obtener historial del botón para un niño (SOLO padres)
   */
  @Get('history/:childId')
  async getButtonHistory(
    @Param('childId') childId: string,
    @Query('days') days: number,
    @Request() req,
  ) {
    if (req.user.role !== UserRole.PARENT) {
      throw new Error('Solo los padres pueden ver el historial del botón');
    }

    return this.selfRegulationService.getButtonHistory(childId, days || 30);
  }

  /**
   * Obtener historial propio (SOLO niños)
   */
  @Get('my-history')
  async getMyButtonHistory(
    @Query('days') days: number,
    @Request() req,
  ) {
    if (req.user.role !== UserRole.CHILD) {
      throw new Error('Solo los niños pueden ver su propio historial');
    }

    return this.selfRegulationService.getButtonHistory(
      req.user.userId.toString(),
      days || 30
    );
  }

  /**
   * Gestionar contactos de emergencia (SOLO padres)
   */
  @Post('emergency-contacts')
  async addEmergencyContact(
    @Body() contactDto: AddEmergencyContactDto,
    @Request() req,
  ) {
    if (req.user.role !== UserRole.PARENT) {
      throw new Error('Solo los padres pueden gestionar contactos de emergencia');
    }

    return this.selfRegulationService.addEmergencyContact(
      req.user.userId.toString(),
      contactDto
    );
  }

  @Get('emergency-contacts')
  async getEmergencyContacts(@Request() req) {
    if (req.user.role !== UserRole.PARENT) {
      throw new Error('Solo los padres pueden ver contactos de emergencia');
    }

    return this.selfRegulationService.getEmergencyContacts(
      req.user.userId.toString()
    );
  }

  @Put('emergency-contacts/:contactId')
  async updateEmergencyContact(
    @Param('contactId') contactId: string,
    @Body() updateData: Partial<AddEmergencyContactDto>,
    @Request() req,
  ) {
    if (req.user.role !== UserRole.PARENT) {
      throw new Error('Solo los padres pueden actualizar contactos de emergencia');
    }

    return this.selfRegulationService.updateEmergencyContact(
      contactId,
      updateData
    );
  }

  @Delete('emergency-contacts/:contactId')
  async deleteEmergencyContact(
    @Param('contactId') contactId: string,
    @Request() req,
  ) {
    if (req.user.role !== UserRole.PARENT) {
      throw new Error('Solo los padres pueden eliminar contactos de emergencia');
    }

    return this.selfRegulationService.deleteEmergencyContact(contactId);
  }
}