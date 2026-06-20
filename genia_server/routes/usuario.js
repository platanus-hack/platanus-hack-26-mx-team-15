import express from 'express';

import {
    registro,
    login,
    obtenerClientes
} from '../controllers/usuario.controller.js';

import {authMiddleware} from '../auth/middleware.js';

const router = express.Router();

router.post("/registro", registro);
router.post('/login', login);
router.post('/obtener-clientes',authMiddleware, obtenerClientes);

export const path = '/usuario';
export default router;