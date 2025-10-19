// src/shared/firebase/firebase.config.ts
import * as admin from 'firebase-admin';

export const initializeFirebase = (): admin.app.App => {
  if (admin.apps.length === 0) {
    // For development, you can use a service account or application default credentials
    if (process.env.FIREBASE_PRIVATE_KEY) {
      const serviceAccount = {
        type: process.env.FIREBASE_TYPE,
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
    } else {
      // Use application default credentials (for production environments like GCP)
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
  }
  
  return admin.app();
};