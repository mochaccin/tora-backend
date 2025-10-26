// src/pictograms/pictograms.module.ts

import { Module } from '@nestjs/common';
import { PictogramsController } from '../pictograms/pictograms.controller';
import { PictogramsService } from './pictograms.service';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    HttpModule, // Para hacer peticiones a ARASAAC
    CacheModule.register({
      // Registra el caché.
      isGlobal: true, // Opcional: hace el caché global
    }),
  ],
  controllers: [PictogramsController],
  providers: [PictogramsService],
})
export class PictogramsModule {}