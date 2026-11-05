#!/usr/bin/env node
/**
 * @file health-check.mjs
 * Script autónomo de verificación de salud para ARIQ ejecutado por GitHub Actions cada 30 min y post-despliegue.
 */

import http from 'http';
import https from 'https';
import fs from 'fs';

const TARGET_URL = process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:3000';
const MONITORED_PATHS = [
  '/',
  '/institucional',
  '/noticias',
  '/cursos',
  '/eventos',
  '/contacto',
  '/login',
  '/images/logo-ariq.png',
];

console.log(`\n======================================================`);
console.log(`🏥 ARIQ - EJECUCIÓN DE CONTROL DE SALUD EN PRODUCCIÓN`);
console.log(`🌐 URL Objetivo: ${TARGET_URL}`);
console.log(`⏰ Marca Temporal: ${new Date().toISOString()}`);
console.log(`======================================================\n`);

function checkUrl(fullUrl) {
  return new Promise((resolve) => {
    const parsed = new URL(fullUrl);
    const client = parsed.protocol === 'https:' ? https : http;
    const start = Date.now();

    const req = client.get(
      fullUrl,
      {
        headers: {
          'User-Agent': 'ARIQ-HealthMonitor/1.0 (+https://ariq-rosario.firebaseapp.com)',
          Accept: 'text/html,*/*',
        },
        timeout: 10000,
      },
      (res) => {
        const latencyMs = Date.now() - start;
        // Consumir datos para liberar socket
        res.resume();
        resolve({
          url: fullUrl,
          path: parsed.pathname,
          status: res.statusCode,
          ok: res.statusCode >= 200 && res.statusCode < 400,
          latencyMs,
          headers: {
            contentType: res.headers['content-type'],
            server: res.headers['server'],
          },
        });
      }
    );

    req.on('error', (err) => {
      resolve({
        url: fullUrl,
        path: parsed.pathname,
        status: 0,
        ok: false,
        latencyMs: Date.now() - start,
        error: err.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        url: fullUrl,
        path: parsed.pathname,
        status: 408,
        ok: false,
        latencyMs: Date.now() - start,
        error: 'Tiempo de espera agotado (Timeout > 10s)',
      });
    });
  });
}

async function runHealthCheck() {
  const results = [];
  let hasCriticalFailure = false;

  for (const path of MONITORED_PATHS) {
    const fullUrl = new URL(path, TARGET_URL).toString();
    process.stdout.write(`Verificando ${path.padEnd(25)} ... `);
    const result = await checkUrl(fullUrl);
    results.push(result);

    if (result.ok) {
      console.log(`✅ [${result.status}] ${result.latencyMs}ms`);
    } else {
      console.log(`❌ [${result.status || 'ERR'}] ${result.error || 'Fallo HTTP'} (${result.latencyMs}ms)`);
      hasCriticalFailure = true;
    }
  }

  const avgLatency = Math.round(
    results.reduce((acc, r) => acc + (r.latencyMs || 0), 0) / results.length
  );

  console.log(`\n------------------------------------------------------`);
  console.log(`📊 RESUMEN DE COMPROBACIÓN:`);
  console.log(`   Rutas Verificadas: ${results.length}`);
  console.log(`   Exitosas:         ${results.filter((r) => r.ok).length}`);
  console.log(`   Fallidas:         ${results.filter((r) => !r.ok).length}`);
  console.log(`   Latencia Media:   ${avgLatency} ms`);
  console.log(`   Estado Global:    ${hasCriticalFailure ? '🔴 ERROR' : '🟢 OPERATIVO'}`);
  console.log(`------------------------------------------------------\n`);

  // Escribir reporte en GitHub Step Summary si estamos en entorno GitHub Actions
  if (process.env.GITHUB_STEP_SUMMARY) {
    const summaryMd = `
### 🏥 ARIQ - Reporte de Monitoreo Automático

| Ruta | Estado HTTP | Latencia | Resultado |
| :--- | :---: | :---: | :---: |
${results
  .map(
    (r) =>
      `| \`${r.path}\` | **${r.status}** | ${r.latencyMs} ms | ${r.ok ? '🟢 OK' : '🔴 ERROR'} |`
  )
  .join('\n')}

- **Estado General:** ${hasCriticalFailure ? '🔴 ERROR' : '🟢 OPERATIVO'}
- **Latencia Promedio:** ${avgLatency} ms
- **Fecha de Verificación:** \`${new Date().toISOString()}\`
`;
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summaryMd);
  }

  if (hasCriticalFailure) {
    console.error(`🚨 Fallo en comprobación de salud del sitio.`);
    process.exit(1);
  } else {
    console.log(`✨ Comprobación de producción finalizada con éxito.`);
    process.exit(0);
  }
}

runHealthCheck();
