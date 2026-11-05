# ARIQ — Asociación Rosarina de Instrumentadores Quirúrgicos
### *Instrumentadores Quirúrgicos Profesionales de Rosario Asociación Civil*
**Personería Jurídica: Resolución I.G.P.J. N° 412/1988 — Rosario, Santa Fe, Argentina**

---

## 1. DESCRIPCIÓN DEL PROYECTO

Plataforma web institucional y sistema de administración integral para la **Asociación Rosarina de Instrumentadores Quirúrgicos (ARIQ)**, desarrollada con **React, JavaScript y JSX**, sin TypeScript, bajo un diseño responsive moderno, accesible y profesional adaptado a la identidad de la salud y la cirugía.

La arquitectura de datos y autenticación se encuentra respaldada **exclusivamente por Cloud Firestore y Firebase Authentication (sin Firebase Storage)**:
- **Cloud Firestore**: Base de datos NoSQL centralizada donde persisten **TODOS los datos institucionales**, incluyendo configuraciones, noticias, cursos, eventos, auditorías, incidentes y **todas las imágenes como cadenas Base64 (Data URLs)**.
- **Firebase Authentication**: Autenticación para Administradores, Editores y Operadores con inicio de sesión por Google y credenciales de correo/contraseña.
- **Firebase Hosting**: Publicación del sitio estático con reescritura SPA e integración CI/CD con GitHub Actions.

---

## 2. ARQUITECTURA DE IMÁGENES EN BASE64 (SIN FIREBASE STORAGE)

Para simplificar la infraestructura y centralizar la persistencia en una sola fuente de datos atómica, la aplicación **no utiliza Firebase Storage**. Todas las fotografías, imágenes de noticias, banners de cursos, afiches de eventos y el logotipo institucional se procesan y almacenan directamente en Cloud Firestore.

### 2.1 Servicio Centralizado de Imágenes (`src/services/imageService.js`)

El servicio gestiona el ciclo de vida completo de cada recurso visual:

1. **Selección del Archivo:** El usuario administrador elige una imagen desde su dispositivo.
2. **Validación:** Comprobación estricta de tipo MIME (`image/webp`, `image/jpeg`, `image/png`) y peso original (< 5 MB).
3. **Redimensionamiento y Compresión en Canvas:**
   - La imagen se dibuja en un `<canvas>` en memoria y se redimensiona a un máximo de 1200 px (o 400 px para miniaturas).
   - Se convierte preferentemente a formato **WebP** o **PNG** (en caso de requerir transparencia como el logotipo oficial).
   - **Límite de tamaño estricto:** `<= 300 KB` post-compresión, garantizando que el documento de Firestore permanezca muy por debajo del límite estructural de 1 MiB.
4. **Miniaturas Automáticas:** Genera automáticamente una miniatura ultra-liviana (`miniatura_base64`, ~20-50 KB) para optimizar el rendimiento de las cuadrículas y listados públicos, reservando la imagen de alta definición para la vista de detalle.
5. **Persistencia Directa:** La imagen se guarda como campo `imagen_url` o `logotipo_base64` dentro del documento correspondiente en Firestore.

---

## 3. SISTEMA AUTOMÁTICO DE MONITOREO Y CONTROL DE PRODUCCIÓN

El sistema cuenta con una arquitectura de observabilidad continua de extremo a extremo que evalúa el estado del sitio público, Cloud Firestore, Firebase Authentication, los procesos de GitHub Actions y el registro centralizado de incidentes.

### 3.1 Componentes del Sistema de Monitoreo

1. **Dashboard Técnico en Panel Administrativo (`/admin/sistema`):**
   - Interfaz en tiempo real para supervisión de salud del sistema.
   - Botón interactivo **"Ejecutar Monitoreo Completo"** que ejecuta pruebas reales no destructivas en el cliente.
   - Métricas de latencia de red en milisegundos (`latencyMs`).
   - Monitor de almacenamiento Base64 en Firestore.
   - Registro y resolución de incidentes con notas administrativas.
   - Exportación de informes de auditoría en formato JSON.

2. **Servicio Central de Monitoreo (`src/services/monitoringService.js`):**
   - Inspección HTTP de las 7 rutas prioritarias: `/`, `/institucional`, `/noticias`, `/cursos`, `/eventos`, `/contacto`, `/login`.
   - Verificación de carga y encabezados del logotipo institucional (`/images/logo-ariq.png`).
   - Detección de protocolo HTTPS y contexto cifrado (`window.isSecureContext`).
   - Consultas de lectura a `institutional_settings`, `news`, `courses` y `events`.
   - Estado de Firebase Authentication y persistencia de sesión.
   - Estado de flujos de trabajo de GitHub Actions.

3. **Script Autónomo de Verificación (`scripts/health-check.mjs`):**
   - Script Node.js ejecutable tanto en terminal local como en servidores CI/CD:
     ```bash
     npm run health-check
     ```
   - Retorna código de salida `0` si todas las rutas están operativas, o `1` en caso de fallo crítico.
   - Genera resúmenes Markdown automáticos para GitHub Actions (`$GITHUB_STEP_SUMMARY`).

4. **Flujos Automatizados de GitHub Actions (`.github/workflows/`):**
   - **`health-check.yml`:** Ejecución programada cada 30 minutos (`cron: '*/30 * * * *'`) y bajo demanda (`workflow_dispatch`).
   - **`firebase-ci-cd.yml`:** Flujo de integración y despliegue continuo que ejecuta pruebas de sintaxis (`npm run lint`), compilación (`npm run build`) y despliegue automático a Firebase Hosting ante cada push a `main`.

---

## 4. INTERPRETACIÓN DE ESTADOS VISUALES

En el panel `/admin/sistema`, cada servicio e indicador muestra uno de cuatro estados unificados:

| Estado Visual | Color / Indicador | Significado Técnico |
| :--- | :--- | :--- |
| **`OPERATIVO`** | 🟢 Verde (Esmeralda) | El servicio responde correctamente, el código HTTP es 200, la latencia es normal (< 1200 ms) y no se detectaron fallos. |
| **`ADVERTENCIA`** | 🟡 Amarillo (Ámbar) | El servicio está en línea pero presenta latencia elevada (> 1200 ms), o algún recurso secundario requiere revisión sin bloquear la navegación. |
| **`ERROR`** | 🔴 Rojo (Rosa fuerte) | Fallo de conexión, código HTTP 4xx/5xx, excepción en Firebase o interrupción de servicio. Se genera automáticamente un incidente. |
| **`SIN VERIFICAR`** | ⚪ Gris (Piedra) | El componente aún no ha sido evaluado en la sesión actual. Nunca se simula un estado positivo sin una prueba real previa. |

Cada indicador muestra además la **fecha y hora exacta** de su última comprobación.

---

## 5. REGISTRO Y GESTIÓN DE INCIDENTES (`system_health_logs`)

Los incidentes detectados de forma automática o reportados manualmente se almacenan en la colección privada de Firestore `/system_health_logs`:

### 5.1 Estructura del Documento de Incidente

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

### 5.2 Alertas Críticas por Correo (Cloud Functions)
Las alertas por correo electrónico se ejecutan exclusivamente en el backend server-side mediante Firebase Cloud Functions (`functions/index.js`), escuchando inserciones en `system_health_logs` donde `severidad === 'critico'`, sin exponer contraseñas ni credenciales SMTP en el navegador del cliente.

---

## 6. COLECCIONES DE CLOUD FIRESTORE

| Colección | Propósito en ARIQ | Almacenamiento de Imágenes | Reglas de Acceso |
| :--- | :--- | :--- | :--- |
| `institutional_settings` | Datos legales oficiales, CUIT, autoridades y canales. | `logotipo_base64` (WebP/PNG transparente <= 250 KB) | Lectura pública; escritura solo `admin`. |
| `news` | Publicaciones y artículos científicos. | `imagen_url` (Base64) y `miniatura_base64` | Lectura pública si publicada; edición `admin`/`editor`. |
| `news_categories` | Categorías temáticas quirúrgicas. | N/A | Lectura pública; gestión por staff. |
| `courses` | Cursos y talleres con vacantes sincronizadas. | `imagen_url` (Base64) y `miniatura_base64` | Lectura pública; actualización transaccional de cupos. |
| `course_registrations` | Inscripciones con DNI y matrícula. | N/A | Creación pública; lectura restringida a staff (PII). |
| `events` | Congresos, jornadas y asambleas. | `imagen_url` (Base64) y `miniatura_base64` | Lectura pública; gestión `admin`/`editor`. |
| `contact_messages` | Mensajes recibidos a través del formulario. | N/A | Creación pública; lectura reservada a staff. |
| `profiles` | Perfiles de usuario vinculados al UID de Auth. | N/A | Lectura/escritura propia o por `admin`. |
| `internal_logs` | Auditoría inmutable de altas, bajas y modificaciones. | N/A | Solo lectura/escritura por `admin`. |
| `system_health_logs` | Registro y control de incidentes de producción. | N/A | Lectura y actualización reservada a staff y administradores. |

---

## 7. DIAGNÓSTICO Y RESOLUCIÓN DE FALLOS EN FIRESTORE

### 1. Error: `permission-denied` (Permiso Denegado en Firestore)
- **Causa:** Las reglas de seguridad de Firestore (`firestore.rules`) no han sido desplegadas en el proyecto de Firebase Console o la colección está bloqueada.
- **Solución:**
  1. Abra la consola de Firebase en `https://console.firebase.google.com/project/ariq-rosario/firestore/rules`.
  2. Pegue el contenido completo de `firestore.rules` del proyecto y presione **Publicar**.

### 2. Error: `the client is offline` / `unavailable`
- **Causa:** La base de datos Cloud Firestore aún no ha sido inicializada en el proyecto `ariq-rosario` o no hay conexión de red.
- **Solución:** Ingrese a la consola de Firebase, diríjase a **Firestore Database**, y si aparece el botón "Crear base de datos", créela en modo producción con base de datos `(default)`.

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
