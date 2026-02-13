import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { EmptyState, ErrorState, LoadingState } from "../components/Status";
import { adelantosApi, solicitudesApi } from "../api/endpoints";

interface AdelantoView {
  id: number;
  nroSolicitud: string;
  clienteNombre: string;
  importe: number;
  fecha: string;
  observaciones?: string;
}

interface SolicitudRaw {
  idsolicitud: number;
  nrosolicitud: string;
  cliente_nombre: string;
  appynom: string;
}

export default function AdelantosPage() {
  const [adelantos, setAdelantos] = useState<AdelantoView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [solicitudes, setSolicitudes] = useState<SolicitudRaw[]>([]);
  const [formData, setFormData] = useState({
    solicitudId: "",
    importe: "",
    observaciones: "",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAdelantos();
    loadSolicitudes();
  }, []);

  const loadSolicitudes = async () => {
    try {
      const data: any = await solicitudesApi.getAll();
      setSolicitudes(data || []);
    } catch (err) {
      console.error("Error cargando solicitudes:", err);
    }
  };

  const loadAdelantos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adelantosApi.getAll();
      const mapped = (response || []).map((a: any) => ({
        id: a.idadelanto,
        nroSolicitud: a.nrosolicitud || "",
        clienteNombre: a.cliente_nombre || "",
        importe: a.adelantoimporte,
        fecha: a.adelantofecha,
        observaciones: a.observaciones,
      }));
      setAdelantos(mapped);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error al cargar adelantos";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.solicitudId || !formData.importe) {
      setFormError("Solicitud e importe son requeridos");
      return;
    }

    setSubmitting(true);
    try {
      await adelantosApi.create(
        parseInt(formData.solicitudId),
        parseFloat(formData.importe),
      );
      setShowModal(false);
      setFormData({
        solicitudId: "",
        importe: "",
        observaciones: "",
      });
      loadAdelantos();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Error al crear adelanto";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const totalAdelantos = adelantos.reduce(
    (sum, adelanto) => sum + adelanto.importe,
    0,
  );

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString("es-AR");
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Adelantos</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Nuevo Adelanto
          </button>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Nuevo Adelanto</h2>
              {formError && (
                <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                  {formError}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Solicitud *
                  </label>
                  <select
                    value={formData.solicitudId}
                    onChange={(e) =>
                      setFormData({ ...formData, solicitudId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    required
                  >
                    <option value="">Seleccionar solicitud</option>
                    {solicitudes.map((s) => (
                      <option key={s.idsolicitud} value={s.idsolicitud}>
                        {s.nrosolicitud} - {s.cliente_nombre || s.appynom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Importe *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.importe}
                    onChange={(e) =>
                      setFormData({ ...formData, importe: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Observaciones
                  </label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        observaciones: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitting ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm">Total Adelantos</p>
            <p className="text-3xl font-bold text-blue-600">
              $
              {totalAdelantos.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm">Cantidad</p>
            <p className="text-3xl font-bold text-green-600">
              {adelantos.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm">Promedio</p>
            <p className="text-3xl font-bold text-purple-600">
              $
              {adelantos.length > 0
                ? (totalAdelantos / adelantos.length).toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                  })
                : "0"}
            </p>
          </div>
        </div>

        {loading && <LoadingState />}
        {error && <ErrorState message={error} />}

        {!loading && !error && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Solicitud
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Importe
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Observaciones
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {adelantos.map((adelanto) => (
                  <tr key={adelanto.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      {adelanto.nroSolicitud}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {adelanto.clienteNombre}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">
                      $
                      {adelanto.importe.toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {formatDate(adelanto.fecha)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {adelanto.observaciones || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <button
                        onClick={() => {}}
                        className="text-red-600 hover:text-red-800"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {adelantos.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <EmptyState message="No hay adelantos para mostrar" />
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
