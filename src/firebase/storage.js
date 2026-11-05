import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from './firebase.js';

export const STORAGE_FOLDERS = {
  INSTITUTIONAL: 'institutional',
  NEWS: 'news',
  COURSES: 'courses',
  EVENTS: 'events',
  DOCUMENTS: 'documents',
};

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
];

const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_DOC_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

/**
 * Upload a file to Firebase Storage with progress tracking and validations
 */
export async function uploadFileToStorage(file, folder = STORAGE_FOLDERS.NEWS, onProgress = null) {
  if (!file) {
    throw new Error('No se seleccionó ningún archivo para subir.');
  }

  const isImage = file.type.startsWith('image/');
  const allowed = isImage ? ALLOWED_IMAGE_TYPES : ALLOWED_DOC_TYPES;
  const maxSize = isImage ? MAX_IMAGE_SIZE_BYTES : MAX_DOC_SIZE_BYTES;

  if (!allowed.includes(file.type)) {
    throw new Error(
      `Tipo de archivo no permitido (${file.type}). Formatos admitidos: JPG, PNG, WEBP, SVG o PDF.`
    );
  }

  if (file.size > maxSize) {
    const maxMb = Math.round(maxSize / (1024 * 1024));
    throw new Error(`El archivo excede el tamaño máximo permitido de ${maxMb} MB.`);
  }

  // Create clean filename with timestamp to prevent collisions
  const cleanName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, '_')
    .replace(/_{2,}/g, '_');
  const timestamp = Date.now();
  const storagePath = `${folder}/${timestamp}_${cleanName}`;
  const storageRef = ref(storage, storagePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        console.error('Error al subir archivo a Firebase Storage:', error);
        reject(new Error(`Error al subir archivo: ${error.message}`));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            downloadUrl,
            storagePath,
            name: file.name,
            size: file.size,
            type: file.type,
          });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/**
 * Delete a file from Firebase Storage by path or URL
 */
export async function deleteFileFromStorage(storagePathOrUrl) {
  if (!storagePathOrUrl) return false;
  try {
    let fileRef;
    if (storagePathOrUrl.startsWith('http://') || storagePathOrUrl.startsWith('https://')) {
      fileRef = ref(storage, storagePathOrUrl);
    } else {
      fileRef = ref(storage, storagePathOrUrl);
    }
    await deleteObject(fileRef);
    return true;
  } catch (error) {
    console.warn('No se pudo eliminar el archivo en Firebase Storage:', error);
    return false;
  }
}
