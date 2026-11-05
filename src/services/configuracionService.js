import { getDocument, setDocument, logInternalActivity } from '../firebase/firestore.js';
import { isFirebaseConfigured } from '../firebase/firebase.js';
import { INITIAL_CONFIGURACION } from './mockData.js';
import { getLocalStore, setLocalStore, initLocalStore } from './supabase.js';

initLocalStore();

export const configuracionService = {
  async getConfiguracion() {
    if (isFirebaseConfigured) {
      try {
        const data = await getDocument('institutional_settings', 'ariq_main');
        if (data) {
          return {
            nombre_oficial: data.nombre_legal_completo || data.nombre_oficial || INITIAL_CONFIGURACION.nombre_oficial,
            sigla: data.sigla || 'ARIQ',
            lema: data.lema || INITIAL_CONFIGURACION.lema,
            personeria_juridica: data.personeria_juridica || INITIAL_CONFIGURACION.personeria_juridica,
            cuit: data.cuit || INITIAL_CONFIGURACION.cuit,
            sede: {
              ciudad: data.ciudad || 'Rosario',
              provincia: data.provincia || 'Santa Fe',
              pais: 'Argentina',
              direccion: data.direccion || 'Rosario, Santa Fe',
            },
            contacto: {
              email: data.email || INITIAL_CONFIGURACION.contacto.email,
              email_cursos: data.email_cursos || INITIAL_CONFIGURACION.contacto.email_cursos,
              telefono: data.telefono || INITIAL_CONFIGURACION.contacto.telefono,
              horario_atencion: data.horario_atencion || INITIAL_CONFIGURACION.contacto.horario_atencion,
            },
            redes_sociales: data.redes_sociales || INITIAL_CONFIGURACION.redes_sociales,
            mision: data.mision || '',
            vision: data.vision || '',
            valores: data.valores || '',
          };
        }
      } catch (err) {
        console.warn('Error al cargar configuración de Firestore, usando caché:', err);
      }
    }

    return getLocalStore('CONFIGURACION', INITIAL_CONFIGURACION);
  },

  async updateConfiguracion(nuevoValor) {
    if (isFirebaseConfigured) {
      const payload = {
        nombre_institucional: nuevoValor.sigla || 'ARIQ',
        nombre_legal_completo: nuevoValor.nombre_oficial,
        sigla: nuevoValor.sigla,
        lema: nuevoValor.lema,
        cuit: nuevoValor.cuit,
        personeria_juridica: nuevoValor.personeria_juridica,
        resolucion_igpj: nuevoValor.personeria_juridica,
        direccion: nuevoValor.sede?.direccion || 'Rosario, Santa Fe',
        ciudad: nuevoValor.sede?.ciudad || 'Rosario',
        provincia: nuevoValor.sede?.provincia || 'Santa Fe',
        telefono: nuevoValor.contacto?.telefono || '',
        email: nuevoValor.contacto?.email || '',
        email_cursos: nuevoValor.contacto?.email_cursos || '',
        horario_atencion: nuevoValor.contacto?.horario_atencion || '',
        redes_sociales: nuevoValor.redes_sociales || {},
        updated_at: new Date().toISOString(),
      };
      await setDocument('institutional_settings', 'ariq_main', payload);
      await logInternalActivity('UPDATE_SETTINGS', 'institutional_settings', 'ariq_main', 'Datos institucionales modificados');
      setLocalStore('CONFIGURACION', nuevoValor);
      return nuevoValor;
    }

    setLocalStore('CONFIGURACION', nuevoValor);
    return nuevoValor;
  },
};
