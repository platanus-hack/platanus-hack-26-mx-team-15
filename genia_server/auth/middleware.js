import { supabase } from "../config/supabaseClient.js"

export const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.replace("Bearer ", "")

    if (!token) {
        return res.status(401).json({ error: "No token" })
    }

    // ── Mock token para desarrollo local ─────────────────────────────────────
    // Formato: "mock-token-{uuid}" generado por loginUsuario (tabla custom)
    // Solo se acepta en NODE_ENV !== "production" para no exponer este bypass.
    if (token.startsWith("mock-token-") && process.env.NODE_ENV !== "production") {
        const userId = token.replace("mock-token-", "")
        if (!userId) {
            return res.status(401).json({ error: "Mock token inválido" })
        }
        req.user = { id: userId, email: null, role: "authenticated" }
        return next()
    }

    // ── Token JWT de Supabase ─────────────────────────────────────────────────
    try {
        const { data, error } = await supabase.auth.getUser(token)

        if (error || !data.user) {
            return res.status(401).json({ error: "Token inválido o expirado" })
        }

        req.user = data.user
        next()
    } catch (err) {
        console.error("Error en authMiddleware:", err)
        return res.status(500).json({ error: "Error al validar token" })
    }
}
