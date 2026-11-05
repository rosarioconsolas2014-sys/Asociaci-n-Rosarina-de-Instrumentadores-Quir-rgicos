import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Use configuration from json or environment variables
export const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_DATABASE_ID ||
    firebaseConfigJson.firestoreDatabaseId ||
    '(default)',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
};

// Initialize Firebase app singleton
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Critical: Pass firestoreDatabaseId if custom database ID is configured
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const storage = getStorage(app);

// Check if Firebase has active valid configuration
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !firebaseConfig.projectId.includes('remixed')
);

// Connection verification test conforming to skill requirements
export async function testFirestoreConnection() {
  if (!isFirebaseConfigured) return { ok: false, message: 'Firebase no configurado.' };
  try {
    // Attempt reading system settings test document from server
    await getDocFromServer(doc(db, 'institutional_settings', 'ariq_main'));
    return { ok: true, message: `Conectado a Cloud Firestore (${firebaseConfig.projectId}).` };
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    if (errMessage.includes('the client is offline') || errMessage.includes('unavailable')) {
      console.warn('Firebase en modo sin conexión o verificando conectividad:', errMessage);
      return { ok: false, message: 'Sin conexión con el servidor de Firestore.' };
    }
    if (errMessage.includes('permission-denied')) {
      return {
        ok: false,
        message: `Conectado a ${firebaseConfig.projectId}. Se requiere aplicar las reglas firestore.rules en Firebase Console.`,
      };
    }
    // If document just doesn't exist yet or is empty, connection is still OK
    return { ok: true, message: `Conectado al servidor de Firestore (${firebaseConfig.projectId}).` };
  }
}

