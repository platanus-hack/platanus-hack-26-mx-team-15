import express from 'express';
import { crearProyecto, obtenerProyectos } from '../controllers/proyecto.controller.js';

const router = express.Router();

// Ruta para crear un proyecto
router.post('/crear', crearProyecto);

// Ruta para listar proyectos de un usuario
router.get('/listar/:usuario_id', obtenerProyectos);

export const path = '/proyecto';
export default router;
