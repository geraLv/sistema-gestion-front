import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { clientesApi } from "../api/endpoints";

export const useClientes = (
    page: number = 1,
    pageSize: number = 15,
    q?: string
) => {
    return useQuery({
        queryKey: ["clientes", page, pageSize, q],
        queryFn: async () => {
            const result = await clientesApi.getPaged({ page, pageSize, q });
            return result;
        },
        placeholderData: keepPreviousData,
    });
};

export const useCliente = (id: number) => {
    return useQuery({
        queryKey: ["cliente", id],
        queryFn: () => clientesApi.getById(id),
        enabled: !!id,
    });
};

export const useCreateCliente = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => clientesApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clientes"] });
        },
    });
};

export const useUpdateCliente = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => clientesApi.update(id, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["clientes"] });
            queryClient.invalidateQueries({ queryKey: ["cliente", variables.id] });
        },
    });
};

export const useDeleteCliente = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => clientesApi.delete(id), // Assuming delete method exists
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clientes"] });
        },
    });
};
