import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { clientesApi, localidadesApi } from "../api/endpoints";

interface ClienteView {
  id: number;
  nombre: string;
  nroDocumento: string;
  telefono?: string;
  email?: string;
}

interface Localidad {
  id: number;
  nombre: string;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [localidades, setLocalidades] = useState<Localidad[]>([]);
  const [formData, setFormData] = useState({
    nombre: "",
    nroDocumento: "",
    direccion: "",
    telefono: "",
    email: "",
    localidadId: "",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  useEffect(() => {
    loadClientes();
    loadLocalidades();
  }, []);

  const loadLocalidades = async () => {
    try {
      const data = (await localidadesApi.getAll()) as any;
      setLocalidades(data || []);
    } catch (err) {
      console.error("Error cargando localidades:", err);
    }
  };

  const loadClientes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = (await clientesApi.getAll()) as any;
      const mapped = (response || []).map((c: any) => ({
        id: c.idcliente,
        nombre: c.appynom || "",
        nroDocumento: c.dni || "",
        telefono: c.telefono,
        email: c.email,
      }));
      setClientes(mapped);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error al cargar clientes";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.nombre || !formData.nroDocumento || !formData.localidadId) {
      setFormError("Nombre, documento y localidad son requeridos");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        appynom: formData.nombre,
        dni: formData.nroDocumento,
        direccion: formData.direccion,
        telefono: formData.telefono,
        email: formData.email,
        selectLocalidades: parseInt(formData.localidadId, 10),
      };

      if (editingId) {
        await clientesApi.update(editingId, payload as any);
      } else {
        await clientesApi.create(payload as any);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({
        nombre: "",
        nroDocumento: "",
        direccion: "",
        telefono: "",
        email: "",
        localidadId: "",
      });
      loadClientes();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Error al crear cliente";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (id: number) => {
    try {
      const data: any = await clientesApi.getById(id);
      if (!data) {
        setFormError("Cliente no encontrado");
        return;
      }
      setEditingId(id);
      setFormData({
        nombre: data.appynom || "",
        nroDocumento: data.dni || "",
        direccion: data.direccion || "",
        telefono: data.telefono || "",
        email: data.email || "",
        localidadId: String(data.relalocalidad || ""),
      });
      setShowModal(true);
    } catch (err) {
      setFormError("No se pudo cargar el cliente");
    }
  };

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.nroDocumento.includes(searchTerm),
  );

  const totalPages = Math.ceil(filteredClientes.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedClientes = filteredClientes.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleRowsPerPageChange = (value: string) => {
    setRowsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  return (
    <Layout>
      <div className=" mx-auto px-6 py-18 page-shell">
        <div className="panel pad mb-6 min-h-screen max-h-full">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Clientes</h1>
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  nombre: "",
                  nroDocumento: "",
                  direccion: "",
                  telefono: "",
                  email: "",
                  localidadId: "",
                });
                setShowModal(true);
              }}
              className="action-button"
            >
              Agregar Cliente
            </button>
          </div>

          {showModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-50 ">
              <div className="panel pad max-w-md w-full">
                <h2 className="text-2xl font-bold mb-4">
                  {editingId ? "Editar Cliente" : "Agregar Cliente"}
                </h2>
                {formError && (
                  <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                    {formError}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) =>
                        setFormData({ ...formData, nombre: e.target.value })
                      }
                      className="w-full input-sleek"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Documento *
                    </label>
                    <input
                      type="text"
                      value={formData.nroDocumento}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nroDocumento: e.target.value,
                        })
                      }
                      className="w-full input-sleek"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Localidad *
                    </label>
                    <select
                      value={formData.localidadId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          localidadId: e.target.value,
                        })
                      }
                      className="w-full input-sleek"
                      required
                    >
                      <option value="">Seleccionar localidad</option>
                      {localidades.map((loc: any) => (
                        <option key={loc.idlocalidad} value={loc.idlocalidad}>
                          {loc.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={formData.direccion}
                      onChange={(e) =>
                        setFormData({ ...formData, direccion: e.target.value })
                      }
                      className="w-full input-sleek"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      value={formData.telefono}
                      onChange={(e) =>
                        setFormData({ ...formData, telefono: e.target.value })
                      }
                      className="w-full input-sleek"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full input-sleek"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 action-button disabled:opacity-50"
                    >
                      {submitting ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 ghost-button"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          <input
            type="text"
            placeholder="Buscar por nombre o documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full input-sleek"
          />

          {loading && <div className="text-center py-8">Cargando...</div>}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div>
              <div className="table-shell">
                <table className="w-full">
                  <thead className="table-head">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Documento
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Teléfono
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Email
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedClientes.map((cliente) => (
                      <tr
                        key={cliente.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 text-sm">{cliente.nombre}</td>
                        <td className="px-6 py-4 text-sm">
                          {cliente.nroDocumento}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {cliente.telefono || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {cliente.email || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          <button
                            onClick={() => handleEdit(cliente.id)}
                            className="text-blue-600 hover:text-blue-800 mr-2"
                          >
                            Editar
                          </button>
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
                {filteredClientes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No hay clientes para mostrar
                  </div>
                )}
              </div>
              {filteredClientes.length > 0 && (
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
                    {filteredClientes.length} registros
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
