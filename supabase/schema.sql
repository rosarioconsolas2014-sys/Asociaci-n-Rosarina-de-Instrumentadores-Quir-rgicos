-- ==============================================================================
-- ARIQ: Asociación Rosarina de Instrumentadores Quirúrgicos
-- Base de Datos PostgreSQL / Supabase Schema
-- Archivo: supabase/schema.sql
-- ==============================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabla de Roles del Sistema
CREATE TABLE IF NOT EXISTS public.roles (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Tabla de Perfiles de Usuarios (vinculada con Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'operador' REFERENCES public.roles(id) ON UPDATE CASCADE,
    avatar_url TEXT,
    activo BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Tabla de Categorías de Noticias y Publicaciones
CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    color TEXT DEFAULT '#dc2626',
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Tabla de Noticias
CREATE TABLE IF NOT EXISTS public.noticias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    resumen TEXT NOT NULL,
    contenido TEXT NOT NULL,
    imagen_url TEXT,
    categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
    autor TEXT NOT NULL DEFAULT 'Comisión Directiva ARIQ',
    estado TEXT NOT NULL DEFAULT 'publicada' CHECK (estado IN ('borrador', 'publicada')),
    destacada BOOLEAN DEFAULT false NOT NULL,
    fecha_publicacion DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Tabla de Cursos y Capacitaciones
CREATE TABLE IF NOT EXISTS public.cursos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    descripcion TEXT NOT NULL,
    imagen_url TEXT,
    modalidad TEXT NOT NULL DEFAULT 'presencial' CHECK (modalidad IN ('presencial', 'virtual', 'hibrida')),
    lugar TEXT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    horario TEXT NOT NULL,
    duracion_horas INTEGER,
    cupos INTEGER NOT NULL DEFAULT 30,
    cupos_disponibles INTEGER NOT NULL DEFAULT 30,
    requisitos TEXT,
    arancel TEXT,
    info_inscripcion TEXT,
    material_descargable_url TEXT,
    estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'finalizado', 'proximamente', 'cerrado')),
    destacado BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Tabla de Eventos y Actividades Institucionales
CREATE TABLE IF NOT EXISTS public.eventos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    descripcion TEXT NOT NULL,
    imagen_url TEXT,
    tipo TEXT NOT NULL DEFAULT 'jornada' CHECK (tipo IN ('jornada', 'congreso', 'taller', 'institucional', 'asamblea')),
    fecha DATE NOT NULL,
    horario TEXT NOT NULL,
    lugar TEXT NOT NULL,
    direccion TEXT,
    ciudad TEXT DEFAULT 'Rosario, Santa Fe',
    estado TEXT NOT NULL DEFAULT 'publicado' CHECK (estado IN ('publicado', 'borrador', 'finalizado')),
    enlace_externo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Tabla de Inscripciones a Cursos
CREATE TABLE IF NOT EXISTS public.inscripciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
    nombre_completo TEXT NOT NULL,
    email TEXT NOT NULL,
    telefono TEXT,
    matricula_o_dni TEXT NOT NULL,
    institucion_laboral TEXT,
    es_socio_ariq BOOLEAN DEFAULT false,
    comentarios TEXT,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'rechazada')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. Tabla de Consultas y Contactos
CREATE TABLE IF NOT EXISTS public.contactos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_completo TEXT NOT NULL,
    email TEXT NOT NULL,
    telefono TEXT,
    motivo TEXT NOT NULL CHECK (motivo IN ('afiliacion', 'cursos', 'ejercicio_profesional', 'legal_gremial', 'general')),
    mensaje TEXT NOT NULL,
    leido BOOLEAN DEFAULT false NOT NULL,
    respondido BOOLEAN DEFAULT false NOT NULL,
    notas_admin TEXT,
    ip_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 10. Tabla de Configuración General e Institucional
CREATE TABLE IF NOT EXISTS public.configuracion (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    descripcion TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- ÍNDICES PARA ALTO RENDIMIENTO
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_noticias_slug ON public.noticias(slug);
CREATE INDEX IF NOT EXISTS idx_noticias_estado ON public.noticias(estado);
CREATE INDEX IF NOT EXISTS idx_noticias_fecha ON public.noticias(fecha_publicacion DESC);
CREATE INDEX IF NOT EXISTS idx_cursos_slug ON public.cursos(slug);
CREATE INDEX IF NOT EXISTS idx_cursos_estado ON public.cursos(estado);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha ON public.eventos(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_inscripciones_curso ON public.inscripciones(curso_id);
CREATE INDEX IF NOT EXISTS idx_contactos_leido ON public.contactos(leido);

-- ==============================================================================
-- TRIGGER PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_noticias_modtime BEFORE UPDATE ON public.noticias FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_cursos_modtime BEFORE UPDATE ON public.cursos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_eventos_modtime BEFORE UPDATE ON public.eventos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_configuracion_modtime BEFORE UPDATE ON public.configuracion FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para crear profile al registrarse nuevo usuario en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'operador')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- POLÍTICAS RLS (Row Level Security)
-- ==============================================================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noticias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contactos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

-- Funciones auxiliares de seguridad
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT (public.get_user_role() = 'admin');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
    SELECT (public.get_user_role() IN ('admin', 'editor', 'operador'));
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. Roles: lectura pública, modificación solo admin
CREATE POLICY "Lectura pública de roles" ON public.roles FOR SELECT USING (true);
CREATE POLICY "Admin gestiona roles" ON public.roles FOR ALL USING (public.is_admin());

-- 2. Perfiles: usuario lee su propio perfil o staff lee perfiles; admin gestiona
CREATE POLICY "Usuarios leen su perfil" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_staff());
CREATE POLICY "Admin gestiona perfiles" ON public.profiles FOR ALL USING (public.is_admin());

-- 3. Categorías: lectura pública; staff gestiona
CREATE POLICY "Lectura pública categorias" ON public.categorias FOR SELECT USING (true);
CREATE POLICY "Staff gestiona categorias" ON public.categorias FOR ALL USING (public.is_staff());

-- 4. Noticias: lectura pública de publicadas; staff lee todo y administra
CREATE POLICY "Lectura publica noticias publicadas" ON public.noticias FOR SELECT USING (estado = 'publicada' OR public.is_staff());
CREATE POLICY "Staff gestiona noticias" ON public.noticias FOR ALL USING (public.is_staff());

-- 5. Cursos: lectura pública; staff administra
CREATE POLICY "Lectura publica cursos" ON public.cursos FOR SELECT USING (true);
CREATE POLICY "Staff gestiona cursos" ON public.cursos FOR ALL USING (public.is_staff());

-- 6. Eventos: lectura pública de publicados; staff administra
CREATE POLICY "Lectura publica eventos publicados" ON public.eventos FOR SELECT USING (estado = 'publicado' OR public.is_staff());
CREATE POLICY "Staff gestiona eventos" ON public.eventos FOR ALL USING (public.is_staff());

-- 7. Inscripciones: inserción pública; staff lee y actualiza
CREATE POLICY "Cualquier persona puede inscribirse" ON public.inscripciones FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff lee inscripciones" ON public.inscripciones FOR SELECT USING (public.is_staff());
CREATE POLICY "Staff actualiza inscripciones" ON public.inscripciones FOR UPDATE USING (public.is_staff());
CREATE POLICY "Admin elimina inscripciones" ON public.inscripciones FOR DELETE USING (public.is_admin());

-- 8. Contactos: inserción pública; staff gestiona
CREATE POLICY "Cualquier persona puede enviar consulta" ON public.contactos FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff gestiona contactos" ON public.contactos FOR ALL USING (public.is_staff());

-- 9. Configuración: lectura pública; admin actualiza
CREATE POLICY "Lectura publica configuracion" ON public.configuracion FOR SELECT USING (true);
CREATE POLICY "Admin gestiona configuracion" ON public.configuracion FOR ALL USING (public.is_admin());
