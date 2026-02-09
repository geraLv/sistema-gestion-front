import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { cuotasApi } from "../api/endpoints";

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
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [viewCuota, setViewCuota] = useState<any | null>(null);
  const [editCuota, setEditCuota] = useState<any | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
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
        nroSolicitud: c.relasolicitud || "",
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
    return matchesStatus;
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
      setShowView(true);
    } catch (err) {
      setError("No se pudo cargar la cuota");
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
      await cuotasApi.pagar(id);
      loadCuotas();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error al pagar cuota";
      alert(errorMsg);
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

          {loading && <div className="text-center py-8">Cargando...</div>}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

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
                  <div className="text-center py-8 text-gray-500">
                    No hay cuotas para mostrar
                  </div>
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
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Página</span>
                      <input
                        type="number"
                        value={currentPage}
                        onChange={(e) =>
                          handlePageChange(parseInt(e.target.value))
                        }
                        min="1"
                        max={totalPages}
                        className="w-12 input-sleek text-sm text-center"
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-50">
            <div className="panel pad max-w-2xl w-full">
              <h2 className="text-2xl font-bold mb-4">Detalle de Cuota</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Solicitud:</strong> {viewCuota.nrosolicitud}
                </div>
                <div>
                  <strong>Nro Cuota:</strong> {viewCuota.nrocuota}
                </div>
                <div>
                  <strong>Importe:</strong> ${viewCuota.importe}
                </div>
                <div>
                  <strong>Vencimiento:</strong>{" "}
                  {viewCuota.vencimiento
                    ? formatDate(viewCuota.vencimiento)
                    : "-"}
                </div>
                <div>
                  <strong>Estado:</strong>{" "}
                  {viewCuota.estado === 0
                    ? "Impaga"
                    : viewCuota.estado === 2
                      ? "Pagada"
                      : "Pendiente"}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  className="ghost-button flex-1"
                  onClick={() => setShowView(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {showEdit && editCuota && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-50">
            <div className="panel pad max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Editar Cuota</h2>
              {editError && (
                <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                  {editError}
                </div>
              )}
              <div className="space-y-3">
                <div className="text-sm">
                  <strong>Solicitud:</strong> {editCuota.nroSolicitud}
                </div>
                <div className="text-sm">
                  <strong>Nro Cuota:</strong> {editCuota.nroCuota}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Importe
                  </label>
                  <input
                    className="w-full input-sleek"
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
              <div className="flex gap-2 mt-4">
                <button
                  className="action-button flex-1"
                  onClick={handleGuardarImporte}
                >
                  Guardar
                </button>
                <button
                  className="ghost-button flex-1"
                  onClick={() => setShowEdit(false)}
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
