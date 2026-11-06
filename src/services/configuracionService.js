/**
 * @file configuracionService.js
 * Servicio de datos institucionales de ARIQ conectado exclusivamente a Cloud Firestore.
 * Colección: `institutional_settings`, Documento: `ariq_main`.
 */

import { getDocument, setDocument, logInternalActivity } from '../firebase/firestore.js';
import { db } from '../firebase/firebase.js';
import { doc, getDoc } from 'firebase/firestore';

export const configuracionService = {
  /**
   * Obtiene la configuración institucional completa almacenada en Cloud Firestore
   */
  async getConfiguracion() {
    try {
      const data = await getDocument('institutional_settings', 'ariq_main');
      if (data) {
        return {
          nombre_oficial:
            data.nombre_legal_completo ||
            data.nombre_oficial ||
            'Instrumentadores Quirúrgicos Profesionales de Rosario Asociación Civil',
          nombre_institucional: data.nombre_institucional || 'ARIQ',
          sigla: data.sigla || 'ARIQ',
          lema:
            data.lema ||
            'Jerarquizando el ejercicio profesional y la seguridad del paciente quirúrgico',
          personeria_juridica: data.personeria_juridica || 'Resolución I.G.P.J. N° 412/1988',
          resolucion_igpj: data.resolucion_igpj || 'Resolución I.G.P.J. N° 412/1988',
          cuit: data.cuit || '30-65487219-4',
          fecha_fundacion: data.fecha_fundacion || '1988-06-15',
          sede: data.sede || {
            ciudad: data.ciudad || 'Rosario',
            provincia: data.provincia || 'Santa Fe',
            pais: 'Argentina',
            direccion: data.direccion || 'Rosario, Santa Fe',
          },
          contacto: data.contacto || {
            email: data.email || 'contacto@ariq.org.ar',
            email_cursos: data.email_cursos || 'capacitacion@ariq.org.ar',
            telefono: data.telefono || '+54 (341) 480-0000',
            horario_atencion: data.horario_atencion || 'Lunes a Viernes de 14:00 a 19:00 hs',
          },
          redes_sociales: data.redes_sociales || {
            instagram: 'https://instagram.com/ariq_rosario',
            facebook: 'https://facebook.com/ariqrosario',
            linkedin: 'https://linkedin.com/company/ariq-rosario',
          },
          historia_resumen: data.historia_resumen || '',
          historia_completa: data.historia_completa || '',
          mision: data.mision || '',
          vision: data.vision || '',
          valores: data.valores || '',
          rol_profesional_texto: data.rol_profesional_texto || '',
          objetivos_estatutarios: data.objetivos_estatutarios || [],
          autoridades: data.autoridades || [],
          hero: data.hero || null,
          seccion_institucional_home: data.seccion_institucional_home || null,
          logotipo_base64: data.logotipo_base64 || null,
          hero_imagen_base64: data.hero_imagen_base64 || null,
        };
      }
    } catch (err) {
      console.error('Error al recuperar configuración de Firestore:', err);
    }
    return null;
  },

  /**
   * Actualiza la configuración institucional en Cloud Firestore
   */
  async updateConfiguracion(nuevoValor) {
    const payload = {
      nombre_institucional: nuevoValor.sigla || 'ARIQ',
      nombre_legal_completo: nuevoValor.nombre_oficial || 'Instrumentadores Quirúrgicos Profesionales de Rosario Asociación Civil',
      nombre_oficial: nuevoValor.nombre_oficial,
      sigla: nuevoValor.sigla || 'ARIQ',
      lema: nuevoValor.lema || '',
      cuit: nuevoValor.cuit || '',
      personeria_juridica: nuevoValor.personeria_juridica || '',
      resolucion_igpj: nuevoValor.personeria_juridica || '',
      fecha_fundacion: nuevoValor.fecha_fundacion || '1988-06-15',
      direccion: nuevoValor.sede?.direccion || 'Rosario, Santa Fe',
      ciudad: nuevoValor.sede?.ciudad || 'Rosario',
      provincia: nuevoValor.sede?.provincia || 'Santa Fe',
      sede: nuevoValor.sede || {},
      telefono: nuevoValor.contacto?.telefono || '',
      email: nuevoValor.contacto?.email || '',
      email_cursos: nuevoValor.contacto?.email_cursos || '',
      horario_atencion: nuevoValor.contacto?.horario_atencion || '',
      contacto: nuevoValor.contacto || {},
      redes_sociales: nuevoValor.redes_sociales || {},
      historia_resumen: nuevoValor.historia_resumen || '',
      historia_completa: nuevoValor.historia_completa || '',
      mision: nuevoValor.mision || '',
      vision: nuevoValor.vision || '',
      valores: nuevoValor.valores || '',
      rol_profesional_texto: nuevoValor.rol_profesional_texto || '',
      objetivos_estatutarios: nuevoValor.objetivos_estatutarios || [],
      autoridades: nuevoValor.autoridades || [],
      hero: nuevoValor.hero || null,
      seccion_institucional_home: nuevoValor.seccion_institucional_home || null,
      logotipo_base64: nuevoValor.logotipo_base64 || '',
      hero_imagen_base64: nuevoValor.hero_imagen_base64 || '',
      updated_at: new Date().toISOString(),
    };

    await setDocument('institutional_settings', 'ariq_main', payload);
    await logInternalActivity(
      'UPDATE_SETTINGS',
      'institutional_settings',
      'ariq_main',
      'Datos institucionales modificados en Firestore'
    );
    return nuevoValor;
  },
};
