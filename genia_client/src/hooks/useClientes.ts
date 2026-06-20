import { useEffect, useState }
from "react";

import {
    obtenerClientes
} from "@/services/cliente.service";

export function useClientes() {

    const [clientes, setClientes] =
        useState([]);

    useEffect(() => {

        obtenerClientes()
            .then(setClientes);

    }, []);

    return clientes;
}