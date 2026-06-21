import { supabase } from "../config/supabaseClient.js";

// ─────────────────────────────────────────────────────────────────────────────
// GET /dashboard  — Listar todos los dashboards del usuario autenticado
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Devuelve un listado resumido de dashboards para la pantalla "Mis Proyectos".
 * Incluye estilos y tablas (sin columnas/filas) para renderizar las tarjetas.
 */
export const listarDashboards = async (req, res) => {
    try {
        const userId = req.user.id;

        const { data: dashboards, error } = await supabase
            .from("dashboards")
            .select(`
                id,
                nombre,
                idioma,
                moneda,
                zona_horaria,
                formato_fecha,
                created_at,
                estilos(
                    id,
                    nombre,
                    tema,
                    color_primario,
                    color_secundario,
                    color_acento,
                    fuente,
                    activo
                ),
                tablas(
                    id,
                    nombre,
                    etiqueta,
                    icono,
                    orden
                )
            `)
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) {
            // PGRST205 = la tabla no existe aún en el schema cache de Supabase
            // (ocurre cuando ningún dashboard ha sido creado todavía en producción).
            // En lugar de devolver 500 y romper el frontend, devolvemos lista vacía.
            if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
                console.warn("listarDashboards: tablas no encontradas en Supabase (PGRST205). Devolviendo lista vacía.");
                return res.status(200).json({ ok: true, data: [] });
            }
            throw error;
        }

        // Ordenar las tablas de cada dashboard por su campo orden
        const resultado = (dashboards || []).map(d => ({
            ...d,
            tablas: (d.tablas || []).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)),
        }));

        return res.status(200).json({
            ok: true,
            data: resultado,
        });

    } catch (err) {
        console.error("Error en listarDashboards:", err);
        return res.status(err.status || 500).json({
            ok: false,
            error: err.message,
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Validar propiedad del dashboard
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifica que el dashboard con `dashboardId` pertenece al `userId`.
 * Lanza un error con status 403 si no es el propietario, o 404 si no existe.
 */
const verificarPropietarioDashboard = async (dashboardId, userId) => {
    const { data, error } = await supabase
        .from("dashboards")
        .select("id, user_id")
        .eq("id", dashboardId)
        .single();

    if (error || !data) {
        const err = new Error("Dashboard no encontrado");
        err.status = 404;
        throw err;
    }

    if (data.user_id !== userId) {
        const err = new Error("No tienes permiso para acceder a este dashboard");
        err.status = 403;
        throw err;
    }

    return data;
};

/**
 * Verifica que la tabla pertenece al dashboard indicado.
 */
const verificarTablaDashboard = async (tablaId, dashboardId) => {
    const { data, error } = await supabase
        .from("tablas")
        .select("id, dashboard_id")
        .eq("id", tablaId)
        .single();

    if (error || !data) {
        const err = new Error("Tabla no encontrada");
        err.status = 404;
        throw err;
    }

    if (data.dashboard_id !== dashboardId) {
        const err = new Error("La tabla no pertenece a este dashboard");
        err.status = 403;
        throw err;
    }

    return data;
};

/**
 * Verifica que la columna pertenece a la tabla indicada.
 */
const verificarColumnaTbla = async (columnaId, tablaId) => {
    const { data, error } = await supabase
        .from("columnas")
        .select("id, tabla_id")
        .eq("id", columnaId)
        .single();

    if (error || !data) {
        const err = new Error("Columna no encontrada");
        err.status = 404;
        throw err;
    }

    if (data.tabla_id !== tablaId) {
        const err = new Error("La columna no pertenece a esta tabla");
        err.status = 403;
        throw err;
    }

    return data;
};

/**
 * Verifica que la fila pertenece a la tabla indicada.
 */
const verificarFilaTabla = async (filaId, tablaId) => {
    const { data, error } = await supabase
        .from("filas")
        .select("id, tabla_id")
        .eq("id", filaId)
        .single();

    if (error || !data) {
        const err = new Error("Fila no encontrada");
        err.status = 404;
        throw err;
    }

    if (data.tabla_id !== tablaId) {
        const err = new Error("La fila no pertenece a esta tabla");
        err.status = 403;
        throw err;
    }

    return data;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /dashboard/:id
// Obtiene el dashboard completo: estilos + tablas (con columnas, filas y relaciones)
// ─────────────────────────────────────────────────────────────────────────────

export const obtenerDashboard = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Validar propiedad
        await verificarPropietarioDashboard(id, userId);

        // 1. Dashboard + estilos + tablas + columnas + filas en una sola query anidada
        const { data: dashboard, error: dashboardError } = await supabase
            .from("dashboards")
            .select(`
                *,
                estilos(*),
                tablas(
                    *,
                    columnas(*),
                    filas(*)
                )
            `)
            .eq("id", id)
            .single();

        if (dashboardError) throw dashboardError;

        // 2. Para cada tabla, obtener relaciones de sus columnas
        //    Relaciones vinculan columnas por ID, así que buscamos por columna_origen_id
        if (dashboard.tablas && dashboard.tablas.length > 0) {
            for (const tabla of dashboard.tablas) {
                const columnaIds = (tabla.columnas || []).map(c => c.id);

                if (columnaIds.length > 0) {
                    const { data: relaciones, error: relError } = await supabase
                        .from("relaciones")
                        .select(`
                            *,
                            columna_origen:columna_origen_id(id, nombre, tabla_id),
                            columna_destino:columna_destino_id(id, nombre, tabla_id)
                        `)
                        .in("columna_origen_id", columnaIds);

                    if (!relError) {
                        tabla.relaciones = relaciones || [];
                    } else {
                        tabla.relaciones = [];
                    }
                } else {
                    tabla.relaciones = [];
                }

                // Ordenar columnas y filas por su campo `orden`
                if (tabla.columnas) {
                    tabla.columnas.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
                }
                if (tabla.filas) {
                    tabla.filas.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
                }
            }

            // Ordenar tablas por su campo `orden`
            dashboard.tablas.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
        }

        return res.status(200).json({
            ok: true,
            data: dashboard
        });

    } catch (err) {
        console.error("Error en obtenerDashboard:", err);
        return res.status(err.status || 500).json({
            ok: false,
            error: err.message
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// TABLAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /dashboard/:id/tablas
 * Agrega una nueva tabla al dashboard.
 */
export const crearTabla = async (req, res) => {
    try {
        const { id: dashboardId } = req.params;
        const userId = req.user.id;

        await verificarPropietarioDashboard(dashboardId, userId);

        const { nombre, etiqueta, icono, orden } = req.body;

        if (!nombre) {
            return res.status(400).json({
                ok: false,
                error: "El campo 'nombre' es requerido"
            });
        }

        const { data: tabla, error } = await supabase
            .from("tablas")
            .insert([{
                dashboard_id: dashboardId,
                nombre,
                etiqueta: etiqueta ?? nombre,
                icono: icono ?? "table",
                orden: orden ?? 0
            }])
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json({
            ok: true,
            mensaje: "Tabla creada exitosamente",
            data: { ...tabla, columnas: [], filas: [], relaciones: [] }
        });

    } catch (err) {
        console.error("Error en crearTabla:", err);
        return res.status(err.status || 500).json({
            ok: false,
            error: err.message
        });
    }
};

/**
 * PUT /dashboard/:id/tablas/:tablaId
 * Actualiza metadata de una tabla (nombre, etiqueta, icono, orden).
 */
export const actualizarTabla = async (req, res) => {
    try {
        const { id: dashboardId, tablaId } = req.params;
        const userId = req.user.id;

        await verificarPropietarioDashboard(dashboardId, userId);
        await verificarTablaDashboard(tablaId, dashboardId);

        const { nombre, etiqueta, icono, orden } = req.body;

        const camposActualizar = {};
        if (nombre !== undefined) camposActualizar.nombre = nombre;
        if (etiqueta !== undefined) camposActualizar.etiqueta = etiqueta;
        if (icono !== undefined) camposActualizar.icono = icono;
        if (orden !== undefined) camposActualizar.orden = orden;

        if (Object.keys(camposActualizar).length === 0) {
            return res.status(400).json({
                ok: false,
                error: "No se proporcionaron campos para actualizar"
            });
        }

        const { data: tabla, error } = await supabase
            .from("tablas")
            .update(camposActualizar)
            .eq("id", tablaId)
            .select()
            .single();

        if (error) throw error;

        return res.status(200).json({
            ok: true,
            mensaje: "Tabla actualizada exitosamente",
            data: tabla
        });

    } catch (err) {
        console.error("Error en actualizarTabla:", err);
        return res.status(err.status || 500).json({
            ok: false,
            error: err.message
        });
    }
};

/**
 * DELETE /dashboard/:id/tablas/:tablaId
 * Elimina una tabla y todos sus datos (columnas, filas, relaciones) en cascada.
 */
export const eliminarTabla = async (req, res) => {
    try {
        const { id: dashboardId, tablaId } = req.params;
        const userId = req.user.id;

        await verificarPropietarioDashboard(dashboardId, userId);
        await verificarTablaDashboard(tablaId, dashboardId);

        // Obtener columnas de la tabla para eliminar sus relaciones
        const { data: columnas } = await supabase
            .from("columnas")
            .select("id")
            .eq("tabla_id", tablaId);

        const columnaIds = (columnas || []).map(c => c.id);

        // Eliminar relaciones donde la columna origen o destino pertenece a esta tabla
        if (columnaIds.length > 0) {
            await supabase
                .from("relaciones")
                .delete()
                .in("columna_origen_id", columnaIds);

            await supabase
                .from("relaciones")
                .delete()
                .in("columna_destino_id", columnaIds);
        }

        // Eliminar columnas de la tabla
        await supabase
            .from("columnas")
            .delete()
            .eq("tabla_id", tablaId);

        // Eliminar filas de la tabla
        await supabase
            .from("filas")
            .delete()
            .eq("tabla_id", tablaId);

        // Eliminar la tabla
        const { error } = await supabase
            .from("tablas")
            .delete()
            .eq("id", tablaId);

        if (error) throw error;

        return res.status(200).json({
            ok: true,
            mensaje: "Tabla eliminada exitosamente"
        });

    } catch (err) {
        console.error("Error en eliminarTabla:", err);
        return res.status(err.status || 500).json({
            ok: false,
            error: err.message
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// COLUMNAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /dashboard/:id/tablas/:tablaId/columnas
 * Agrega una nueva columna a una tabla.
 */
export const crearColumna = async (req, res) => {
    try {
        const { id: dashboardId, tablaId } = req.params;
        const userId = req.user.id;

        await verificarPropietarioDashboard(dashboardId, userId);
        await verificarTablaDashboard(tablaId, dashboardId);

        const columna = req.body;

        if (!columna.nombre) {
            return res.status(400).json({
                ok: false,
                error: "El campo 'nombre' es requerido"
            });
        }

        const { data, error } = await supabase
            .from("columnas")
            .insert([{
                tabla_id: tablaId,
                nombre: columna.nombre,
                etiqueta: columna.etiqueta ?? columna.nombre,
                tipo_dato: columna.tipo_dato ?? "string",
                requerido: columna.requerido ?? false,
                unico: columna.unico ?? false,
                max_length: columna.max_length ?? null,
                mascara: columna.mascara ?? null,
                valores_permitidos: columna.valores_permitidos ?? null,
                multivalor: columna.multivalor ?? false,
                valor_defecto: columna.valor_defecto ?? null,
                expresion_regular: columna.expresion_regular ?? null,
                condicion_visible: columna.condicion_visible ?? null,
                busqueda_habilitada: columna.busqueda_habilitada ?? false,
                tabla_busqueda: columna.tabla_busqueda ?? null,
                orden: columna.orden ?? 0,
                ancho: columna.ancho ?? "full",
                input_type: columna.input_type ?? "text",
                icono: columna.icono ?? null,
                placeholder: columna.placeholder ?? null,
                clase_css: columna.clase_css ?? null
            }])
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json({
            ok: true,
            mensaje: "Columna creada exitosamente",
            data
        });

    } catch (err) {
        console.error("Error en crearColumna:", err);
        return res.status(err.status || 500).json({
            ok: false,
            error: err.message
        });
    }
};

/**
 * PUT /dashboard/:id/tablas/:tablaId/columnas/:columnaId
 * Actualiza la definición de una columna.
 */
export const actualizarColumna = async (req, res) => {
    try {
        const { id: dashboardId, tablaId, columnaId } = req.params;
        const userId = req.user.id;

        await verificarPropietarioDashboard(dashboardId, userId);
        await verificarTablaDashboard(tablaId, dashboardId);
        await verificarColumnaTbla(columnaId, tablaId);

        const camposPermitidos = [
            "nombre", "etiqueta", "tipo_dato", "requerido", "unico",
            "max_length", "mascara", "valores_permitidos", "multivalor",
            "valor_defecto", "expresion_regular", "condicion_visible",
            "busqueda_habilitada", "tabla_busqueda", "orden", "ancho",
            "input_type", "icono", "placeholder", "clase_css"
        ];

        const camposActualizar = {};
        for (const campo of camposPermitidos) {
            if (req.body[campo] !== undefined) {
                camposActualizar[campo] = req.body[campo];
            }
        }

        if (Object.keys(camposActualizar).length === 0) {
            return res.status(400).json({
                ok: false,
                error: "No se proporcionaron campos para actualizar"
            });
        }

        const { data, error } = await supabase
            .from("columnas")
            .update(camposActualizar)
            .eq("id", columnaId)
            .select()
            .single();

        if (error) throw error;

        return res.status(200).json({
            ok: true,
            mensaje: "Columna actualizada exitosamente",
            data
        });

    } catch (err) {
        console.error("Error en actualizarColumna:", err);
        return res.status(err.status || 500).json({
            ok: false,
            error: err.message
        });
    }
};

/**
 * DELETE /dashboard/:id/tablas/:tablaId/columnas/:columnaId
 * Elimina una columna y sus relaciones asociadas.
 */
export const eliminarColumna = async (req, res) => {
    try {
        const { id: dashboardId, tablaId, columnaId } = req.params;
        const userId = req.user.id;

        await verificarPropietarioDashboard(dashboardId, userId);
        await verificarTablaDashboard(tablaId, dashboardId);
        await verificarColumnaTbla(columnaId, tablaId);

        // Eliminar relaciones donde esta columna es origen o destino
        await supabase
            .from("relaciones")
            .delete()
            .eq("columna_origen_id", columnaId);

        await supabase
            .from("relaciones")
            .delete()
            .eq("columna_destino_id", columnaId);

        // Eliminar la columna
        const { error } = await supabase
            .from("columnas")
            .delete()
            .eq("id", columnaId);

        if (error) throw error;

        return res.status(200).json({
            ok: true,
            mensaje: "Columna eliminada exitosamente"
        });

    } catch (err) {
        console.error("Error en eliminarColumna:", err);
        return res.status(err.status || 500).json({
            ok: false,
            error: err.message
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// FILAS (Registros de datos)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /dashboard/:id/tablas/:tablaId/filas
 * Inserta un nuevo registro de datos en una tabla.
 *
 * Body: { datos: { campo1: valor1, campo2: valor2, ... }, orden?: number }
 */
export const crearFila = async (req, res) => {
    try {
        const { id: dashboardId, tablaId } = req.params;
        const userId = req.user.id;

        await verificarPropietarioDashboard(dashboardId, userId);
        await verificarTablaDashboard(tablaId, dashboardId);

        const { datos, orden } = req.body;

        if (!datos || typeof datos !== "object") {
            return res.status(400).json({
                ok: false,
                error: "El campo 'datos' es requerido y debe ser un objeto"
            });
        }

        // Validar que los campos de datos corresponden a columnas existentes
        const { data: columnas, error: colError } = await supabase
            .from("columnas")
            .select("nombre, requerido")
            .eq("tabla_id", tablaId);

        if (colError) throw colError;

        // Verificar campos requeridos
        const erroresCampos = [];
        for (const col of (columnas || [])) {
            if (col.requerido && (datos[col.nombre] === undefined || datos[col.nombre] === null || datos[col.nombre] === "")) {
                erroresCampos.push(`El campo '${col.nombre}' es requerido`);
            }
        }

        if (erroresCampos.length > 0) {
            return res.status(400).json({
                ok: false,
                error: "Campos requeridos faltantes",
                detalles: erroresCampos
            });
        }

        // Calcular el siguiente orden si no se proporcionó
        let ordenFila = orden;
        if (ordenFila === undefined) {
            const { count } = await supabase
                .from("filas")
                .select("id", { count: "exact", head: true })
                .eq("tabla_id", tablaId);
            ordenFila = (count || 0) + 1;
        }

        const { data: fila, error } = await supabase
            .from("filas")
            .insert([{
                tabla_id: tablaId,
                datos,
                orden: ordenFila
            }])
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json({
            ok: true,
            mensaje: "Registro creado exitosamente",
            data: fila
        });

    } catch (err) {
        console.error("Error en crearFila:", err);
        return res.status(err.status || 500).json({
            ok: false,
            error: err.message
        });
    }
};

/**
 * PUT /dashboard/:id/tablas/:tablaId/filas/:filaId
 * Actualiza los datos de un registro existente.
 *
 * Body: { datos: { campo1: valor1, ... } }
 * Hace merge con los datos existentes (no reemplaza todo el objeto).
 */
export const actualizarFila = async (req, res) => {
    try {
        const { id: dashboardId, tablaId, filaId } = req.params;
        const userId = req.user.id;

        await verificarPropietarioDashboard(dashboardId, userId);
        await verificarTablaDashboard(tablaId, dashboardId);
        await verificarFilaTabla(filaId, tablaId);

        const { datos, orden } = req.body;

        if (datos === undefined && orden === undefined) {
            return res.status(400).json({
                ok: false,
                error: "Se debe proporcionar al menos 'datos' o 'orden' para actualizar"
            });
        }

        // Obtener datos actuales para hacer merge
        const { data: filaActual, error: filaError } = await supabase
            .from("filas")
            .select("datos, orden")
            .eq("id", filaId)
            .single();

        if (filaError) throw filaError;

        const camposActualizar = {};

        if (datos !== undefined) {
            // Merge de datos: mantener campos existentes y sobreescribir los nuevos
            camposActualizar.datos = { ...(filaActual.datos || {}), ...datos };
        }

        if (orden !== undefined) {
            camposActualizar.orden = orden;
        }

        const { data: fila, error } = await supabase
            .from("filas")
            .update(camposActualizar)
            .eq("id", filaId)
            .select()
            .single();

        if (error) throw error;

        return res.status(200).json({
            ok: true,
            mensaje: "Registro actualizado exitosamente",
            data: fila
        });

    } catch (err) {
        console.error("Error en actualizarFila:", err);
        return res.status(err.status || 500).json({
            ok: false,
            error: err.message
        });
    }
};

/**
 * DELETE /dashboard/:id/tablas/:tablaId/filas/:filaId
 * Elimina un registro de datos.
 */
export const eliminarFila = async (req, res) => {
    try {
        const { id: dashboardId, tablaId, filaId } = req.params;
        const userId = req.user.id;

        await verificarPropietarioDashboard(dashboardId, userId);
        await verificarTablaDashboard(tablaId, dashboardId);
        await verificarFilaTabla(filaId, tablaId);

        const { error } = await supabase
            .from("filas")
            .delete()
            .eq("id", filaId);

        if (error) throw error;

        return res.status(200).json({
            ok: true,
            mensaje: "Registro eliminado exitosamente"
        });

    } catch (err) {
        console.error("Error en eliminarFila:", err);
        return res.status(err.status || 500).json({
            ok: false,
            error: err.message
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PUT /dashboard/:id/estilos/:estiloId
 * Actualiza el estilo activo del dashboard (colores, tema, fuente).
 */
export const actualizarEstilo = async (req, res) => {
    try {
        const { id: dashboardId, estiloId } = req.params;
        const userId = req.user.id;

        await verificarPropietarioDashboard(dashboardId, userId);

        // Verificar que el estilo pertenece al dashboard
        const { data: estiloExistente, error: estiloError } = await supabase
            .from("estilos")
            .select("id, dashboard_id")
            .eq("id", estiloId)
            .single();

        if (estiloError || !estiloExistente) {
            return res.status(404).json({ ok: false, error: "Estilo no encontrado" });
        }

        if (estiloExistente.dashboard_id !== dashboardId) {
            return res.status(403).json({ ok: false, error: "El estilo no pertenece a este dashboard" });
        }

        const camposPermitidos = [
            "nombre", "tema", "color_primario", "color_secundario",
            "color_acento", "fuente", "activo"
        ];

        const camposActualizar = {};
        for (const campo of camposPermitidos) {
            if (req.body[campo] !== undefined) {
                camposActualizar[campo] = req.body[campo];
            }
        }

        const { data: estilo, error } = await supabase
            .from("estilos")
            .update(camposActualizar)
            .eq("id", estiloId)
            .select()
            .single();

        if (error) throw error;

        return res.status(200).json({
            ok: true,
            mensaje: "Estilo actualizado exitosamente",
            data: estilo
        });

    } catch (err) {
        console.error("Error en actualizarEstilo:", err);
        return res.status(err.status || 500).json({
            ok: false,
            error: err.message
        });
    }
};
