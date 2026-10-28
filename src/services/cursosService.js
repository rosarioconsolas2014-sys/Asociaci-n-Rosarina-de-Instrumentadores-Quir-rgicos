import { supabase, isSupabaseConfigured, getLocalStore, setLocalStore, initLocalStore } from './supabase.js';
import { slugify } from './noticiasService.js';

initLocalStore();

export const cursosService = {
  async getCursos({ soloActivos = false, modalidad = '', search = '' } = {}) {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('cursos')
        .select('*')
        .order('fecha_inicio', { ascending: true });

      if (soloActivos) {
        query = query.in('estado', ['activo', 'proximamente']);
      }
      if (modalidad) {
        query = query.eq('modalidad', modalidad);
      }
      if (search) {
        query = query.or(`nombre.ilike.%${search}%,descripcion.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }

    let items = getLocalStore('CURSOS', []);

    if (soloActivos) {
      items = items.filter((c) => c.estado === 'activo' || c.estado === 'proximamente');
    }
    if (modalidad) {
      items = items.filter((c) => c.modalidad === modalidad);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (c) =>
          c.nombre?.toLowerCase().includes(q) ||
          c.descripcion?.toLowerCase().includes(q)
      );
    }

    return items.sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));
  },

  async getCursoBySlug(slug) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('cursos')
        .select('*')
        .eq('slug', slug)
        .single();
      if (error) throw error;
      return data;
    }
    const items = getLocalStore('CURSOS', []);
    return items.find((c) => c.slug === slug) || null;
  },

  async getCursoById(id) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('cursos')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    }
    const items = getLocalStore('CURSOS', []);
    return items.find((c) => c.id === id) || null;
  },

  async createCurso(curso) {
    const slug = curso.slug?.trim() ? slugify(curso.slug) : slugify(curso.nombre);
    const newRecord = {
      ...curso,
      slug,
      cupos: Number(curso.cupos) || 20,
      cupos_disponibles: Number(curso.cupos_disponibles ?? curso.cupos) || 20,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('cursos')
        .insert([newRecord])
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const items = getLocalStore('CURSOS', []);
    const itemWithId = {
      ...newRecord,
      id: crypto.randomUUID ? crypto.randomUUID() : 'curso_' + Date.now(),
    };
    items.push(itemWithId);
    setLocalStore('CURSOS', items);
    return itemWithId;
  },

  async updateCurso(id, curso) {
    const slug = curso.slug?.trim() ? slugify(curso.slug) : slugify(curso.nombre);
    const updatedData = {
      ...curso,
      slug,
      cupos: Number(curso.cupos) || 20,
      cupos_disponibles: Number(curso.cupos_disponibles),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('cursos')
        .update(updatedData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const items = getLocalStore('CURSOS', []);
    const index = items.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Curso no encontrado');

    items[index] = { ...items[index], ...updatedData };
    setLocalStore('CURSOS', items);
    return items[index];
  },

  async deleteCurso(id) {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('cursos').delete().eq('id', id);
      if (error) throw error;
      return true;
    }

    const items = getLocalStore('CURSOS', []);
    const filtered = items.filter((c) => c.id !== id);
    setLocalStore('CURSOS', filtered);
    return true;
  },
};
