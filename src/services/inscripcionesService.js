import {
  updateDocument,
  deleteDocument,
  registerForCourseTransaction,
  logInternalActivity,
} from '../firebase/firestore.js';
import { db } from '../firebase/firebase.js';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { cursosService } from './cursosService.js';

export const inscripcionesService = {
  async getInscripciones({ cursoId = null, estado = '', search = '' } = {}) {
    const colRef = collection(db, 'course_registrations');
    const q = query(colRef, orderBy('created_at', 'desc'));
    const snap = await getDocs(q);
    let items = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        cursos: { nombre: data.curso_nombre || 'Capacitación Quirúrgica' },
      };
    });

    if (cursoId) {
      items = items.filter((i) => i.curso_id === cursoId);
    }
    if (estado) {
      items = items.filter((i) => i.estado === estado);
    }
    if (search) {
      const qLower = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.nombre_completo?.toLowerCase().includes(qLower) ||
          i.email?.toLowerCase().includes(qLower) ||
          i.dni?.toLowerCase().includes(qLower) ||
          i.matricula_o_dni?.toLowerCase().includes(qLower)
      );
    }

    return items;
  },

  async registrarInscripcion({
    curso_id,
    nombre_completo,
    email,
    telefono,
    dni,
    matricula_o_dni,
    matricula,
    institucion_laboral,
    es_socio_ariq,
    comentarios,
  }) {
    const docIdent = (dni || matricula_o_dni || '').trim();
    if (!curso_id || !nombre_completo || !email || !docIdent) {
      throw new Error('Complete todos los campos obligatorios para registrarse.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Ingrese un correo electrónico válido.');
    }

    // Verify course exists in Firestore
    const curso = await cursosService.getCursoById(curso_id);
    if (!curso) {
      throw new Error('El curso seleccionado no existe o no está disponible.');
    }

    const registrationPayload = {
      curso_id,
      curso_nombre: curso.nombre,
      nombre_completo: nombre_completo.trim(),
      email: email.trim().toLowerCase(),
      telefono: telefono?.trim() || null,
      dni: docIdent,
      matricula_o_dni: docIdent,
      matricula: (matricula || docIdent).trim(),
      institucion_laboral: institucion_laboral?.trim() || null,
      es_socio_ariq: Boolean(es_socio_ariq),
      comentarios: comentarios?.trim() || null,
    };

    // Use Firestore atomic transaction for spot reservation
    const result = await registerForCourseTransaction(registrationPayload);
    await logInternalActivity(
      'REGISTER_APPLICANT',
      'course_registrations',
      result.id,
      `Inscripción a ${curso.nombre} de ${nombre_completo}`
    );
    return result;
  },

  async updateEstado(id, nuevoEstado, observaciones = '') {
    if (!['pendiente', 'confirmada', 'rechazada', 'cancelada'].includes(nuevoEstado)) {
      throw new Error('Estado de inscripción inválido.');
    }

    const updated = await updateDocument('course_registrations', id, {
      estado: nuevoEstado,
      observaciones_admin: observaciones || '',
    });
    await logInternalActivity(
      'UPDATE_REGISTRATION_STATUS',
      'course_registrations',
      id,
      `Estado actualizado a: ${nuevoEstado}`
    );
    return updated;
  },

  async deleteInscripcion(id) {
    await deleteDocument('course_registrations', id);
    await logInternalActivity('DELETE_REGISTRATION', 'course_registrations', id, `Inscripción eliminada id: ${id}`);
    return true;
  },
};
