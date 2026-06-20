import { supabase } from "../config/supabaseClient.js";

//RUTAS Usuario

export const registro = async (req, res) =>{
    try{

    const {nombre, appat, apmat, fecha_nacimiento, telefono, email, password} = req.body;

    //El que lea esto es un ganador bro.
    const {data: authSign, err: errSign} = await supabase.auth.signUp({
        email,
        password
    });

    if(errSign){
        console.log("Aqui esta dando el error pedazo de estupido")
        throw errSign
    } 

    //Insertamos un nuevo usuario papá
    const {data: usuario, err: chispas} = await supabase
        .from("usuario")
        .insert({
            id: authSign.user?.id,
            nombre,
            appat,
            apmat,
            fecha_nacimiento,
            telefono
        });
    
    if(chispas) throw chispas

    res.json({ok: true, data: usuario})

    } catch (err) {
        res.status(500).json({ error: err.message })
    }
}


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
