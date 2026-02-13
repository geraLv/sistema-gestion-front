import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { EmptyState, ErrorState, LoadingState } from "../components/Status";
import {
  solicitudesApi,
  clientesApi,
  productosApi,
  vendedoresApi,
} from "../api/endpoints";

interface SolicitudView {
  id: number;
  nroSolicitud: string;
  clienteNombre: string;
  clienteDni: string;
  productoNombre: string;
  importe: number;
  cantidadCuotas: number;
  totalPagado: number;
  estado: string;
}

interface ClienteRaw {
  idcliente: number;
  appynom: string;
}

interface ProductoRaw {
  idproducto: number;
  descripcion: string;
  precio: number;
}

interface VendedorRaw {
  idvendedor: number;
  apellidonombre: string;
}

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [viewData, setViewData] = useState<any | null>(null);
  const [editData, setEditData] = useState<any | null>(null);
  const [clientes, setClientes] = useState<ClienteRaw[]>([]);
  const [productos, setProductos] = useState<ProductoRaw[]>([]);
  const [vendedores, setVendedores] = useState<VendedorRaw[]>([]);
  const [formData, setFormData] = useState({
    clienteId: "",
    vendedorId: "",
    productoId: "",
    cantidadCuotas: "",
    importe: "",
    totalapagar: "",
    observaciones: "",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  useEffect(() => {
    loadSolicitudes();
    loadClientes();
    loadProductos();
    loadVendedores();
  }, []);

  const loadClientes = async () => {
    try {
      const data = await clientesApi.getAll();
      const normalized = Array.isArray(data) ? data : (data as any)?.data || [];
      setClientes(normalized);
    } catch (err) {
      console.error("Error cargando clientes:", err);
    }
  };

  const loadProductos = async () => {
    try {
      const data = await productosApi.getAll();
      const normalized = Array.isArray(data) ? data : (data as any)?.data || [];
      setProductos(normalized);
    } catch (err) {
      console.error("Error cargando productos:", err);
    }
  };

  const loadVendedores = async () => {
    try {
      const data = await vendedoresApi.getAll();
      const normalized = Array.isArray(data) ? data : (data as any)?.data || [];
      setVendedores(normalized);
    } catch (err) {
      console.error("Error cargando vendedores:", err);
    }
  };

  const loadSolicitudes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = (await solicitudesApi.getAll()) as any;
      const mapped = (response || []).map((s: any) => {
        const producto =
          Array.isArray(s.producto) && s.producto.length > 0
            ? s.producto[0]
            : s.producto;
        return {
          id: s.idsolicitud,
          nroSolicitud: s.nrosolicitud,
          clienteNombre:
            s.cliente?.cliente_nombre || s.cliente?.appynom || "Desconocido",
          clienteDni: s.cliente?.dni || s.dni || "",
          productoNombre:
            producto?.descripcion ||
            s.producto_descripcion ||
            s.prdescripcion ||
            "",
          importe: s.monto || s.totalapagar || 0,
          cantidadCuotas: s.cantidadcuotas,
          totalPagado: s.totalabonado || s.total_pagado || 0,
          estado:
            s.estado === 0 ? "Impaga" : s.estado === 2 ? "Pagada" : "Pendiente",
        };
      });
      setSolicitudes(mapped);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error al cargar solicitudes";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (
      !formData.clienteId ||
      !formData.vendedorId ||
      !formData.productoId ||
      !formData.importe ||
      !formData.cantidadCuotas ||
      !formData.totalapagar
    ) {
      setFormError(
        "Cliente, vendedor, producto, importe, cuotas y total a pagar son requeridos",
      );
      return;
    }

    setSubmitting(true);
    try {
      await solicitudesApi.create({
        selectCliente: parseInt(formData.clienteId, 10),
        selectVendedor: parseInt(formData.vendedorId, 10),
        idproducto: parseInt(formData.productoId, 10),
        monto: parseFloat(formData.importe),
        selectCuotas: parseInt(formData.cantidadCuotas, 10),
        totalapagar: parseFloat(formData.totalapagar),
        observacion: formData.observaciones || "",
      } as any);
      setShowModal(false);
      setFormData({
        clienteId: "",
        vendedorId: "",
        productoId: "",
        cantidadCuotas: "",
        importe: "",
        totalapagar: "",
        observaciones: "",
      });
      loadSolicitudes();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Error al crear solicitud";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleView = async (id: number) => {
    try {
      const data: any = await solicitudesApi.getById(id);
      setViewData(data);
      setShowView(true);
    } catch (err) {
      setError("No se pudo cargar la solicitud");
    }
  };

  const handleEdit = async (id: number) => {
    try {
      const data: any = await solicitudesApi.getById(id);
      setEditData({
        id: data.idsolicitud,
        nroSolicitud: data.nrosolicitud,
        monto: data.monto || data.totalapagar || 0,
        cantidadCuotas: data.cantidadcuotas || 0,
        totalapagar: data.totalapagar || 0,
        observacion: data.observacion || "",
        estado: data.estado ?? 1,
        productoId: data.relaproducto || data.idproducto || "",
        clienteId: data.relacliente || "",
        vendedorId: data.relavendedor || "",
      });
      setShowEdit(true);
    } catch (err) {
      setError("No se pudo cargar la solicitud");
    }
  };

  const handleUpdate = async () => {
    if (!editData) return;
    setSubmitting(true);
    try {
      await solicitudesApi.update(editData.id, {
        selectCliente: editData.clienteId,
        selectVendedor: editData.vendedorId,
        idproducto: editData.productoId,
        monto: editData.monto,
        selectCuotas: editData.cantidadCuotas,
        nroSolicitud: editData.nroSolicitud,
        totalapagar: editData.totalapagar,
        observacion: editData.observacion,
        selectEstado: editData.estado,
      } as any);
      setShowEdit(false);
      setEditData(null);
      loadSolicitudes();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Error al actualizar solicitud";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSolicitudes = solicitudes.filter((solicitud) => {
    const nroStr = String(solicitud.nroSolicitud || "").toLowerCase();
    const clienteStr = (solicitud.clienteNombre || "").toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      nroStr.includes(searchLower) || clienteStr.includes(searchLower);
    const matchesStatus = !statusFilter || solicitud.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredSolicitudes.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedSolicitudes = filteredSolicitudes.slice(startIndex, endIndex);

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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 page-shell">
        {showView && viewData && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-50">
            <div className="panel pad max-w-2xl w-full">
              <h2 className="text-2xl font-bold mb-4">Detalle de Solicitud</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Nro Solicitud:</strong> {viewData.nrosolicitud}
                </div>
                <div>
                  <strong>Cliente:</strong>{" "}
                  {viewData.cliente?.appynom || viewData.appynom || "-"}
                </div>
                <div>
                  <strong>DNI:</strong>{" "}
                  {viewData.cliente?.dni || viewData.dni || "-"}
                </div>
                <div>
                  <strong>Producto:</strong>{" "}
                  {viewData.producto?.descripcion ||
                    viewData.producto_descripcion ||
                    viewData.prdescripcion ||
                    "-"}
                </div>
                <div>
                  <strong>Vendedor:</strong>{" "}
                  {viewData.vendedor?.apellidonombre ||
                    viewData.vendedor ||
                    "-"}
                </div>
                <div>
                  <strong>Monto:</strong> $
                  {viewData.monto || viewData.totalapagar}
                </div>
                <div>
                  <strong>Cuotas:</strong> {viewData.cantidadcuotas}
                </div>
                <div className="col-span-2">
                  <strong>Observaciones:</strong> {viewData.observacion || "-"}
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

        {showEdit && editData && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-50">
            <div className="panel pad max-w-md w-full">
              <h2 className="text-2xl font-bold mb-4">Editar Solicitud</h2>
              {formError && (
                <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                  {formError}
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Cliente
                  </label>
                  <select
                    className="w-full input-sleek"
                    value={editData.clienteId}
                    onChange={(e) =>
                      setEditData({ ...editData, clienteId: e.target.value })
                    }
                  >
                    <option value="">Seleccione el cliente</option>
                    {clientes.map((c) => (
                      <option key={c.idcliente} value={c.idcliente}>
                        {c.appynom || "Cliente"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Vendedor
                  </label>
                  <select
                    className="w-full input-sleek"
                    value={editData.vendedorId}
                    onChange={(e) =>
                      setEditData({ ...editData, vendedorId: e.target.value })
                    }
                  >
                    <option value="">Seleccione el vendedor</option>
                    {vendedores.map((v) => (
                      <option key={v.idvendedor} value={v.idvendedor}>
                        {v.apellidonombre || "Vendedor"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Producto
                  </label>
                  <select
                    className="w-full input-sleek"
                    value={editData.productoId}
                    onChange={(e) =>
                      setEditData({ ...editData, productoId: e.target.value })
                    }
                  >
                    <option value="">Seleccione el producto</option>
                    {productos
                      .filter((p) =>
                        ["Usado", "Moto", "0 Km"].includes(
                          String(p.descripcion || ""),
                        ),
                      )
                      .map((p) => (
                        <option key={p.idproducto} value={p.idproducto}>
                          {p.descripcion}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Cantidad de cuotas
                  </label>
                  <input
                    className="w-full input-sleek"
                    type="number"
                    placeholder="Cantidad Cuotas"
                    value={editData.cantidadCuotas}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        cantidadCuotas: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Monto de las cuotas
                  </label>
                  <input
                    className="w-full input-sleek"
                    type="number"
                    placeholder="Monto"
                    value={editData.monto}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        monto: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Número de solicitud
                  </label>
                  <input
                    className="w-full input-sleek"
                    placeholder="Nro Solicitud"
                    value={editData.nroSolicitud}
                    onChange={(e) =>
                      setEditData({ ...editData, nroSolicitud: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Monto total a pagar
                  </label>
                  <input
                    className="w-full input-sleek"
                    type="number"
                    placeholder="Total a pagar"
                    value={editData.totalapagar}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        totalapagar: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Estado actual
                  </label>
                  <select
                    className="w-full input-sleek"
                    value={editData.estado}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        estado: Number(e.target.value),
                      })
                    }
                  >
                    <option value={1}>Activa</option>
                    <option value={0}>Baja</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Nota
                  </label>
                  <textarea
                    className="w-full input-sleek"
                    rows={3}
                    placeholder="Observaciones"
                    value={editData.observacion}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        observacion: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  className="action-button flex-1"
                  onClick={handleUpdate}
                  disabled={submitting}
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

        <div className="panel pad mb-6 min-h-screen max-h-full">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Solicitudes</h1>
            <button
              onClick={() => setShowModal(true)}
              className="action-button"
            >
              Nueva Solicitud
            </button>
          </div>

          {showModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-50">
              <div className="panel pad max-w-md w-full">
                <h2 className="text-2xl font-bold mb-4">Nueva Solicitud</h2>
                {formError && (
                  <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                    {formError}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Cliente *
                    </label>
                    <select
                      value={formData.clienteId}
                      onChange={(e) =>
                        setFormData({ ...formData, clienteId: e.target.value })
                      }
                      className="w-full input-sleek"
                      required
                    >
                      <option value="">Seleccionar cliente</option>
                      {clientes.map((c) => (
                        <option key={c.idcliente} value={c.idcliente}>
                          {c.appynom || "Cliente"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Vendedor *
                    </label>
                    <select
                      value={formData.vendedorId}
                      onChange={(e) =>
                        setFormData({ ...formData, vendedorId: e.target.value })
                      }
                      className="w-full input-sleek"
                      required
                    >
                      <option value="">Seleccionar vendedor</option>
                      {vendedores.map((v) => (
                        <option key={v.idvendedor} value={v.idvendedor}>
                          {v.apellidonombre || "Vendedor"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Producto *
                    </label>
                    <select
                      value={formData.productoId}
                      onChange={(e) =>
                        setFormData({ ...formData, productoId: e.target.value })
                      }
                      className="w-full input-sleek"
                      required
                    >
                      <option value="">Seleccionar producto</option>
                      {productos
                        .filter((p) =>
                          ["Usado", "Moto", "0 Km"].includes(
                            String(p.descripcion || ""),
                          ),
                        )
                        .map((p) => (
                          <option key={p.idproducto} value={p.idproducto}>
                            {p.descripcion}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Cantidad de Cuotas *
                    </label>
                    <input
                      type="number"
                      value={formData.cantidadCuotas}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cantidadCuotas: e.target.value,
                        })
                      }
                      className="w-full input-sleek"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Monto de las cuotas *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.importe}
                      onChange={(e) =>
                        setFormData({ ...formData, importe: e.target.value })
                      }
                      className="w-full input-sleek"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Monto total a pagar *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.totalapagar}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalapagar: e.target.value,
                        })
                      }
                      className="w-full input-sleek"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Nota
                    </label>
                    <textarea
                      value={formData.observaciones}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          observaciones: e.target.value,
                        })
                      }
                      className="w-full input-sleek"
                      rows={3}
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
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Buscar por nro o cliente..."
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
            <div>
              <div className="table-shell">
                <table className="w-full">
                  <thead className="table-head">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Nro Solicitud
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        DNI
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Importe
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Cuotas
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Total Pagado
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedSolicitudes.map((solicitud) => (
                      <tr
                        key={solicitud.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 text-sm font-semibold">
                          {solicitud.nroSolicitud}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {solicitud.clienteNombre}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {solicitud.clienteDni || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {solicitud.productoNombre || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          $
                          {solicitud.importe.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {solicitud.cantidadCuotas}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          $
                          {solicitud.totalPagado.toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`chip ${getStatusColor(solicitud.estado)}`}
                          >
                            {solicitud.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          <button
                            onClick={() => handleView(solicitud.id)}
                            className="text-blue-600 hover:text-blue-800 mr-2"
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => handleEdit(solicitud.id)}
                            className="text-green-600 hover:text-green-800 mr-2"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredSolicitudes.length === 0 && (
                  <EmptyState message="No hay solicitudes para mostrar" />
                )}
              </div>
              {filteredSolicitudes.length > 0 && (
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
                    {filteredSolicitudes.length} registros
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
