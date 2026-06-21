import express from "express";
import { authMiddleware } from "../auth/middleware.js";
import {
    listarDashboards,
    obtenerDashboard,
    crearTabla,
    actualizarTabla,
    eliminarTabla,
    crearColumna,
    actualizarColumna,
    eliminarColumna,
    crearFila,
    actualizarFila,
    eliminarFila,
    actualizarEstilo
} from "../controllers/dashboard.controller.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ── Dashboard ─────────────────────────────────────────────────────────────────
/**
 * GET /dashboard
 * Lista todos los dashboards del usuario autenticado (resumen para "Mis Proyectos").
 */
router.get("/", listarDashboards);

/**
 * GET /dashboard/:id
 * Obtiene el dashboard completo con estilos, tablas, columnas, filas y relaciones.
 */
router.get("/:id", obtenerDashboard);

// ── Estilos ───────────────────────────────────────────────────────────────────
/**
 * PUT /dashboard/:id/estilos/:estiloId
 * Actualiza el estilo del dashboard (colores, tema, fuente).
 */
router.put("/:id/estilos/:estiloId", actualizarEstilo);

// ── Tablas ────────────────────────────────────────────────────────────────────
/**
 * POST /dashboard/:id/tablas
 * Agrega una nueva tabla al dashboard.
 */
router.post("/:id/tablas", crearTabla);

/**
 * PUT /dashboard/:id/tablas/:tablaId
 * Actualiza metadata de una tabla (nombre, etiqueta, icono, orden).
 */
router.put("/:id/tablas/:tablaId", actualizarTabla);

/**
 * DELETE /dashboard/:id/tablas/:tablaId
 * Elimina una tabla y todos sus datos en cascada.
 */
router.delete("/:id/tablas/:tablaId", eliminarTabla);

// ── Columnas ──────────────────────────────────────────────────────────────────
/**
 * POST /dashboard/:id/tablas/:tablaId/columnas
 * Agrega una nueva columna a una tabla.
 */
router.post("/:id/tablas/:tablaId/columnas", crearColumna);

/**
 * PUT /dashboard/:id/tablas/:tablaId/columnas/:columnaId
 * Actualiza la definición de una columna.
 */
router.put("/:id/tablas/:tablaId/columnas/:columnaId", actualizarColumna);

/**
 * DELETE /dashboard/:id/tablas/:tablaId/columnas/:columnaId
 * Elimina una columna y sus relaciones.
 */
router.delete("/:id/tablas/:tablaId/columnas/:columnaId", eliminarColumna);

// ── Filas (Registros de datos) ────────────────────────────────────────────────
/**
 * POST /dashboard/:id/tablas/:tablaId/filas
 * Inserta un nuevo registro de datos.
 */
router.post("/:id/tablas/:tablaId/filas", crearFila);

/**
 * PUT /dashboard/:id/tablas/:tablaId/filas/:filaId
 * Actualiza los datos de un registro (merge con datos existentes).
 */
router.put("/:id/tablas/:tablaId/filas/:filaId", actualizarFila);

/**
 * DELETE /dashboard/:id/tablas/:tablaId/filas/:filaId
 * Elimina un registro de datos.
 */
router.delete("/:id/tablas/:tablaId/filas/:filaId", eliminarFila);

export const path = "/dashboard";
export default router;
