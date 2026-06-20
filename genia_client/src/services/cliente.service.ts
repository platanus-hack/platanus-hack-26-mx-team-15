import api from "@/lib/api";

export const obtenerClientes = async () => {
    const response = await api.get("/clientes/");
    return response.data;
};