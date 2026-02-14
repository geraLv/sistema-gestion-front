import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { EmptyState, ErrorState, LoadingState } from "../components/Status";
import {
  solicitudesApi,
  clientesApi,
  productosApi,
  vendedoresApi,
  cuotasApi,
  reportesApi,
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
  const [clienteSearch, setClienteSearch] = useState("");
  const [vendedorSearch, setVendedorSearch] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [totalSolicitudes, setTotalSolicitudes] = useState(0);
  const [showPlan, setShowPlan] = useState(false);
  const [planSolicitud, setPlanSolicitud] = useState<SolicitudView | null>(
    null,
  );
  const [planCuotas, setPlanCuotas] = useState<any[]>([]);
  const [planResumen, setPlanResumen] = useState<any | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [planReciboLoading, setPlanReciboLoading] = useState(false);

  useEffect(() => {
    loadClientes();
    loadProductos();
    loadVendedores();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setCurrentPage(1);
      loadSolicitudes(1, searchTerm);
    }, 350);

    return () => clearTimeout(handler);
  }, [searchTerm, statusFilter]);

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

  const buildSolicitudesFiltro = (value: string) => {
    switch (value) {
      case "Pagada":
        return "pagadas";
      case "Impaga":
        return "impagas";
      case "Pendiente":
        return "pendientes";
      default:
        return undefined;
    }
  };

  const formatDate = (date?: string | Date | null) => {
    if (!date) return "-";
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("es-AR");
  };

  const loadSolicitudes = async (
    page = currentPage,
    query = searchTerm,
    pageSize = rowsPerPage,
  ) => {
    try {
      setLoading(true);
      setError(null);
      const q = (query ?? searchTerm).trim() || undefined;
      const filtro = buildSolicitudesFiltro(statusFilter);
      const response = await solicitudesApi.getPaged({
        filtro,
        q,
        page,
        pageSize,
      });
      const mapped = (response.items || []).map((s: any) => {
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
      setTotalSolicitudes(response.total || 0);
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
      setClienteSearch("");
      setVendedorSearch("");
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

  const openBlob = (blob: Blob, filename: string, inline = true) => {
    const url = URL.createObjectURL(blob);
    if (inline) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handlePlan = async (solicitud: SolicitudView) => {
    try {
      setPlanError(null);
      setPlanLoading(true);
      setPlanSolicitud(solicitud);
      setPlanCuotas([]);
      setPlanResumen(null);
      setShowPlan(true);
      const data = await cuotasApi.getForSolicitud(solicitud.id);
      setPlanCuotas(data?.cuotas || []);
      setPlanResumen(data?.resumen || null);
    } catch (err) {
      setPlanError("No se pudo cargar el plan de pagos.");
    } finally {
      setPlanLoading(false);
    }
  };

  const handleDescargarReciboCuota = async (idcuota: number) => {
    setPlanReciboLoading(true);
    try {
      const blob = await reportesApi.reciboCuota(idcuota);
      openBlob(blob, `recibo-cuota-${idcuota}.pdf`, true);
    } catch (err) {
      setPlanError("No se pudo generar el recibo.");
    } finally {
      setPlanReciboLoading(false);
    }
  };

  const handleDescargarRecibosSolicitud = async () => {
    if (!planSolicitud) return;
    setPlanReciboLoading(true);
    try {
      const blob = await reportesApi.recibosSolicitudPagados(
        planSolicitud.id,
      );
      openBlob(
        blob,
        `recibos-solicitud-${planSolicitud.nroSolicitud}.pdf`,
        true,
      );
    } catch (err) {
      setPlanError("No se pudo generar el PDF de recibos.");
    } finally {
      setPlanReciboLoading(false);
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

  const totalPages = Math.ceil(
    Math.max(totalSolicitudes, solicitudes.length) / rowsPerPage,
  );

  const handlePageChange = (page: number) => {
    const nextPage = Math.max(1, Math.min(page, totalPages || 1));
    setCurrentPage(nextPage);
    loadSolicitudes(nextPage);
  };

  const handleRowsPerPageChange = (value: string) => {
    const next = parseInt(value);
    setRowsPerPage(next);
    setCurrentPage(1);
    loadSolicitudes(1, searchTerm, next);
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
                    {productos.map((p) => (
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

        {showPlan && planSolicitud && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-50">
            <div className="panel pad max-w-4xl w-full">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Plan de pagos</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Solicitud {planSolicitud.nroSolicitud} •{" "}
                    {planSolicitud.clienteNombre} • DNI{" "}
                    {planSolicitud.clienteDni || "-"} •{" "}
                    {planSolicitud.productoNombre || "-"}
                  </p>
                </div>
                <button
                  className="ghost-button"
                  onClick={() => {
                    setShowPlan(false);
                    setPlanCuotas([]);
                    setPlanResumen(null);
                    setPlanSolicitud(null);
                    setPlanError(null);
                  }}
                >
                  Cerrar
                </button>
              </div>

              {planLoading && <LoadingState />}
              {planError && <ErrorState message={planError} />}

              {!planLoading && !planError && (
                <>
                  {planResumen && (
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4 text-sm">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">Total</div>
                        <div className="font-semibold">
                          {planResumen.total ?? 0}
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">Pagadas</div>
                        <div className="font-semibold">
                          {planResumen.pagadas ?? 0}
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">Impagas</div>
                        <div className="font-semibold">
                          {planResumen.impagas ?? 0}
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">Monto total</div>
                        <div className="font-semibold">
                          $
                          {Number(planResumen.montoTotal || 0).toLocaleString(
                            "es-AR",
                            {
                              minimumFractionDigits: 2,
                            },
                          )}
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">
                          Monto pagado
                        </div>
                        <div className="font-semibold">
                          $
                          {Number(planResumen.montoPagado || 0).toLocaleString(
                            "es-AR",
                            {
                              minimumFractionDigits: 2,
                            },
                          )}
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">
                          Monto impago
                        </div>
                        <div className="font-semibold">
                          $
                          {Number(planResumen.montoImpago || 0).toLocaleString(
                            "es-AR",
                            {
                              minimumFractionDigits: 2,
                            },
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-slate-600">
                      {planCuotas.length} cuota(s)
                    </div>
                    <button
                      className="ghost-button"
                      onClick={handleDescargarRecibosSolicitud}
                      disabled={
                        planReciboLoading ||
                        !planCuotas.some((c) => Number(c.estado) === 2)
                      }
                    >
                      {planReciboLoading
                        ? "Generando..."
                        : "Descargar recibos pagados"}
                    </button>
                  </div>

                  <div className="table-shell">
                    <table className="w-full">
                      <thead className="table-head">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">
                            Cuota
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">
                            Importe
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">
                            Vencimiento
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">
                            Estado
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">
                            Fecha pago
                          </th>
                          <th className="px-4 py-3 text-center text-sm font-semibold">
                            Recibo
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {planCuotas.map((c) => (
                          <tr key={c.idcuota} className="border-b">
                            <td className="px-4 py-3 text-sm font-semibold">
                              {c.nrocuota}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              $
                              {Number(c.importe || 0).toLocaleString("es-AR", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {formatDate(c.vencimiento)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span
                                className={`chip ${
                                  Number(c.estado) === 2
                                    ? "bg-green-100 text-green-800"
                                    : Number(c.estado) === 0
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {Number(c.estado) === 2
                                  ? "Pagada"
                                  : Number(c.estado) === 0
                                    ? "Impaga"
                                    : "Pendiente"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {Number(c.estado) === 2
                                ? formatDate(c.fecha)
                                : "-"}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              {Number(c.estado) === 2 ? (
                                <button
                                  className="text-blue-600 hover:text-blue-800"
                                  onClick={() =>
                                    handleDescargarReciboCuota(c.idcuota)
                                  }
                                  disabled={planReciboLoading}
                                >
                                  Recibo PDF
                                </button>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {planCuotas.length === 0 && (
                      <EmptyState message="No hay cuotas para mostrar" />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="panel pad mb-6 min-h-screen max-h-full">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Solicitudes</h1>
            <button
              onClick={() => {
                setClienteSearch("");
                setVendedorSearch("");
                setShowModal(true);
              }}
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
                    <input
                      type="text"
                      placeholder="Filtrar cliente por nombre..."
                      value={clienteSearch}
                      onChange={(e) => setClienteSearch(e.target.value)}
                      className="w-full input-sleek mb-2"
                    />
                    <select
                      value={formData.clienteId}
                      onChange={(e) =>
                        setFormData({ ...formData, clienteId: e.target.value })
                      }
                      className="w-full input-sleek"
                      required
                    >
                      <option value="">Seleccionar cliente</option>
                      {clientes
                        .filter((c) =>
                          (c.appynom || "")
                            .toLowerCase()
                            .includes(clienteSearch.toLowerCase()),
                        )
                        .map((c) => (
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
                    <input
                      type="text"
                      placeholder="Filtrar vendedor por nombre..."
                      value={vendedorSearch}
                      onChange={(e) => setVendedorSearch(e.target.value)}
                      className="w-full input-sleek mb-2"
                    />
                    <select
                      value={formData.vendedorId}
                      onChange={(e) =>
                        setFormData({ ...formData, vendedorId: e.target.value })
                      }
                      className="w-full input-sleek"
                      required
                    >
                      <option value="">Seleccionar vendedor</option>
                      {vendedores
                        .filter((v) =>
                          (v.apellidonombre || "")
                            .toLowerCase()
                            .includes(vendedorSearch.toLowerCase()),
                        )
                        .map((v) => (
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
                      {productos.map((p) => (
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
                      onClick={() => {
                        setShowModal(false);
                        setClienteSearch("");
                        setVendedorSearch("");
                      }}
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
              placeholder="Buscar por cliente, DNI o solicitud..."
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
                    {solicitudes.map((solicitud) => (
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
                            onClick={() => handlePlan(solicitud)}
                            className="text-slate-600 hover:text-slate-800 mr-2"
                          >
                            Plan de pagos
                          </button>
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
                          <Link
                            to={`/admin?tab=audit&entity=solicitud&entity_id=${solicitud.id}`}
                            className="text-slate-600 hover:text-slate-800"
                          >
                            Ver historial
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {solicitudes.length === 0 && (
                  <EmptyState message="No hay solicitudes para mostrar" />
                )}
              </div>
              {Math.max(totalSolicitudes, solicitudes.length) > 0 && (
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
                    {Math.max(totalSolicitudes, solicitudes.length)} registros
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
