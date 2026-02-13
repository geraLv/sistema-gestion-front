import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { EmptyState, ErrorState, LoadingState } from "../components/Status";
import { cuotasApi, reportesApi, solicitudesApi } from "../api/endpoints";

interface CuotaView {
  id: number;
  nroSolicitud: string;
  nroCuota: number;
  importe: number;
  vencimiento: string;
  estado: string;
}

export default function CuotasPage() {
  const [cuotas, setCuotas] = useState<CuotaView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [viewCuota, setViewCuota] = useState<any | null>(null);
  const [viewSolicitud, setViewSolicitud] = useState<any | null>(null);
  const [viewSolicitudLoading, setViewSolicitudLoading] = useState(false);
  const [viewSolicitudError, setViewSolicitudError] = useState<string | null>(
    null,
  );
  const [viewComprobantes, setViewComprobantes] = useState<any[]>([]);
  const [viewReciboLoading, setViewReciboLoading] = useState(false);
  const [viewReciboError, setViewReciboError] = useState<string | null>(null);
  const [editCuota, setEditCuota] = useState<any | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [showPay, setShowPay] = useState(false);
  const [payCuota, setPayCuota] = useState<any | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [payFile, setPayFile] = useState<File | null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [comprobantes, setComprobantes] = useState<any[]>([]);
  const [selectedCuotas, setSelectedCuotas] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  useEffect(() => {
    loadCuotas();
  }, []);

  const loadCuotas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cuotasApi.getAll();
      const mapped = (response || []).map((c: any) => ({
        id: c.idcuota,
        nroSolicitud: c.relasolicitud,
        nroCuota: c.nrocuota,
        importe: c.importe,
        vencimiento: c.vencimiento,
        estado:
          c.estado === 0 ? "Impaga" : c.estado === 2 ? "Pagada" : "Pendiente",
      }));
      setCuotas(mapped);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error al cargar cuotas";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const filteredCuotas = cuotas.filter((cuota) => {
    const matchesStatus = !statusFilter || cuota.estado === statusFilter;
    const search = searchTerm.trim().toLowerCase();
    if (!search) return matchesStatus;
    const nroSolicitud = String(cuota.nroSolicitud || "").toLowerCase();
    const nroCuota = String(cuota.nroCuota || "").toLowerCase();
    return (
      matchesStatus &&
      (nroSolicitud.includes(search) || nroCuota.includes(search))
    );
  });

  const totalPages = Math.ceil(filteredCuotas.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedCuotas = filteredCuotas.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pagada":
        return "bg-green-100 text-green-800";
      case "Impaga":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString("es-AR");
  };

  const handleSelectCuota = (cuotaId: number) => {
    setSelectedCuotas((prev) =>
      prev.includes(cuotaId)
        ? prev.filter((id) => id !== cuotaId)
        : [...prev, cuotaId],
    );
  };

  const handlePagarSeleccionadas = async () => {
    if (selectedCuotas.length === 0) {
      alert("Seleccione al menos una cuota");
      return;
    }
    try {
      await cuotasApi.pagarMultiples(selectedCuotas);
      setSelectedCuotas([]);
      loadCuotas();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error al pagar cuotas";
      alert(errorMsg);
    }
  };

  const handleVer = async (id: number) => {
    try {
      const data: any = await cuotasApi.getById(id);
      setViewCuota(data);
      setViewSolicitud(null);
      setViewSolicitudError(null);
      setViewSolicitudLoading(true);
      if (data?.relasolicitud) {
        const solicitudId = Number(data.relasolicitud);
        try {
          const solicitud = Number.isFinite(solicitudId)
            ? await solicitudesApi.getById(solicitudId)
            : await solicitudesApi.getByNro(String(data.relasolicitud));
          setViewSolicitud(solicitud);
        } catch (err) {
          setViewSolicitudError("No se pudo cargar la solicitud");
        }
      }
      const list = await cuotasApi.getComprobantes(id);
      setViewComprobantes(list || []);
      setShowView(true);
    } catch (err) {
      setError("No se pudo cargar la cuota");
    } finally {
      setViewSolicitudLoading(false);
    }
  };

  const formatFechaComprobante = (value?: string) => {
    if (!value) return "Sin fecha";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Sin fecha";
    return date.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDescargarRecibo = async () => {
    if (!viewCuota) return;
    const id = Number(viewCuota.idcuota ?? viewCuota.id);
    if (!Number.isFinite(id) || id <= 0) {
      setViewReciboError("ID de cuota inválido.");
      return;
    }
    setViewReciboError(null);
    setViewReciboLoading(true);
    try {
      const blob = await reportesApi.reciboCuota(id);
      openBlob(blob, `recibo-cuota-${id}.pdf`);
    } catch (err) {
      setViewReciboError("No se pudo generar el recibo.");
    } finally {
      setViewReciboLoading(false);
    }
  };

  const handleEditar = async (id: number) => {
    try {
      setEditError(null);
      const data: any = await cuotasApi.getById(id);
      setEditCuota({
        id: data.idcuota,
        nroSolicitud: data.relasolicitud,
        nroCuota: data.nrocuota,
        importe: data.importe,
        vencimiento: data.vencimiento,
        estado: data.estado,
      });
      setShowEdit(true);
    } catch (err) {
      setError("No se pudo cargar la cuota");
    }
  };

  const handleGuardarImporte = async () => {
    if (!editCuota) return;
    const importe = Number(editCuota.importe);
    if (!Number.isFinite(importe) || importe <= 0) {
      setEditError("El importe debe ser un número mayor a 0");
      return;
    }
    try {
      await cuotasApi.updateImporte(editCuota.id, importe);
      setShowEdit(false);
      setEditCuota(null);
      setEditError(null);
      loadCuotas();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error al actualizar cuota";
      setEditError(errorMsg);
    }
  };

  const handlePagar = async (id: number) => {
    try {
      setPayError(null);
      const data: any = await cuotasApi.getById(id);
      setPayCuota({
        id: data.idcuota,
        nroSolicitud: data.relasolicitud,
        nroCuota: data.nrocuota,
        importe: data.importe,
        vencimiento: data.vencimiento,
        estado: data.estado,
      });
      const list = await cuotasApi.getComprobantes(id);
      setComprobantes(list || []);
      setShowPay(true);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error al cargar cuota";
      setPayError(errorMsg);
    }
  };

  const handleConfirmarPago = async () => {
    if (!payCuota) return;
    setPayLoading(true);
    setPayError(null);
    try {
      await cuotasApi.pagar(payCuota.id);
      if (payFile) {
        await cuotasApi.uploadComprobante(payCuota.id, payFile);
      }
      setShowPay(false);
      setPayCuota(null);
      setPayFile(null);
      setComprobantes([]);
      loadCuotas();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error al pagar cuota";
      setPayError(errorMsg);
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 page-shell">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Cuotas</h1>
          {selectedCuotas.length > 0 && (
            <button
              onClick={handlePagarSeleccionadas}
              className="action-button"
            >
              Pagar {selectedCuotas.length} seleccionada(s)
            </button>
          )}
        </div>

        <div className="panel pad mb-6 min-h-screen max-h-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Buscar por solicitud o nro cuota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-sleek"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-sleek"
            >
              <option value="">Todos los estados</option>
              <option value="Pagada">Pagadas</option>
              <option value="Impaga">Impagas</option>
              <option value="Pendiente">Pendientes</option>
            </select>
          </div>

          {loading && <LoadingState />}
          {error && <ErrorState message={error} />}

          {!loading && !error && (
            <div className="p-4 mb-4">
              <div className="table-shell overflow-auto p-4 m-4 ">
                <table className="w-full p-4 m-4 ">
                  <thead className="table-head p-4 m-4 ">
                    <tr className="p-4 m-4 gap-4">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCuotas(
                                filteredCuotas.map((c) => c.id),
                              );
                            } else {
                              setSelectedCuotas([]);
                            }
                          }}
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Solicitud
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Nro Cuota
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Importe
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Vencimiento
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="p-4 m-4 ">
                    {paginatedCuotas.map((cuota) => (
                      <tr key={cuota.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm">
                          <input
                            type="checkbox"
                            checked={selectedCuotas.includes(cuota.id)}
                            onChange={() => handleSelectCuota(cuota.id)}
                          />
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {cuota.nroSolicitud}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold">
                          {cuota.nroCuota}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          $
                          {cuota.importe.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {formatDate(cuota.vencimiento)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`chip ${getStatusColor(cuota.estado)}`}
                          >
                            {cuota.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          <button
                            onClick={() => handleVer(cuota.id)}
                            className="text-blue-600 hover:text-blue-800 mr-2"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => handleEditar(cuota.id)}
                            className="text-green-600 hover:text-green-800 mr-2"
                          >
                            Editar
                          </button>
                          {cuota.estado === "Impaga" && (
                            <button
                              onClick={() => handlePagar(cuota.id)}
                              className="text-green-600 hover:text-green-800"
                            >
                              Pagar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredCuotas.length === 0 && (
                  <EmptyState message="No hay cuotas para mostrar" />
                )}
              </div>
              {filteredCuotas.length > 0 && (
                <div className="bg-white border-t p-4 flex items-center justify-between">
                  <select
                    value={rowsPerPage}
                    onChange={(e) => handleRowsPerPageChange(e.target.value)}
                    className="input-sleek text-sm"
                  >
                    <option value="15">15 filas</option>
                    <option value="50">50 filas</option>
                    <option value="100">100 filas</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="ghost-button disabled:opacity-50"
                    >
                      ←
                    </button>
                    <div className="flex items-center justify-around gap-2">
                      <span className="text-sm">Página</span>
                      <input
                        type="number"
                        value={currentPage}
                        onChange={(e) =>
                          handlePageChange(parseInt(e.target.value))
                        }
                        min="1"
                        max={totalPages}
                        className="w-18 input-sleek text-sm text-center"
                      />
                      <span className="text-sm">de {totalPages}</span>
                    </div>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="ghost-button disabled:opacity-50"
                    >
                      →
                    </button>
                  </div>
                  <span className="text-sm text-gray-600">
                    {filteredCuotas.length} registros
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {showView && viewCuota && (
          <div className="fixed inset-0 z-50 flex items-center justify-center m-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => {
                setShowView(false);
                setViewComprobantes([]);
              }}
            />

            {/* Modal */}
            <div className="flex  flex-col m-19 gap-4 justify-around items-center relative h-3/4 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between w-11/12 gap-4 h-1/4  border-b border-slate-100 m-10 p-15">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                    i
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
                  onClick={() => {
                    setShowView(false);
                    setViewComprobantes([]);
                  }}
                  className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="flex flex-col  h-full  w-11/12">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                    <div className="text-xs font-medium text-slate-500">
                      Solicitud
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {viewCuota.relasolicitud || "-"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-medium text-slate-500">
                      Cliente
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {viewSolicitudLoading
                        ? "Cargando..."
                        : viewSolicitud?.cliente?.appynom ||
                          viewSolicitud?.cliente?.cliente_nombre ||
                          viewSolicitud?.appynom ||
                          "Sin datos"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-medium text-slate-500">
                      DNI
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {viewSolicitudLoading
                        ? "Cargando..."
                        : viewSolicitud?.cliente?.dni ||
                          viewSolicitud?.dni ||
                          "-"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                    <div className="text-xs font-medium text-slate-500">
                      Producto
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {viewSolicitudLoading
                        ? "Cargando..."
                        : viewSolicitud?.producto?.descripcion ||
                          viewSolicitud?.producto_descripcion ||
                          viewSolicitud?.prdescripcion ||
                          "-"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-medium text-slate-500">
                      Nro Cuota
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {viewCuota.nrocuota ?? "-"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-medium text-slate-500">
                      Importe
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      $
                      {Number(viewCuota.importe || 0).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-medium text-slate-500">
                      {Number(viewCuota.estado) === 2
                        ? "Fecha de pago"
                        : "Vencimiento"}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {Number(viewCuota.estado) === 2
                        ? viewCuota.fecha
                          ? formatDate(viewCuota.fecha)
                          : "-"
                        : viewCuota.vencimiento
                          ? formatDate(viewCuota.vencimiento)
                          : "-"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-medium text-slate-500">
                      Estado
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {viewCuota.estado === 0
                        ? "Impaga"
                        : viewCuota.estado === 2
                          ? "Pagada"
                          : "Pendiente"}
                    </div>
                  </div>

                  {viewSolicitudError && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 sm:col-span-2">
                      {viewSolicitudError}
                    </div>
                  )}

                  {viewReciboError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:col-span-2">
                      {viewReciboError}
                    </div>
                  )}
                </div>

                {viewComprobantes.length > 0 && (
                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-900">
                        Comprobantes
                      </div>
                      <div className="text-xs text-slate-500">
                        {viewComprobantes.length} archivo(s)
                      </div>
                    </div>

                    <div className=" max-h-48 overflow-auto rounded-xl border w-full border-slate-200 bg-white">
                      <ul className="divide-y divide-slate-100">
                        {viewComprobantes.map((c) => (
                          <li key={c.idcomprobante} className="p-3">
                            <div className="flex items-center justify-between gap-3 text-sm rounded-lg px-2 py-2 hover:bg-slate-50 transition">
                              <div className="flex justify-center min-w-0 w-full ">
                                <div className="flex flex-row w-11/12 items-center justify-between">
                                  <div className="truncate font-medium text-slate-800">
                                    {c.archivo_nombre || c.archivo_url}
                                    <div className="text-xs text-slate-500 mt-1">
                                      Subido:{" "}
                                      {formatFechaComprobante(c.created_at)}
                                    </div>
                                  </div>
                                  <a
                                    href={c.archivo_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="shrink-0 text-xs font-semibold text-blue-700"
                                  >
                                    Abrir
                                  </a>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {viewComprobantes.length === 0 && (
                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    No hay comprobantes cargados para esta cuota.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex h-20 flex-col-reverse gap-2 border-t border-slate-100 p-5 sm:flex-row justify-end             items-center w-11/12">
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    className="ghost-button w-full inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 transition disabled:opacity-50"
                    onClick={handleDescargarRecibo}
                    disabled={viewReciboLoading}
                  >
                    {viewReciboLoading
                      ? "Generando recibo..."
                      : "Descargar recibo PDF"}
                  </button>
                </div>
                <button
                  className="ghost-button w-20 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 transition "
                  onClick={() => {
                    setShowView(false);
                    setViewComprobantes([]);
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {showEdit && editCuota && (
          <div className="fixed inset-0 z-50 flex items-center  justify-center m-4 ">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setShowEdit(false)}
            />

            {/* Modal */}
            <div className="flex  flex-col m-19 gap-4 justify-around items-center relative h-2/5 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between w-11/12 gap-4 h-1/5  border-b border-slate-100 m-10 p-15">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                    ✎
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 leading-6">
                      Editar Cuota
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Actualizá el importe de la cuota seleccionada.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="flex flex-col min-h-2/5 gap-4 justify-center w-11/12">
                {editError && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {editError}
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-medium text-slate-500">
                      Solicitud
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {editCuota.nroSolicitud}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-medium text-slate-500">
                      Nro Cuota
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {editCuota.nroCuota}
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-slate-800">
                    Importe
                  </label>
                  <input
                    className="w-full input-sleek mt-2"
                    type="number"
                    step="0.01"
                    placeholder="Importe"
                    value={editCuota.importe}
                    onChange={(e) =>
                      setEditCuota({
                        ...editCuota,
                        importe: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex  h-1/5 gap-2 border-t border-slate-100 p-5 sm:flex-row sm:justify-center items-center w-11/12">
                <button
                  className="action-button inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 transition sm:w-auto"
                  onClick={() => setShowEdit(false)}
                >
                  Cancelar
                </button>
                <button
                  className="ghost-button inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition sm:w-auto"
                  onClick={handleGuardarImporte}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}

        {showPay && payCuota && (
          <div className="fixed inset-0 z-50 flex items-center  justify-center m-4 ">
            {/* Backdrop */}
            <div
              className="absolute inset-0  bg-slate-950/60  backdrop-blur-sm"
              onClick={() => {
                setShowPay(false);
                setPayCuota(null);
                setPayFile(null);
                setComprobantes([]);
                setPayError(null);
              }}
            />

            {/* Modal */}
            <div className="flex  flex-col m-19 gap-4 justify-around items-center relative h-2/4 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between w-11/12 gap-4 h-1/4  border-b border-slate-100 m-10 p-15">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                    $
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 leading-6">
                      Pago de Cuota
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Confirmá el pago y adjuntá el comprobante (opcional).
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowPay(false);
                    setPayCuota(null);
                    setPayFile(null);
                    setComprobantes([]);
                    setPayError(null);
                  }}
                  className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="flex flex-col  h-full justify- w-11/12">
                {payError && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {payError}
                  </div>
                )}

                {/* Resumen */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-medium text-slate-500">
                      Solicitud
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {payCuota.nroSolicitud || "-"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-medium text-slate-500">
                      Nro Cuota
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {payCuota.nroCuota}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-medium text-slate-500">
                      Importe
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      $
                      {Number(payCuota.importe).toLocaleString("es-AR", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs font-medium text-slate-500">
                      Vencimiento
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">
                      {payCuota.vencimiento
                        ? formatDate(payCuota.vencimiento)
                        : "-"}
                    </div>
                  </div>
                </div>

                {/* Upload */}
                <div className="mt-5 h-full">
                  <div className="flex flex-col justify-end h-3/12">
                    <label className="block text-sm font-semibold text-slate-800">
                      Comprobante (PDF)
                    </label>
                    <p className="mt-1 text-xs text-slate-500">
                      Podés adjuntarlo ahora o subirlo más tarde.
                    </p>
                  </div>

                  <div className="flex flex-col mt-3 h-8/12 rounded-xl border items-center border-dashed border-slate-300 bg-white p-4 hover:bg-slate-50 transition">
                    <div className="flex flex-col gap-3 h-10 w-11/12 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm text-slate-700">
                        {payFile ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-6 items-center rounded-md bg-slate-900 px-2 text-xs font-semibold text-white">
                              PDF
                            </span>
                            <span className="font-medium">{payFile.name}</span>
                            <span className="text-slate-400 text-xs">
                              ({Math.round(payFile.size / 1024)} KB)
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-600 ">
                            Seleccioná un archivo PDF para adjuntar.
                          </span>
                        )}
                      </div>

                      <label className="inline-flex cursor-pointer items-center justify-center rounded-sm w-2/6 border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 active:scale-[0.99] transition">
                        {payFile ? "Cambiar archivo" : "Elegir archivo"}
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) =>
                            setPayFile(
                              e.target.files ? e.target.files[0] : null,
                            )
                          }
                        />
                      </label>
                    </div>
                    <div className="flex justify-start w-11/12">
                      {payFile && (
                        <button
                          type="button"
                          className="mt-3 text-xs font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-4"
                          onClick={() => setPayFile(null)}
                        >
                          Quitar archivo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Comprobantes previos */}
                {comprobantes.length > 0 && (
                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-900">
                        Comprobantes previos
                      </div>
                      <div className="text-xs text-slate-500">
                        {comprobantes.length} archivo(s)
                      </div>
                    </div>

                    <div className="max-h-40 overflow-auto rounded-xl border border-slate-200 bg-white">
                      <ul className="divide-y divide-slate-100">
                        {comprobantes.map((c) => (
                          <li key={c.idcomprobante} className="p-3">
                            <a
                              href={c.archivo_url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between gap-3 text-sm hover:bg-slate-50 rounded-lg px-2 py-2 transition"
                            >
                              <span className="truncate font-medium text-slate-800">
                                {c.archivo_nombre || c.archivo_url}
                              </span>
                              <span className="shrink-0 text-xs font-semibold text-blue-700">
                                Abrir
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex flex-col-reverse h-20 gap-2 border-t border-slate-100 p-5 sm:flex-row sm:justify-center items-center w-11/12">
                <button
                  className="flex-1 h-10 action-button disabled:opacity-50"
                  onClick={handleConfirmarPago}
                  disabled={payLoading}
                >
                  {payLoading ? "Procesando..." : "Confirmar pago"}
                </button>
                <button
                  className="flex-1 ghost-button h-10"
                  onClick={() => {
                    setShowPay(false);
                    setPayCuota(null);
                    setPayFile(null);
                    setComprobantes([]);
                    setPayError(null);
                  }}
                  disabled={payLoading}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
