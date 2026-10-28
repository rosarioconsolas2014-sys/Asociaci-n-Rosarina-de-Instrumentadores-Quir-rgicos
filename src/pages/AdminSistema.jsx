import React, { useState } from 'react';
import { Database, ShieldCheck, Key, RefreshCw, Copy, Check, FileCode, CheckCircle2 } from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import { isSupabaseConfigured, resetLocalStore } from '../services/supabase.js';

export default function AdminSistema() {
  const [copied, setCopied] = useState(null);
  const [resetDone, setResetDone] = useState(false);

  const handleCopy = (text, key) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2500);
    }
  };

  const handleReset = () => {
    if (window.confirm('¿Desea restaurar los datos de demostración a su estado inicial? Esta acción reiniciará las tablas en el almacenamiento local.')) {
      resetLocalStore();
      setResetDone(true);
      setTimeout(() => {
        setResetDone(false);
        window.location.reload();
      }, 1000);
    }
  };

  const adminCreationSQL = `-- Script seguro para crear el primer Administrador en Supabase:
-- 1. Primero crear el usuario en Supabase Auth (Authentication > Users > Add user) con:
-- Email: admin@ariq.org.ar
-- Contraseña segura

-- 2. Asignarle rol de 'admin' en la tabla profiles:
UPDATE public.profiles
SET role = 'admin', activo = true
WHERE email = 'admin@ariq.org.ar';

-- O para insertar directamente si no existiera el trigger:
-- INSERT INTO public.profiles (id, email, full_name, role)
-- VALUES ('<UUID_DEL_USUARIO>', 'admin@ariq.org.ar', 'Administrador Principal ARIQ', 'admin')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';`;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Supabase & Seguridad de Datos</h1>
        <p className="text-xs text-stone-500 mt-0.5">
          Estado del motor de base de datos, políticas de acceso RLS e instrucciones de aprovisionamiento en la nube.
        </p>
      </div>

      {/* Status Card */}
      <Card padding="p-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isSupabaseConfigured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-900">
                {isSupabaseConfigured ? 'Supabase Conectado en Producción' : 'Motor Local de Persistencia (Modo Demostración Activo)'}
              </h3>
              <p className="text-xs text-stone-500">
                {isSupabaseConfigured
                  ? 'Conectado a la URL configurada en VITE_SUPABASE_URL mediante Supabase Client.'
                  : 'Operando con el repositorio persistente local basado en el esquema oficial de ARIQ.'}
              </p>
            </div>
          </div>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
            isSupabaseConfigured
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            {isSupabaseConfigured ? 'Producción' : 'Demo / Vista Previa'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
          <div>
            <span className="text-stone-400 block font-semibold text-[10px] uppercase">Esquema SQL</span>
            <span className="text-stone-800 font-mono">supabase/schema.sql</span>
          </div>
          <div>
            <span className="text-stone-400 block font-semibold text-[10px] uppercase">Semilla Inicial</span>
            <span className="text-stone-800 font-mono">supabase/seed.sql</span>
          </div>
          <div>
            <span className="text-stone-400 block font-semibold text-[10px] uppercase">Políticas RLS</span>
            <span className="text-emerald-700 font-semibold">9 Tablas Protegidas</span>
          </div>
        </div>
      </Card>

      {/* Safe Admin Creation Instructions */}
      <Card padding="p-6">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-bold text-stone-900">
              Creación Segura del Primer Administrador
            </h3>
          </div>
          <button
            onClick={() => handleCopy(adminCreationSQL, 'sql_admin')}
            className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded cursor-pointer"
          >
            {copied === 'sql_admin' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied === 'sql_admin' ? 'Copiado' : 'Copiar SQL'}</span>
          </button>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed mb-3">
          Por principios de seguridad, un usuario nunca puede otorgarse a sí mismo el rol de administrador desde el cliente web. Para crear el primer superadministrador de forma segura:
        </p>

        <ol className="list-decimal pl-5 space-y-1.5 text-xs text-stone-700 mb-4">
          <li>Crea la cuenta en <strong>Supabase Dashboard &rarr; Authentication &rarr; Users &rarr; Add User</strong>.</li>
          <li>Abre el <strong>SQL Editor</strong> de Supabase y ejecuta la sentencia que se indica a continuación:</li>
        </ol>

        <pre className="bg-stone-900 text-stone-200 p-4 rounded-xl text-xs overflow-x-auto font-mono leading-relaxed">
          {adminCreationSQL}
        </pre>
      </Card>

      {/* Database Maintenance */}
      <Card padding="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-stone-900">Restablecer Datos de Demostración</h4>
            <p className="text-xs text-stone-500 mt-0.5">
              Reinicia las noticias, capacitaciones, eventos e inscripciones de prueba a sus valores iniciales.
            </p>
          </div>
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={handleReset}>
            {resetDone ? 'Restaurado...' : 'Restablecer Datos'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
