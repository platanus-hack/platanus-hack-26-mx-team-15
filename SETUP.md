# GenIA - Setup Instructions

## Backend Setup

### 1. Crear tabla en Supabase

Ejecuta este SQL en tu proyecto de Supabase:

```sql
CREATE TABLE usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido_paterno TEXT NOT NULL,
  apellido_materno TEXT NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  telefono VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas por teléfono
CREATE INDEX idx_usuarios_telefono ON usuarios(telefono);
```

### 2. Configurar variables de entorno del backend

En `genia_server/.env`:

```env
PORT=3000
SUPABASE_URL=tu_supabase_url
SUPABASE_KEY=tu_supabase_key
```

### 3. Iniciar el backend

```bash
cd genia_server
npm install
npm start
```

El servidor correrá en `http://localhost:3000`

## Frontend Setup

### 1. Configurar variables de entorno del frontend

En `genia_client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Para producción**, cambia a la URL real de tu backend desplegado:
```env
NEXT_PUBLIC_API_URL=https://tu-backend.com
```

### 2. Iniciar el frontend

```bash
cd genia_client
npm install
npm run dev
```

El frontend correrá en `http://localhost:3000` (o el puerto que Next.js asigne)

## Endpoints del Backend

### POST /usuario/registro

Registra un nuevo usuario.

**Body:**
```json
{
  "nombre": "Juan",
  "apellido_paterno": "Pérez",
  "apellido_materno": "García",
  "fecha_nacimiento": "1990-01-15",
  "telefono": "5512345678"
}
```

**Response exitoso:**
```json
{
  "ok": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "id": "uuid",
    "nombre": "Juan",
    "apellido_paterno": "Pérez",
    "apellido_materno": "García",
    "fecha_nacimiento": "1990-01-15",
    "telefono": "5512345678",
    "created_at": "2026-06-20T14:30:00.000Z"
  }
}
```

**Response con error:**
```json
{
  "ok": false,
  "error": "Todos los campos son requeridos"
}
```

## Funcionalidades Implementadas

✅ Landing page con animaciones al scroll (solo primera vez)
✅ Modal de registro con fondo transparente y blur
✅ Formulario de registro con validación
✅ Conexión con backend para guardar usuarios
✅ Manejo de errores y mensajes de éxito
✅ Diseño responsive
✅ Integración del logo GenIA

## Próximos Pasos

1. Desplegar el backend en un servicio como Railway, Render o Vercel
2. Actualizar `NEXT_PUBLIC_API_URL` en `.env.local` con la URL real
3. Desplegar el frontend en Vercel
4. Configurar CORS en el backend si es necesario