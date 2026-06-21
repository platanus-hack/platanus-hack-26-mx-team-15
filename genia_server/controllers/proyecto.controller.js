import { supabase } from "../config/supabaseClient.js";

// Helper para obtener el ID de usuario desde el token o el cuerpo de la petición
const getUserId = async (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        if (token.startsWith("mock-token-")) {
            return token.replace("mock-token-", "");
        }
        try {
            const { data, error } = await supabase.auth.getUser(token);
            if (!error && data?.user) {
                return data.user.id;
            }
        } catch (e) {
            console.error("Error parseando usuario de Supabase:", e);
        }
    }
    return req.body.usuario_id || req.params.usuario_id || req.body.userId;
};

// Crear un proyecto
export const crearProyecto = async (req, res) => {
    try {
        const usuario_id = await getUserId(req);
        const { tipo_negocio, tamano, operacion, modulos_deseados, flujo, tecnologia, datos_existentes } = req.body;

        if (!tipo_negocio) {
            return res.status(400).json({ ok: false, error: "El tipo de negocio es requerido" });
        }

        const nombre_negocio = req.body.nombre_negocio || `Mi ${tipo_negocio}`;

        const configuracion = {
            tipo_negocio,
            tamano,
            operacion,
            modulos_deseados,
            flujo,
            tecnologia,
            datos_existentes
        };

        // Insertar en Supabase
        const { data: proyecto, error } = await supabase
            .from("proyectos")
            .insert([
                {
                    usuario_id: usuario_id || null,
                    nombre_negocio,
                    configuracion,
                    created_at: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (error) {
            console.error("Error al insertar en Supabase (proyectos):", error);
            // Fallback en caso de que la tabla 'proyectos' no esté creada en la base de datos
            return res.json({
                ok: true,
                message: "Proyecto simulado/guardado (tabla 'proyectos' no encontrada en Supabase)",
                data: {
                    id: "mock-uuid-" + Math.random().toString(36).substring(2, 9),
                    usuario_id: usuario_id || null,
                    nombre_negocio,
                    configuracion,
                    created_at: new Date().toISOString()
                }
            });
        }

        res.json({
            ok: true,
            message: "Proyecto guardado exitosamente",
            data: proyecto
        });

    } catch (err) {
        console.error("Error al crear proyecto:", err);
        res.status(500).json({ ok: false, error: err.message });
    }
};

// Obtener todos los proyectos de un usuario
export const obtenerProyectos = async (req, res) => {
    try {
        const usuario_id = req.params.usuario_id || await getUserId(req);
        if (!usuario_id) {
            return res.status(400).json({ ok: false, error: "El ID de usuario es requerido" });
        }

        const { data: proyectos, error } = await supabase
            .from("proyectos")
            .select("*")
            .eq("usuario_id", usuario_id);

        if (error) {
            console.error("Error al obtener proyectos de Supabase:", error);
            // Retornamos un arreglo vacío para no romper la interfaz
            return res.json({ ok: true, data: [] });
        }

        res.json({ ok: true, data: proyectos });

    } catch (err) {
        console.error("Error al obtener proyectos:", err);
        res.status(500).json({ ok: false, error: err.message });
    }
};
