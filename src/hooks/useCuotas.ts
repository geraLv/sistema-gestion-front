import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { cuotasApi } from "../api/endpoints";

export const useCuotas = (
    page: number = 1,
    pageSize: number = 15,
    q?: string,
    filtro?: string
) => {
    return useQuery({
        queryKey: ["cuotas", page, pageSize, q, filtro],
        queryFn: async () => {
            const result = await cuotasApi.getPaged({ page, pageSize, q, filtro });
            return result;
        },
        placeholderData: keepPreviousData,
    });
};

export const useCuota = (id: number) => {
    return useQuery({
        queryKey: ["cuota", id],
        queryFn: () => cuotasApi.getById(id),
        enabled: !!id,
    });
};

export const usePagarCuota = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => cuotasApi.pagar(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cuotas"] });
            queryClient.invalidateQueries({ queryKey: ["cuota"] });
        },
    });
};

export const usePagarMultiplesCuotas = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (ids: number[]) => cuotasApi.pagarMultiples(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cuotas"] });
        },
    });
};
