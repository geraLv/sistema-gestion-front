import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, FileText, Plus } from "lucide-react";
import { useSolicitudes } from "../../hooks/useSolicitudes";
import { DataTable } from "../ui/DataTable";
import { FilterBar } from "../ui/FilterBar";
import { ErrorState } from "../Status";

export type SolicitudColumn = {
    id: number;
    nrosolicitud: string;
    clienteNombre: string;
    clienteDni: string;
    productoNombre: string;
    importe: number; // Monto Solicitado
    totalAPagar: number; // Total Financiado
    cantidadCuotas: number;
    totalPagado: number;
    porcentajePagado: number;
    estado: string;
};

interface SolicitudesListProps {
    onCreate: () => void;
    onEdit: (id: number) => void;
    onView: (id: number) => void;
    onViewPlan: (id: number) => void; // Para ver cuotas/recibos
    onAddCuotas: (solicitud: SolicitudColumn) => void;
}

export function SolicitudesList({ onCreate, onEdit, onView, onViewPlan }: SolicitudesListProps) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const { data, isLoading, isError, error } = useSolicitudes(
        page,
        pageSize,
        searchTerm,
        statusFilter
    );

    const columns: ColumnDef<SolicitudColumn>[] = [
        {
            accessorKey: "nrosolicitud",
            header: "Nro",
            cell: (info) => <span className="font-mono font-medium">{info.getValue() as string}</span>,
        },
        {
            accessorKey: "clienteNombre",
            header: "Cliente",
            cell: (info) => (
                <div className="flex flex-col">
                    <span className="font-medium">{info.getValue() as string}</span>
                    <span className="text-xs text-slate-500">{info.row.original.clienteDni}</span>
                </div>
            ),
        },
        {
            accessorKey: "productoNombre",
            header: "Producto",
        },
        {
            accessorKey: "importe",
            header: "Monto",
            cell: (info) => {
                const val = info.getValue() as number;
                return <span>${val.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span>;
            },
        },
        {
            accessorKey: "totalAPagar",
            header: "Total a Pagar",
            cell: (info) => {
                const val = info.getValue() as number;
                return <span className="font-semibold">${val.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</span>;
            },
        },
        {
            accessorKey: "cantidadCuotas",
            header: "Cuotas",
            cell: (info) => <div className="text-center w-12">{info.getValue() as number}</div>,
        },
        {
            accessorKey: "totalPagado",
            header: "Pagado",
            cell: (info) => {
                const pagado = info.getValue() as number;
                // Use DB value for percentage if available, fallback to calc
                const porcentaje = info.row.original.porcentajePagado ?? 0;

                return (
                    <div className="w-full max-w-[120px]">
                        <div className="flex justify-between text-xs mb-1">
                            <span>${pagado.toLocaleString("es-AR", { compactDisplay: "short" })}</span>
                            <span className="text-slate-500">{Math.round(porcentaje)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 rounded-full transition-all duration-500"
                                style={{ width: `${porcentaje}%` }}
                            />
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "estado",
            header: "Estado",
            cell: (info) => {
                const status = info.getValue() as string;
                let color = "bg-slate-100 text-slate-700";
                if (status === "Pagada") color = "bg-green-100 text-green-700";
                if (status === "Impaga") color = "bg-red-100 text-red-700";
                if (status === "Pendiente") color = "bg-yellow-100 text-yellow-700";

                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
                        {status}
                    </span>
                );
            },
        },
        {
            id: "actions",
            header: "Acciones",
            cell: (info) => {
                const id = info.row.original.id;
                return (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onView(id)}
                            className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                            title="Ver detalle"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onEdit(id)}
                            className="p-1.5 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                            title="Editar"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onViewPlan(id)}
                            className="p-1.5 hover:bg-green-50 rounded text-green-600 transition-colors"
                            title="Ver Plan de Pagos"
                        >
                            <FileText className="w-4 h-4" />
                        </button>
                    </div>
                );
            },
        },
    ];

    // Mapping function to adapt API response to our column structure
    const mappedData: SolicitudColumn[] = (data?.items || []).map((s: any) => {
        const producto = Array.isArray(s.producto) && s.producto.length > 0 ? s.producto[0] : s.producto;
        return {
            id: s.idsolicitud,
            nrosolicitud: s.nrosolicitud,
            clienteNombre: s.cliente?.cliente_nombre || s.cliente?.appynom || "Desconocido",
            clienteDni: s.cliente?.dni || s.dni || "",
            productoNombre: producto?.descripcion || s.producto_descripcion || s.prdescripcion || "",
            importe: s.monto || 0, // Now strictly Monto
            totalAPagar: s.totalapagar || 0, // New field from DB
            cantidadCuotas: s.cantidadcuotas,
            totalPagado: s.totalabonado || s.total_pagado || 0,
            porcentajePagado: s.porcentajepagado || 0,
            estado: s.estado === 0 ? "Impaga" : s.estado === 2 ? "Pagada" : "Pendiente",
        };
    });

    if (isError) return <ErrorState message={(error as Error).message} />;

    return (
        <div>
            <div className="flex w-11/12 justify-center items-center mb-6">
                <div className="flex flex-col md:flex-row w-full justify-between items-center gap-4">
                    <div className="w-full md:flex-1">
                        <FilterBar
                            onSearch={setSearchTerm}
                            onFilterChange={setStatusFilter}
                            filters={[
                                { value: "Pagada", label: "Pagada" },
                                { value: "Impaga", label: "Impaga" },
                                { value: "Pendiente", label: "Pendiente" },
                            ]}
                            placeholder="Buscar por cliente, DNI o Nro Solicitud..."
                        />
                    </div>

                    <div className="flex justify-end items-center mb-6 md:mb-0">
                        <button onClick={onCreate} className="action-button h-10 w-full md:w-auto flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" /> <span className="whitespace-nowrap">Nueva Solicitud</span>
                        </button>
                    </div>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={mappedData}
                isLoading={isLoading}
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
