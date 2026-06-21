// ─────────────────────────────────────────────────────────────────────────────
// Tipos base del sistema de dashboards generados por GenIA
// Reflejan el schema de Supabase definido en el backend (inyeccion.controller.js)
// ─────────────────────────────────────────────────────────────────────────────

export interface Estilo {
  id: string;
  dashboard_id: string;
  nombre: string;
  /** "light" | "dark" */
  tema: string;
  color_primario: string;
  color_secundario: string;
  color_acento: string;
  fuente: string;
  activo: boolean;
}

export interface Relacion {
  id: string;
  columna_origen_id: string;
  columna_destino_id: string;
  /** "many_to_one" | "one_to_many" | "many_to_many" | "one_to_one" */
  tipo: string;
  nombre_relacion: string | null;
  /** Columna origen expandida (poblada en el GET /dashboard/:id) */
  columna_origen?: { id: string; nombre: string; tabla_id: string };
  /** Columna destino expandida (poblada en el GET /dashboard/:id) */
  columna_destino?: { id: string; nombre: string; tabla_id: string };
}

export interface Columna {
  id: string;
  tabla_id: string;
  nombre: string;
  etiqueta: string;
  /** "string" | "integer" | "decimal" | "boolean" | "date" | "datetime" | "email" | "phone" | "text" | "uuid" */
  tipo_dato: string;
  requerido: boolean;
  unico: boolean;
  max_length: number | null;
  mascara: string | null;
  valores_permitidos: string[] | null;
  multivalor: boolean;
  valor_defecto: string | null;
  expresion_regular: string | null;
  /** { campo: string; operador: string; valor: string } | null */
  condicion_visible: Record<string, string> | null;
  busqueda_habilitada: boolean;
  tabla_busqueda: string | null;
  orden: number;
  /** "full" | "half" | "third" */
  ancho: string;
  /** "text" | "email" | "number" | "tel" | "date" | "datetime-local" | "switch" | "select" | "textarea" | "password" */
  input_type: string;
  icono: string | null;
  placeholder: string | null;
  clase_css: string | null;
}

export interface Fila {
  id: string;
  tabla_id: string;
  /** Clave: nombre de columna, Valor: valor como string */
  datos: Record<string, string>;
  orden: number;
}

export interface Tabla {
  id: string;
  dashboard_id: string;
  nombre: string;
  etiqueta: string;
  icono: string;
  orden: number;
  columnas: Columna[];
  filas: Fila[];
  relaciones: Relacion[];
}

export interface Dashboard {
  id: string;
  user_id: string;
  nombre: string;
  idioma: string;
  moneda: string;
  zona_horaria: string;
  formato_fecha: string;
  created_at: string;
  estilos: Estilo[];
  tablas: Tabla[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Payloads para operaciones de escritura (sin campos auto-generados)
// ─────────────────────────────────────────────────────────────────────────────

export interface CrearTablaPayload {
  nombre: string;
  etiqueta?: string;
  icono?: string;
  orden?: number;
}

export interface ActualizarTablaPayload {
  nombre?: string;
  etiqueta?: string;
  icono?: string;
  orden?: number;
}

export type CrearColumnaPayload = Omit<Columna, "id" | "tabla_id">;

export type ActualizarColumnaPayload = Partial<Omit<Columna, "id" | "tabla_id">>;

export interface CrearFilaPayload {
  datos: Record<string, string>;
  orden?: number;
}

export interface ActualizarFilaPayload {
  datos?: Record<string, string>;
  orden?: number;
}

export interface ActualizarEstiloPayload {
  nombre?: string;
  tema?: string;
  color_primario?: string;
  color_secundario?: string;
  color_acento?: string;
  fuente?: string;
  activo?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Respuestas genéricas del API
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  mensaje?: string;
  error?: string;
  detalles?: string[];
}

export interface DashboardResponse extends ApiResponse<Dashboard> {
  data: Dashboard;
}
