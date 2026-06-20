import { supabase } from "../config/supabaseClient.js"

export const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.replace("Bearer ", "")

    if (!token) {
        return res.status(401).json({ error: "No token" })
    }

    try {
        const { data, error } = await supabase.auth.getUser(token)

        console.log("Auth Middleware - User Data:", data)

        if (error || !data.user) {
            return res.status(401).json({ error: "Token inválido" })
        }

        req.user = data.user
        next()
    } catch (error) {
        console.error("Error en authMiddleware:", error)
        return res.status(500).json({ error: "Error al validar token" })
    }
}