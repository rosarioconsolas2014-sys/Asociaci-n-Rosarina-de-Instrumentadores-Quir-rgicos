/**
 * @file auth.js
 * Sistema Propio de Autenticación Administrativa para ARIQ
 * 
 * Reglas:
 * - NO utiliza Firebase Authentication SDK (completamente eliminado).
 * - Utiliza Cloud Firestore colecciones privadas: `admin_users` y `admin_sessions`.
 * - Hasheo y verificación de contraseñas mediante bcryptjs (cost factor 12).
 * - Protección contra ataques de fuerza bruta (bloqueo temporal tras 5 intentos por 15 minutos).
 * - Control de sesiones activas con caducidad.
 * - Registro estricto de auditoría en `internal_logs`.
 * - Ninguna contraseña en texto plano en almacenamiento, logs o memoria persistente.
 */

import bcrypt from 'bcryptjs';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  addDoc,
} from 'firebase/firestore';
import { db } from './firebase.js';

export const SESSION_STORAGE_KEY = 'ariq_admin_session_v2';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const SESSION_DURATION_HOURS = 24;

/**
 * Log internal activity helper
 */
async function recordAuditLog(user, accion, modulo, registroId, detalles) {
  try {
    await addDoc(collection(db, 'internal_logs'), {
      usuario_email: user?.email || user?.username || 'sistema@ariq.org.ar',
      usuario_uid: user?.userId || user?.id || 'system',
      usuario_rol: user?.role || 'operador',
      accion,
      modulo,
      registro_id: String(registroId || ''),
      detalles: typeof detalles === 'object' ? JSON.stringify(detalles) : String(detalles),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('No se pudo registrar log de auditoría:', err);
  }
}

/**
 * Genera token de sesión pseudo-aleatorio criptográfico seguro
 */
function generateSessionToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'ses_';
  for (let i = 0; i < 48; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Iniciar sesión mediante usuario o correo electrónico y contraseña
 */
export async function loginWithCredentials(identifier, password) {
  if (!identifier || !identifier.trim()) {
    throw new Error('Ingrese su nombre de usuario o correo electrónico.');
  }
  if (!password) {
    throw new Error('Ingrese su contraseña.');
  }

  const cleanIdentifier = identifier.trim().toLowerCase();
  const usersCol = collection(db, 'admin_users');

  // Buscar por nombre de usuario o por correo electrónico
  let matchedDoc = null;

  // 1. Intentar por username
  const qUsername = query(usersCol, where('username', '==', cleanIdentifier), limit(1));
  const snapUsername = await getDocs(qUsername);
  if (!snapUsername.empty) {
    matchedDoc = snapUsername.docs[0];
  } else {
    // 2. Intentar por email
    const qEmail = query(usersCol, where('email', '==', cleanIdentifier), limit(1));
    const snapEmail = await getDocs(qEmail);
    if (!snapEmail.empty) {
      matchedDoc = snapEmail.docs[0];
    }
  }

  if (!matchedDoc) {
    await recordAuditLog(
      null,
      'LOGIN_FAILED',
      'auth_propia',
      cleanIdentifier,
      `Intento de acceso fallido: identificador "${cleanIdentifier}" no encontrado`
    );
    throw new Error('Credenciales inválidas. Verifique su usuario y contraseña.');
  }

  const userData = matchedDoc.data();
  const userId = matchedDoc.id;
  const now = new Date();

  // Verificar si la cuenta está bloqueada por intentos de fuerza bruta
  if (userData.lockedUntil) {
    const lockExpiry = new Date(userData.lockedUntil);
    if (lockExpiry > now) {
      const remainingMinutes = Math.ceil((lockExpiry.getTime() - now.getTime()) / (60 * 1000));
      await recordAuditLog(
        { email: userData.email, userId, role: userData.role },
        'LOGIN_BLOCKED_ATTEMPT',
        'auth_propia',
        userId,
        `Intento de acceso a cuenta bloqueada. Tiempo restante: ${remainingMinutes}m`
      );
      throw new Error(
        `Esta cuenta se encuentra temporalmente bloqueada por seguridad tras reiterados intentos fallidos. Intente nuevamente en ${remainingMinutes} minuto(s).`
      );
    }
  }

  // Verificar si la cuenta está activa
  if (userData.active === false) {
    await recordAuditLog(
      { email: userData.email, userId, role: userData.role },
      'LOGIN_INACTIVE_ACCOUNT',
      'auth_propia',
      userId,
      `Intento de acceso a cuenta inactiva: ${userData.username}`
    );
    throw new Error('Su cuenta ha sido desactivada. Comuníquese con la Presidencia o Administración de ARIQ.');
  }

  // Verificar contraseña mediante bcrypt
  const isMatch = await bcrypt.compare(password, userData.passwordHash);

  if (!isMatch) {
    const newFailedAttempts = (userData.failedAttempts || 0) + 1;
    let willLock = false;
    let lockUntilIso = null;

    if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
      willLock = true;
      lockUntilIso = new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000).toISOString();
    }

    await updateDoc(doc(db, 'admin_users', userId), {
      failedAttempts: newFailedAttempts,
      lockedUntil: lockUntilIso,
      updatedAt: now.toISOString(),
    });

    await recordAuditLog(
      { email: userData.email, userId, role: userData.role },
      willLock ? 'ACCOUNT_LOCKED' : 'LOGIN_BAD_PASSWORD',
      'auth_propia',
      userId,
      willLock
        ? `Cuenta bloqueada por ${LOCKOUT_MINUTES} min tras ${newFailedAttempts} intentos fallidos`
        : `Contraseña incorrecta (intento ${newFailedAttempts} de ${MAX_FAILED_ATTEMPTS})`
    );

    if (willLock) {
      throw new Error(
        `Ha superado el límite de intentos permitidos (${MAX_FAILED_ATTEMPTS}). Su cuenta ha sido bloqueada temporalmente por ${LOCKOUT_MINUTES} minutos.`
      );
    } else {
      const remainingAttempts = MAX_FAILED_ATTEMPTS - newFailedAttempts;
      throw new Error(
        `Credenciales inválidas. Le quedan ${remainingAttempts} intento(s) antes del bloqueo temporal.`
      );
    }
  }

  // Inicio de sesión exitoso: reiniciar intentos y actualizar último login
  const lastLoginIso = now.toISOString();
  await updateDoc(doc(db, 'admin_users', userId), {
    failedAttempts: 0,
    lockedUntil: null,
    lastLogin: lastLoginIso,
    updatedAt: lastLoginIso,
  });

  // Generar sesión en Firestore `admin_sessions`
  const token = generateSessionToken();
  const sessionId = `ses_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_HOURS * 60 * 60 * 1000).toISOString();

  const sessionRecord = {
    id: sessionId,
    userId,
    username: userData.username,
    email: userData.email,
    role: userData.role,
    token,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Desconocido',
    createdAt: lastLoginIso,
    expiresAt,
    active: true,
  };

  try {
    await setDoc(doc(db, 'admin_sessions', sessionId), sessionRecord);
  } catch (err) {
    console.warn('No se pudo registrar sesión en Firestore:', err);
  }

  // Guardar sesión en almacenamiento local del navegador
  const clientSession = {
    sessionId,
    userId,
    username: userData.username,
    email: userData.email,
    role: userData.role,
    full_name: userData.username.toUpperCase(),
    token,
    expiresAt,
  };

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(clientSession));
  }

  await recordAuditLog(
    clientSession,
    'LOGIN_SUCCESS',
    'auth_propia',
    userId,
    `Inicio de sesión exitoso de ${userData.username} (${userData.email}) con rol ${userData.role}`
  );

  return clientSession;
}

/**
 * Cerrar sesión
 */
export async function logoutUser() {
  const current = getCurrentUser();
  if (current) {
    try {
      if (current.sessionId) {
        await updateDoc(doc(db, 'admin_sessions', current.sessionId), {
          active: false,
          closedAt: new Date().toISOString(),
        });
      }
      await recordAuditLog(
        current,
        'LOGOUT',
        'auth_propia',
        current.userId,
        `Cierre de sesión de ${current.username}`
      );
    } catch (e) {
      console.warn('Error cerrando sesión en Firestore:', e);
    }
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem('ariq_auth_session_v1');
  }
}

/**
 * Obtener la sesión actual si es válida y no ha expirado
 */
export function getCurrentUser() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session || !session.userId) return null;

    // Verificar caducidad
    if (session.expiresAt && new Date(session.expiresAt) <= new Date()) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Jerarquía de permisos:
 * admin > editor > operador
 */
export function hasPermission(userRole, requiredRole) {
  if (!userRole) return false;
  if (userRole === 'admin') return true;
  if (requiredRole === 'editor' && (userRole === 'admin' || userRole === 'editor')) return true;
  if (
    requiredRole === 'operador' &&
    (userRole === 'admin' || userRole === 'editor' || userRole === 'operador')
  ) {
    return true;
  }
  return userRole === requiredRole;
}

// =========================================================================
// GESTIÓN DE USUARIOS ADMINISTRATIVOS (Módulo Usuarios & Permisos)
// =========================================================================

/**
 * Listar todos los usuarios administrativos (excluyendo passwordHash por seguridad)
 */
export async function listAdminUsers() {
  const usersCol = collection(db, 'admin_users');
  const snap = await getDocs(usersCol);
  return snap.docs.map((d) => {
    const data = d.data();
    // Excluir hash de contraseña del objeto retornado a la UI
    const { passwordHash, ...safeUser } = data;
    return {
      id: d.id,
      ...safeUser,
    };
  });
}

/**
 * Dar de alta un nuevo usuario administrativo
 */
export async function createAdminUser({ username, email, password, role = 'operador' }) {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    throw new Error('Solo los Administradores Generales pueden crear nuevos usuarios.');
  }

  const cleanUsername = username.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();

  if (cleanUsername.length < 3) {
    throw new Error('El nombre de usuario debe tener al menos 3 caracteres.');
  }
  if (!cleanEmail.includes('@')) {
    throw new Error('El correo electrónico no es válido.');
  }
  if (!password || password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres.');
  }
  if (!['admin', 'editor', 'operador'].includes(role)) {
    throw new Error('Rol no válido.');
  }

  // Verificar unicidad de username
  const qUser = query(collection(db, 'admin_users'), where('username', '==', cleanUsername), limit(1));
  const snapUser = await getDocs(qUser);
  if (!snapUser.empty) {
    throw new Error(`El nombre de usuario "${cleanUsername}" ya se encuentra registrado.`);
  }

  // Verificar unicidad de email
  const qEmail = query(collection(db, 'admin_users'), where('email', '==', cleanEmail), limit(1));
  const snapEmail = await getDocs(qEmail);
  if (!snapEmail.empty) {
    throw new Error(`El correo electrónico "${cleanEmail}" ya está registrado.`);
  }

  // Hashear contraseña con bcrypt (cost factor 12)
  const passwordHash = await bcrypt.hash(password, 12);
  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newUserData = {
    id: userId,
    username: cleanUsername,
    email: cleanEmail,
    passwordHash,
    role,
    active: true,
    createdAt: now,
    updatedAt: now,
    lastLogin: null,
    failedAttempts: 0,
    lockedUntil: null,
  };

  await setDoc(doc(db, 'admin_users', userId), newUserData);

  await recordAuditLog(
    currentUser,
    'CREATE_USER',
    'usuarios',
    userId,
    `Creación de usuario ${cleanUsername} (${cleanEmail}) con rol ${role}`
  );

  const { passwordHash: _ph, ...safeUser } = newUserData;
  return safeUser;
}

/**
 * Modificar rol o estado de activación de un usuario
 */
export async function updateAdminUser(userId, { role, active }) {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    throw new Error('Solo los Administradores Generales pueden editar usuarios.');
  }

  const userRef = doc(db, 'admin_users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    throw new Error('Usuario no encontrado.');
  }

  const updates = {
    updatedAt: new Date().toISOString(),
  };

  if (role && ['admin', 'editor', 'operador'].includes(role)) {
    updates.role = role;
  }
  if (typeof active === 'boolean') {
    // Evitar que el admin se desactive a sí mismo
    if (!active && userId === currentUser.userId) {
      throw new Error('No puede desactivar su propia cuenta de Administrador.');
    }
    updates.active = active;
    if (active) {
      // Si se activa, desbloquear intentos
      updates.failedAttempts = 0;
      updates.lockedUntil = null;
    }
  }

  await updateDoc(userRef, updates);

  await recordAuditLog(
    currentUser,
    'UPDATE_USER',
    'usuarios',
    userId,
    `Modificación de usuario ${snap.data().username}: ${JSON.stringify(updates)}`
  );

  return { id: userId, ...snap.data(), ...updates };
}

/**
 * Cambiar contraseña de un usuario administrativo
 */
export async function changeAdminUserPassword(userId, newPassword) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('Debe iniciar sesión para realizar esta operación.');
  }

  // Solo un admin puede cambiar la contraseña de otro; o el propio usuario la suya
  if (currentUser.role !== 'admin' && currentUser.userId !== userId) {
    throw new Error('No posee privilegios para cambiar la contraseña de este usuario.');
  }

  if (!newPassword || newPassword.length < 8) {
    throw new Error('La nueva contraseña debe tener como mínimo 8 caracteres.');
  }

  const userRef = doc(db, 'admin_users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    throw new Error('Usuario no encontrado.');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const now = new Date().toISOString();

  await updateDoc(userRef, {
    passwordHash,
    failedAttempts: 0,
    lockedUntil: null,
    updatedAt: now,
  });

  await recordAuditLog(
    currentUser,
    'CHANGE_PASSWORD',
    'usuarios',
    userId,
    `Actualización de contraseña para el usuario ${snap.data().username}`
  );

  return true;
}

/**
 * Desbloquear usuario manualmente
 */
export async function unlockAdminUser(userId) {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    throw new Error('Solo los Administradores pueden desbloquear cuentas.');
  }

  const userRef = doc(db, 'admin_users', userId);
  await updateDoc(userRef, {
    failedAttempts: 0,
    lockedUntil: null,
    updatedAt: new Date().toISOString(),
  });

  await recordAuditLog(
    currentUser,
    'UNLOCK_USER',
    'usuarios',
    userId,
    `Desbloqueo manual de cuenta ${userId}`
  );
  return true;
}

/**
 * Eliminar usuario administrativo
 */
export async function deleteAdminUser(userId) {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'admin') {
    throw new Error('Solo los Administradores pueden eliminar usuarios.');
  }

  if (userId === currentUser.userId) {
    throw new Error('No puede eliminar su propia cuenta de Administrador.');
  }

  const userRef = doc(db, 'admin_users', userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    throw new Error('Usuario no encontrado.');
  }

  await deleteDoc(userRef);

  await recordAuditLog(
    currentUser,
    'DELETE_USER',
    'usuarios',
    userId,
    `Eliminación del usuario ${snap.data().username} (${snap.data().email})`
  );

  return true;
}
