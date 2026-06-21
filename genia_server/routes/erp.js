
import express from 'express';
import { generarERPController, generarERPPreviewController } from '../controllers/erpAgentController.js';

const router = express.Router();

router.post('/generar', generarERPController);
router.post('/preview', generarERPPreviewController);

export const path = '/erp';
export default router;
