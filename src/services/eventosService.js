import {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  logInternalActivity,
} from '../firebase/firestore.js';
import { isFirebaseConfigured, db } from '../firebase/firebase.js';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { slugify } from './noticiasService.js';
import { getLocalStore, setLocalStore, initLocalStore } from './supabase.js';

initLocalStore();

export const eventosService = {
  async getEventos({ soloPublicados = false, tipo = '', search = '' } = {}) {
    if (isFirebaseConfigured) {
      try {
        const colRef = collection(db, 'events');
        let q;
        if (soloPublicados) {
          q = query(colRef, where('estado', '==', 'publicado'), orderBy('fecha', 'desc'));
        } else {
          q = query(colRef, orderBy('fecha', 'desc'));
        }

        const snap = await getDocs(q);
        let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        if (tipo) {
          items = items.filter((e) => e.tipo === tipo);
        }
        if (search) {
          const qStr = search.toLowerCase();
          items = items.filter(
            (e) =>
              e.titulo?.toLowerCase().includes(qStr) ||
              e.descripcion?.toLowerCase().includes(qStr) ||
              e.lugar?.toLowerCase().includes(qStr) ||
              e.ubicacion?.toLowerCase().includes(qStr)
          );
        }

        if (items.length > 0) {
          return items;
        }
      } catch (err) {
        console.warn('Error al cargar eventos de Firestore, usando caché local:', err);
      }
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
    if (isFirebaseConfigured) {
      try {
        const data = await getDocument('events', id);
        if (data) return data;
      } catch (err) {
        console.warn('Error al obtener evento de Firestore:', err);
      }
    }
    const items = getLocalStore('EVENTOS', []);
    return items.find((e) => e.id === id) || null;
  },

  async createEvento(evento) {
    const slug = evento.slug?.trim() ? slugify(evento.slug) : slugify(evento.titulo);
    const today = new Date().toISOString().split('T')[0];
    const newRecord = {
      ...evento,
      slug,
      ciudad: evento.ciudad || 'Rosario, Santa Fe',
      ubicacion: evento.ubicacion || evento.lugar || 'Rosario, Santa Fe',
      clasificacion: evento.fecha >= today ? 'proximo' : 'historico',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isFirebaseConfigured) {
      const created = await createDocument('events', newRecord);
      await logInternalActivity('CREATE_EVENT', 'events', created.id, `Evento creado: ${newRecord.titulo}`);
      return created;
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
    const today = new Date().toISOString().split('T')[0];
    const updatedData = {
      ...evento,
      slug,
      ubicacion: evento.ubicacion || evento.lugar || 'Rosario, Santa Fe',
      clasificacion: evento.fecha >= today ? 'proximo' : 'historico',
      updated_at: new Date().toISOString(),
    };

    if (isFirebaseConfigured) {
      const updated = await updateDocument('events', id, updatedData);
      await logInternalActivity('UPDATE_EVENT', 'events', id, `Evento actualizado: ${evento.titulo || id}`);
      return updated;
    }

    const items = getLocalStore('EVENTOS', []);
    const index = items.findIndex((e) => e.id === id);
    if (index === -1) throw new Error('Evento no encontrado');

    items[index] = { ...items[index], ...updatedData };
    setLocalStore('EVENTOS', items);
    return items[index];
  },

  async deleteEvento(id) {
    if (isFirebaseConfigured) {
      await deleteDocument('events', id);
      await logInternalActivity('DELETE_EVENT', 'events', id, `Evento eliminado id: ${id}`);
      return true;
    }

    const items = getLocalStore('EVENTOS', []);
    const filtered = items.filter((e) => e.id !== id);
    setLocalStore('EVENTOS', filtered);
    return true;
  },
};
