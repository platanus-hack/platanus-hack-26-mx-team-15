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

// REGISTRO DE USUARIO
export const registrarUsuario = async (req, res) => {
    try {
        const { nombre, appat, apmat, fecha_nacimiento, telefono, email, password } = req.body;

        // Validar campos requeridos
        if (!nombre || !appat || !apmat || !fecha_nacimiento || !telefono || !email || !password) {
            return res.status(400).json({
                ok: false,
                error: 'Todos los campos son requeridos'
            });
        }

        // Validar formato de teléfono (10 dígitos)
        if (!/^\d{10}$/.test(telefono)) {
            return res.status(400).json({
                ok: false,
                error: 'El teléfono debe tener 10 dígitos'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                ok: false,
                error: 'El formato del email no es válido'
            });
        }

        // Validar longitud de password
        if (password.length < 6) {
            return res.status(400).json({
                ok: false,
                error: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Insertar usuario en la base de datos
        const { data: usuario, error: errorUsuario } = await supabase
            .from("usuarios")
            .insert([
                {
                    nombre,
                    appat,
                    apmat,
                    fecha_nacimiento,
                    telefono,
                    email,
                    password, // En producción, deberías hashear la contraseña
                    created_at: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (errorUsuario) {
            console.error('Error de Supabase:', errorUsuario);
            return res.status(500).json({
                ok: false,
                error: `Error de base de datos: ${errorUsuario.message || 'Error desconocido'}`
            });
        }

        res.json({
            ok: true,
            message: 'Usuario registrado exitosamente',
            data: usuario
        });

    } catch (err) {
        console.error('Error al registrar usuario:', err);
        res.status(500).json({ 
            ok: false, 
            error: err.message 
        });
    }
}

// LOGIN DE USUARIO
export const loginUsuario = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar campos requeridos
        if (!email || !password) {
            return res.status(400).json({
                ok: false,
                error: 'Email y contraseña son requeridos'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                ok: false,
                error: 'El formato del email no es válido'
            });
        }

        // Buscar usuario en la base de datos
        const { data: usuario, error: errorUsuario } = await supabase
            .from("usuarios")
            .select("*")
            .eq("email", email)
            .eq("password", password) // En producción, deberías comparar con hash
            .single();

        if (errorUsuario || !usuario) {
            return res.status(401).json({
                ok: false,
                error: 'Email o contraseña incorrectos'
            });
        }

        // Remover la contraseña del objeto de respuesta
        const { password: _, ...usuarioSinPassword } = usuario;

        res.json({
            ok: true,
            message: 'Login exitoso',
            data: usuarioSinPassword,
            token: 'mock-token-' + usuario.id // En producción, usar JWT real
        });

    } catch (err) {
        console.error('Error al hacer login:', err);
        res.status(500).json({
            ok: false,
            error: err.message
        });
    }
}

// Made with Bob
