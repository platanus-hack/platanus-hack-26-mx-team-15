import express from 'express';

import {
    obtenerClientes,
    registrarUsuario,
    loginUsuario
} from '../controllers/usuario.controller.js';

import {authMiddleware} from '../auth/middleware.js';

const router = express.Router();

// Ruta pública para registro
router.post('/registro', registrarUsuario);

// Ruta pública para login
router.post('/login', loginUsuario);

// Ruta protegida
router.post('/obtener-clientes',authMiddleware, obtenerClientes);

export const path = '/usuario';
export default router;