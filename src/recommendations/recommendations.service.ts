// src/recommendations/recommendations.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { 
  Recommendation, 
  RecommendationDocument, 
  RecommendationCategory,
  AgeGroup 
} from '../shared/schemas/recommendation.schema';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectModel(Recommendation.name) 
    private recommendationModel: Model<RecommendationDocument>,
  ) {}

  async initializeDefaultRecommendations() {
    const count = await this.recommendationModel.countDocuments();
    if (count === 0) {
      await this.recommendationModel.insertMany(this.getDefaultRecommendations());
      console.log('Default recommendations initialized');
    }
  }

  async getRecommendationsByAgeAndCategory(age: number, category?: RecommendationCategory) {
    const ageGroup = this.getAgeGroup(age);
    
    const query: any = { 
      ageGroup,
      active: true 
    };

    if (category) {
      query.category = category;
    }

    return this.recommendationModel
      .find(query)
      .sort({ priority: -1, title: 1 })
      .exec();
  }

  async getRecommendationsForChild(childId: string, category?: RecommendationCategory) {
    // In a real app, you'd get the child's age from the database
    // For now, we'll assume age 8 (EARLY_SCHOOL) as default
    const ageGroup = AgeGroup.EARLY_SCHOOL;
    
    const query: any = { 
      ageGroup,
      active: true 
    };

    if (category) {
      query.category = category;
    }

    return this.recommendationModel
      .find(query)
      .sort({ priority: -1, title: 1 })
      .exec();
  }

  async getAllCategories() {
    return Object.values(RecommendationCategory);
  }

  private getAgeGroup(age: number): AgeGroup {
    if (age >= 3 && age <= 5) return AgeGroup.PRESCHOOL;
    if (age >= 6 && age <= 8) return AgeGroup.EARLY_SCHOOL;
    if (age >= 9 && age <= 12) return AgeGroup.MIDDLE_SCHOOL;
    return AgeGroup.TEEN;
  }

  private getDefaultRecommendations(): Partial<Recommendation>[] {
    return [
      // EMOTION_REGULATION
      {
        title: 'Respiración de la mariposa',
        description: 'Coloca las manos en el pecho y respira profundamente como una mariposa que abre y cierra sus alas. Inspira por la nariz y exhala por la boca lentamente.',
        category: RecommendationCategory.EMOTION_REGULATION,
        ageGroup: AgeGroup.EARLY_SCHOOL,
        tags: ['respiración', 'calma', 'ansiedad'],
        priority: 10
      },
      {
        title: 'Rincón de la calma',
        description: 'Crea un espacio tranquilo con cojines, pelotas antiestrés y objetos que te gusten. Ve a este rincón cuando sientas que necesitas un momento para calmarte.',
        category: RecommendationCategory.EMOTION_REGULATION,
        ageGroup: AgeGroup.EARLY_SCHOOL,
        tags: ['espacio seguro', 'autorregulación'],
        priority: 9
      },
      {
        title: 'Botella de la calma',
        description: 'Crea una botella con agua, pegamento y purpurina. Agítala cuando sientas emociones fuertes y observa cómo la purpurina se asienta lentamente.',
        category: RecommendationCategory.EMOTION_REGULATION,
        ageGroup: AgeGroup.PRESCHOOL,
        tags: ['visual', 'focus', 'meditación'],
        priority: 8
      },

      // RECOGNIZE_EMOTIONS
      {
        title: 'Termómetro de emociones',
        description: 'Dibuja un termómetro y colorea hasta dónde llega tu emoción. Verde para calma, amarillo para alerta, rojo para emociones muy intensas.',
        category: RecommendationCategory.RECOGNIZE_EMOTIONS,
        ageGroup: AgeGroup.EARLY_SCHOOL,
        tags: ['identificación', 'intensidad', 'visual'],
        priority: 10
      },
      {
        title: 'Caras emocionales',
        description: 'Practica hacer diferentes expresiones faciales frente al espejo: feliz, triste, enojado, sorprendido. Nombra cada emoción en voz alta.',
        category: RecommendationCategory.RECOGNIZE_EMOTIONS,
        ageGroup: AgeGroup.PRESCHOOL,
        tags: ['expresiones', 'espejo', 'práctica'],
        priority: 9
      },

      // CLASSROOM_RULES
      {
        title: 'Si me enojo en clase',
        description: '1. Respira profundamente 3 veces\n2. Levanta la mano para pedir un momento\n3. Usa tu tarjeta de "necesito un break"\n4. Ve al rincón de la calma si es necesario',
        category: RecommendationCategory.CLASSROOM_RULES,
        ageGroup: AgeGroup.EARLY_SCHOOL,
        tags: ['enojo', 'clase', 'estrategias'],
        priority: 10
      },
      {
        title: 'Qué puedo hacer en clases',
        description: '- Usar herramientas sensoriales discretas\n- Pedir ayuda levantando la mano\n- Tomar notas con colores\n- Usar auriculares si hay mucho ruido',
        category: RecommendationCategory.CLASSROOM_RULES,
        ageGroup: AgeGroup.MIDDLE_SCHOOL,
        tags: ['estrategias', 'aula', 'concentración'],
        priority: 8
      },

      // ASKING_QUESTIONS
      {
        title: 'Cómo hacer preguntas',
        description: '1. Piensa qué quieres saber\n2. Levanta la mano y espera tu turno\n3. Habla claro y despacio\n4. Si no entiendes la respuesta, pide que te lo expliquen de otra manera',
        category: RecommendationCategory.ASKING_QUESTIONS,
        ageGroup: AgeGroup.EARLY_SCHOOL,
        tags: ['comunicación', 'preguntas', 'clase'],
        priority: 7
      },

      // SOCIAL_INTERACTION
      {
        title: 'Cómo interactuar con un amigo',
        description: '- Mantén una distancia cómoda\n- Mira a los ojos por momentos\n- Escucha sin interrumpir\n- Comparte tus ideas y juguetes\n- Pregunta "¿quieres jugar conmigo?"',
        category: RecommendationCategory.SOCIAL_INTERACTION,
        ageGroup: AgeGroup.EARLY_SCHOOL,
        tags: ['amistad', 'social', 'interacción'],
        priority: 9
      }
    ];
  }
}