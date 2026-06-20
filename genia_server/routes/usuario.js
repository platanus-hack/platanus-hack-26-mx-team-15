import express from 'express';

import {
    obtenerClientes
} from '../controllers/usuario.controller.js';

import {authMiddleware} from '../auth/middleware.js';

const router = express.Router();


router.post('/obtener-clientes',authMiddleware, obtenerClientes);

export const path = '/usuario';
export default router;