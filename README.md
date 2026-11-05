# ARIQ — Asociación Rosarina de Instrumentadores Quirúrgicos
### *Instrumentadores Quirúrgicos Profesionales de Rosario Asociación Civil*
**Personería Jurídica: Resolución I.G.P.J. N° 412/1988 — Rosario, Santa Fe, Argentina**

---

## 1. DESCRIPCIÓN DEL PROYECTO

Plataforma web institucional y sistema de administración integral para la **Asociación Rosarina de Instrumentadores Quirúrgicos (ARIQ)**, desarrollada con **React, JavaScript y JSX**, sin TypeScript, bajo un diseño responsive moderno, accesible y profesional adaptado a la identidad de la salud y la cirugía.

La infraestructura central de datos, autenticación y archivos se encuentra respaldada por **Firebase (Google Cloud Platform)**:
- **Cloud Firestore**: Base de datos NoSQL de alta escalabilidad con 10 colecciones estructuradas (incluyendo `system_health_logs` para control de incidentes).
- **Firebase Authentication**: Autenticación para Administradores, Editores y Operadores con inicio de sesión por Google y credenciales de correo/contraseña.
- **Firebase Storage**: Almacenamiento seguro de fotografías quirúrgicas, portadas de cursos, imágenes de noticias y documentación oficial (`ariq-rosario.firebasestorage.app`).
- **Firebase Hosting**: Publicación del sitio estático con reescritura SPA e integración CI/CD con GitHub Actions.

---

## 2. SISTEMA AUTOMÁTICO DE MONITOREO Y CONTROL DE PRODUCCIÓN

El sistema cuenta con una arquitectura de observabilidad continua de extremo a extremo que evalúa el estado del sitio público, los microservicios de Firebase, los procesos de GitHub Actions y el registro centralizado de incidentes.

### 2.1 Componentes del Sistema de Monitoreo

1. **Dashboard Técnico en Panel Administrativo (`/admin/sistema`):**
   - Interfaz en tiempo real para supervisión de salud del sistema.
   - Botón interactivo **"Ejecutar Monitoreo Completo"** que ejecuta pruebas reales no destructivas en el cliente.
   - Métricas de latencia de red en milisegundos (`latencyMs`).
   - Registro y resolución de incidentes con notas administrativas.
   - Exportación de informes de auditoría en formato JSON.

2. **Servicio Central de Monitoreo (`src/services/monitoringService.js`):**
   - Ejecuta verificaciones atómicas de:
     - **Disponibilidad Web:** Comprobación HTTP (código 200) y tiempo de respuesta en las 7 rutas obligatorias:
       - `/` (Inicio)
       - `/institucional` (Institucional)
       - `/noticias` (Noticias y publicaciones)
       - `/cursos` (Cursos y capacitaciones)
       - `/eventos` (Agenda de eventos y congresos)
       - `/contacto` (Formulario de contacto)
       - `/login` (Acceso al panel administrativo)
     - **Recursos Estáticos:** Verificación de carga y encabezados del logotipo oficial (`/images/logo-ariq.png`).
     - **Seguridad de Transporte:** Detección de protocolo HTTPS y contexto cifrado (`window.isSecureContext`).
     - **Cloud Firestore (`ariq-rosario`):** Consultas de lectura a `institutional_settings`, `news`, `courses` y `events`.
     - **Firebase Authentication:** Estado del proveedor de identidad, persistencia de sesión y dominio de autenticación.
     - **Firebase Storage:** Accesibilidad al bucket `ariq-rosario.firebasestorage.app`.
     - **GitHub Actions:** Estado de flujos de trabajo de CI/CD.

3. **Script Autónomo de Verificación (`scripts/health-check.mjs`):**
   - Script Node.js ejecutable tanto en terminal local como en servidores CI/CD:
     ```bash
     npm run health-check
     ```
   - Retorna código de salida `0` si todas las rutas están operativas, o `1` en caso de fallo crítico.
   - Genera resúmenes Markdown automáticos para GitHub Actions (`$GITHUB_STEP_SUMMARY`).

4. **Flujos Automatizados de GitHub Actions (`.github/workflows/`):**
   - **`health-check.yml`:** Ejecución programada cada 30 minutos (`cron: '*/30 * * * *'`) y bajo demanda (`workflow_dispatch`), inspeccionando la URL de producción sin intervención humana.
   - **`firebase-ci-cd.yml`:** Flujo de integración y despliegue continuo que ejecuta pruebas de sintaxis (`npm run lint`), compilación (`npm run build`) y despliegue automático a Firebase Hosting ante cada push a la rama `main`.

---

## 3. INTERPRETACIÓN DE ESTADOS VISUALES

En el panel `/admin/sistema`, cada servicio e indicador muestra uno de cuatro estados unificados:

| Estado Visual | Color / Indicador | Significado Técnico |
| :--- | :--- | :--- |
| **`OPERATIVO`** | 🟢 Verde (Esmeralda) | El servicio responde correctamente, el código HTTP es 200, la latencia es normal (< 1200 ms) y no se detectaron fallos. |
| **`ADVERTENCIA`** | 🟡 Amarillo (Ámbar) | El servicio está en línea pero presenta latencia elevada (> 1200 ms), o algún recurso secundario requiere revisión sin bloquear la navegación. |
| **`ERROR`** | 🔴 Rojo (Rosa fuerte) | Fallo de conexión, código HTTP 4xx/5xx, excepción en Firebase o interrupción de servicio. Se genera automáticamente un incidente. |
| **`SIN VERIFICAR`** | ⚪ Gris (Piedra) | El componente aún no ha sido evaluado en la sesión actual. Nunca se simula un estado positivo sin una prueba real previa. |

Cada indicador muestra además la **fecha y hora exacta** de su última comprobación.

---

## 4. REGISTRO Y GESTIÓN DE INCIDENTES (`system_health_logs`)

Los incidentes detectados de forma automática o reportados manualmente se almacenan en la colección privada de Firestore `/system_health_logs`:

### 4.1 Estructura del Documento de Incidente

```json
{
  "id": "inc_1730799600000_a1b2c3",
  "servicio": "hosting",
  "tipo_error": "FALLO_DETECTADO_EN_AUDITORIA",
  "descripcion": "Fallo de respuesta HTTP 500 en ruta /cursos.",
  "estado": "abierto",
  "severidad": "critico",
  "latencia_ms": 3500,
  "creado_por": "sistema_automatico",
  "fecha_resolucion": null,
  "resolucion_notas": "",
  "timestamp": "2026-11-05T04:00:00.000Z"
}
```

### 4.2 Estados de un Incidente
- **`abierto`**: Incidente recién registrado que requiere atención.
- **`investigando`**: En proceso de diagnóstico técnico.
- **`resuelto`**: Incidente mitigado con fecha de resolución y notas archivadas.

### 4.3 Sanitización y Privacidad
El servicio de monitoreo sanitiza automáticamente cualquier mensaje de error antes de guardarlo en Firestore, eliminando tokens, contraseñas, claves privadas y datos personales de usuarios (cumplimiento estricto de seguridad).

---

## 5. ALERTAS CRÍTICAS POR CORREO ELECTRÓNICO (CLOUD FUNCTIONS)

Para evitar la exposición de credenciales SMTP o claves privadas en el navegador del usuario, las alertas por correo se gestionan exclusivamente del lado del servidor mediante Firebase Cloud Functions:

- **Archivo:** `functions/index.js`
- **Disparador:** `onDocumentCreated('system_health_logs/{incidentId}')`
- **Comportamiento:** Si un incidente tiene `severidad == 'critico'`, la función envía un correo con el detalle técnico del fallo a la casilla de administración (`admin@ariq.org.ar`).
- **Configuración en Firebase:**
  ```bash
  firebase functions:config:set smtp.host="smtp.gmail.com" smtp.user="alertas@ariq.org.ar" smtp.password="TU_CONTRASENA_DE_APLICACION"
  firebase deploy --only functions
  ```

---

## 6. COLECCIONES DE CLOUD FIRESTORE

| Colección | Propósito en ARIQ | Reglas de Acceso |
| :--- | :--- | :--- |
| `institutional_settings` | Datos legales oficiales, CUIT, personerías, autoridades y canales de atención. | Lectura pública; escritura solo `admin`. |
| `news` | Publicaciones institucionales, notas científicas, slug único y portadas. | Lectura pública si `estado == 'publicada'`; edición `admin` y `editor`. |
| `news_categories` | Categorías temáticas (Capacitación Continua, Gremial, Bioseguridad, etc.). | Lectura pública; gestión por personal staff. |
| `courses` | Programas de formación quirúrgica, vacantes sincronizadas y cupos. | Lectura pública; actualización transaccional de cupos. |
| `course_registrations` | Inscripciones con DNI y matrícula. Registro transaccional seguro. | Creación pública; lectura restringida a staff (PII protegida). |
| `events` | Congresos, jornadas rosarinas y asambleas con fechas y sedes. | Lectura pública; gestión `admin` y `editor`. |
| `contact_messages` | Mensajes recibidos a través del formulario con notas internas. | Creación pública; lectura reservada a staff. |
| `profiles` | Perfiles de usuario vinculados al UID de Firebase Auth. | Lectura/escritura propia o por `admin`. |
| `internal_logs` | Auditoría inmutable de altas, bajas y modificaciones administrativas. | Solo lectura/escritura por `admin`. |
| `system_health_logs` | Historial y estado de incidentes del sistema de monitoreo. | Lectura y actualización reservada a staff y administradores. |

---

## 7. DIAGNÓSTICO Y RESOLUCIÓN DE FALLOS COMUNES EN FIREBASE

### 1. Error: `permission-denied` (Permiso Denegado en Firestore)
- **Causa:** Las reglas de seguridad de Firestore (`firestore.rules`) no han sido desplegadas en el proyecto de Firebase Console o la colección está bloqueada.
- **Solución:**
  1. Abra la consola de Firebase en `https://console.firebase.google.com/project/ariq-rosario/firestore/rules`.
  2. Pegue el contenido completo de `firestore.rules` del proyecto y presione **Publicar**.

### 2. Error: `the client is offline` / `unavailable`
- **Causa:** La base de datos Cloud Firestore aún no ha sido inicializada en el proyecto `ariq-rosario` o no hay conexión de red.
- **Solución:** Ingrese a la consola de Firebase, diríjase a **Firestore Database**, y si aparece el botón "Crear base de datos", créela en modo producción con base de datos `(default)`.

### 3. Error en Firebase Storage: `storage/unauthorized`
- **Causa:** Las reglas de `storage.rules` no están aplicadas en el bucket `ariq-rosario.firebasestorage.app`.
- **Solución:** En la pestaña **Storage > Reglas**, copie el contenido de `storage.rules` y presione **Publicar**.

---

## 8. COMANDOS DEL PROYECTO

```bash
# Iniciar servidor de desarrollo en puerto 3000
npm run dev

# Ejecutar verificación de salud de rutas localmente
npm run health-check

# Validación de código y linter sin emitir archivos
npm run lint

# Compilar para producción (Vite)
npm run build
```
