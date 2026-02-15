import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Edit, Trash2 } from "lucide-react";
import { useClientes, useDeleteCliente } from "../../hooks/useClientes";
import { DataTable } from "../ui/DataTable";
import { FilterBar } from "../ui/FilterBar";
import { ErrorState } from "../Status";

export type ClienteColumn = {
    id: number;
    nombre: string;
    nroDocumento: string;
    telefono: string;
    email: string;
    localidad: string;
};

interface ClientesListProps {
    onEdit: (id: number) => void;
}

export function ClientesList({ onEdit }: ClientesListProps) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
    const [searchTerm, setSearchTerm] = useState("");

    const { data, isLoading, isError, error } = useClientes(
        page,
        pageSize,
        searchTerm
    );

    const deleteMutation = useDeleteCliente();

    const handleDelete = async (id: number) => {
        if (!confirm("¿Está seguro de eliminar este cliente?")) return;
        try {
            await deleteMutation.mutateAsync(id);
        } catch (e) {
            alert("Error al eliminar cliente");
        }
    };

    const columns: ColumnDef<ClienteColumn>[] = [
        {
            accessorKey: "nombre",
            header: "Nombre",
            cell: (info) => <span className="font-medium text-slate-700">{info.getValue() as string}</span>,
        },
        {
            accessorKey: "nroDocumento",
            header: "Documento",
            cell: (info) => <span className="font-mono text-sm">{info.getValue() as string}</span>,
        },
        {
            accessorKey: "email",
            header: "Email",
            cell: (info) => <span className="text-sm text-slate-600">{info.getValue() as string || "-"}</span>,
        },
        {
            accessorKey: "telefono",
            header: "Teléfono",
            cell: (info) => <span className="text-sm text-slate-600">{info.getValue() as string || "-"}</span>,
        },
        {
            accessorKey: "localidad",
            header: "Localidad",
            cell: (info) => <span className="text-sm text-slate-600">{info.getValue() as string || "-"}</span>,
        },
        {
            id: "actions",
            header: "Acciones",
            cell: (info) => {
                const row = info.row.original;
                return (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onEdit(row.id)}
                            className="p-1.5 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                            title="Editar Cliente"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleDelete(row.id)}
                            className="p-1.5 hover:bg-red-50 rounded text-red-600 transition-colors"
                            title="Eliminar Cliente"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                );
            },
        }
    ];

    // Mapping
    const mappedData: ClienteColumn[] = (data?.items || []).map((c: any) => ({
        id: c.idcliente,
        nombre: c.appynom || "",
        nroDocumento: c.dni || "",
        telefono: c.telefono,
        email: c.email,
        localidad: c.localidad?.nombre || c.localidad_nombre || "-",
    }));

    if (isError) return <ErrorState message={(error as Error).message} />;

    return (
        <div className="h-full">
            <div className="flex w-full mb-6 justify-center">
                <div className="flex w-11/12 justify-start">
                    <FilterBar
                        onSearch={setSearchTerm}
                        placeholder="Buscar por nombre, DNI..."
                    />
                </div>
            </div>

            <DataTable
                columns={columns}
                data={mappedData}
                isLoading={isLoading}
                pageCount={data?.total ? Math.ceil(data.total / pageSize) : -1}
                pagination={{ pageIndex: page - 1, pageSize }}
                onPaginationChange={(newPagination) => {
                    setPage(newPagination.pageIndex + 1);
                    setPageSize(newPagination.pageSize);
                }}
            />
        </div>
    );
}
