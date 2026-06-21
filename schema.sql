-- ═══════════════════════════════════════════════════════════════════════════
-- GenIA — Schema de base de datos (Supabase / PostgreSQL)
-- Ejecutar en el SQL Editor de Supabase para crear todas las tablas.
-- Todas las sentencias usan IF NOT EXISTS para ser idempotentes.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Usuarios ──────────────────────────────────────────────────────────────
-- Tabla complementaria a auth.users de Supabase.
-- auth.users se gestiona automáticamente por Supabase Auth.
CREATE TABLE IF NOT EXISTS public.usuarios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  appat       TEXT NOT NULL,
  apmat       TEXT,
  fecha_nacimiento DATE,
  telefono    TEXT,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT,                         -- solo para login custom (sin Supabase Auth)
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── 2. Dashboards ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dashboards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,            -- referencia a auth.users.id de Supabase
  nombre          TEXT NOT NULL,
  idioma          TEXT NOT NULL DEFAULT 'es',
  moneda          TEXT NOT NULL DEFAULT 'MXN',
  zona_horaria    TEXT NOT NULL DEFAULT 'America/Mexico_City',
  formato_fecha   TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dashboards_user_id ON public.dashboards(user_id);

-- ── 3. Estilos ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.estilos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id     UUID NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
  nombre           TEXT NOT NULL DEFAULT 'Tema Principal',
  tema             TEXT NOT NULL DEFAULT 'dark',          -- 'light' | 'dark'
  color_primario   TEXT NOT NULL DEFAULT '#8b5cf6',
  color_secundario TEXT NOT NULL DEFAULT '#1e293b',
  color_acento     TEXT NOT NULL DEFAULT '#22c55e',
  fuente           TEXT NOT NULL DEFAULT 'Inter',
  activo           BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_estilos_dashboard_id ON public.estilos(dashboard_id);

-- ── 4. Tablas (módulos del ERP) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tablas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
  nombre       TEXT NOT NULL,              -- snake_case, ej: 'clientes'
  etiqueta     TEXT NOT NULL,              -- label visible, ej: 'Clientes'
  icono        TEXT NOT NULL DEFAULT 'table',
  orden        INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tablas_dashboard_id ON public.tablas(dashboard_id);

-- ── 5. Columnas (campos de cada tabla) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.columnas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabla_id            UUID NOT NULL REFERENCES public.tablas(id) ON DELETE CASCADE,
  nombre              TEXT NOT NULL,       -- nombre interno, ej: 'nombre_completo'
  etiqueta            TEXT NOT NULL,       -- label visible
  tipo_dato           TEXT NOT NULL DEFAULT 'string',
  requerido           BOOLEAN NOT NULL DEFAULT false,
  unico               BOOLEAN NOT NULL DEFAULT false,
  max_length          INTEGER,
  mascara             TEXT,
  valores_permitidos  JSONB,               -- array de strings para selects
  multivalor          BOOLEAN NOT NULL DEFAULT false,
  valor_defecto       TEXT,
  expresion_regular   TEXT,
  condicion_visible   JSONB,               -- { campo, operador, valor }
  busqueda_habilitada BOOLEAN NOT NULL DEFAULT false,
  tabla_busqueda      TEXT,
  orden               INTEGER NOT NULL DEFAULT 0,
  ancho               TEXT NOT NULL DEFAULT 'full',  -- 'full' | 'half' | 'third'
  input_type          TEXT NOT NULL DEFAULT 'text',
  icono               TEXT,
  placeholder         TEXT,
  clase_css           TEXT,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_columnas_tabla_id ON public.columnas(tabla_id);

-- ── 6. Filas (registros de datos de cada tabla) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.filas (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabla_id   UUID NOT NULL REFERENCES public.tablas(id) ON DELETE CASCADE,
  datos      JSONB NOT NULL DEFAULT '{}', -- { nombre_columna: valor }
  orden      INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_filas_tabla_id ON public.filas(tabla_id);

-- ── 7. Relaciones (entre columnas de diferentes tablas) ───────────────────────
CREATE TABLE IF NOT EXISTS public.relaciones (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  columna_origen_id   UUID NOT NULL REFERENCES public.columnas(id) ON DELETE CASCADE,
  columna_destino_id  UUID NOT NULL REFERENCES public.columnas(id) ON DELETE CASCADE,
  tipo                TEXT NOT NULL,       -- 'many_to_one' | 'one_to_many' | 'many_to_many' | 'one_to_one'
  nombre_relacion     TEXT,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_relaciones_origen ON public.relaciones(columna_origen_id);
CREATE INDEX IF NOT EXISTS idx_relaciones_destino ON public.relaciones(columna_destino_id);

-- ── 8. Módulos (catálogo de módulos disponibles) ──────────────────────────────
-- Tabla de referencia que usa Supabase internamente.
CREATE TABLE IF NOT EXISTS public.modulos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT UNIQUE NOT NULL,        -- ej: 'Clientes'
  descripcion TEXT,
  icono       TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- Row Level Security (RLS) — habilitar en producción
-- Descomentar y configurar según necesidades de la app.
-- ═══════════════════════════════════════════════════════════════════════════

-- ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Usuarios solo ven sus dashboards"
--   ON public.dashboards FOR ALL
--   USING (user_id = auth.uid());

-- ALTER TABLE public.tablas ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Acceso a tablas del dashboard del usuario"
--   ON public.tablas FOR ALL
--   USING (dashboard_id IN (SELECT id FROM public.dashboards WHERE user_id = auth.uid()));
