-- Tabla para almacenar los proyectos de los usuarios
CREATE TABLE IF NOT EXISTS proyectos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre_negocio TEXT NOT NULL,
  configuracion JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para acelerar búsquedas de proyectos por usuario
CREATE INDEX IF NOT EXISTS idx_proyectos_usuario_id ON proyectos(usuario_id);
