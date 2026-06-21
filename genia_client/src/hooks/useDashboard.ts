import { useState, useCallback, useEffect } from "react";
import type {
    Dashboard,
    Tabla,
    Columna,
    Fila,
    Estilo,
    CrearTablaPayload,
    ActualizarTablaPayload,
    CrearColumnaPayload,
    ActualizarColumnaPayload,
    CrearFilaPayload,
    ActualizarFilaPayload,
    ActualizarEstiloPayload,
} from "@/types/dashboard";
import {
    getDashboard,
    updateEstilo,
    createTabla,
    updateTabla,
    deleteTabla,
    createColumna,
    updateColumna,
    deleteColumna,
    createFila,
    updateFila,
    deleteFila,
} from "@/services/dashboard.service";

// ─────────────────────────────────────────────────────────────────────────────
// Tipos del hook
// ─────────────────────────────────────────────────────────────────────────────

interface UseDashboardReturn {
    /** Dashboard completo con estilos, tablas, columnas, filas y relaciones */
    dashboard: Dashboard | null;
    /** true mientras se carga el dashboard por primera vez */
    loading: boolean;
    /** true mientras se ejecuta cualquier operación de escritura */
    saving: boolean;
    /** Mensaje de error de la última operación fallida */
    error: string | null;
    /** Tabla actualmente seleccionada en el UI */
    tablaActiva: Tabla | null;
    /** Selecciona la tabla activa por ID */
    seleccionarTabla: (tablaId: string) => void;
    /** Recarga el dashboard desde el servidor */
    recargar: () => Promise<void>;
    /** Limpia el error actual */
    limpiarError: () => void;

    // Estilos
    handleUpdateEstilo: (estiloId: string, payload: ActualizarEstiloPayload) => Promise<Estilo | null>;

    // Tablas
    handleCreateTabla: (payload: CrearTablaPayload) => Promise<Tabla | null>;
    handleUpdateTabla: (tablaId: string, payload: ActualizarTablaPayload) => Promise<Tabla | null>;
    handleDeleteTabla: (tablaId: string) => Promise<boolean>;

    // Columnas
    handleCreateColumna: (tablaId: string, payload: CrearColumnaPayload) => Promise<Columna | null>;
    handleUpdateColumna: (tablaId: string, columnaId: string, payload: ActualizarColumnaPayload) => Promise<Columna | null>;
    handleDeleteColumna: (tablaId: string, columnaId: string) => Promise<boolean>;

    // Filas
    handleCreateFila: (tablaId: string, payload: CrearFilaPayload) => Promise<Fila | null>;
    handleUpdateFila: (tablaId: string, filaId: string, payload: ActualizarFilaPayload) => Promise<Fila | null>;
    handleDeleteFila: (tablaId: string, filaId: string) => Promise<boolean>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook principal
// ─────────────────────────────────────────────────────────────────────────────

export function useDashboard(dashboardId: string): UseDashboardReturn {
    const [dashboard, setDashboard] = useState<Dashboard | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tablaActivaId, setTablaActivaId] = useState<string | null>(null);

    // ── Carga inicial ──────────────────────────────────────────────────────────

    const cargar = useCallback(async () => {
        if (!dashboardId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getDashboard(dashboardId);
            setDashboard(data);
            // Seleccionar la primera tabla automáticamente si no hay ninguna activa
            if (data.tablas.length > 0 && !tablaActivaId) {
                setTablaActivaId(data.tablas[0].id);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al cargar el dashboard");
        } finally {
            setLoading(false);
        }
    }, [dashboardId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        cargar();
    }, [cargar]);

    // ── Helpers internos ───────────────────────────────────────────────────────

    const limpiarError = useCallback(() => setError(null), []);

    const seleccionarTabla = useCallback((tablaId: string) => {
        setTablaActivaId(tablaId);
    }, []);

    const tablaActiva = dashboard?.tablas.find(t => t.id === tablaActivaId) ?? null;

    /** Envuelve una operación async con manejo de saving/error */
    const ejecutar = useCallback(async <T>(fn: () => Promise<T>): Promise<T | null> => {
        setSaving(true);
        setError(null);
        try {
            return await fn();
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Error desconocido";
            setError(msg);
            return null;
        } finally {
            setSaving(false);
        }
    }, []);

    // ── Actualización optimista del estado local ───────────────────────────────

    const actualizarTablasLocalmente = useCallback((tablas: Tabla[]) => {
        setDashboard(prev => prev ? { ...prev, tablas } : prev);
    }, []);

    // ── ESTILOS ────────────────────────────────────────────────────────────────

    const handleUpdateEstilo = useCallback(async (
        estiloId: string,
        payload: ActualizarEstiloPayload
    ): Promise<Estilo | null> => {
        return ejecutar(async () => {
            const estilo = await updateEstilo(dashboardId, estiloId, payload);
            setDashboard(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    estilos: prev.estilos.map(e => e.id === estiloId ? estilo : e)
                };
            });
            return estilo;
        });
    }, [dashboardId, ejecutar]);

    // ── TABLAS ─────────────────────────────────────────────────────────────────

    const handleCreateTabla = useCallback(async (
        payload: CrearTablaPayload
    ): Promise<Tabla | null> => {
        return ejecutar(async () => {
            const tabla = await createTabla(dashboardId, payload);
            setDashboard(prev => {
                if (!prev) return prev;
                const nuevasTablas = [...prev.tablas, tabla].sort(
                    (a, b) => (a.orden ?? 0) - (b.orden ?? 0)
                );
                return { ...prev, tablas: nuevasTablas };
            });
            // Seleccionar la tabla recién creada
            setTablaActivaId(tabla.id);
            return tabla;
        });
    }, [dashboardId, ejecutar]);

    const handleUpdateTabla = useCallback(async (
        tablaId: string,
        payload: ActualizarTablaPayload
    ): Promise<Tabla | null> => {
        return ejecutar(async () => {
            const tablaActualizada = await updateTabla(dashboardId, tablaId, payload);
            setDashboard(prev => {
                if (!prev) return prev;
                const tablas = prev.tablas.map(t =>
                    t.id === tablaId
                        // Conservar columnas, filas y relaciones locales
                        ? { ...t, ...tablaActualizada, columnas: t.columnas, filas: t.filas, relaciones: t.relaciones }
                        : t
                );
                return { ...prev, tablas };
            });
            return tablaActualizada;
        });
    }, [dashboardId, ejecutar]);

    const handleDeleteTabla = useCallback(async (
        tablaId: string
    ): Promise<boolean> => {
        const result = await ejecutar(async () => {
            await deleteTabla(dashboardId, tablaId);
            setDashboard(prev => {
                if (!prev) return prev;
                const tablas = prev.tablas.filter(t => t.id !== tablaId);
                return { ...prev, tablas };
            });
            // Si la tabla eliminada era la activa, seleccionar la primera disponible
            if (tablaActivaId === tablaId) {
                setDashboard(prev => {
                    const primera = prev?.tablas.find(t => t.id !== tablaId);
                    setTablaActivaId(primera?.id ?? null);
                    return prev;
                });
            }
            return true;
        });
        return result === true;
    }, [dashboardId, tablaActivaId, ejecutar]);

    // ── COLUMNAS ───────────────────────────────────────────────────────────────

    const handleCreateColumna = useCallback(async (
        tablaId: string,
        payload: CrearColumnaPayload
    ): Promise<Columna | null> => {
        return ejecutar(async () => {
            const columna = await createColumna(dashboardId, tablaId, payload);
            setDashboard(prev => {
                if (!prev) return prev;
                const tablas = prev.tablas.map(t => {
                    if (t.id !== tablaId) return t;
                    const columnas = [...t.columnas, columna].sort(
                        (a, b) => (a.orden ?? 0) - (b.orden ?? 0)
                    );
                    return { ...t, columnas };
                });
                return { ...prev, tablas };
            });
            return columna;
        });
    }, [dashboardId, ejecutar]);

    const handleUpdateColumna = useCallback(async (
        tablaId: string,
        columnaId: string,
        payload: ActualizarColumnaPayload
    ): Promise<Columna | null> => {
        return ejecutar(async () => {
            const columnaActualizada = await updateColumna(dashboardId, tablaId, columnaId, payload);
            setDashboard(prev => {
                if (!prev) return prev;
                const tablas = prev.tablas.map(t => {
                    if (t.id !== tablaId) return t;
                    const columnas = t.columnas.map(c =>
                        c.id === columnaId ? columnaActualizada : c
                    );
                    return { ...t, columnas };
                });
                return { ...prev, tablas };
            });
            return columnaActualizada;
        });
    }, [dashboardId, ejecutar]);

    const handleDeleteColumna = useCallback(async (
        tablaId: string,
        columnaId: string
    ): Promise<boolean> => {
        const result = await ejecutar(async () => {
            await deleteColumna(dashboardId, tablaId, columnaId);
            setDashboard(prev => {
                if (!prev) return prev;
                const tablas = prev.tablas.map(t => {
                    if (t.id !== tablaId) return t;
                    return {
                        ...t,
                        columnas: t.columnas.filter(c => c.id !== columnaId),
                        // Limpiar filas: remover el campo eliminado de los datos
                        filas: t.filas.map(f => {
                            const colEliminada = t.columnas.find(c => c.id === columnaId);
                            if (!colEliminada) return f;
                            const datos = { ...f.datos };
                            delete datos[colEliminada.nombre];
                            return { ...f, datos };
                        })
                    };
                });
                return { ...prev, tablas };
            });
            return true;
        });
        return result === true;
    }, [dashboardId, ejecutar]);

    // ── FILAS ──────────────────────────────────────────────────────────────────

    const handleCreateFila = useCallback(async (
        tablaId: string,
        payload: CrearFilaPayload
    ): Promise<Fila | null> => {
        return ejecutar(async () => {
            const fila = await createFila(dashboardId, tablaId, payload);
            setDashboard(prev => {
                if (!prev) return prev;
                const tablas = prev.tablas.map(t => {
                    if (t.id !== tablaId) return t;
                    const filas = [...t.filas, fila].sort(
                        (a, b) => (a.orden ?? 0) - (b.orden ?? 0)
                    );
                    return { ...t, filas };
                });
                return { ...prev, tablas };
            });
            return fila;
        });
    }, [dashboardId, ejecutar]);

    const handleUpdateFila = useCallback(async (
        tablaId: string,
        filaId: string,
        payload: ActualizarFilaPayload
    ): Promise<Fila | null> => {
        return ejecutar(async () => {
            const filaActualizada = await updateFila(dashboardId, tablaId, filaId, payload);
            setDashboard(prev => {
                if (!prev) return prev;
                const tablas = prev.tablas.map(t => {
                    if (t.id !== tablaId) return t;
                    const filas = t.filas.map(f =>
                        f.id === filaId ? filaActualizada : f
                    );
                    return { ...t, filas };
                });
                return { ...prev, tablas };
            });
            return filaActualizada;
        });
    }, [dashboardId, ejecutar]);

    const handleDeleteFila = useCallback(async (
        tablaId: string,
        filaId: string
    ): Promise<boolean> => {
        const result = await ejecutar(async () => {
            await deleteFila(dashboardId, tablaId, filaId);
            setDashboard(prev => {
                if (!prev) return prev;
                const tablas = prev.tablas.map(t => {
                    if (t.id !== tablaId) return t;
                    return { ...t, filas: t.filas.filter(f => f.id !== filaId) };
                });
                return { ...prev, tablas };
            });
            return true;
        });
        return result === true;
    }, [dashboardId, ejecutar]);

    // ── Retorno ────────────────────────────────────────────────────────────────

    return {
        dashboard,
        loading,
        saving,
        error,
        tablaActiva,
        seleccionarTabla,
        recargar: cargar,
        limpiarError,
        handleUpdateEstilo,
        handleCreateTabla,
        handleUpdateTabla,
        handleDeleteTabla,
        handleCreateColumna,
        handleUpdateColumna,
        handleDeleteColumna,
        handleCreateFila,
        handleUpdateFila,
        handleDeleteFila,
    };
}
