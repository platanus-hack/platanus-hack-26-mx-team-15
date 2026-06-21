import express from 'express';
import { crearDashboard } from '../controllers/inyeccion.controller.js';
import { authMiddleware } from '../auth/middleware.js';

const router = express.Router();

/**
 * POST /inyeccion/crear-dashboard
 *
 * Body: JSON generado por la IA con la estructura:
 *   { dashboard, estilos, tablas }
 *
 * Headers:
 *   Authorization: Bearer <supabase_access_token>
 */
router.post('/crear-dashboard', authMiddleware, crearDashboard);

export const path = '/inyeccion';
export default router;
