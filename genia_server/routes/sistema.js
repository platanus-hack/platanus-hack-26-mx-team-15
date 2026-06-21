import express from 'express';
import multer from 'multer';

import { conversionExcel } from '../controllers/sistema.controller.js';
//import { authMiddleware } from '../auth/middleware.js';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.post('/conversion-Excel', upload.single('archivo'), conversionExcel);

export const path = '/sistema';
export default router;