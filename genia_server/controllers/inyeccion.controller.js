import { supabase } from "../config/supabaseClient.js";

/**
 * POST /inyeccion/crear-dashboard
 *
 * Recibe el JSON generado por la IA y lo inyecta en las tablas de Supabase:
 *   dashboards -> estilos -> tablas -> columnas -> filas -> relaciones
 *
 * Requiere authMiddleware: el user_id se toma de req.user.id.
 */
export const crearDashboard = async (req, res) => {
    try {
        const { dashboard, estilos = [], tablas = [] } = req.body;
        const userId = req.user.id;

        // ── Validaciones básicas ──────────────────────────────────────────────
        if (!dashboard || typeof dashboard !== "object") {
            return res.status(400).json({
                ok: false,
                error: "El campo 'dashboard' es requerido y debe ser un objeto"
            });
        }

        if (!dashboard.nombre || typeof dashboard.nombre !== "string") {
            return res.status(400).json({
                ok: false,
                error: "El campo 'dashboard.nombre' es requerido"
            });
        }

        if (!Array.isArray(tablas)) {
            return res.status(400).json({
                ok: false,
                error: "El campo 'tablas' debe ser un array"
            });
        }

        // ── 1. Insertar Dashboard ─────────────────────────────────────────────
        const { data: dashboardData, error: dashboardError } = await supabase
            .from("dashboards")
            .insert([{
                user_id: userId,
                nombre: dashboard.nombre,
                idioma: dashboard.idioma ?? "es",
                moneda: dashboard.moneda ?? "MXN",
                zona_horaria: dashboard.zona_horaria ?? "America/Mexico_City",
                formato_fecha: dashboard.formato_fecha ?? "DD/MM/YYYY"
            }])
            .select()
            .single();

        if (dashboardError) throw dashboardError;

        const dashboardId = dashboardData.id;

        // Acumuladores de resultado
        const errores = [];
        const resumen = {
            dashboard_id: dashboardId,
            estilos_insertados: 0,
            tablas_insertadas: 0,
            columnas_insertadas: 0,
            filas_insertadas: 0,
            relaciones_insertadas: 0
        };

        // ── 2. Insertar Estilos ───────────────────────────────────────────────
        for (const estilo of estilos) {
            const { error } = await supabase
                .from("estilos")
                .insert([{
                    dashboard_id: dashboardId,
                    nombre: estilo.nombre ?? "Tema Principal",
                    tema: estilo.tema ?? "light",
                    color_primario: estilo.color_primario ?? "#3b82f6",
                    color_secundario: estilo.color_secundario ?? "#8b5cf6",
                    color_acento: estilo.color_acento ?? "#f59e0b",
                    fuente: estilo.fuente ?? "Inter",
                    activo: estilo.activo ?? false
                }]);

            if (error) {
                errores.push({
                    entidad: "estilo",
                    nombre: estilo.nombre,
                    error: error.message
                });
            } else {
                resumen.estilos_insertados++;
            }
        }

        // ── 3. Insertar Tablas + Columnas + Filas (Fase 1) ───────────────────
        //
        // Se construye un mapa: "nombre_tabla.nombre_columna" -> columna_uuid
        // para poder resolver las referencias de relaciones en la Fase 2.
        //
        const columnaIdMap = {};

        for (const tabla of tablas) {
            if (!tabla.nombre) {
                errores.push({
                    entidad: "tabla",
                    nombre: "(sin nombre)",
                    error: "Cada tabla debe tener el campo 'nombre'"
                });
                continue;
            }

            // Insertar tabla
            const { data: tablaData, error: tablaError } = await supabase
                .from("tablas")
                .insert([{
                    dashboard_id: dashboardId,
                    nombre: tabla.nombre,
                    etiqueta: tabla.etiqueta ?? tabla.nombre,
                    icono: tabla.icono ?? "table",
                    orden: tabla.orden ?? 0
                }])
                .select()
                .single();

            if (tablaError) {
                errores.push({
                    entidad: "tabla",
                    nombre: tabla.nombre,
                    error: tablaError.message
                });
                // Si la tabla no se pudo crear, omitir sus columnas y filas
                continue;
            }

            const tablaId = tablaData.id;
            resumen.tablas_insertadas++;

            // Insertar columnas de esta tabla
            for (const columna of (tabla.columnas ?? [])) {
                if (!columna.nombre) {
                    errores.push({
                        entidad: "columna",
                        nombre: `${tabla.nombre}.(sin nombre)`,
                        error: "Cada columna debe tener el campo 'nombre'"
                    });
                    continue;
                }

                const { data: columnaData, error: columnaError } = await supabase
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
                        // valores_permitidos es JSONB — puede ser null o array de strings
                        valores_permitidos: columna.valores_permitidos ?? null,
                        multivalor: columna.multivalor ?? false,
                        valor_defecto: columna.valor_defecto ?? null,
                        expresion_regular: columna.expresion_regular ?? null,
                        // condicion_visible es JSONB — puede ser null u objeto {campo, operador, valor}
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

                if (columnaError) {
                    errores.push({
                        entidad: "columna",
                        nombre: `${tabla.nombre}.${columna.nombre}`,
                        error: columnaError.message
                    });
                } else {
                    // Registrar en el mapa para resolución de relaciones
                    columnaIdMap[`${tabla.nombre}.${columna.nombre}`] = columnaData.id;
                    resumen.columnas_insertadas++;
                }
            }

            // Insertar filas de esta tabla
            for (const fila of (tabla.filas ?? [])) {
                const { error: filaError } = await supabase
                    .from("filas")
                    .insert([{
                        tabla_id: tablaId,
                        // datos se almacena como JSONB tal cual viene del JSON
                        datos: fila.datos ?? {},
                        orden: fila.orden ?? 0
                    }]);

                if (filaError) {
                    errores.push({
                        entidad: "fila",
                        nombre: `${tabla.nombre}[orden=${fila.orden ?? "?"}]`,
                        error: filaError.message
                    });
                } else {
                    resumen.filas_insertadas++;
                }
            }
        }

        // ── 4. Insertar Relaciones (Fase 2) ───────────────────────────────────
        //
        // En este punto columnaIdMap está completo con todas las columnas
        // insertadas exitosamente. Se resuelven los nombres a UUIDs y se
        // inserta en la tabla "relaciones".
        //
        for (const tabla of tablas) {
            for (const relacion of (tabla.relaciones ?? [])) {
                const claveOrigen = `${tabla.nombre}.${relacion.columna_origen}`;
                const claveDestino = `${relacion.tabla_destino}.${relacion.columna_destino}`;

                const columnaOrigenId = columnaIdMap[claveOrigen];
                const columnaDestinoId = columnaIdMap[claveDestino];

                if (!columnaOrigenId) {
                    errores.push({
                        entidad: "relacion",
                        nombre: `${tabla.nombre} -> ${relacion.tabla_destino}`,
                        error: `Columna origen '${claveOrigen}' no encontrada. Verifica que la columna FK existe en la tabla.`
                    });
                    continue;
                }

                if (!columnaDestinoId) {
                    errores.push({
                        entidad: "relacion",
                        nombre: `${tabla.nombre} -> ${relacion.tabla_destino}`,
                        error: `Columna destino '${claveDestino}' no encontrada. Verifica que la tabla_destino y columna_destino existen.`
                    });
                    continue;
                }

                const { error: relacionError } = await supabase
                    .from("relaciones")
                    .insert([{
                        columna_origen_id: columnaOrigenId,
                        columna_destino_id: columnaDestinoId,
                        tipo: relacion.tipo,
                        nombre_relacion: relacion.nombre_relacion ?? null
                    }]);

                if (relacionError) {
                    errores.push({
                        entidad: "relacion",
                        nombre: `${tabla.nombre} -> ${relacion.tabla_destino}`,
                        error: relacionError.message
                    });
                } else {
                    resumen.relaciones_insertadas++;
                }
            }
        }

        // ── Respuesta ─────────────────────────────────────────────────────────
        const hayErrores = errores.length > 0;

        return res.status(201).json({
            ok: true,
            mensaje: hayErrores
                ? "Dashboard creado con advertencias. Revisa el campo 'errores'."
                : "Dashboard creado exitosamente.",
            resumen,
            ...(hayErrores && { errores })
        });

    } catch (err) {
        console.error("Error en crearDashboard:", err);
        return res.status(500).json({
            ok: false,
            error: err.message
        });
    }
};
