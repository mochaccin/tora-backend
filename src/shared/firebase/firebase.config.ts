// src/shared/firebase/firebase.config.ts
import * as admin from 'firebase-admin';
import { Logger } from '@nestjs/common';

const logger = new Logger('FirebaseConfig');

export const initializeFirebase = (): admin.app.App => {
  if (admin.apps.length === 0) {
    try {
      logger.log('Initializing Firebase Admin SDK...');
      
      // Debug: Log environment variables (sin la private key completa por seguridad)
      logger.log(`FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID}`);
      logger.log(`FIREBASE_CLIENT_EMAIL: ${process.env.FIREBASE_CLIENT_EMAIL}`);
      logger.log(`FIREBASE_PRIVATE_KEY exists: ${!!process.env.FIREBASE_PRIVATE_KEY}`);
      logger.log(`FIREBASE_PRIVATE_KEY length: ${process.env.FIREBASE_PRIVATE_KEY?.length}`);
      
      if (!process.env.FIREBASE_PRIVATE_KEY) {
        throw new Error('FIREBASE_PRIVATE_KEY is not defined');
      }

      // Convertir \n a saltos de línea reales
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      
      // Verificar formato de la private key
      if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || 
          !privateKey.includes('-----END PRIVATE KEY-----')) {
        throw new Error('Invalid private key format');
      }

      const serviceAccount = {
        type: process.env.FIREBASE_TYPE,
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: privateKey,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      };

      logger.log('Firebase service account configured successfully');

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });

      logger.log('✅ Firebase Admin SDK initialized successfully');
      
    } catch (error) {
      logger.error('❌ Failed to initialize Firebase Admin SDK:', error);
      throw error;
    }
  }
  
  return admin.app();
};