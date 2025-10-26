// src/pictograms/pictograms.controller.ts

import { Controller, Get, UseGuards } from '@nestjs/common';
import { PictogramsService } from './pictograms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Asegúrate que la ruta sea correcta

// Temporalmente sin autenticación para pruebas
// @UseGuards(JwtAuthGuard)
@Controller('pictograms') // Ruta base: /pictograms
export class PictogramsController {
  constructor(private readonly pictogramsService: PictogramsService) {}

  @Get('emociones')
  getEmociones() {
    return this.pictogramsService.getBundle('emociones');
  }

  @Get('acciones')
  getAcciones() {
    return this.pictogramsService.getBundle('acciones');
  }

  @Get('sociales')
  getSociales() {
    return this.pictogramsService.getBundle('sociales');
  }

  @Get('regulacion')
  getRegulacion() {
    return this.pictogramsService.getBundle('regulacion');
  }
}