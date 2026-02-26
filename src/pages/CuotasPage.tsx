import { useState } from "react";
import Layout from "../components/Layout";
import { CuotasList, type CuotaColumn } from "../components/cuotas/CuotasList";
import { CuotaDetailModal } from "../components/cuotas/CuotaDetailModal";
import { CuotaEditModal } from "../components/cuotas/CuotaEditModal";
import { CuotaPayModal } from "../components/cuotas/CuotaPayModal";
import { cuotasApi, reportesApi, solicitudesApi } from "../api/endpoints";
import { useQueryClient } from "@tanstack/react-query";

export default function CuotasPage() {
  const queryClient = useQueryClient();
  const [viewCuota, setViewCuota] = useState<any | null>(null);
  const [editCuota, setEditCuota] = useState<any | null>(null);
  const [payCuota, setPayCuota] = useState<any | null>(null);

  // Data for View Modal
  const [viewSolicitud, setViewSolicitud] = useState<any | null>(null);
  const [viewComprobantes, setViewComprobantes] = useState<any[]>([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);
  const [reciboLoading, setReciboLoading] = useState(false);

  const handleView = async (id: number) => {
    try {
      setViewLoading(true);
      const data = await cuotasApi.getById(id);
      setViewCuota(data);

      if (data?.relasolicitud) {
        const solId = Number(data.relasolicitud);
        try {
          const sol = await solicitudesApi.getById(solId);
          setViewSolicitud(sol);
        } catch (e) { console.error(e) }
      }
      try {
        const comp = await cuotasApi.getComprobantes(id);
        setViewComprobantes(comp || []);
      } catch (e) { console.error(e) }

    } catch (e) {
      setViewError("Error al cargar detalle");
    } finally {
      setViewLoading(false);
    }
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

  const openEdit = (cuota: CuotaColumn & { raw?: any }) => {
    // Use raw if available, otherwise just use what's in the column
    setEditCuota(cuota.raw || cuota);
  };

  const openPay = (cuota: CuotaColumn & { raw?: any }) => {
    setPayCuota(cuota.raw || cuota);
  };

  const handleSaveEdit = async (
    id: number,
    payload: { importe?: number; fechaPago?: string },
  ) => {
    try {
      if (payload.fechaPago) {
        await cuotasApi.updateFechaPago(id, payload.fechaPago);
      } else if (payload.importe !== undefined) {
        await cuotasApi.updateImporte(id, payload.importe);
      }
      setEditCuota(null);
      queryClient.invalidateQueries({ queryKey: ["cuotas"] });
    } catch (e) {
      alert("Error al actualizar");
    }
  };

  const handleConfirmPayCuota = async (id: number, file: File | null) => {
    try {
      await cuotasApi.pagar(id);
      if (file) {
        await cuotasApi.uploadComprobante(id, file); // Fixed method name assumption which was subirComprobante
      }
      queryClient.invalidateQueries({ queryKey: ["cuotas"] });
    } catch (e) {
      alert("Error al pagar o subir comprobante");
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 page-shell">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gestión de Cuotas</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
          <CuotasList
            onView={handleView}
            onEdit={openEdit}
            onPay={openPay}
          />
        </div>

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
            onSave={handleSaveEdit}
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
