/**
 * @file imageService.js
 * Servicio centralizado para validación, redimensionamiento, compresión y conversión
 * de imágenes a Base64 para almacenamiento exclusivo en Cloud Firestore (sin Firebase Storage).
 * 
 * Límite estricto: <= 300 KB por imagen para respetar el límite de 1 MiB de Firestore.
 */

// Formatos permitidos
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB antes de comprimir
export const MAX_COMPRESSED_SIZE_KB = 300; // 300 KB límite final en Firestore
export const MAX_DIMENSION_PX = 1200; // Ancho/alto máximo para imágenes principales
export const THUMBNAIL_DIMENSION_PX = 400; // Ancho/alto máximo para miniaturas

/**
 * Valida formato y tamaño del archivo original
 */
export function validateImage(file) {
  if (!file) {
    throw new Error('No se ha proporcionado ningún archivo.');
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(
      `Formato de imagen no permitido (${file.type || 'desconocido'}). Utilice WebP, JPEG o PNG.`
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`La imagen original supera el límite de 5 MB (${sizeMb} MB).`);
  }

  return true;
}

/**
 * Convierte un File a Data URL Base64 sin compresión
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(new Error('Error al leer el archivo: ' + error));
    reader.readAsDataURL(file);
  });
}

/**
 * Obtiene dimensiones (ancho y alto) de un archivo o Data URL
 */
export function getImageDimensions(fileOrBase64) {
  return new Promise(async (resolve, reject) => {
    try {
      const src =
        typeof fileOrBase64 === 'string'
          ? fileOrBase64
          : await fileToBase64(fileOrBase64);

      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error('No se pudieron obtener las dimensiones de la imagen.'));
      img.src = src;
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Analiza una cadena Base64 Data URL (tamaño en KB, MIME, etc.)
 */
export function getImageData(base64) {
  if (!base64 || typeof base64 !== 'string') {
    return { sizeKb: 0, mimeType: '', isValid: false };
  }

  const match = base64.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return { sizeKb: 0, mimeType: '', isValid: false };
  }

  const mimeType = match[1];
  const base64Data = match[2];
  // Cada 4 caracteres base64 equivalen a 3 bytes
  const bytes = (base64Data.length * 3) / 4;
  const sizeKb = Math.round(bytes / 1024);

  return {
    sizeKb,
    mimeType,
    isValid: true,
  };
}

/**
 * Redimensiona y comprime una imagen utilizando Canvas en memoria
 * @param {File|string} fileOrBase64 - Archivo File o Data URL existente
 * @param {Object} options - Configuración de compresión
 * @param {number} options.maxDimension - Dimensión máxima en píxeles (ancho o alto)
 * @param {number} options.maxSizeKb - Peso máximo permitido en KB (por defecto 300)
 * @param {string} options.preferFormat - 'image/webp' | 'image/jpeg' | 'image/png'
 * @param {number} options.initialQuality - Calidad inicial (0 a 1)
 */
export async function compressImage(fileOrBase64, options = {}) {
  const {
    maxDimension = MAX_DIMENSION_PX,
    maxSizeKb = MAX_COMPRESSED_SIZE_KB,
    preferFormat = null,
    initialQuality = 0.82,
    keepTransparency = false,
  } = options;

  const src =
    typeof fileOrBase64 === 'string'
      ? fileOrBase64
      : await fileToBase64(fileOrBase64);

  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Fallo al cargar la imagen en memoria para compresión.'));
    el.src = src;
  });

  // Calcular nuevas dimensiones proporcionales
  let { naturalWidth: width, naturalHeight: height } = img;
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  // Crear canvas en memoria
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: true });

  if (!ctx) {
    throw new Error('No se pudo inicializar el contexto 2D de Canvas.');
  }

  // Detectar formato de salida óptimo
  let outputFormat = preferFormat;
  if (!outputFormat) {
    // Si la imagen original es PNG y se requiere conservar transparencia (ej. logos)
    const isPng = src.startsWith('data:image/png');
    if (isPng || keepTransparency) {
      // Intentar WebP que soporta transparencia con compresión muy superior a PNG
      outputFormat = 'image/webp';
    } else {
      outputFormat = 'image/webp';
    }
  }

  // Si no soporta transparencia y convertimos a JPEG, rellenar fondo blanco
  if (outputFormat === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(img, 0, 0, width, height);

  // Compresión iterativa si supera el límite de KB
  let quality = initialQuality;
  let resultBase64 = canvas.toDataURL(outputFormat, quality);
  let currentData = getImageData(resultBase64);

  let iterations = 0;
  while (currentData.sizeKb > maxSizeKb && quality > 0.45 && iterations < 5) {
    quality -= 0.1;
    resultBase64 = canvas.toDataURL(outputFormat, quality);
    currentData = getImageData(resultBase64);
    iterations++;
  }

  // Si aún supera el límite después de bajar calidad, reducir dimensiones
  if (currentData.sizeKb > maxSizeKb) {
    const scaleFactor = 0.75;
    canvas.width = Math.round(width * scaleFactor);
    canvas.height = Math.round(height * scaleFactor);
    const ctx2 = canvas.getContext('2d');
    if (ctx2) {
      if (outputFormat === 'image/jpeg') {
        ctx2.fillStyle = '#FFFFFF';
        ctx2.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx2.drawImage(img, 0, 0, canvas.width, canvas.height);
      resultBase64 = canvas.toDataURL(outputFormat, 0.75);
      currentData = getImageData(resultBase64);
    }
  }

  return {
    base64: resultBase64,
    mimeType: currentData.mimeType,
    sizeKb: currentData.sizeKb,
    width: canvas.width,
    height: canvas.height,
  };
}

/**
 * Genera una miniatura ligera (~20-50 KB) para listados y tarjetas
 */
export async function createThumbnail(fileOrBase64, maxDimension = THUMBNAIL_DIMENSION_PX) {
  return compressImage(fileOrBase64, {
    maxDimension,
    maxSizeKb: 60,
    initialQuality: 0.75,
  });
}

/**
 * Pipeline completo: Valida, redimensiona, comprime y genera miniatura
 * Listo para persistir en Firestore
 */
export async function prepareImageForFirestore(file, options = {}) {
  validateImage(file);

  const originalSizeKb = Math.round(file.size / 1024);

  // 1. Comprimir imagen principal
  const mainImage = await compressImage(file, {
    maxDimension: options.maxDimension || MAX_DIMENSION_PX,
    maxSizeKb: options.maxSizeKb || MAX_COMPRESSED_SIZE_KB,
    keepTransparency: options.keepTransparency || file.type === 'image/png',
  });

  // 2. Generar miniatura opcional para optimizar listados
  let thumbnail = null;
  if (options.generateThumbnail !== false) {
    try {
      thumbnail = await createThumbnail(mainImage.base64);
    } catch {
      thumbnail = null;
    }
  }

  return {
    base64: mainImage.base64,
    miniaturaBase64: thumbnail?.base64 || mainImage.base64,
    mimeType: mainImage.mimeType,
    sizeKb: mainImage.sizeKb,
    originalSizeKb,
    width: mainImage.width,
    height: mainImage.height,
  };
}

/**
 * Descarga una imagen desde una URL local o remota y la convierte a Base64
 * Útil para la migración de assets iniciales (ej. /images/logo-ariq.png)
 */
export async function urlToBase64(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return fileToBase64(blob);
}
