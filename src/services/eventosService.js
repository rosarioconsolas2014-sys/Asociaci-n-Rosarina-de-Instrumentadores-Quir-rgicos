/**
 * @file eventosService.js
 * Servicio de Eventos y Agenda Institucional de ARIQ conectado exclusivamente a Cloud Firestore.
 * Colección: `events`.
 * Las imágenes se persisten y recuperan directamente en Base64.
 */

import {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  logInternalActivity,
} from '../firebase/firestore.js';
import { db } from '../firebase/firebase.js';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { slugify } from './noticiasService.js';

export const eventosService = {
  /**
   * Obtiene los eventos desde Cloud Firestore
   */
  async getEventos({ soloPublicados = false, tipo = '', search = '' } = {}) {
    try {
      const colRef = collection(db, 'events');
      let q;
      if (soloPublicados) {
        q = query(colRef, where('estado', '==', 'publicado'), orderBy('fecha', 'desc'));
      } else {
        q = query(colRef, orderBy('fecha', 'desc'));
      }

      const snap = await getDocs(q);
      let items = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          imagen_url: data.imagen_base64 || data.imagen_url,
        };
      });

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

      return items;
    } catch (err) {
      console.error('Error al cargar eventos de Firestore:', err);
      return [];
    }
  },

  /**
   * Obtiene un evento por ID desde Cloud Firestore
   */
  async getEventoById(id) {
    try {
      const data = await getDocument('events', id);
      if (data) {
        return {
          ...data,
          imagen_url: data.imagen_base64 || data.imagen_url,
        };
      }
    } catch (err) {
      console.error('Error al obtener evento de Firestore:', err);
    }
    return null;
  },

  /**
   * Crea un nuevo evento en Cloud Firestore con imagen en Base64
   */
  async createEvento(evento) {
    const slug = evento.slug?.trim() ? slugify(evento.slug) : slugify(evento.titulo);
    const today = new Date().toISOString().split('T')[0];
    const newRecord = {
      ...evento,
      slug,
      ciudad: evento.ciudad || 'Rosario, Santa Fe',
      ubicacion: evento.ubicacion || evento.lugar || 'Rosario, Santa Fe',
      clasificacion: evento.fecha >= today ? 'proximo' : 'historico',
      imagen_url: evento.imagen_base64 || evento.imagen_url || '',
      imagen_base64: evento.imagen_base64 || evento.imagen_url || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const created = await createDocument('events', newRecord);
    await logInternalActivity(
      'CREATE_EVENT',
      'events',
      created.id,
      `Evento creado en Firestore: ${newRecord.titulo}`
    );
    return created;
  },

  /**
   * Actualiza un evento en Cloud Firestore
   */
  async updateEvento(id, evento) {
    const slug = evento.slug?.trim() ? slugify(evento.slug) : slugify(evento.titulo);
    const today = new Date().toISOString().split('T')[0];
    const updatedData = {
      ...evento,
      slug,
      ubicacion: evento.ubicacion || evento.lugar || 'Rosario, Santa Fe',
      clasificacion: evento.fecha >= today ? 'proximo' : 'historico',
      imagen_url: evento.imagen_base64 || evento.imagen_url,
      imagen_base64: evento.imagen_base64 || evento.imagen_url,
      updated_at: new Date().toISOString(),
    };

    const updated = await updateDocument('events', id, updatedData);
    await logInternalActivity(
      'UPDATE_EVENT',
      'events',
      id,
      `Evento actualizado en Firestore: ${evento.titulo || id}`
    );
    return updated;
  },

  /**
   * Elimina un evento de Cloud Firestore
   */
  async deleteEvento(id) {
    await deleteDocument('events', id);
    await logInternalActivity('DELETE_EVENT', 'events', id, `Evento eliminado id: ${id}`);
    return true;
  },
};
