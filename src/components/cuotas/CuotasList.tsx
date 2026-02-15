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
    onView: (id: number) => void;
    onEdit: (cuota: any) => void;
    onPay: (cuota: any) => void;
}

export function CuotasList({ onView, onEdit, onPay }: CuotasListProps) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
    const [searchTerm, setSearchTerm] = useState("");
    const [estadoFilter, setEstadoFilter] = useState("impagas");

    // Selection state
    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

    const { data, isLoading, isError, error } = useCuotas(
        page,
        pageSize,
        searchTerm,
        estadoFilter
    );

    const pagarMultiplesMutation = usePagarMultiplesCuotas();

    const handlePagarSeleccionadas = async () => {
        const selectedIds = Object.keys(rowSelection)
            .filter(key => rowSelection[key])
            .map(key => Number(key));

        if (selectedIds.length === 0) return;
        if (!confirm(`¿Registrar pago de ${selectedIds.length} cuotas seleccionadas?`)) return;

        try {
            await pagarMultiplesMutation.mutateAsync(selectedIds);
            setRowSelection({}); // Clear selection
        } catch (e) {
            alert("Error al realizar pagos masivos");
        }
    };

    // Helper to check if date is past
    const isPast = (dateStr: string) => {
        return new Date(dateStr) < new Date() && new Date(dateStr).getFullYear() > 2000;
    };

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
                                <button
                                    onClick={() => onPay(row)}
                                    className="p-1.5 hover:bg-green-50 rounded text-green-600 transition-colors"
                                    title="Registrar Pago"
                                >
                                    <DollarSign className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onEdit(row)}
                                    className="p-1.5 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                                    title="Editar Importe"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => onView(row.id)}
                            className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                            title="Ver Detalle"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
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
        // Pass full object for actions if needed, or rely on id
        // Ideally we pass relevant info for modal display without re-fetching if possible
        raw: c
    }));

    const selectedCount = Object.keys(rowSelection).filter(k => rowSelection[k]).length;

    if (isError) return <ErrorState message={(error as Error).message} />;

    return (
        <div className="h-full" >
            <div className="flex w-full mb-6 justify-center">
                <div className="flex w-11/12 justify-start ">

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

                    {selectedCount > 0 && (
                        <button
                            onClick={handlePagarSeleccionadas}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors flex items-center gap-2 animate-in fade-in slide-in-from-right-4"
                        >
                            <DollarSign className="w-4 h-4" />
                            Pagar ({selectedCount})
                        </button>
                    )}
                </div>
            </div>

            <DataTable
                columns={columns}
                data={mappedData}
                isLoading={isLoading}
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
                pageCount={data?.totalPages || -1}
                pagination={{ pageIndex: page - 1, pageSize }}
                onPaginationChange={(newPagination) => {
                    setPage(newPagination.pageIndex + 1);
                    setPageSize(newPagination.pageSize);
                }}
            />
        </div>
    );
}
