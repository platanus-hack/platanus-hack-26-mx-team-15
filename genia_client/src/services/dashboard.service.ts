import api from "@/lib/api";
import type {
    Dashboard,
    Tabla,
    Columna,
    Fila,
    Estilo,
    ApiResponse,
    CrearTablaPayload,
    ActualizarTablaPayload,
    CrearColumnaPayload,
    ActualizarColumnaPayload,
    CrearFilaPayload,
    ActualizarFilaPayload,
    ActualizarEstiloPayload,
} from "@/types/dashboard";

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

/** Resumen de dashboard para la lista "Mis Proyectos" */
export type DashboardResumen = Pick<
    Dashboard,
    "id" | "nombre" | "idioma" | "moneda" | "zona_horaria" | "formato_fecha" | "created_at"
> & {
    estilos: Pick<Estilo, "id" | "nombre" | "tema" | "color_primario" | "color_secundario" | "color_acento" | "fuente" | "activo">[];
    tablas: Pick<Tabla, "id" | "nombre" | "etiqueta" | "icono" | "orden">[];
};

// ─────────────────────────────────────────────────────────────────────────────
// ERP PREVIEW (AI)
// ─────────────────────────────────────────────────────────────────────────────

/** Resultado de la generación de mockups por Claude */
export interface ERPPreviewResult {
    analisis: {
        tipo_negocio: string;
        resumen: string;
        modulos_detectados: string[];
        roles: { nombre: string; permisos: string[] }[];
    };
    base_de_datos: {
        tablas: { nombre: string; campos: string[] }[];
    };
    pantallas: { nombre: string; mockup_html: string }[];
    pregunta_confirmacion: string;
}

export interface ERPPreviewResponse {
    success: boolean;
    data: ERPPreviewResult;
    preview_html: string;
}

/**
 * Llama al agente Claude para generar mockups HTML del ERP basado en el formulario.
 * POST /erp/generar
 * No requiere auth (el endpoint es público).
 */
export const generateERPPreview = async (
    formPayload: Record<string, unknown>
): Promise<ERPPreviewResponse> => {
    const res = await api.post<ERPPreviewResponse>("/erp/generar", formPayload);
    if (!res.data.success) {
        throw new Error("El agente no pudo generar los mockups");
    }
    return res.data;
};

/**
 * Lista todos los dashboards del usuario autenticado (resumen, sin columnas/filas).
 * GET /dashboard
 */
export const listDashboards = async (): Promise<DashboardResumen[]> => {
    const res = await api.get<ApiResponse<DashboardResumen[]>>("/dashboard");
    if (!res.data.ok || !res.data.data) {
        throw new Error(res.data.error ?? "Error al listar los dashboards");
    }
    return res.data.data;
};

/**
 * Obtiene el dashboard completo con estilos, tablas (columnas, filas, relaciones).
 * GET /dashboard/:id
 */
export const getDashboard = async (dashboardId: string): Promise<Dashboard> => {
    const res = await api.get<ApiResponse<Dashboard>>(`/dashboard/${dashboardId}`);
    if (!res.data.ok || !res.data.data) {
        throw new Error(res.data.error ?? "Error al obtener el dashboard");
    }
    return res.data.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Actualiza el estilo (colores, tema, fuente) de un dashboard.
 * PUT /dashboard/:id/estilos/:estiloId
 */
export const updateEstilo = async (
    dashboardId: string,
    estiloId: string,
    payload: ActualizarEstiloPayload
): Promise<Estilo> => {
    const res = await api.put<ApiResponse<Estilo>>(
        `/dashboard/${dashboardId}/estilos/${estiloId}`,
        payload
    );
    if (!res.data.ok || !res.data.data) {
        throw new Error(res.data.error ?? "Error al actualizar el estilo");
    }
    return res.data.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// TABLAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Agrega una nueva tabla al dashboard.
 * POST /dashboard/:id/tablas
 */
export const createTabla = async (
    dashboardId: string,
    payload: CrearTablaPayload
): Promise<Tabla> => {
    const res = await api.post<ApiResponse<Tabla>>(
        `/dashboard/${dashboardId}/tablas`,
        payload
    );
    if (!res.data.ok || !res.data.data) {
        throw new Error(res.data.error ?? "Error al crear la tabla");
    }
    return res.data.data;
};

/**
 * Actualiza metadata de una tabla (nombre, etiqueta, icono, orden).
 * PUT /dashboard/:id/tablas/:tablaId
 */
export const updateTabla = async (
    dashboardId: string,
    tablaId: string,
    payload: ActualizarTablaPayload
): Promise<Tabla> => {
    const res = await api.put<ApiResponse<Tabla>>(
        `/dashboard/${dashboardId}/tablas/${tablaId}`,
        payload
    );
    if (!res.data.ok || !res.data.data) {
        throw new Error(res.data.error ?? "Error al actualizar la tabla");
    }
    return res.data.data;
};

/**
 * Elimina una tabla y todos sus datos (cascade).
 * DELETE /dashboard/:id/tablas/:tablaId
 */
export const deleteTabla = async (
    dashboardId: string,
    tablaId: string
): Promise<void> => {
    const res = await api.delete<ApiResponse<null>>(
        `/dashboard/${dashboardId}/tablas/${tablaId}`
    );
    if (!res.data.ok) {
        throw new Error(res.data.error ?? "Error al eliminar la tabla");
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// COLUMNAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Agrega una nueva columna a una tabla.
 * POST /dashboard/:id/tablas/:tablaId/columnas
 */
export const createColumna = async (
    dashboardId: string,
    tablaId: string,
    payload: CrearColumnaPayload
): Promise<Columna> => {
    const res = await api.post<ApiResponse<Columna>>(
        `/dashboard/${dashboardId}/tablas/${tablaId}/columnas`,
        payload
    );
    if (!res.data.ok || !res.data.data) {
        throw new Error(res.data.error ?? "Error al crear la columna");
    }
    return res.data.data;
};

/**
 * Actualiza la definición de una columna.
 * PUT /dashboard/:id/tablas/:tablaId/columnas/:columnaId
 */
export const updateColumna = async (
    dashboardId: string,
    tablaId: string,
    columnaId: string,
    payload: ActualizarColumnaPayload
): Promise<Columna> => {
    const res = await api.put<ApiResponse<Columna>>(
        `/dashboard/${dashboardId}/tablas/${tablaId}/columnas/${columnaId}`,
        payload
    );
    if (!res.data.ok || !res.data.data) {
        throw new Error(res.data.error ?? "Error al actualizar la columna");
    }
    return res.data.data;
};

/**
 * Elimina una columna y sus relaciones.
 * DELETE /dashboard/:id/tablas/:tablaId/columnas/:columnaId
 */
export const deleteColumna = async (
    dashboardId: string,
    tablaId: string,
    columnaId: string
): Promise<void> => {
    const res = await api.delete<ApiResponse<null>>(
        `/dashboard/${dashboardId}/tablas/${tablaId}/columnas/${columnaId}`
    );
    if (!res.data.ok) {
        throw new Error(res.data.error ?? "Error al eliminar la columna");
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// FILAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Inserta un nuevo registro de datos en una tabla.
 * POST /dashboard/:id/tablas/:tablaId/filas
 */
export const createFila = async (
    dashboardId: string,
    tablaId: string,
    payload: CrearFilaPayload
): Promise<Fila> => {
    const res = await api.post<ApiResponse<Fila>>(
        `/dashboard/${dashboardId}/tablas/${tablaId}/filas`,
        payload
    );
    if (!res.data.ok || !res.data.data) {
        throw new Error(res.data.error ?? "Error al crear el registro");
    }
    return res.data.data;
};

/**
 * Actualiza los datos de un registro existente (merge con datos actuales).
 * PUT /dashboard/:id/tablas/:tablaId/filas/:filaId
 */
export const updateFila = async (
    dashboardId: string,
    tablaId: string,
    filaId: string,
    payload: ActualizarFilaPayload
): Promise<Fila> => {
    const res = await api.put<ApiResponse<Fila>>(
        `/dashboard/${dashboardId}/tablas/${tablaId}/filas/${filaId}`,
        payload
    );
    if (!res.data.ok || !res.data.data) {
        throw new Error(res.data.error ?? "Error al actualizar el registro");
    }
    return res.data.data;
};

/**
 * Elimina un registro de datos.
 * DELETE /dashboard/:id/tablas/:tablaId/filas/:filaId
 */
export const deleteFila = async (
    dashboardId: string,
    tablaId: string,
    filaId: string
): Promise<void> => {
    const res = await api.delete<ApiResponse<null>>(
        `/dashboard/${dashboardId}/tablas/${tablaId}/filas/${filaId}`
    );
    if (!res.data.ok) {
        throw new Error(res.data.error ?? "Error al eliminar el registro");
    }
};
