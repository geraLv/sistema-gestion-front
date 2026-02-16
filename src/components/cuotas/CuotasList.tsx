import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Eye, DollarSign, Edit } from "lucide-react";
import { useCuotas, usePagarMultiplesCuotas } from "../../hooks/useCuotas";
import { DataTable } from "../ui/DataTable";
import { FilterBar } from "../ui/FilterBar";
import { ErrorState } from "../Status";
import { cn } from "../../lib/utils";

export type CuotaColumn = {
    id: number;
    nroCuota: number;
    nroSolicitud: string | number;
    cliente: string;
    vencimiento: string;
    importe: number;
    estado: number; // 0 impaga, 1 parcial, 2 pagada
    fechaPago?: string;
    isVencida?: boolean;
};

interface CuotasListProps {
    onView?: (id: number) => void;
    onEdit?: (cuota: any) => void;
    onPay?: (cuota: any) => void;
    filtro?: string; // Solicitud ID to filter
    isModal?: boolean;
}

import { reportesApi } from "../../api/endpoints";

export function CuotasList({ onView, onEdit, onPay, filtro, isModal }: CuotasListProps) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(isModal ? 100 : 15);
    const [searchTerm, setSearchTerm] = useState(filtro || "");
    const [estadoFilter, setEstadoFilter] = useState(isModal ? "" : "impagas");
    const [isDownloading, setIsDownloading] = useState(false);

    // Selection state
    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

    const { data, isLoading, isError, error } = useCuotas(
        page,
        pageSize,
        searchTerm, // This handles the "filtro" if passed as search term
        estadoFilter
    );

    const pagarMultiplesMutation = usePagarMultiplesCuotas();

    const handlePagarSeleccionadas = async () => {
        const selectedIds = Object.keys(rowSelection)
            .filter(key => rowSelection[key])
            .map(key => {
                const index = Number(key);
                return mappedData[index];
            })
            .filter(item => item && item.estado !== 2 && item.id !== undefined)
            .map(item => item.id);

        if (selectedIds.length === 0) return;
        if (!confirm(`¿Registrar pago de ${selectedIds.length} cuotas seleccionadas?`)) return;

        try {
            await pagarMultiplesMutation.mutateAsync(selectedIds);
            setRowSelection({}); // Clear selection
        } catch (e) {
            alert("Error al realizar pagos masivos");
        }
    };

    const handlePrintSelected = async () => {
        const selectedIds = Object.keys(rowSelection)
            .filter(key => rowSelection[key])
            .map(key => {
                const index = Number(key);
                return mappedData[index]?.id;
            })
            .filter(id => id !== undefined);

        if (selectedIds.length === 0) return;

        setIsDownloading(true);
        try {
            const blob = await reportesApi.recibosMultiples(selectedIds);
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e) {
            console.error(e);
            alert("Error descargando recibos. Verifique que las cuotas estén pagadas.");
        } finally {
            setIsDownloading(false);
        }
    };

    // Helper to check if date is past
    const isPast = (dateStr: string) => {
        return new Date(dateStr) < new Date() && new Date(dateStr).getFullYear() > 2000;
    };

    // ... columns ...

    // columns definition omitted for brevity as it is unchanged

    const columns: ColumnDef<CuotaColumn>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <input
                    type="checkbox"
                    checked={table.getIsAllPageRowsSelected()}
                    onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
                    aria-label="Select all"
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-4 w-4"
                />
            ),
            cell: ({ row }) => (
                <input
                    type="checkbox"
                    checked={row.getIsSelected()}
                    onChange={(e) => row.toggleSelected(!!e.target.checked)}
                    aria-label="Select row"
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-4 w-4"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "nroCuota",
            header: "Cuota",
            cell: (info) => <span className="font-medium text-slate-700">#{info.getValue() as number}</span>,
        },
        {
            accessorKey: "nroSolicitud",
            header: "Solicitud",
            cell: (info) => <span className="font-mono text-xs">{info.getValue() as string}</span>,
        },
        {
            accessorKey: "cliente",
            header: "Cliente",
            cell: (info) => <span className="text-sm font-medium">{info.getValue() as string}</span>,
        },
        {
            accessorKey: "vencimiento",
            header: "Vencimiento",
            cell: (info) => {
                const dateStr = info.getValue() as string;
                const row = info.row.original;
                // Check if vencida and impaga
                const isVencida = row.estado !== 2 && isPast(dateStr);
                return (
                    <div className={cn("text-sm", isVencida && "text-red-600 font-semibold")}>
                        {new Date(dateStr).toLocaleDateString()}
                        {isVencida && <span className="ml-1 text-[10px] bg-red-100 text-red-600 px-1 rounded">Vencida</span>}
                    </div>
                );
            },
        },
        {
            accessorKey: "importe",
            header: "Importe",
            cell: (info) => <span className="font-mono">${(info.getValue() as number).toLocaleString("es-AR")}</span>,
        },
        {
            accessorKey: "estado",
            header: "Estado",
            cell: (info) => {
                const state = info.getValue() as number;
                return (
                    <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        state === 2 ? "bg-green-100 text-green-700" :
                            state === 0 ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                    )}>
                        {state === 2 ? "Pagada" : state === 0 ? "Impaga" : "Pendiente"}
                    </span>
                );
            },
        },
        {
            id: "actions",
            header: "Acciones",
            cell: (info) => {
                const row = info.row.original;
                return (
                    <div className="flex items-center gap-2">
                        {row.estado !== 2 && (
                            <>
                                {onPay && (
                                    <button
                                        onClick={() => onPay(row)}
                                        className="p-1.5 hover:bg-green-50 rounded text-green-600 transition-colors"
                                        title="Registrar Pago"
                                    >
                                        <DollarSign className="w-4 h-4" />
                                    </button>
                                )}
                                {onEdit && (
                                    <button
                                        onClick={() => onEdit(row)}
                                        className="p-1.5 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                                        title="Editar Importe"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                )}
                            </>
                        )}
                        {onView && (
                            <button
                                onClick={() => onView(row.id)}
                                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                                title="Ver Detalle"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                );
            },
        }
    ];

    // Mapping
    const mappedData: CuotaColumn[] = (data?.items || []).map((c: any) => ({
        id: c.idcuota,
        nroCuota: c.nrocuota,
        nroSolicitud: c.nrosolicitud || c.solicitud?.nrosolicitud || "-",
        cliente: c.cliente_nombre || c.solicitud?.cliente?.appynom || "-",
        vencimiento: c.vencimiento,
        importe: c.importe,
        estado: c.estado,
        fechaPago: c.fecha,
        raw: c
    }));

    const selectedCount = Object.keys(rowSelection).filter(k => rowSelection[k]).length;

    // Count only unpaid/payable items for the Pay button
    const selectedPagablesCount = Object.keys(rowSelection)
        .filter(k => rowSelection[k])
        .filter(k => {
            const index = Number(k);
            const item = mappedData[index];
            return item && item.estado !== 2;
        }).length;

    if (isError) return <ErrorState message={(error as Error).message} />;

    return (
        <div className={cn("flex flex-col", !isModal && "h-full")}>
            <div className="flex w-full mb-6 justify-center">
                <div className="flex flex-col md:flex-row w-11/12 justify-between items-center gap-4">
                    <div className="w-full md:flex-1">
                        {!isModal && (
                            <FilterBar
                                onSearch={setSearchTerm}
                                onFilterChange={setEstadoFilter}
                                filters={[
                                    { value: "impagas", label: "Impagas" },
                                    { value: "pagadas", label: "Pagadas" },
                                    { value: "vencidas", label: "Vencidas" },
                                    { value: "", label: "Todas" },
                                ]}
                                initialFilter="impagas"
                                placeholder="Buscar cuota, cliente..."
                            />
                        )}
                    </div>

                    <div className="flex justify-end items-center mb-6 md:mb-0 gap-2">
                        {selectedCount > 0 && (
                            <>
                                <button
                                    onClick={handlePrintSelected}
                                    disabled={isDownloading}
                                    className={cn(
                                        "bg-slate-100 text-slate-700 border border-slate-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors flex items-center gap-2 animate-in fade-in slide-in-from-right-4 w-full md:w-auto justify-center",
                                        isDownloading && "opacity-50 cursor-not-allowed"
                                    )}
                                    title="Imprimir seleccionadas"
                                >
                                    {isDownloading ? (
                                        <span className="animate-spin mr-2">⏳</span>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-printer"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 9V3h12v6" /><rect x="6" y="14" width="12" height="8" ry="1" /></svg>
                                    )}
                                    Imprimir ({selectedCount})
                                </button>
                                {selectedPagablesCount > 0 && (
                                    <button
                                        onClick={handlePagarSeleccionadas}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors flex items-center gap-2 animate-in fade-in slide-in-from-right-4 w-full md:w-auto justify-center"
                                    >
                                        <DollarSign className="w-4 h-4" />
                                        Pagar ({selectedPagablesCount})
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={mappedData}
                isLoading={isLoading}
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
                pageCount={Math.ceil((data?.total || 0) / pageSize)}
                pagination={{ pageIndex: page - 1, pageSize }}
                onPaginationChange={(newPagination) => {
                    setPage(newPagination.pageIndex + 1);
                    setPageSize(newPagination.pageSize);
                }}
            />
        </div>
    );
}
