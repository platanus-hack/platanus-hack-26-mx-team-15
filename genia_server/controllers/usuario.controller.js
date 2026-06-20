import { supabase } from "../config/supabaseClient.js";

//RUTAS ENTRENADOR

export const obtenerClientes = async (req, res) => {

    try {

        const entrenador_id = req.user.id

        //1. Obtener entrenador REAL (no confiar en frontend)
        const { data: entrenador, error: errorEntrenador } = await supabase
            .from("entrenador")
            .select("id")
            .eq("user_id", entrenador_id)
            .single()

        if (errorEntrenador) throw errorEntrenador

        const { data: clientes, error: errorClientes } = await supabase
            .rpc("obtener_clientes_con_membresia")

        if (errorClientes) throw errorClientes

        // (opcional) filtrar activos si no lo hiciste en SQL
        const clientesActivos = clientes.filter(c => c.activo !== false)

        res.json({ ok: true, data: clientesActivos })

    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}
