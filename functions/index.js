/**
 * @file index.js
 * Cloud Functions para el Sistema de Monitoreo ARIQ.
 * Dispara notificaciones por correo electrónico ante la creación de incidentes críticos en Firestore `system_health_logs`.
 * No expone secretos ni claves en el cliente.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Configurar transporte SMTP seguro con variables de entorno del servidor (NUNCA en el frontend)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || '',
  },
});

const ALERT_RECIPIENTS = process.env.ALERT_EMAILS || 'admin@ariq.org.ar, presidencia@ariq.org.ar';

/**
 * Trigger de Firestore: Escucha inserciones en `system_health_logs`
 */
exports.onCriticalIncidentCreated = functions.firestore
  .document('system_health_logs/{incidentId}')
  .onCreate(async (snap, context) => {
    const incident = snap.data();

    // Solo notificar si la severidad es crítica o advertencia mayor
    if (incident.severidad !== 'critico') {
      return null;
    }

    const mailOptions = {
      from: '"ARQ Alertas de Producción" <alertas@ariq.org.ar>',
      to: ALERT_RECIPIENTS,
      subject: `🚨 [ALERTA CRÍTICA] Incidente en Sistema ARIQ: ${incident.servicio.toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fee2e2; border-radius: 8px;">
          <h2 style="color: #dc2626; margin-top: 0;">Alerta Crítica del Sistema ARIQ</h2>
          <p>Se ha detectado automáticamente un incidente crítico en la plataforma institucional:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">ID Incidente:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><code>${context.params.incidentId}</code></td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Servicio Afectado:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong style="color: #dc2626;">${incident.servicio}</strong></td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Tipo de Error:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${incident.tipo_error}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Descripción:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${incident.descripcion}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Fecha y Hora:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${new Date(incident.timestamp).toLocaleString('es-AR')}</td>
            </tr>
          </table>
          <p style="font-size: 13px; color: #666;">
            Acceda al panel de control en <a href="https://ariq-rosario.firebaseapp.com/admin/sistema" style="color: #dc2626;">/admin/sistema</a> para investigar y resolver este incidente.
          </p>
        </div>
      `,
    };

    try {
      if (process.env.SMTP_USER) {
        await transporter.sendMail(mailOptions);
        console.log(`Alerta crítica enviada por correo para incidente ${context.params.incidentId}`);
      } else {
        console.warn('SMTP_USER no configurado en Cloud Functions. Correo simulado en log de servidor.');
      }
      return null;
    } catch (err) {
      console.error('Error enviando alerta de correo de incidente:', err);
      return null;
    }
  });
