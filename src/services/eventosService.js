import { supabase, isSupabaseConfigured, getLocalStore, setLocalStore, initLocalStore } from './supabase.js';
import { slugify } from './noticiasService.js';

initLocalStore();

export const eventosService = {
  async getEventos({ soloPublicados = false, tipo = '', search = '' } = {}) {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('eventos')
        .select('*')
        .order('fecha', { ascending: false });

      if (soloPublicados) {
        query = query.eq('estado', 'publicado');
      }
      if (tipo) {
        query = query.eq('tipo', tipo);
      }
      if (search) {
        query = query.or(`titulo.ilike.%${search}%,descripcion.ilike.%${search}%,lugar.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }

    let items = getLocalStore('EVENTOS', []);

    if (soloPublicados) {
      items = items.filter((e) => e.estado === 'publicado');
    }
    if (tipo) {
      items = items.filter((e) => e.tipo === tipo);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (e) =>
          e.titulo?.toLowerCase().includes(q) ||
          e.descripcion?.toLowerCase().includes(q) ||
          e.lugar?.toLowerCase().includes(q)
      );
    }

    return items.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  },

  async getEventoById(id) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    }
    const items = getLocalStore('EVENTOS', []);
    return items.find((e) => e.id === id) || null;
  },

  async createEvento(evento) {
    const slug = evento.slug?.trim() ? slugify(evento.slug) : slugify(evento.titulo);
    const newRecord = {
      ...evento,
      slug,
      ciudad: evento.ciudad || 'Rosario, Santa Fe',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('eventos')
        .insert([newRecord])
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const items = getLocalStore('EVENTOS', []);
    const itemWithId = {
      ...newRecord,
      id: crypto.randomUUID ? crypto.randomUUID() : 'evento_' + Date.now(),
    };
    items.unshift(itemWithId);
    setLocalStore('EVENTOS', items);
    return itemWithId;
  },

  async updateEvento(id, evento) {
    const slug = evento.slug?.trim() ? slugify(evento.slug) : slugify(evento.titulo);
    const updatedData = {
      ...evento,
      slug,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('eventos')
        .update(updatedData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const items = getLocalStore('EVENTOS', []);
    const index = items.findIndex((e) => e.id === id);
    if (index === -1) throw new Error('Evento no encontrado');

    items[index] = { ...items[index], ...updatedData };
    setLocalStore('EVENTOS', items);
    return items[index];
  },

  async deleteEvento(id) {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('eventos').delete().eq('id', id);
      if (error) throw error;
      return true;
    }

    const items = getLocalStore('EVENTOS', []);
    const filtered = items.filter((e) => e.id !== id);
    setLocalStore('EVENTOS', filtered);
    return true;
  },
};
