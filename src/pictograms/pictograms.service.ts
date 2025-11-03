// src/pictograms/pictograms.service.ts

import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { firstValueFrom } from 'rxjs';

// Definimos la estructura de nuestra respuesta de pictograma
export interface PictogramResponse {
  word: string;
  imageUrl: string | null; // Será null si no se encuentra
  arasaacId: number | null;
}

@Injectable()
export class PictogramsService {
  // Usamos el endpoint 'bestsearch' de ARASAAC
  private ARASAAC_API_URL = 'https://api.arasaac.org/api/pictograms/es/bestsearch';

  // Listas de palabras que nos pidio carolina luego cambiar
  private readonly BUNDLES = {
    emociones: ['feliz', 'triste', 'enojado', 'cansado', 'con miedo', 'necesito ayuda'],
    acciones: ['jugar', 'parar', 'esperar', 'no quiero', 'sí quiero', 'necesito un descanso'],
    sociales: ['hola', 'gracias', 'perdón', 'puedo participar', 'no entiendo'],
    regulacion: ['respirar', 'ir al rincón tranquilo', 'pedir apoyo'],
  };

  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Obtiene un conjunto (bundle) de pictogramas por categoría
   */
  async getBundle(category: 'emociones' | 'acciones' | 'sociales' | 'regulacion'): Promise<PictogramResponse[]> {
    const words = this.BUNDLES[category];
    if (!words) {
      return [];
    }

    // Usamos Promise.all para buscar todas las palabras en paralelo
    const pictograms = await Promise.all(
      words.map(word => this.findPictogram(word)),
    );

    return pictograms;
  }

  /**
   * Busca un pictograma en ARASAAC.
   * Primero revisa el caché. Si no está, lo busca en la API y lo guarda.
   */
  private async findPictogram(word: string): Promise<PictogramResponse> {
    const cacheKey = `PICTOGRAM_${word.toUpperCase().replace(/ /g, '_')}`;

    // 1. Revisar el caché primero
    const cachedPictogram = await this.cacheManager.get<PictogramResponse>(cacheKey);
    if (cachedPictogram) {
      return cachedPictogram;
    }

    // 2. Si no está en caché, llamar a la API de ARASAAC
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.ARASAAC_API_URL}/${encodeURIComponent(word)}`),
      );

      if (response.data && response.data.length > 0) {
        const pictogram = response.data[0]; // bestsearch devuelve un array, tomamos el primero
        const arasaacId = pictogram._id;
        
        // Construimos la URL de la imagen (ARASAAC usa esta estructura)
        const imageUrl = `https://static.arasaac.org/pictograms/${arasaacId}/${arasaacId}_300.png`;

        const result: PictogramResponse = {
          word: word,
          imageUrl: imageUrl,
          arasaacId: arasaacId,
        };

        // 3. Guardar en caché (ej. por 24 horas)
        await this.cacheManager.set(cacheKey, result, 86400 * 1000); // 1 día
        return result;

      } else {
        // No se encontró pictograma
        return { word: word, imageUrl: null, arasaacId: null };
      }

    } catch (error) {
      console.error(`Error fetching pictogram for "${word}":`, error.message);
      return { word: word, imageUrl: null, arasaacId: null };
    }
  }
}