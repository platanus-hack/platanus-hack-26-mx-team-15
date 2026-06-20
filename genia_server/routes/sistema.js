import express from 'express';

import {
    conversionExcel
} from '../controllers/sistema.controller.js';

import {authMiddleware} from '../auth/middleware.js';

const router = express.Router();


router.post('/conversion-Excel',authMiddleware, conversionExcel);

export const path = '/sistema';
export default router;