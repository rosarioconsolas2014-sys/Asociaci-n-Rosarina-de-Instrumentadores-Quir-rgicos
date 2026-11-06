import {
  createDocument,
  updateDocument,
  deleteDocument,
  logInternalActivity,
} from '../firebase/firestore.js';
import { db } from '../firebase/firebase.js';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

export const contactoService = {
  async getContactos({ soloNoLeidos = false, motivo = '' } = {}) {
    const colRef = collection(db, 'contact_messages');
    const q = query(colRef, orderBy('created_at', 'desc'));
    const snap = await getDocs(q);
    let items = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        nombre_completo: data.nombre || data.nombre_completo,
        notas_admin: data.notas_internas || data.notas_admin || '',
      };
    });

    if (soloNoLeidos) {
      items = items.filter((c) => !c.leido);
    }
    if (motivo) {
      items = items.filter((c) => c.motivo === motivo);
    }

    return items;
  },

  async enviarConsulta({ nombre, nombre_completo, email, telefono, motivo, mensaje, honeypot }) {
    if (honeypot) {
      throw new Error('Solicitud no autorizada.');
    }

    const lastSent = sessionStorage.getItem('ariq_contact_timestamp');
    const now = Date.now();
    if (lastSent && now - Number(lastSent) < 15000) {
      throw new Error('Por favor espere unos segundos antes de enviar otra consulta.');
    }

    const remitente = (nombre || nombre_completo || '').trim();
    if (!remitente || !email || !mensaje || !motivo) {
      throw new Error('Por favor complete todos los campos obligatorios.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Ingrese un correo electrónico válido.');
    }

    const newRecord = {
      nombre: remitente,
      nombre_completo: remitente,
      email: email.trim().toLowerCase(),
      telefono: telefono?.trim() || null,
      motivo,
      mensaje: mensaje.trim(),
      leido: false,
      respondido: false,
      notas_internas: '',
      notas_admin: '',
      created_at: new Date().toISOString(),
    };

    const created = await createDocument('contact_messages', newRecord);
    sessionStorage.setItem('ariq_contact_timestamp', String(now));
    return created;
  },

  async marcarLeido(id, leido = true) {
    const updated = await updateDocument('contact_messages', id, { leido });
    return updated;
  },

  async marcarRespondido(id, respondido = true, notas = '') {
    const updated = await updateDocument('contact_messages', id, {
      respondido,
      notas_internas: notas,
      notas_admin: notas,
    });
    await logInternalActivity('REPLY_CONTACT', 'contact_messages', id, 'Consulta marcada como respondida');
    return updated;
  },

  async deleteContacto(id) {
    await deleteDocument('contact_messages', id);
    await logInternalActivity('DELETE_CONTACT', 'contact_messages', id, `Consulta eliminada id: ${id}`);
    return true;
  },
};
