import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase.js';

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
};

function getActiveSessionUser() {
  try {
    const raw = localStorage.getItem('ariq_admin_session_v2');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Mandatory Error Handler conforming strictly to FirestoreErrorInfo schema
 */
export function handleFirestoreError(error, operationType, path) {
  const sessionUser = getActiveSessionUser();
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: sessionUser?.userId || null,
      email: sessionUser?.email || null,
      username: sessionUser?.username || null,
      role: sessionUser?.role || null,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Get single document by ID
 */
export async function getDocument(collectionName, documentId) {
  const docRef = doc(db, collectionName, documentId);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${collectionName}/${documentId}`);
  }
}

/**
 * List documents with optional query constraints
 */
export async function listDocuments(collectionName, constraints = []) {
  const colRef = collection(db, collectionName);
  const q = constraints.length > 0 ? query(colRef, ...constraints) : colRef;
  try {
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionName);
  }
}

/**
 * Set document (create with specific ID or overwrite)
 */
export async function setDocument(collectionName, documentId, data, merge = true) {
  const docRef = doc(db, collectionName, documentId);
  try {
    await setDoc(docRef, { ...data, updated_at: new Date().toISOString() }, { merge });
    return { id: documentId, ...data };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${documentId}`);
  }
}

/**
 * Add document (auto-generated ID)
 */
export async function createDocument(collectionName, data) {
  const colRef = collection(db, collectionName);
  try {
    const docRef = await addDoc(colRef, {
      ...data,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return { id: docRef.id, ...data };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionName);
  }
}

/**
 * Update document
 */
export async function updateDocument(collectionName, documentId, data) {
  const docRef = doc(db, collectionName, documentId);
  try {
    await updateDoc(docRef, {
      ...data,
      updated_at: new Date().toISOString(),
    });
    return { id: documentId, ...data };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${documentId}`);
  }
}

/**
 * Delete document
 */
export async function deleteDocument(collectionName, documentId) {
  const docRef = doc(db, collectionName, documentId);
  try {
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${documentId}`);
  }
}

/**
 * Real-time listener for collection
 */
export function subscribeToCollection(collectionName, constraints = [], onNext, onError) {
  const colRef = collection(db, collectionName);
  const q = constraints.length > 0 ? query(colRef, ...constraints) : colRef;
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onNext(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionName);
      if (onError) onError(error);
    }
  );
}

/**
 * Real-time listener for document
 */
export function subscribeToDocument(collectionName, documentId, onNext, onError) {
  const docRef = doc(db, collectionName, documentId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        onNext({ id: snap.id, ...snap.data() });
      } else {
        onNext(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `${collectionName}/${documentId}`);
      if (onError) onError(error);
    }
  );
}

/**
 * Atomic Course Registration with Spot Reservation Transaction
 * Prevents race conditions and over-booking.
 */
export async function registerForCourseTransaction(registrationData) {
  const courseId = registrationData.curso_id;
  const courseRef = doc(db, 'courses', courseId);
  const regColRef = collection(db, 'course_registrations');

  try {
    const result = await runTransaction(db, async (transaction) => {
      const courseDoc = await transaction.get(courseRef);
      if (!courseDoc.exists()) {
        throw new Error('El curso seleccionado no existe.');
      }

      const course = courseDoc.data();
      const cuposDisponibles = Number(course.vacantes_disponibles ?? course.cupos_disponibles ?? 0);

      if (cuposDisponibles <= 0) {
        throw new Error('Lo sentimos, los cupos para este curso se encuentran completos.');
      }

      // Check duplicates in registrations if possible
      const newRegRef = doc(regColRef);
      const newVacantes = cuposDisponibles - 1;

      // Update course available spots atomically
      transaction.update(courseRef, {
        vacantes_disponibles: newVacantes,
        cupos_disponibles: newVacantes,
        updated_at: new Date().toISOString(),
      });

      // Write enrollment record
      const fullRecord = {
        ...registrationData,
        estado: 'pendiente',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      transaction.set(newRegRef, fullRecord);

      return { id: newRegRef.id, ...fullRecord, remainingSpots: newVacantes };
    });

    return result;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `course_registrations`);
  }
}

/**
 * Internal Audit Logger
 */
export async function logInternalActivity(action, moduleName, recordId, details = '') {
  try {
    const user = getActiveSessionUser();
    const logData = {
      usuario_email: user?.email || user?.username || 'sistema@ariq.org.ar',
      usuario_uid: user?.userId || 'system',
      usuario_rol: user?.role || 'admin',
      accion: action,
      modulo: moduleName,
      registro_id: String(recordId || ''),
      detalles: typeof details === 'object' ? JSON.stringify(details) : String(details),
      timestamp: new Date().toISOString(),
    };
    await addDoc(collection(db, 'internal_logs'), logData);
  } catch (e) {
    console.warn('No se pudo registrar log de auditoría:', e);
  }
}
