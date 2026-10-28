import { createClient } from '@supabase/supabase-js';
import {
  INITIAL_CATEGORIAS,
  INITIAL_NOTICIAS,
  INITIAL_CURSOS,
  INITIAL_EVENTOS,
  INITIAL_INSCRIPCIONES,
  INITIAL_CONTACTOS,
  INITIAL_CONFIGURACION,
} from './mockData.js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('tu-proyecto') &&
  !supabaseUrl.includes('example.com') &&
  supabaseUrl.startsWith('http')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==============================================================================
// LOCAL STORAGE DATA REPOSITORY (Fallback / Mock Engine)
// Provides instant full persistence for development, evaluation, and offline use.
// ==============================================================================
const STORAGE_KEYS = {
  CATEGORIAS: 'ariq_categorias_v1',
  NOTICIAS: 'ariq_noticias_v1',
  CURSOS: 'ariq_cursos_v1',
  EVENTOS: 'ariq_eventos_v1',
  INSCRIPCIONES: 'ariq_inscripciones_v1',
  CONTACTOS: 'ariq_contactos_v1',
  CONFIGURACION: 'ariq_configuracion_v1',
  AUTH_USER: 'ariq_auth_session_v1',
};

// Initialize default storage if empty
export const initLocalStore = () => {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.CATEGORIAS)) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIAS, JSON.stringify(INITIAL_CATEGORIAS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTICIAS)) {
    localStorage.setItem(STORAGE_KEYS.NOTICIAS, JSON.stringify(INITIAL_NOTICIAS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CURSOS)) {
    localStorage.setItem(STORAGE_KEYS.CURSOS, JSON.stringify(INITIAL_CURSOS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.EVENTOS)) {
    localStorage.setItem(STORAGE_KEYS.EVENTOS, JSON.stringify(INITIAL_EVENTOS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.INSCRIPCIONES)) {
    localStorage.setItem(STORAGE_KEYS.INSCRIPCIONES, JSON.stringify(INITIAL_INSCRIPCIONES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CONTACTOS)) {
    localStorage.setItem(STORAGE_KEYS.CONTACTOS, JSON.stringify(INITIAL_CONTACTOS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CONFIGURACION)) {
    localStorage.setItem(STORAGE_KEYS.CONFIGURACION, JSON.stringify(INITIAL_CONFIGURACION));
  }
};

// Local storage helper
export const getLocalStore = (key, defaultVal) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[key] || key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (e) {
    console.error('Error reading localStorage:', e);
    return defaultVal;
  }
};

export const setLocalStore = (key, data) => {
  try {
    localStorage.setItem(STORAGE_KEYS[key] || key, JSON.stringify(data));
  } catch (e) {
    console.error('Error writing localStorage:', e);
  }
};

export const resetLocalStore = () => {
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  initLocalStore();
};
