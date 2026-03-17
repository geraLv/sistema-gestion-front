import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { SolicitudesList, type SolicitudColumn } from "../components/solicitudes/SolicitudesList";
import { SolicitudForm } from "../components/solicitudes/SolicitudForm";
import { SolicitudAddCuotasModal } from "../components/solicitudes/SolicitudAddCuotasModal";
import { SolicitudFechaModal } from "../components/solicitudes/SolicitudFechaModal";
import { cuotasApi, solicitudesApi, reportesApi, contratosApi } from "../api/endpoints";
import { Modal } from "../components/ui/Modal";
import { ContratoPreviewModal } from "../components/solicitudes/ContratoPreviewModal";
import { useAddCuotas } from "../hooks/useSolicitudes";
import { CuotaDetailModal } from "../components/cuotas/CuotaDetailModal";
import { CuotaEditModal } from "../components/cuotas/CuotaEditModal";
import { CuotaPayModal } from "../components/cuotas/CuotaPayModal";
import { CuotasList } from "../components/cuotas/CuotasList";
import { ReciboSignModal } from "../components/solicitudes/ReciboSignModal";
import { CalendarDays, Info, X } from "lucide-react";

export default function SolicitudesPage() {
    const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
    const [selectedId, setSelectedId] = useState<number | null>(null);

    // Signature modal state
    const [signModalOpen, setSignModalOpen] = useState(false);
    const [signLoading, setSignLoading] = useState(false);
    const [pendingSignAction, setPendingSignAction] = useState<((firma?: { firmaProductor: string; aclaracionProductor: string }) => Promise<void>) | null>(null);

    // States for "Ver Detalle" (Classic view) and context for Plan
    const [showView, setShowView] = useState(false);
    const [viewData, setViewData] = useState<any | null>(null);

    // States for Plan (Cuotas)
    const [showPlan, setShowPlan] = useState(false);
    const [planResumen, setPlanResumen] = useState<any | null>(null);

    // Add Cuotas Modal state
    const [addCuotasSol, setAddCuotasSol] = useState<{ id: number, nroSolicitud: string } | null>(null);

    // Edit Fecha Modal state
    const [editFechaSol, setEditFechaSol] = useState<{ id: number, nroSolicitud: string, fechaActual?: string } | null>(null);

    // Cuota Actions State (similar to CuotasPage)
    const [viewCuota, setViewCuota] = useState<any | null>(null);
    const [editCuota, setEditCuota] = useState<any | null>(null);
    const [payCuota, setPayCuota] = useState<any | null>(null);

    // Data for Cuota Detail Modal
    const [viewSolicitud, setViewSolicitud] = useState<any | null>(null);
    const [viewComprobantes, setViewComprobantes] = useState<any[]>([]);
    const [viewLoading, setViewLoading] = useState(false);
    const [viewError, setViewError] = useState<string | null>(null);
    const [reciboLoading, setReciboLoading] = useState(false);
    const [contratoLink, setContratoLink] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [contratoLoading, setContratoLoading] = useState(false);

    // Manual Upload state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingContrato, setUploadingContrato] = useState(false);
    const [selectedManualFile, setSelectedManualFile] = useState<File | null>(null);

    const addCuotasMutation = useAddCuotas();
    const queryClient = useQueryClient();

    const handleCreate = () => {
        setSelectedId(null);
        setViewMode("create");
    };

    const handleEdit = (id: number) => {
        setSelectedId(id);
        setViewMode("edit");
    };

    const handleSuccess = async (data?: any, action?: 'save' | 'save_and_contract') => {
        setViewMode("list");
        setSelectedId(null);

        if (action === 'save_and_contract' && data) {
            try {
                // Fetch fresh details with nested objects (cliente, producto, etc)
                const solId = data.idsolicitud || data.id;
                if (!solId) return;

                const detailedData: any = await solicitudesApi.getById(solId);
                setViewData(detailedData);
                setShowView(true);
                setShowPreview(true);
            } catch (err) {
                console.error("Error fetching detail for contract preview", err);
            }
        }
    };

    const handleView = async (id: number) => {
        try {
            setContratoLink(null);
            const data: any = await solicitudesApi.getById(id);
            setViewData(data);
            setShowView(true);
        } catch (err) {
            console.error("Error fetching detail", err);
        }
    };

    const handleViewPlan = async (id: number) => {
        try {
            // Fetch details to have context (nroSolicitud) for the modal
            const solData: any = await solicitudesApi.getById(id);
            setViewData(solData);

            // Fetch real-time summary
            const resumenData = await cuotasApi.getForSolicitud(id);
            setPlanResumen(resumenData.resumen);

            setShowPlan(true);
        } catch (err) {
            console.error("Error data for plan", err);
        }
    };

    const handleAddCuotasPrompt = (sol: SolicitudColumn | { id: number, nrosolicitud: string } | any) => {
        setAddCuotasSol({
            id: sol.id || sol.idsolicitud,
            nroSolicitud: sol.nrosolicitud || sol.nroSolicitud
        });
    };

    const handleConfirmAddCuotas = async (cantidad: number) => {
        if (!addCuotasSol) return;
        await addCuotasMutation.mutateAsync({ id: addCuotasSol.id, cantidad });
        if (viewData) handleViewPlan(viewData.idsolicitud || viewData.id);
    };

    const handleOpenEditFecha = () => {
        if (!viewData) return;
        setEditFechaSol({
            id: viewData.idsolicitud || viewData.id,
            nroSolicitud: viewData.nrosolicitud,
            fechaActual: viewData.fechalta,
        });
    };

    const handleConfirmEditFecha = async (fechaInicio: string) => {
        if (!editFechaSol) return;
        await cuotasApi.recalcularVencimientos(editFechaSol.id, fechaInicio);
        queryClient.invalidateQueries({ queryKey: ["cuotas"] });
        // Refresh Plan
        if (viewData) handleViewPlan(viewData.idsolicitud || viewData.id);
    };

    // --- Handlers for Cuota Actions ---

    const handleViewCuota = async (id: number) => {
        try {
            setViewLoading(true);
            const data = await cuotasApi.getById(id);
            setViewCuota(data);

            // Try to get related info
            if (data?.solicitudId || data?.solicitud || data?.relasolicitud) {
                try {
                    const solId = data.solicitudId || data.solicitud?.id || data.relasolicitud;

                    if (viewData && (viewData.id === solId)) {
                        setViewSolicitud(viewData);
                    } else if (solId) {
                        const sol = await solicitudesApi.getById(solId);
                        setViewSolicitud(sol);
                    }
                } catch (e) { console.error(e); }
            }

            try {
                const comp = await cuotasApi.getComprobantes(id);
                setViewComprobantes(comp || []);
            } catch (e) { console.error(e); }

        } catch (e) {
            setViewError("Error al cargar detalle");
        } finally {
            setViewLoading(false);
        }
    };

    const handleOpenEditCuota = (cuota: any) => {
        setEditCuota(cuota);
    };

    const handleOpenPayCuota = (cuota: any) => {
        setPayCuota(cuota);
    };

    const handleSaveEditCuota = async (
        id: number,
        payload: { importe?: number; fechaPago?: string; formapago?: string },
    ) => {
        if (payload.fechaPago) {
            await cuotasApi.updateFechaPago(id, payload.fechaPago);
        }
        if (payload.formapago) {
            await cuotasApi.updateFormaPago(id, payload.formapago);
        }
        if (payload.importe !== undefined) {
            await cuotasApi.updateImporte(id, payload.importe);
        }
        setEditCuota(null);
        queryClient.invalidateQueries({ queryKey: ["cuotas"] });
        // Refresh Plan
        if (viewData) handleViewPlan(viewData.idsolicitud || viewData.id);
    };

    const handleConfirmPayCuota = async (id: number, file: File | null, formapago: string) => {
        await cuotasApi.pagar(id, formapago);
        if (file) {
            const formData = new FormData();
            formData.append("archivo", file);
            await cuotasApi.uploadComprobante(id, file);
        }
        setPayCuota(null);
        queryClient.invalidateQueries({ queryKey: ["cuotas"] });
        // Refresh Plan
        if (viewData) handleViewPlan(viewData.idsolicitud || viewData.id);
    };

    const handleDownloadRecibo = async () => {
        if (!viewCuota) return;
        setReciboLoading(true);
        try {
            const blob = await reportesApi.reciboCuota(viewCuota.idcuota);
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `recibo-cuota-${viewCuota.idcuota}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (e) {
            alert("Error descargando recibo");
        } finally {
            setReciboLoading(false);
        }
    };

    const handleDownloadPagadas = async (firma?: { firmaProductor: string; aclaracionProductor: string }) => {
        if (!viewData) return;
        setSignLoading(true);
        try {
            const blob = await reportesApi.recibosSolicitudPagados(viewData.id || viewData.idsolicitud, firma);
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `recibos-pagados-solicitud-${viewData.id || viewData.idsolicitud}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            setSignModalOpen(false);
        } catch (e) {
            alert("Error generando reporte o no hay cuotas pagadas");
        } finally {
            setSignLoading(false);
        }
    };

    const handleOpenSignModal = () => {
        setPendingSignAction(() => async (firma?: { firmaProductor: string; aclaracionProductor: string }) => {
            await handleDownloadPagadas(firma);
        });
        setSignModalOpen(true);
    };

    const handleOpenPreview = () => {
        if (!viewData) return;
        setShowPreview(true);
    };

    const handleGenerarContrato = async (datosContrato: any) => {
        if (!viewData) return;
        setContratoLoading(true);

        try {
            const res: any = await contratosApi.generar(viewData.id || viewData.idsolicitud, datosContrato);
            // El token para armar la URL pública
            if (res?.token_acceso) {
                const link = `${window.location.origin}/firma/${res.token_acceso}`;
                setContratoLink(link);
                setShowPreview(false);
            }
        } catch (e: any) {
            alert(e.response?.data?.error || "Error al generar el contrato");
        } finally {
            setContratoLoading(false);
        }
    };

    const handleSeleccionarContratoManual = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedManualFile(file);
        }
    };

    const handleSubirContratoManual = async () => {
        if (!viewData || !selectedManualFile) return;

        setUploadingContrato(true);
        try {
            await contratosApi.subirManual(viewData.id || viewData.idsolicitud, selectedManualFile);
            alert("Contrato subido y marcado como firmado exitosamente.");
            setSelectedManualFile(null);
            // Refresh view
            handleView(viewData);
        } catch (err: any) {
            alert(err.response?.data?.error || "Error al subir el contrato manual");
        } finally {
            setUploadingContrato(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <Layout>
            <div className="container mx-auto px-4 py-8 page-shell">
                <h1 className="text-3xl font-bold">Solicitudes</h1>

                {/* Content Area */}
                <div className=" bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
                    {viewMode === "list" && (
                        <SolicitudesList
                            onCreate={handleCreate}
                            onEdit={handleEdit}
                            onView={handleView}
                            onViewPlan={handleViewPlan}
                            onAddCuotas={handleAddCuotasPrompt}
                        />
                    )}

                    {(viewMode === "create" || viewMode === "edit") && (
                        <div className="max-w-3xl mx-auto">
                            <h2 className="text-xl font-semibold mb-6 pb-2 border-b border-slate-100">
                                {viewMode === "create" ? "Nueva Solicitud" : "Editar Solicitud"}
                            </h2>
                            <SolicitudForm
                                id={selectedId ?? undefined}
                                onSuccess={handleSuccess}
                                onCancel={() => setViewMode("list")}
                            />
                        </div>
                    )}
                </div>

                {/* Modals needed for "View" and "Plan" */}
                {showView && viewData && (
                    <Modal
                        isOpen={true}
                        onClose={() => setShowView(false)}
                        className="max-w-xl h-[80vh]"
                        showCloseButton={false}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-2 border-b border-slate-100 bg-white">
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm shrink-0">
                                    <Info className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 leading-6">
                                        Detalle de Solicitud
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Información completa de la solicitud y gestión de contratos.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowView(false)}
                                className="rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                                aria-label="Cerrar"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent h-[calc(80vh-140px)]">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="text-xs font-medium text-slate-500">Nro Solicitud</div>
                                    <div className="mt-1 text-sm font-semibold text-slate-900">
                                        {viewData.nrosolicitud || "-"}
                                    </div>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="text-xs font-medium text-slate-500">Monto</div>
                                    <div className="mt-1 text-sm font-semibold text-slate-900">
                                        ${Number(viewData.monto || viewData.totalapagar || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                                    <div className="text-xs font-medium text-slate-500">Cliente</div>
                                    <div className="mt-1 text-sm font-semibold text-slate-900">
                                        {viewData.cliente?.appynom || viewData.appynom || "-"}
                                    </div>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                                    <div className="text-xs font-medium text-slate-500">Producto</div>
                                    <div className="mt-1 text-sm font-semibold text-slate-900">
                                        {viewData.producto?.descripcion || viewData.producto_descripcion || "-"}
                                    </div>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                                    <div className="text-xs font-medium text-slate-500">Observaciones</div>
                                    <div className="mt-1 text-sm font-semibold text-slate-900">
                                        {viewData.observacion || "-"}
                                    </div>
                                </div>
                            </div>

                            {/* Contratos section */}
                            <div className="mt-6">
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="text-sm font-semibold text-slate-900">Gestión de Contratos</div>
                                </div>

                                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="flex flex-col gap-4">
                                        {contratoLink && (
                                            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                                                <p className="text-sm text-green-800 font-medium mb-2">Contrato Pendiente de Firma. Link para el cliente:</p>
                                                <div className="flex items-center gap-2">
                                                    <input type="text" readOnly value={contratoLink} className="flex-1 p-2 text-sm border rounded" />
                                                    <button
                                                        className="action-button whitespace-nowrap"
                                                        onClick={() => { navigator.clipboard.writeText(contratoLink); alert("Link copiado!"); }}
                                                    >
                                                        Copiar Link
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center w-full flex-wrap gap-2">
                                            {viewData.contratos && viewData.contratos.length > 0 && viewData.contratos[0].estado === 2 && viewData.contratos[0].url_pdf_firmado ? (
                                                <div className="flex justify-between w-full">
                                                    <a
                                                        href={viewData.contratos[0].url_pdf_firmado}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="secondary-button rounded-lg p-1 bg-white! text-emerald-600! hover:bg-emerald-600! hover:text-white! transition-all duration-300 cursor-pointer flex items-center gap-2"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" /></svg>
                                                        Ver Contrato Firmado
                                                    </a>
                                                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-flex items-center">
                                                        Contrato Digitalizado y Aprobado
                                                    </span>
                                                </div>
                                            ) : selectedManualFile ? (
                                                <div className="flex items-center justify-between w-full gap-2 bg-slate-100 p-2 rounded border border-slate-200">
                                                    <span className="text-sm font-medium truncate max-w-[150px]" title={selectedManualFile.name}>{selectedManualFile.name}</span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            className="secondary-button text-xs py-1"
                                                            onClick={() => {
                                                                const url = URL.createObjectURL(selectedManualFile);
                                                                window.open(url, '_blank');
                                                                setTimeout(() => URL.revokeObjectURL(url), 1000);
                                                            }}
                                                        >
                                                            Abrir
                                                        </button>
                                                        <button
                                                            className="ghost-button text-xs py-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => {
                                                                setSelectedManualFile(null);
                                                                if (fileInputRef.current) fileInputRef.current.value = "";
                                                            }}
                                                            disabled={uploadingContrato}
                                                        >
                                                            Eliminar
                                                        </button>
                                                        <button
                                                            className="action-button bg-green-600 hover:bg-green-700 text-xs py-1"
                                                            onClick={handleSubirContratoManual}
                                                            disabled={uploadingContrato}
                                                        >
                                                            {uploadingContrato ? "Subiendo..." : "Confirmar"}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (


                                                <div className="flex gap-3 flex-wrap">
                                                    {viewData.contratos && viewData.contratos.length > 0 && viewData.contratos[0].token_acceso && viewData.contratos[0].estado !== 2 && (
                                                        <button
                                                            onClick={() => {
                                                                const link = `${window.location.origin}/firma/${viewData.contratos?.[0]?.token_acceso}`;
                                                                navigator.clipboard.writeText(link);
                                                                alert("Link copiado al portapapeles: " + link);
                                                            }}
                                                            className="action-button bg-amber-600 hover:bg-amber-700 text-sm py-2 flex items-center gap-2"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                                                            Copiar Link de Firma
                                                        </button>
                                                    )}
                                                    <button className="ghost-button text-sm py-2" onClick={handleOpenPreview} disabled={contratoLoading}>
                                                        Generar Contrato
                                                    </button>
                                                    <button
                                                        className="action-button bg-slate-600 hover:bg-slate-700 text-sm py-2"
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        Subir PDF Firmado
                                                    </button>
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        className="hidden"
                                                        accept="application/pdf"
                                                        onChange={handleSeleccionarContratoManual}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 p-5 sm:flex-row sm:justify-end sm:items-center bg-white">
                            <button
                                type="button"
                                className="ghost-button flex-1 sm:flex-none justify-center"
                                onClick={() => setShowView(false)}
                            >
                                Cerrar
                            </button>
                        </div>
                    </Modal>
                )}

                {showPlan && (
                    <Modal
                        isOpen={true}
                        onClose={() => setShowPlan(false)}
                        title="Plan de Pagos"
                        className="max-w-5xl h-[90vh]"
                    >
                        <div className="flex flex-col h-full bg-slate-50/50">
                            <div className="flex-1 overflow-auto p-6">
                                {/* KPIs Section */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                                    <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Financiado</div>
                                        <div className="text-2xl font-bold text-slate-900 mt-1">
                                            ${(viewData?.totalapagar || planResumen?.montoTotal || 0).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Pagado</div>
                                        <div className="text-2xl font-bold text-emerald-600 mt-1">
                                            ${(planResumen?.montoPagado || 0).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Saldo Restante</div>
                                        <div className="text-2xl font-bold text-slate-900 mt-1">
                                            ${((viewData?.totalapagar || planResumen?.montoTotal || 0) - (planResumen?.montoPagado || 0)).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Cuotas</div>
                                        <div className="text-2xl font-bold text-slate-900 mt-1">
                                            {planResumen?.total || 0}
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Progreso</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {Math.round(((planResumen?.montoPagado || 0) / (planResumen?.montoTotal || 1)) * 100)}%
                                            </div>
                                            <div className="h-2 w-12 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `${Math.round(((planResumen?.montoPagado || 0) / (planResumen?.montoTotal || 1)) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                                    <h3 className="text-lg font-semibold text-slate-800">Detalle de Cuotas</h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleOpenEditFecha}
                                            className="ghost-button text-sm py-2 flex items-center gap-2"
                                            title="Cambiar fecha de inicio y recalcular vencimientos"
                                        >
                                            <CalendarDays className="w-4 h-4" />
                                            Fecha de Inicio
                                        </button>
                                        <button
                                            onClick={async () => {
                                                await handleDownloadPagadas();
                                            }}
                                            className="ghost-button text-sm py-2 flex items-center gap-2"
                                            title="Descargar todos los recibos pagados"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-printer"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 9V3h12v6" /><rect x="6" y="14" width="12" height="8" ry="1" /></svg>
                                            Descargar Pagadas
                                        </button>
                                        <button
                                            onClick={handleOpenSignModal}
                                            className="ghost-button text-sm py-2 flex items-center gap-2"
                                            title="Firmar y descargar recibos pagados"
                                        >
                                            firmar e imprimir
                                        </button>
                                        <button
                                            onClick={() => handleAddCuotasPrompt(viewData)}
                                            className="action-button text-sm py-2"
                                        >
                                            + Agregar Cuota
                                        </button>
                                    </div>
                                </div>

                                <CuotasList
                                    filtro={String(viewData?.id || viewData?.idsolicitud || "")}
                                    idsolicitud={viewData?.idsolicitud || viewData?.id}
                                    isModal={true}
                                    onView={(id) => handleViewCuota(id)}
                                    onEdit={(c) => handleOpenEditCuota(c)}
                                    onPay={(c) => handleOpenPayCuota(c)}
                                />
                            </div>
                            <div className="bg-white border-t border-slate-100 p-4 flex justify-end">
                                <button
                                    onClick={() => setShowPlan(false)}
                                    className="ghost-button"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </Modal>
                )}

                {/* Action Modals */}
                {addCuotasSol && (
                    <SolicitudAddCuotasModal
                        nroSolicitud={addCuotasSol.nroSolicitud}
                        onClose={() => setAddCuotasSol(null)}
                        onConfirm={handleConfirmAddCuotas}
                    />
                )}

                {editFechaSol && (
                    <SolicitudFechaModal
                        idsolicitud={editFechaSol.id}
                        nroSolicitud={editFechaSol.nroSolicitud}
                        fechaActual={editFechaSol.fechaActual}
                        onClose={() => setEditFechaSol(null)}
                        onConfirm={handleConfirmEditFecha}
                    />
                )}

                {viewCuota && (
                    <CuotaDetailModal
                        cuota={viewCuota}
                        solicitud={viewSolicitud}
                        comprobantes={viewComprobantes}
                        onClose={() => setViewCuota(null)}
                        onDownloadRecibo={handleDownloadRecibo}
                        reciboLoading={reciboLoading}
                        solicitudLoading={viewLoading}
                        reciboError={null}
                        solicitudError={viewError}
                    />
                )}

                {editCuota && (
                    <CuotaEditModal
                        cuota={editCuota}
                        onClose={() => setEditCuota(null)}
                        onSave={handleSaveEditCuota}
                    />
                )}

                {payCuota && (
                    <CuotaPayModal
                        cuota={payCuota}
                        onClose={() => setPayCuota(null)}
                        onConfirm={handleConfirmPayCuota}
                    />
                )}

                {/* Modal for Contract Preview */}
                {showPreview && viewData && (
                    <ContratoPreviewModal
                        isOpen={showPreview}
                        onClose={() => setShowPreview(false)}
                        solicitudData={viewData}
                        onGenerate={handleGenerarContrato}
                        isLoading={contratoLoading}
                    />
                )}

                <ReciboSignModal
                    isOpen={signModalOpen}
                    onClose={() => setSignModalOpen(false)}
                    onConfirm={(firma) => pendingSignAction?.(firma)}
                    isLoading={signLoading}
                />
            </div>
        </Layout>
    );
}
