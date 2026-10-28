import { supabase, isSupabaseConfigured } from './supabase.js';

const DEMO_USERS = [
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

const SESSION_KEY = 'ariq_auth_session_v1';

export const authService = {
  getDemoUsers() {
    return DEMO_USERS.map(({ id, email, full_name, role, cargo, password }) => ({
      id,
      email,
      full_name,
      role,
      cargo,
      password,
    }));
  },

  getCurrentUser() {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  async login(email, password) {
    const cleanEmail = email.trim().toLowerCase();

    // 1. If real Supabase is configured, authenticate via Supabase Auth
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        throw new Error(error.message || 'Error al iniciar sesión.');
      }

      // Fetch profile to verify role
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileErr || !profile) {
        throw new Error('No se encontró el perfil de usuario asociado o la cuenta está inactiva.');
      }

      if (!profile.activo) {
        await supabase.auth.signOut();
        throw new Error('Esta cuenta ha sido desactivada. Comuníquese con la administración.');
      }

      const userSession = {
        id: data.user.id,
        email: data.user.email,
        full_name: profile.full_name,
        role: profile.role,
        cargo: profile.cargo || 'Miembro del Personal',
        isSupabase: true,
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(userSession));
      return userSession;
    }

    // 2. Local Demo Authentication
    const found = DEMO_USERS.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.password === password
    );

    if (!found) {
      throw new Error('Credenciales inválidas. Compruebe el correo electrónico y la contraseña.');
    }

    const session = {
      id: found.id,
      email: found.email,
      full_name: found.full_name,
      role: found.role,
      cargo: found.cargo,
      isSupabase: false,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async logout() {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('Error al cerrar sesión en Supabase:', e);
    } finally {
      localStorage.removeItem(SESSION_KEY);
    }
  },

  hasPermission(userRole, requiredRole) {
    if (!userRole) return false;
    if (userRole === 'admin') return true;
    if (requiredRole === 'editor' && (userRole === 'admin' || userRole === 'editor')) return true;
    if (requiredRole === 'operador' && (userRole === 'admin' || userRole === 'operador' || userRole === 'editor')) return true;
    return userRole === requiredRole;
  },
};
