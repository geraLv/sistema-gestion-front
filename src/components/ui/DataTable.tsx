import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    type SortingState,
    getSortedRowModel,
    type VisibilityState,
} from "@tanstack/react-table"
import { useState } from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    pageCount?: number
    pagination?: {
        pageIndex: number
        pageSize: number
    }
    onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void
    isLoading?: boolean
    rowSelection?: Record<string, boolean>;
    onRowSelectionChange?: (selection: Record<string, boolean>) => void;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    pageCount = -1,
    pagination,
    onPaginationChange,
    isLoading = false,
    rowSelection: controlledRowSelection,
    onRowSelectionChange: controlledOnRowSelectionChange,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [internalRowSelection, setInternalRowSelection] = useState({})
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

    // Determine if row selection is controlled
    const isRowSelectionControlled = controlledRowSelection !== undefined;
    const rowSelection = isRowSelectionControlled ? controlledRowSelection : internalRowSelection;
    const onRowSelectionChange = isRowSelectionControlled ? controlledOnRowSelectionChange : setInternalRowSelection;

    // If pagination is controlled, us passing it to table options
    // If not, we let the table handle it (client-side)
    const isServerSide = !!pagination && !!onPaginationChange

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onRowSelectionChange: (updaterOrValue) => {
            // Handle both function updater and direct value
            if (onRowSelectionChange) {
                if (typeof updaterOrValue === 'function') {
                    const newValue = updaterOrValue(rowSelection as Record<string, boolean>);
                    onRowSelectionChange(newValue);
                } else {
                    onRowSelectionChange(updaterOrValue);
                }
            }
        },
        onColumnVisibilityChange: setColumnVisibility,
        state: {
            sorting,
            rowSelection,
            columnVisibility,
            pagination: isServerSide ? pagination : undefined,
        },
        manualPagination: isServerSide,
        pageCount: isServerSide ? pageCount : undefined,
        onPaginationChange: isServerSide
            ? (updater) => {
                if (typeof updater === 'function') {
                    const newPagination = updater(pagination!)
                    onPaginationChange(newPagination)
                } else {
                    onPaginationChange(updater)
                }
            }
            : undefined,
        enableRowSelection: true, // Enable row selection
    })

    return (
        <div className="space-y-4">
            <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b bg-gray-50/50">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <th
                                                key={header.id}
                                                className="h-12 px-4 text-left align-middle font-medium text-slate-500 [&:has([role=checkbox])]:pr-0"
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </th>
                                        )
                                    })}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={columns.length} className="h-24 text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                                            <span>Cargando datos...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                        className="border-b h-8 transition-colors hover:bg-slate-50/50 data-[state=selected]:bg-slate-50"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="p-4 align-middle [&:has([role=checkbox])]:pr-0">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length} className="h-24 text-center text-slate-500">
                                        No se encontraron resultados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-2">
                <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} de{" "}
                    {table.getFilteredRowModel().rows.length} fila(s) seleccionada(s).
                </div>
                <div className="flex items-center space-x-6 lg:space-x-8">
                    <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">Filas por pág</p>
                        <select
                            className="h-8 w-[70px] rounded-md border border-input bg-transparent px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            value={table.getState().pagination.pageSize}
                            onChange={(e) => {
                                table.setPageSize(Number(e.target.value))
                            }}
                        >
                            {[10, 15, 20, 30, 50].map((pageSize) => (
                                <option key={pageSize} value={pageSize}>
                                    {pageSize}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                        Página {table.getState().pagination.pageIndex + 1} de{" "}
                        {table.getPageCount()}
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            className="hidden h-8 w-8 p-0 lg:flex items-center justify-center rounded-md border text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Go to first page</span>
                            <ChevronsLeft className="h-4 w-4" />
                        </button>
                        <button
                            className="h-8 w-8 p-0 flex items-center justify-center rounded-md border text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <span className="sr-only">Go to previous page</span>
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            className="h-8 w-8 p-0 flex items-center justify-center rounded-md border text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Go to next page</span>
                            <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                            className="hidden h-8 w-8 p-0 lg:flex items-center justify-center rounded-md border text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            <span className="sr-only">Go to last page</span>
                            <ChevronsRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
