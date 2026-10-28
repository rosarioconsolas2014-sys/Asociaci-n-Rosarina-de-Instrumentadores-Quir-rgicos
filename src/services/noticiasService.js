import { supabase, isSupabaseConfigured, getLocalStore, setLocalStore, initLocalStore } from './supabase.js';

initLocalStore();

export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

export const noticiasService = {
  async getCategorias() {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('orden', { ascending: true });
      if (error) throw error;
      return data || [];
    }
    const categorias = getLocalStore('CATEGORIAS', []);
    return [...categorias].sort((a, b) => (a.orden || 0) - (b.orden || 0));
  },

  async getNoticias({ soloPublicadas = false, categoriaId = null, search = '' } = {}) {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('noticias')
        .select(`*, categorias:categoria_id (*)`)
        .order('fecha_publicacion', { ascending: false });

      if (soloPublicadas) {
        query = query.eq('estado', 'publicada');
      }
      if (categoriaId) {
        query = query.eq('categoria_id', categoriaId);
      }
      if (search) {
        query = query.or(`titulo.ilike.%${search}%,resumen.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }

    let items = getLocalStore('NOTICIAS', []);
    const cats = getLocalStore('CATEGORIAS', []);
    const catMap = Object.fromEntries(cats.map((c) => [c.id, c]));

    items = items.map((item) => ({
      ...item,
      categorias: catMap[item.categoria_id] || null,
    }));

    if (soloPublicadas) {
      items = items.filter((n) => n.estado === 'publicada');
    }
    if (categoriaId) {
      items = items.filter((n) => n.categoria_id === categoriaId);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (n) =>
          n.titulo?.toLowerCase().includes(q) ||
          n.resumen?.toLowerCase().includes(q)
      );
    }

    return items.sort((a, b) => new Date(b.fecha_publicacion || b.created_at) - new Date(a.fecha_publicacion || a.created_at));
  },

  async getNoticiaBySlug(slug) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('noticias')
        .select(`*, categorias:categoria_id (*)`)
        .eq('slug', slug)
        .single();
      if (error) throw error;
      return data;
    }

    const items = await this.getNoticias({ soloPublicadas: false });
    return items.find((n) => n.slug === slug) || null;
  },

  async getNoticiaById(id) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('noticias')
        .select(`*, categorias:categoria_id (*)`)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    }
    const items = await this.getNoticias({ soloPublicadas: false });
    return items.find((n) => n.id === id) || null;
  },

  async createNoticia(noticia) {
    const slug = noticia.slug?.trim() ? slugify(noticia.slug) : slugify(noticia.titulo);
    const newRecord = {
      ...noticia,
      slug,
      fecha_publicacion: noticia.fecha_publicacion || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('noticias')
        .insert([newRecord])
        .select(`*, categorias:categoria_id (*)`)
        .single();
      if (error) throw error;
      return data;
    }

    const items = getLocalStore('NOTICIAS', []);
    const itemWithId = {
      ...newRecord,
      id: crypto.randomUUID ? crypto.randomUUID() : 'noticia_' + Date.now(),
    };
    items.unshift(itemWithId);
    setLocalStore('NOTICIAS', items);
    return itemWithId;
  },

  async updateNoticia(id, noticia) {
    const slug = noticia.slug?.trim() ? slugify(noticia.slug) : slugify(noticia.titulo);
    const updatedData = {
      ...noticia,
      slug,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('noticias')
        .update(updatedData)
        .eq('id', id)
        .select(`*, categorias:categoria_id (*)`)
        .single();
      if (error) throw error;
      return data;
    }

    const items = getLocalStore('NOTICIAS', []);
    const index = items.findIndex((n) => n.id === id);
    if (index === -1) throw new Error('Noticia no encontrada');

    items[index] = { ...items[index], ...updatedData };
    setLocalStore('NOTICIAS', items);
    return items[index];
  },

  async toggleEstado(id) {
    const current = await this.getNoticiaById(id);
    if (!current) throw new Error('Noticia no encontrada');
    const nuevoEstado = current.estado === 'publicada' ? 'borrador' : 'publicada';
    return this.updateNoticia(id, { estado: nuevoEstado });
  },

  async deleteNoticia(id) {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('noticias').delete().eq('id', id);
      if (error) throw error;
      return true;
    }

    const items = getLocalStore('NOTICIAS', []);
    const filtered = items.filter((n) => n.id !== id);
    setLocalStore('NOTICIAS', filtered);
    return true;
  },
};
