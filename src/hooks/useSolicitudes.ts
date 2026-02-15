import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { solicitudesApi } from "../api/endpoints";

export const useSolicitudes = (
    page: number = 1,
    pageSize: number = 15,
    q?: string,
    filtro?: string
) => {
    return useQuery({
        queryKey: ["solicitudes", page, pageSize, q, filtro],
        queryFn: async () => {
            const result = await solicitudesApi.getPaged({ page, pageSize, q, filtro });
            return result;
        },
        placeholderData: keepPreviousData,
    });
};

export const useSolicitud = (id: number) => {
    return useQuery({
        queryKey: ["solicitud", id],
        queryFn: () => solicitudesApi.getById(id),
        enabled: !!id,
    });
};

export const useCreateSolicitud = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => solicitudesApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["solicitudes"] });
        },
    });
};

export const useUpdateSolicitud = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) =>
            solicitudesApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["solicitudes"] });
            queryClient.invalidateQueries({ queryKey: ["solicitud"] });
        },
    });
};

export const useAddCuotas = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, cantidad }: { id: number; cantidad: number }) =>
            solicitudesApi.addCuotas(id, cantidad),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["solicitudes"] });
            queryClient.invalidateQueries({ queryKey: ["solicitud"] });
            queryClient.invalidateQueries({ queryKey: ["cuotas"] });
        },
    });
};
