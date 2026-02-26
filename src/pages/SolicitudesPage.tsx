import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Layout from "../components/Layout";
import { SolicitudesList, type SolicitudColumn } from "../components/solicitudes/SolicitudesList";
import { SolicitudForm } from "../components/solicitudes/SolicitudForm";
import { SolicitudAddCuotasModal } from "../components/solicitudes/SolicitudAddCuotasModal";
import { SolicitudFechaModal } from "../components/solicitudes/SolicitudFechaModal";
import { cuotasApi, solicitudesApi, reportesApi } from "../api/endpoints";
import { Modal } from "../components/ui/Modal";
import { useAddCuotas } from "../hooks/useSolicitudes";
import { CuotaDetailModal } from "../components/cuotas/CuotaDetailModal";
import { CuotaEditModal } from "../components/cuotas/CuotaEditModal";
import { CuotaPayModal } from "../components/cuotas/CuotaPayModal";
import { CuotasList } from "../components/cuotas/CuotasList";
import { CalendarDays } from "lucide-react";

export default function SolicitudesPage() {
    const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
    const [selectedId, setSelectedId] = useState<number | null>(null);

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

    const handleSuccess = () => {
        setViewMode("list");
        setSelectedId(null);
    };

    const handleView = async (id: number) => {
        try {
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
        payload: { importe?: number; fechaPago?: string },
    ) => {
        if (payload.fechaPago) {
            await cuotasApi.updateFechaPago(id, payload.fechaPago);
        } else if (payload.importe !== undefined) {
            await cuotasApi.updateImporte(id, payload.importe);
        }
        setEditCuota(null);
        queryClient.invalidateQueries({ queryKey: ["cuotas"] });
        // Refresh Plan
        if (viewData) handleViewPlan(viewData.idsolicitud || viewData.id);
    };

    const handleConfirmPayCuota = async (id: number, file: File | null) => {
        await cuotasApi.pagar(id);
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
                        title="Detalle de Solicitud"
                        className="max-w-2xl"
                    >
                        <div className="grid grid-cols-2 gap-4 text-sm p-6">
                            <div><strong>Nro:</strong> {viewData.nrosolicitud}</div>
                            <div><strong>Cliente:</strong> {viewData.cliente?.appynom || viewData.appynom}</div>
                            <div><strong>Producto:</strong> {viewData.producto?.descripcion || viewData.producto_descripcion}</div>
                            <div><strong>Monto:</strong> ${viewData.monto || viewData.totalapagar}</div>
                            <div className="col-span-2"><strong>Observaciones:</strong> {viewData.observacion || "-"}</div>
                        </div>
                        <div className="flex gap-2 p-4 border-t border-slate-100 justify-end bg-slate-50">
                            <button className="ghost-button" onClick={() => setShowView(false)}>Cerrar</button>
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
                                            ${(planResumen?.montoTotal || 0).toLocaleString()}
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
                                            ${(planResumen?.montoImpago || 0).toLocaleString()}
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
                                                try {
                                                    const blob = await reportesApi.recibosSolicitudPagados(viewData.id || viewData.idsolicitud);
                                                    const url = URL.createObjectURL(blob);
                                                    const link = document.createElement("a");
                                                    link.href = url;
                                                    link.download = `recibos-pagados-solicitud-${viewData.id || viewData.idsolicitud}.pdf`;
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    link.remove();
                                                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                                                } catch (e) {
                                                    alert("Error generando reporte o no hay cuotas pagadas");
                                                }
                                            }}
                                            className="ghost-button text-sm py-2 flex items-center gap-2"
                                            title="Descargar todos los recibos pagados"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-printer"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 9V3h12v6" /><rect x="6" y="14" width="12" height="8" ry="1" /></svg>
                                            Descargar Pagadas
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

            </div>
        </Layout>
    );
}
