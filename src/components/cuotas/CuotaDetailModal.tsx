import { Printer, X, Info } from "lucide-react";

interface CuotaDetailModalProps {
    cuota: any;
    solicitud: any;
    comprobantes: any[];
    onClose: () => void;
    onDownloadRecibo: () => void;
    reciboLoading?: boolean;
    solicitudLoading?: boolean;
    reciboError?: string | null;
    solicitudError?: string | null;
}

export function CuotaDetailModal({
    cuota,
    solicitud,
    comprobantes,
    onClose,
    onDownloadRecibo,
    reciboLoading = false,
    solicitudLoading = false,
    reciboError,
    solicitudError
}: CuotaDetailModalProps) {
    if (!cuota) return null;

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString("es-AR");
    };

    const formatFechaComprobante = (dateStr?: string) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleString("es-AR");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center m-4">
            <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="flex flex-col relative h-[80vh] w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm shrink-0">
                            <Info className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 leading-6">
                                Detalle de Cuota
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Información completa de la cuota y sus comprobantes.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                        aria-label="Cerrar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                            <div className="text-xs font-medium text-slate-500">Solicitud</div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                                {cuota.relasolicitud || "-"}
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-medium text-slate-500">Cliente</div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                                {solicitudLoading
                                    ? "Cargando..."
                                    : solicitud?.cliente?.appynom ||
                                    solicitud?.cliente?.cliente_nombre ||
                                    solicitud?.appynom ||
                                    "Sin datos"}
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-medium text-slate-500">DNI</div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                                {solicitudLoading
                                    ? "Cargando..."
                                    : solicitud?.cliente?.dni || solicitud?.dni || "-"}
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                            <div className="text-xs font-medium text-slate-500">Producto</div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                                {solicitudLoading
                                    ? "Cargando..."
                                    : solicitud?.producto?.descripcion ||
                                    solicitud?.producto_descripcion ||
                                    solicitud?.prdescripcion ||
                                    "-"}
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-medium text-slate-500">Nro Cuota</div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                                {cuota.nrocuota ?? "-"}
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-medium text-slate-500">Importe</div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                                ${Number(cuota.importe || 0).toLocaleString("es-AR", {
                                    minimumFractionDigits: 2,
                                })}
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-medium text-slate-500">
                                {Number(cuota.estado) === 2 ? "Fecha de pago" : "Vencimiento"}
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                                {Number(cuota.estado) === 2
                                    ? cuota.fecha
                                        ? formatDate(cuota.fecha)
                                        : "-"
                                    : cuota.vencimiento
                                        ? formatDate(cuota.vencimiento)
                                        : "-"}
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-medium text-slate-500">Estado</div>
                            <div className="mt-1 text-sm font-semibold text-slate-900">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${Number(cuota.estado) === 2 ? "bg-green-100 text-green-800" :
                                    Number(cuota.estado) === 0 ? "bg-red-100 text-red-800" :
                                        "bg-yellow-100 text-yellow-800"
                                    }`}>
                                    {Number(cuota.estado) === 0 ? "Impaga" : Number(cuota.estado) === 2 ? "Pagada" : "Pendiente"}
                                </span>
                            </div>
                        </div>

                        {solicitudError && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 sm:col-span-2">
                                Error cargando solicitud: {solicitudError}
                            </div>
                        )}

                        {reciboError && (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:col-span-2">
                                Error recibo: {reciboError}
                            </div>
                        )}
                    </div>

                    {/* Comprobantes section */}
                    <div className="mt-6">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="text-sm font-semibold text-slate-900">Comprobantes</div>
                            <div className="text-xs text-slate-500">{comprobantes.length} archivo(s)</div>
                        </div>

                        {comprobantes.length > 0 ? (
                            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                                <ul className="divide-y divide-slate-100">
                                    {comprobantes.map((c) => (
                                        <li key={c.idcomprobante} className="p-3 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                        <Printer className="w-4 h-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-medium text-slate-800">
                                                            {c.archivo_nombre || "Recibo"}
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            Subido: {formatFechaComprobante(c.created_at)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <a
                                                    href={c.archivo_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="shrink-0 text-xs font-semibold text-blue-700 hover:text-blue-800 hover:underline"
                                                >
                                                    Abrir
                                                </a>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                                No hay comprobantes cargados para esta cuota.
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 p-5 sm:flex-row sm:justify-end sm:items-center bg-white">
                    <button
                        type="button"
                        className="ghost-button flex-1 sm:flex-none justify-center"
                        onClick={onClose}
                    >
                        Cerrar
                    </button>
                    {Number(cuota.estado) === 2 && (
                        <button
                            type="button"
                            className="action-button flex-1 sm:flex-none justify-center"
                            onClick={onDownloadRecibo}
                            disabled={reciboLoading}
                        >
                            {reciboLoading ? "Generando..." : "Descargar recibo PDF"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
