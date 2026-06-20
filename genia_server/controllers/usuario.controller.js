import { supabase } from "../config/supabaseClient.js";

//RUTAS Usuario

export const registro = async (req, res) => {
    try {
        const {
            nombre,
            appat,
            apmat,
            fecha_nacimiento,
            telefono,
            email,
            password
        } = req.body;

        const { data: authSign, error: errSign } =
            await supabase.auth.signUp({
                email,
                password
            });

        if (errSign) throw errSign;

        const userId =
            authSign.user?.id || authSign.session?.user?.id;

        const { data: usuario, error: chispas } =
            await supabase
                .from("usuario")
                .insert([
                    {
                        id: userId,
                        nombre,
                        appat,
                        apmat,
                        fecha_nacimiento,
                        telefono
                    }
                ])
                .select();

        if (chispas) throw chispas;

        return res.json({ ok: true, data: usuario });

    } catch (err) {
        return res.status(500).json({
            ok: false,
            error: err.message
        });
    }
};


export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data, error } =
            await supabase.auth.signInWithPassword({
                email,
                password,
            });

        if (error) {
            return res.status(401).json({
                message: error.message,
            });
        }

        return res.status(200).json({
            user: data.user,
            session: data.session,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error interno",
        });
    }
};

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
