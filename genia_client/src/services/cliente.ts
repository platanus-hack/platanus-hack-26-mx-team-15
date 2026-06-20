import api from "@/lib/api";
import { Cliente } from "@/types/cliente";

export const obtenerClientes =
async (): Promise<Cliente[]> => {

    const response =
        await api.get<Cliente[]>(
            "/clientes/"
        );

    return response.data;
};