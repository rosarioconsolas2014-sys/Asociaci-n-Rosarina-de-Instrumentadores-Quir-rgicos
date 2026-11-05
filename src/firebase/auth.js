import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db, isFirebaseConfigured } from './firebase.js';
import { logInternalActivity } from './firestore.js';

// Pre-defined demo users for quick development & fallback
export const DEMO_USERS = [
  {
    id: 'usr_admin_001',
    email: 'admin@ariq.org.ar',
    password: 'adminariq2026',
    full_name: 'Lic. Claudia S. Morales',
    role: 'admin',
    cargo: 'Presidente - Comisión Directiva',
  },
  {
    id: 'usr_editor_002',
    email: 'editor@ariq.org.ar',
    password: 'editorariq2026',
    full_name: 'Prof. Javier V. Giménez',
    role: 'editor',
    cargo: 'Coordinador del Comité Científico',
  },
  {
    id: 'usr_operador_003',
    email: 'operador@ariq.org.ar',
    password: 'operadorariq2026',
    full_name: 'Tec. Lucía R. Mendoza',
    role: 'operador',
    cargo: 'Secretaría de Admisión y Cursos',
  },
];

const LOCAL_SESSION_KEY = 'ariq_auth_session_v1';

/**
 * Fetch or bootstrap user profile from Firestore
 */
export async function getUserProfile(uid, defaultEmail = '') {
  try {
    const profileRef = doc(db, 'profiles', uid);
    const snap = await getDoc(profileRef);

    if (snap.exists()) {
      return snap.data();
    }

    // If logging in with the developer/admin email, automatically assign admin role
    const isAdminEmail =
      defaultEmail.toLowerCase() === 'rosarioconsolas2014@gmail.com' ||
      defaultEmail.toLowerCase() === 'admin@ariq.org.ar';

    const newProfile = {
      uid,
      email: defaultEmail,
      full_name: defaultEmail.split('@')[0],
      role: isAdminEmail ? 'admin' : 'operador',
      cargo: isAdminEmail ? 'Administrador General' : 'Operador de Gestión',
      activo: true,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
    };

    await setDoc(profileRef, newProfile);
    return newProfile;
  } catch (error) {
    console.warn('No se pudo leer perfil desde Firestore, usando perfil provisional:', error);
    return {
      uid,
      email: defaultEmail,
      full_name: defaultEmail.split('@')[0] || 'Usuario ARIQ',
      role: defaultEmail.includes('admin') || defaultEmail === 'rosarioconsolas2014@gmail.com' ? 'admin' : 'operador',
      cargo: 'Miembro Institucional',
      activo: true,
    };
  }
}

/**
 * Sign in with Google (Popup)
 */
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const profile = await getUserProfile(user.uid, user.email);

  const session = {
    id: user.uid,
    uid: user.uid,
    email: user.email,
    full_name: profile.full_name || user.displayName || user.email,
    role: profile.role || 'operador',
    cargo: profile.cargo || 'Miembro',
    provider: 'google',
  };

  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
  await logInternalActivity('LOGIN_GOOGLE', 'auth', user.uid, `Ingreso de ${user.email}`);
  return session;
}

/**
 * Sign in with Email and Password
 */
export async function loginWithEmail(email, password) {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Try Firebase Authentication first
  if (isFirebaseConfigured) {
    try {
      const userCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCred.user;
      const profile = await getUserProfile(user.uid, user.email);

      const session = {
        id: user.uid,
        uid: user.uid,
        email: user.email,
        full_name: profile.full_name || user.displayName || user.email,
        role: profile.role || 'operador',
        cargo: profile.cargo || 'Miembro',
        provider: 'password',
      };

      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
      await logInternalActivity('LOGIN_PASSWORD', 'auth', user.uid, `Ingreso de ${user.email}`);
      return session;
    } catch (fbErr) {
      // If user not found in Firebase Auth yet, check demo users to allow seamless testing
      const foundDemo = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === cleanEmail && u.password === password
      );

      if (foundDemo) {
        // Attempt to create the user in Firebase Auth automatically
        try {
          const newCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
          const profile = {
            uid: newCred.user.uid,
            email: cleanEmail,
            full_name: foundDemo.full_name,
            role: foundDemo.role,
            cargo: foundDemo.cargo,
            activo: true,
            created_at: new Date().toISOString(),
          };
          await setDoc(doc(db, 'profiles', newCred.user.uid), profile);

          const session = {
            id: newCred.user.uid,
            uid: newCred.user.uid,
            email: cleanEmail,
            full_name: foundDemo.full_name,
            role: foundDemo.role,
            cargo: foundDemo.cargo,
            provider: 'password_provisioned',
          };
          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
          return session;
        } catch {
          // If creation fails (e.g. email exists with diff password), use demo session
          const session = {
            id: foundDemo.id,
            uid: foundDemo.id,
            email: foundDemo.email,
            full_name: foundDemo.full_name,
            role: foundDemo.role,
            cargo: foundDemo.cargo,
            provider: 'demo_fallback',
          };
          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
          return session;
        }
      }
      throw new Error(fbErr.message || 'Credenciales inválidas.');
    }
  }

  // Fallback demo mode
  const found = DEMO_USERS.find(
    (u) => u.email.toLowerCase() === cleanEmail && u.password === password
  );
  if (!found) {
    throw new Error('Credenciales inválidas.');
  }

  const session = {
    id: found.id,
    uid: found.id,
    email: found.email,
    full_name: found.full_name,
    role: found.role,
    cargo: found.cargo,
    provider: 'demo',
  };
  localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
  return session;
}

/**
 * Sign out
 */
export async function logoutUser() {
  try {
    if (isFirebaseConfigured) {
      await signOut(auth);
    }
  } catch (err) {
    console.warn('Error al cerrar sesión en Firebase:', err);
  } finally {
    localStorage.removeItem(LOCAL_SESSION_KEY);
  }
}

/**
 * Get current stored session
 */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Check permission level by role
 */
export function hasPermission(userRole, requiredRole) {
  if (!userRole) return false;
  if (userRole === 'admin') return true;
  if (requiredRole === 'editor' && (userRole === 'admin' || userRole === 'editor')) return true;
  if (
    requiredRole === 'operador' &&
    (userRole === 'admin' || userRole === 'operador' || userRole === 'editor')
  ) {
    return true;
  }
  return userRole === requiredRole;
}
