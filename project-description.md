# GenIA — Generador Inteligente de ERPs para PyMEs

GenIA es un sistema web que permite a pequeñas y medianas empresas (PyMEs) mexicanas crear y gestionar sistemas ERP personalizados mediante un asistente inteligente basado en inteligencia artificial.

## ¿Cómo funciona?

1. **Asistente por formulario**: El usuario completa un formulario interactivo de 8 secciones (tipo de negocio, tamaño, operación, módulos deseados, flujo de trabajo, tecnología, datos existentes y validación final).

2. **Generación con IA**: Dependiendo del camino elegido:
   - **Agente Claude (Anthropic)**: Analiza las respuestas del formulario y genera un análisis de negocio, diseño de base de datos y mockups HTML navegables de las pantallas del ERP.
   - **Agente Gemini (Google)**: Si el usuario sube un archivo Excel con datos existentes, lo normaliza a 3FN y genera el script SQL correspondiente.

3. **Dashboard operativo**: El sistema creado se materializa en un dashboard funcional donde el usuario puede:
   - Navegar entre módulos (tablas) mediante una barra lateral
   - Crear, editar y eliminar registros (filas)
   - Agregar y configurar campos (columnas) con tipos de dato, validaciones y reglas
   - Personalizar estilos visuales (colores, tema, fuente)
   - Buscar y filtrar datos en tiempo real

4. **Persistencia**: Los proyectos se almacenan en Supabase (PostgreSQL) y también cuentan con soporte offline vía localStorage como fallback.

## Arquitectura

- **Frontend**: Next.js 16 con TypeScript, Tailwind CSS v4, React Query, Axios, Lucide icons y Lottie
- **Backend**: Express.js 5 con autenticación JWT/Supabase, carga de archivos (Multer) y exportación Excel (ExcelJS)
- **Base de datos**: Supabase (PostgreSQL) con tablas para dashboards, estilos, tablas, columnas, filas y relaciones
- **IA**: Anthropic Claude Sonnet 4 (generación de ERPs) y Google Gemini 2.5 Flash (conversión Excel a SQL)

## Requisitos

- Node.js 18+
- Cuenta en Supabase (URL + Anon Key)
- API Key de Anthropic (para generación de ERPs)
- API Key de Google AI (para conversión de Excel, opcional)

## Cómo ejecutar

### Backend (`genia_server/`)

```bash
cd genia_server
npm install
cp .env.example .env   # Configurar SUPABASE_URL, SUPABASE_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY
npm run dev            # Inicia en http://localhost:4000 (con nodemon)
```

### Frontend (`genia_client/`)

```bash
cd genia_client
npm install
cp .env.local.example .env.local   # Configurar NEXT_PUBLIC_API_URL (http://localhost:4000 en dev)
npm run dev           # Inicia en http://localhost:3000
```

### Variables de entorno

**Backend** (`.env`):
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=eyJxxx...
ANTHROPIC_API_KEY=sk-ant-xxx...
GOOGLE_API_KEY=AIzaxxx...
PORT=4000
NODE_ENV=development
```

**Frontend** (`.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## Rutas del API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/usuario/registro` | Registro de usuario |
| POST | `/usuario/login` | Inicio de sesión |
| POST | `/proyecto/crear` | Crear proyecto |
| GET | `/proyecto/listar/:id` | Listar proyectos por usuario |
| POST | `/erp/generar` | Generar ERP con Claude (JSON) |
| POST | `/erp/preview` | Generar previsualización HTML |
| POST | `/inyeccion/crear-dashboard` | Persistir dashboard generado en BD |
| POST | `/sistema/conversion-Excel` | Convertir Excel a SQL (Gemini) |
| GET | `/dashboard` | Listar dashboards del usuario |
| GET | `/dashboard/:id` | Obtener dashboard completo |
| POST | `/dashboard/:id/tablas` | Crear tabla |
| PUT | `/dashboard/:id/tablas/:tablaId` | Actualizar tabla |
| DELETE | `/dashboard/:id/tablas/:tablaId` | Eliminar tabla |
| POST | `/dashboard/:id/tablas/:tablaId/columnas` | Crear columna |
| PUT | `/dashboard/:id/tablas/:tablaId/columnas/:columnaId` | Actualizar columna |
| DELETE | `/dashboard/:id/tablas/:tablaId/columnas/:columnaId` | Eliminar columna |
| POST | `/dashboard/:id/tablas/:tablaId/filas` | Crear fila |
| PUT | `/dashboard/:id/tablas/:tablaId/filas/:filaId` | Actualizar fila |
| DELETE | `/dashboard/:id/tablas/:tablaId/filas/:filaId` | Eliminar fila |
| PUT | `/dashboard/:id/estilos/:estiloId` | Actualizar estilo |

## Tecnologías principales

- **Frontend**: Next.js, TypeScript, Tailwind CSS, React Query, Lucide React
- **Backend**: Express.js, Supabase, Multer, ExcelJS
- **IA**: Anthropic Claude, Google Gemini (LangChain)
- **BD**: PostgreSQL (Supabase)

---

Proyecto desarrollado para el **Platanus Hack 26: CDMX** — Track Legacy por el equipo 15.
