import { useState } from "react";
import Layout from "../components/Layout";
import { SolicitudesList, type SolicitudColumn } from "../components/solicitudes/SolicitudesList";
import { SolicitudForm } from "../components/solicitudes/SolicitudForm";
import { SolicitudAddCuotasModal } from "../components/solicitudes/SolicitudAddCuotasModal";
import { Plus, DollarSign, Edit, Eye } from "lucide-react";
import { cuotasApi, solicitudesApi, reportesApi } from "../api/endpoints";
import { LoadingState, ErrorState } from "../components/Status";
import { useAddCuotas } from "../hooks/useSolicitudes";
import { CuotaDetailModal } from "../components/cuotas/CuotaDetailModal";
import { CuotaEditModal } from "../components/cuotas/CuotaEditModal";
import { CuotaPayModal } from "../components/cuotas/CuotaPayModal";

export default function SolicitudesPage() {
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit">("list");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // States for "Ver Detalle" (Classic view) and context for Plan
  const [showView, setShowView] = useState(false);
  const [viewData, setViewData] = useState<any | null>(null);

  // States for Plan (Cuotas)
  const [showPlan, setShowPlan] = useState(false);
  const [planCuotas, setPlanCuotas] = useState<any[]>([]);
  const [planResumen, setPlanResumen] = useState<any | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);


  // Add Cuotas Modal state
  const [addCuotasSol, setAddCuotasSol] = useState<{ id: number, nroSolicitud: string } | null>(null);

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
      setPlanError(null);
      setPlanLoading(true);
      setPlanCuotas([]);
      setPlanResumen(null);

      // Fetch details to have context (nroSolicitud) for the modal
      const solData: any = await solicitudesApi.getById(id);
      setViewData(solData);

      setShowPlan(true);

      const data = await cuotasApi.getForSolicitud(id);
      setPlanCuotas(data?.cuotas || []);
      setPlanResumen(data?.resumen || null);
    } catch (err) {
      setPlanError("No se pudo cargar el plan de pagos.");
    } finally {
      setPlanLoading(false);
    }
  };

  const handleAddCuotasPrompt = (sol: SolicitudColumn | { id: number, nroSolicitud: string }) => {
    setAddCuotasSol({
      id: sol.id,
      nroSolicitud: sol.nroSolicitud
    });
  };

  const handleConfirmAddCuotas = async (cantidad: number) => {
    if (!addCuotasSol) return;
    await addCuotasMutation.mutateAsync({ id: addCuotasSol.id, cantidad });
    // If the plan modal is open, refresh the plan!
    if (showPlan && viewData) {
      handleViewPlan(viewData.idsolicitud || viewData.id);
    }
  };

  // --- Handlers for Cuota Actions ---

  const handleViewCuota = async (id: number) => {
    try {
      setViewLoading(true);
      const data = await cuotasApi.getById(id);
      setViewCuota(data);

      // Try to get related info
      if (data?.relasolicitud) {
        try {
          // Reuse existing viewData if matches, otherwise fetch?
          // Actually, for simplicity, let's just fetch or use viewData if available and matches
          if (viewData && (viewData.idsolicitud === data.relasolicitud || viewData.id === data.relasolicitud)) {
            setViewSolicitud(viewData);
          } else {
            const sol = await solicitudesApi.getById(data.relasolicitud);
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

  const handleSaveEditCuota = async (id: number, importe: number) => {
    await cuotasApi.updateImporte(id, importe);
    setEditCuota(null);
    // Refresh Plan
    if (viewData) handleViewPlan(viewData.idsolicitud || viewData.id);
  };

  const handleConfirmPayCuota = async (id: number, file: File | null) => {
    await cuotasApi.pagar(id);
    if (file) {
      const formData = new FormData();
      formData.append("archivo", file);
      await cuotasApi.uploadComprobante(id, file); // Fixed method name assumption, check api/endpoints
    }
    setPayCuota(null);
    // Refresh Plan
    if (viewData) handleViewPlan(viewData.idsolicitud || viewData.id);
  };

  const handleDownloadRecibo = async () => {
    if (!viewCuota) return;
    setReciboLoading(true);
    try {
      const blob = await reportesApi.reciboCuota(viewCuota.idcuota);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
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

        {/* <div className="flex justify-between items-center mb-6">
            {viewMode === "list" && (
              <button onClick={handleCreate} className="action-button flex items-center gap-2">
                <Plus className="w-4 h-4" /> Nueva Solicitud
              </button>
            )}
          </div> */}
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-50">
            <div className="panel pad max-w-2xl w-full">
              <h2 className="text-2xl font-bold mb-4">Detalle de Solicitud</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Nro:</strong> {viewData.nrosolicitud}</div>
                <div><strong>Cliente:</strong> {viewData.cliente?.appynom || viewData.appynom}</div>
                <div><strong>Producto:</strong> {viewData.producto?.descripcion || viewData.producto_descripcion}</div>
                <div><strong>Monto:</strong> ${viewData.monto || viewData.totalapagar}</div>
                <div className="col-span-2"><strong>Observaciones:</strong> {viewData.observacion || "-"}</div>
              </div>
              <div className="flex gap-2 mt-6 justify-end">
                <button className="ghost-button" onClick={() => setShowView(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {showPlan && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-50">
            <div className="panel pad max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Plan de Pagos</h2>
                <div className="flex items-center gap-2">
                  {viewData && (
                    <button
                      onClick={() => handleAddCuotasPrompt({ id: viewData.idsolicitud || viewData.id, nroSolicitud: viewData.nrosolicitud })}
                      className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-purple-100 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar Cuotas
                    </button>
                  )}
                  <button className="ghost-button" onClick={() => setShowPlan(false)}>Cerrar</button>
                </div>
              </div>

              {planLoading && <LoadingState />}
              {planError && <ErrorState message={planError} />}

              {!planLoading && !planError && (
                <div className="flex-1 overflow-auto">
                  {/* Summary Cards */}
                  {planResumen && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                      <div className="p-3 bg-slate-50 rounded-lg border">
                        <div className="text-xs text-slate-500">Total Cuotas</div>
                        <div className="font-bold">{planResumen.total}</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                        <div className="text-xs text-green-600">Pagadas</div>
                        <div className="font-bold text-green-700">{planResumen.pagadas}</div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border">
                        <div className="text-xs text-slate-500">Monto Total</div>
                        <div className="font-bold">${planResumen.montoTotal}</div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border">
                        <div className="text-xs text-slate-500">Monto Pendiente</div>
                        <div className="font-bold">${planResumen.montoImpago}</div>
                      </div>
                    </div>
                  )}

                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 font-semibold text-slate-700">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Vencimiento</th>
                        <th className="p-3">Importe</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3">Fecha Pago</th>
                        <th className="p-3">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {planCuotas.map((c) => (
                        <tr key={c.idcuota} className="hover:bg-slate-50">
                          <td className="p-3">{c.nrocuota}</td>
                          <td className="p-3">{new Date(c.vencimiento).toLocaleDateString()}</td>
                          <td className="p-3">${c.importe}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.estado === 2 ? "bg-green-100 text-green-700" :
                              c.estado === 0 ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                              }`}>
                              {c.estado === 2 ? "Pagada" : c.estado === 0 ? "Impaga" : "Pendiente"}
                            </span>
                          </td>
                          <td className="p-3">{c.fecha ? new Date(c.fecha).toLocaleDateString() : "-"}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {c.estado !== 2 && (
                                <>
                                  <button
                                    onClick={() => handleOpenPayCuota(c)}
                                    className="p-1.5 hover:bg-green-50 rounded text-green-600 transition-colors"
                                    title="Registrar Pago"
                                  >
                                    <DollarSign className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenEditCuota(c)}
                                    className="p-1.5 hover:bg-blue-50 rounded text-blue-600 transition-colors"
                                    title="Editar Importe"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleViewCuota(c.idcuota)}
                                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                                title="Ver Detalle"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {addCuotasSol && (
          <SolicitudAddCuotasModal
            nroSolicitud={addCuotasSol.nroSolicitud}
            onClose={() => setAddCuotasSol(null)}
            onConfirm={handleConfirmAddCuotas}
          />
        )}

        {/* Cuota Action Modals */}
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
