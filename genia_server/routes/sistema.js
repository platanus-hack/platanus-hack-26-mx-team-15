import express from 'express';

import {
    conversionExcel
} from '../controllers/usuario.controller.js';

import {authMiddleware} from '../auth/middleware.js';

const router = express.Router();


router.post('/conversion-Excel',authMiddleware, convercionExcel);

export const path = '/sistema';
export default router;