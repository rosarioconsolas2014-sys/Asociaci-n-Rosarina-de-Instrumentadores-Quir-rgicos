/**
 * @file cursosService.js
 * Servicio de Cursos y Capacitaciones de ARIQ conectado exclusivamente a Cloud Firestore.
 * Colección: `courses`.
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

export const cursosService = {
  /**
   * Obtiene todos los cursos desde Cloud Firestore
   */
  async getCursos({ soloActivos = false, modalidad = '', search = '' } = {}) {
    try {
      const colRef = collection(db, 'courses');
      let q;
      if (soloActivos) {
        q = query(colRef, where('estado', 'in', ['activo', 'proximamente']), orderBy('fecha_inicio', 'asc'));
      } else {
        q = query(colRef, orderBy('fecha_inicio', 'asc'));
      }

      const snap = await getDocs(q);
      let items = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          imagen_url: data.imagen_base64 || data.imagen_url,
          cupos: data.cupo_total ?? data.cupos ?? 20,
          cupos_disponibles: data.vacantes_disponibles ?? data.cupos_disponibles ?? 0,
        };
      });

      if (modalidad) {
        items = items.filter((c) => c.modalidad === modalidad);
      }
      if (search) {
        const qStr = search.toLowerCase();
        items = items.filter(
          (c) =>
            c.nombre?.toLowerCase().includes(qStr) ||
            c.descripcion?.toLowerCase().includes(qStr) ||
            c.lugar?.toLowerCase().includes(qStr)
        );
      }

      return items;
    } catch (err) {
      console.error('Error al cargar cursos de Firestore:', err);
      return [];
    }
  },

  /**
   * Obtiene un curso por su slug único desde Cloud Firestore
   */
  async getCursoBySlug(slug) {
    try {
      const colRef = collection(db, 'courses');
      const q = query(colRef, where('slug', '==', slug));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          imagen_url: data.imagen_base64 || data.imagen_url,
          cupos: data.cupo_total ?? data.cupos ?? 20,
          cupos_disponibles: data.vacantes_disponibles ?? data.cupos_disponibles ?? 0,
        };
      }
    } catch (err) {
      console.error('Error al buscar curso por slug en Firestore:', err);
    }
    return null;
  },

  /**
   * Obtiene un curso por ID desde Cloud Firestore
   */
  async getCursoById(id) {
    try {
      const data = await getDocument('courses', id);
      if (data) {
        return {
          ...data,
          imagen_url: data.imagen_base64 || data.imagen_url,
          cupos: data.cupo_total ?? data.cupos ?? 20,
          cupos_disponibles: data.vacantes_disponibles ?? data.cupos_disponibles ?? 0,
        };
      }
    } catch (err) {
      console.error('Error al buscar curso por ID en Firestore:', err);
    }
    return null;
  },

  /**
   * Crea un nuevo curso en Cloud Firestore con imagen en Base64
   */
  async createCurso(curso) {
    const slug = curso.slug?.trim() ? slugify(curso.slug) : slugify(curso.nombre);
    const cupoTotal = Number(curso.cupos || curso.cupo_total) || 20;
    const vacantes = Number(curso.cupos_disponibles ?? curso.vacantes_disponibles ?? cupoTotal);

    const newRecord = {
      ...curso,
      slug,
      cupos: cupoTotal,
      cupo_total: cupoTotal,
      cupos_disponibles: vacantes,
      vacantes_disponibles: vacantes,
      imagen_url: curso.imagen_base64 || curso.imagen_url || '',
      imagen_base64: curso.imagen_base64 || curso.imagen_url || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const created = await createDocument('courses', newRecord);
    await logInternalActivity(
      'CREATE_COURSE',
      'courses',
      created.id,
      `Curso creado en Firestore: ${newRecord.nombre}`
    );
    return created;
  },

  /**
   * Actualiza un curso en Cloud Firestore
   */
  async updateCurso(id, curso) {
    const slug = curso.slug?.trim() ? slugify(curso.slug) : slugify(curso.nombre);
    const cupoTotal = Number(curso.cupos || curso.cupo_total) || 20;
    const vacantes = Number(curso.cupos_disponibles ?? curso.vacantes_disponibles ?? cupoTotal);

    const updatedData = {
      ...curso,
      slug,
      cupos: cupoTotal,
      cupo_total: cupoTotal,
      cupos_disponibles: vacantes,
      vacantes_disponibles: vacantes,
      imagen_url: curso.imagen_base64 || curso.imagen_url,
      imagen_base64: curso.imagen_base64 || curso.imagen_url,
      updated_at: new Date().toISOString(),
    };

    const updated = await updateDocument('courses', id, updatedData);
    await logInternalActivity(
      'UPDATE_COURSE',
      'courses',
      id,
      `Curso actualizado en Firestore: ${curso.nombre || id}`
    );
    return updated;
  },

  /**
   * Elimina un curso de Cloud Firestore
   */
  async deleteCurso(id) {
    await deleteDocument('courses', id);
    await logInternalActivity('DELETE_COURSE', 'courses', id, `Curso eliminado id: ${id}`);
    return true;
  },
};
