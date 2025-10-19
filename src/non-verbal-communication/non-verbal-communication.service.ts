// src/non-verbal-communication/non-verbal-communication.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { 
  NonVerbalCommunication, 
  NonVerbalCommunicationDocument, 
  CommunicationType,
} from '../shared/schemas/non-verbal-communication.schema';

import { AgeGroup } from '../shared/schemas/recommendation.schema';

@Injectable()
export class NonVerbalCommunicationService {
  constructor(
    @InjectModel(NonVerbalCommunication.name) 
    private nonVerbalModel: Model<NonVerbalCommunicationDocument>,
  ) {}

  async initializeDefaultCommunications() {
    const count = await this.nonVerbalModel.countDocuments();
    if (count === 0) {
      await this.nonVerbalModel.insertMany(this.getDefaultCommunications());
      console.log('Default non-verbal communications initialized');
    }
  }

  async getAllByAgeGroup(age: number, type?: CommunicationType) {
    const ageGroup = this.getAgeGroup(age);
    
    const query: any = { 
      ageGroup,
      active: true 
    };

    if (type) {
      query.type = type;
    }

    return this.nonVerbalModel
      .find(query)
      .sort({ title: 1 })
      .exec();
  }

  async getByType(type: CommunicationType, ageGroup?: AgeGroup) {
    const query: any = { 
      type,
      active: true 
    };

    if (ageGroup) {
      query.ageGroup = ageGroup;
    }

    return this.nonVerbalModel
      .find(query)
      .sort({ title: 1 })
      .exec();
  }

  async getTypicalPhrases() {
    const communications = await this.nonVerbalModel
      .find({ active: true })
      .select('typicalPhrases title')
      .exec();

    const phrases = communications.flatMap(comm => 
      comm.typicalPhrases.map(phrase => ({
        phrase,
        context: comm.title,
        category: comm.type
      }))
    );

    return phrases;
  }

  private getAgeGroup(age: number): AgeGroup {
    if (age >= 3 && age <= 5) return AgeGroup.PRESCHOOL;
    if (age >= 6 && age <= 8) return AgeGroup.EARLY_SCHOOL;
    if (age >= 9 && age <= 12) return AgeGroup.MIDDLE_SCHOOL;
    return AgeGroup.TEEN;
  }

  private getDefaultCommunications(): Partial<NonVerbalCommunication>[] {
    return [
      // GESTURES
      {
        title: 'Brazo cruzado',
        description: 'Cuando alguien cruza los brazos',
        type: CommunicationType.GESTURE,
        examples: ['Cruzar los brazos sobre el pecho', 'Brazos apretados contra el cuerpo'],
        typicalPhrases: ['No estoy de acuerdo', 'Me siento incómodo', 'Estoy a la defensiva'],
        whatItMeans: ['Puede indicar incomodidad o desacuerdo', 'A veces es solo una postura cómoda'],
        howToRespond: ['Pregunta si todo está bien', 'Ofrece un espacio seguro para hablar', 'Respeta su espacio personal'],
        ageGroup: AgeGroup.EARLY_SCHOOL
      },
      {
        title: 'Jugar con las manos',
        description: 'Cuando alguien mueve mucho las manos o juega con objetos',
        type: CommunicationType.GESTURE,
        examples: ['Girar un lápiz', 'Jugar con la ropa', 'Mover los dedos'],
        typicalPhrases: ['Estoy pensando', 'Me siento nervioso', 'Necesito moverme'],
        whatItMeans: ['Puede ser una forma de regular la energía', 'A veces indica ansiedad o aburrimiento'],
        howToRespond: ['Ofrece una herramienta sensorial', 'Pregunta si necesita un descanso', 'Entiende que es una necesidad sensorial'],
        ageGroup: AgeGroup.EARLY_SCHOOL
      },

      // FACIAL_EXPRESSIONS
      {
        title: 'Cejas fruncidas',
        description: 'Cuando alguien junta las cejas hacia el centro',
        type: CommunicationType.FACIAL_EXPRESSION,
        examples: ['Cejas hacia abajo', 'Arrugas en la frente', 'Mirada concentrada'],
        typicalPhrases: ['Estoy confundido', 'No entiendo', 'Estoy pensando mucho'],
        whatItMeans: ['Puede indicar confusión o concentración', 'A veces es una expresión natural al pensar'],
        howToRespond: ['Pregunta "¿hay algo que no entiendes?"', 'Ofrece explicar de otra manera', 'Da tiempo para procesar'],
        ageGroup: AgeGroup.EARLY_SCHOOL
      },
      {
        title: 'Sonrisa grande',
        description: 'Cuando alguien muestra los dientes al sonreír',
        type: CommunicationType.FACIAL_EXPRESSION,
        examples: ['Ojos entrecerrados', 'Mejillas levantadas', 'Dientes visibles'],
        typicalPhrases: ['¡Estoy muy feliz!', 'Me gusta esto', 'Me divierto mucho'],
        whatItMeans: ['Alegría genuina', 'Entusiasmo', 'Diversión'],
        howToRespond: ['Sonríe de vuelta', 'Comparte la alegría', 'Pregunta qué le hace feliz'],
        ageGroup: AgeGroup.PRESCHOOL
      },

      // BODY_LANGUAGE
      {
        title: 'Cuerpo girado',
        description: 'Cuando alguien no mira directamente hacia ti',
        type: CommunicationType.BODY_LANGUAGE,
        examples: ['Cuerpo hacia la puerta', 'Mirada hacia otro lado', 'Pies apuntando hacia la salida'],
        typicalPhrases: ['Quiero irme', 'No me interesa esto', 'Estoy incómodo'],
        whatItMeans: ['Puede indicar desinterés o incomodidad', 'A veces es solo una postura casual'],
        howToRespond: ['Pregunta si quiere cambiar de actividad', 'Ofrece alternativas', 'Respeta su necesidad de espacio'],
        ageGroup: AgeGroup.MIDDLE_SCHOOL
      },

      // SOCIAL_PHRASES
      {
        title: 'Frases para iniciar conversación',
        description: 'Formas de acercarse a otros niños',
        type: CommunicationType.SOCIAL_PHRASE,
        examples: ['¿Puedo jugar contigo?', '¿Te gusta este juego?', '¿Quieres ser mi amigo?'],
        typicalPhrases: ['Hola, me llamo...', '¿Qué estás haciendo?', 'Eso se ve divertido'],
        whatItMeans: ['Quiero interactuar contigo', 'Me interesa lo que haces', 'Busco amistad'],
        howToRespond: ['Responde con amabilidad', 'Inclúyelo en la actividad', 'Si no puedes ahora, explícale por qué'],
        ageGroup: AgeGroup.EARLY_SCHOOL
      },
      {
        title: 'Frases para expresar necesidades',
        description: 'Cómo pedir ayuda o expresar incomodidad',
        type: CommunicationType.SOCIAL_PHRASE,
        examples: ['Necesito un descanso', '¿Puedes explicarlo de nuevo?', 'Este ruido me molesta'],
        typicalPhrases: ['No entiendo', 'Me siento incómodo', 'Necesito ayuda'],
        whatItMeans: ['Tengo una necesidad no cubierta', 'Estoy teniendo dificultades', 'Requiero apoyo'],
        howToRespond: ['Escucha atentamente', 'Ofrece ayuda concreta', 'Valida sus sentimientos'],
        ageGroup: AgeGroup.MIDDLE_SCHOOL
      }
    ];
  }
}