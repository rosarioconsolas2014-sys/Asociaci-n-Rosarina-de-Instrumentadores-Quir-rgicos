import { supabase, isSupabaseConfigured, getLocalStore, setLocalStore, initLocalStore } from './supabase.js';

initLocalStore();

export const contactoService = {
  async getContactos({ soloNoLeidos = false, motivo = '' } = {}) {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('contactos')
        .select('*')
        .order('created_at', { ascending: false });

      if (soloNoLeidos) {
        query = query.eq('leido', false);
      }
      if (motivo) {
        query = query.eq('motivo', motivo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }

    let items = getLocalStore('CONTACTOS', []);
    if (soloNoLeidos) {
      items = items.filter((c) => !c.leido);
    }
    if (motivo) {
      items = items.filter((c) => c.motivo === motivo);
    }
    return items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async enviarConsulta({ nombre_completo, email, telefono, motivo, mensaje, honeypot }) {
    // Spam bot honeypot protection: if hidden field is filled, reject silently
    if (honeypot) {
      throw new Error('Solicitud no autorizada.');
    }

    // Basic rate limit check in client (at most 1 submission every 20 seconds from same browser session)
    const lastSent = sessionStorage.getItem('ariq_contact_timestamp');
    const now = Date.now();
    if (lastSent && now - Number(lastSent) < 15000) {
      throw new Error('Por favor espere unos segundos antes de enviar otra consulta.');
    }

    if (!nombre_completo || !email || !mensaje || !motivo) {
      throw new Error('Por favor complete todos los campos obligatorios.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Ingrese un correo electrónico válido.');
    }

    const newRecord = {
      nombre_completo: nombre_completo.trim(),
      email: email.trim().toLowerCase(),
      telefono: telefono?.trim() || null,
      motivo,
      mensaje: mensaje.trim(),
      leido: false,
      respondido: false,
      notas_admin: '',
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('contactos')
        .insert([newRecord])
        .select()
        .single();
      if (error) throw error;
      sessionStorage.setItem('ariq_contact_timestamp', String(now));
      return data;
    }

    const items = getLocalStore('CONTACTOS', []);
    const itemWithId = {
      ...newRecord,
      id: crypto.randomUUID ? crypto.randomUUID() : 'contacto_' + Date.now(),
    };
    items.unshift(itemWithId);
    setLocalStore('CONTACTOS', items);
    sessionStorage.setItem('ariq_contact_timestamp', String(now));
    return itemWithId;
  },

  async marcarLeido(id, leido = true) {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('contactos')
        .update({ leido })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const items = getLocalStore('CONTACTOS', []);
    const index = items.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Consulta no encontrada');
    items[index] = { ...items[index], leido };
    setLocalStore('CONTACTOS', items);
    return items[index];
  },

  async marcarRespondido(id, respondido = true, notas = '') {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('contactos')
        .update({ respondido, notas_admin: notas })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }

    const items = getLocalStore('CONTACTOS', []);
    const index = items.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Consulta no encontrada');
    items[index] = {
      ...items[index],
      respondido,
      notas_admin: notas || items[index].notas_admin,
    };
    setLocalStore('CONTACTOS', items);
    return items[index];
  },

  async deleteContacto(id) {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('contactos').delete().eq('id', id);
      if (error) throw error;
      return true;
    }

    const items = getLocalStore('CONTACTOS', []);
    const filtered = items.filter((c) => c.id !== id);
    setLocalStore('CONTACTOS', filtered);
    return true;
  },
};
