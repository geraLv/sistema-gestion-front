import { useEffect, useState } from "react";
import { solicitudesApi } from "../api/endpoints";
import useAuthStore from "../stores/authStore";
import Layout from "../components/Layout";
import { SolicitudForm } from "../components/solicitudes/SolicitudForm";
import { ContratoPreviewModal } from "../components/solicitudes/ContratoPreviewModal";
import { contratosApi } from "../api/endpoints";
import { Modal } from "../components/ui/Modal";

interface Venta {
    idsolicitud: number;
    nrosolicitud: string;
    cliente?: { appynom?: string };
    producto?: { descripcion?: string };
    monto: number;
    totalapagar: number;
    totalabonado: number;
    porcentajepagado: number;
    estado: number;
    fechalta?: string;
    contratos?: any[];
}

const estadoLabel: Record<number, { label: string; color: string }> = {
    0: { label: "Baja", color: "bg-red-100 text-red-700" },
    1: { label: "Activa", color: "bg-green-100 text-green-700" },
    2: { label: "Pagada", color: "bg-blue-100 text-blue-700" },
};

export default function MisVentasPage() {
    const { usuario } = useAuthStore();
    const [ventas, setVentas] = useState<Venta[]>([]);
    const [total, setTotal] = useState(0);
    const [kpis, setKpis] = useState<{ totalImporte: number; activas: number; pagadas: number; bajas: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [showForm, setShowForm] = useState(false);

    // Contract generation states
    const [selectedSolicitud, setSelectedSolicitud] = useState<any>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [contratoLoading, setContratoLoading] = useState(false);
    const [contratoLink, setContratoLink] = useState<string | null>(null);

    const pageSize = 15;

    const fetchVentas = async () => {
        setLoading(true);
        try {
            const result = await solicitudesApi.getMisVentas({ page, pageSize });
            setVentas(result.items as Venta[]);
            setTotal(result.total);
            if (result.kpis) {
                setKpis(result.kpis);
            }
        } catch (err) {
            console.error("Error al cargar mis ventas:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVentas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const handleGenerarContrato = async (datosContrato: any) => {
        if (!selectedSolicitud) return;
        setContratoLoading(true);

        try {
            const res: any = await contratosApi.generar(selectedSolicitud.idsolicitud || selectedSolicitud.id, datosContrato);
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

    // KPIs derivados
    const totalImporte = kpis ? kpis.totalImporte : ventas.reduce((s, v) => s + (v.totalapagar ?? 0), 0);
    const activas = kpis ? kpis.activas : ventas.filter((v) => v.estado === 1).length;
    const pagadas = kpis ? kpis.pagadas : ventas.filter((v) => v.estado === 2).length;

    const totalPages = Math.ceil(total / pageSize);

    const fmt = (n: number) =>
        new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0,
        }).format(n);

    return (
        <Layout>
            <div className="p-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Mis Ventas</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Bienvenido/a, <span className="font-medium">{usuario?.nombre}</span>
                        </p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nueva Solicitud
                    </button>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <KpiCard label="Total solicitudes" value={String(total)} />
                    <KpiCard label="Monto total" value={fmt(totalImporte)} small />
                    <KpiCard label="Activas" value={String(activas)} color="text-green-700" />
                    <KpiCard label="Pagadas" value={String(pagadas)} color="text-blue-700" />
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : ventas.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <svg className="mx-auto w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm">No tenés solicitudes registradas todavía.</p>
                        <button
                            onClick={() => setShowForm(true)}
                            className="mt-4 text-green-600 hover:underline text-sm font-medium"
                        >
                            Crear primera solicitud
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-[11px] tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Nro</th>
                                        <th className="px-4 py-3 text-left">Cliente</th>
                                        <th className="px-4 py-3 text-left">Producto</th>
                                        <th className="px-4 py-3 text-right">Monto</th>
                                        <th className="px-4 py-3 text-right">Total a pagar</th>
                                        <th className="px-4 py-3 text-center">% Pagado</th>
                                        <th className="px-4 py-3 text-center">Estado</th>
                                        <th className="px-4 py-3 text-center">Contrato</th>
                                        <th className="px-4 py-3 text-left">Fecha</th>
                                        <th className="px-4 py-3 text-center">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {ventas.map((v) => {
                                        const est = estadoLabel[v.estado] ?? { label: "—", color: "bg-gray-100 text-gray-600" };
                                        return (
                                            <tr key={v.idsolicitud} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-gray-900">{v.nrosolicitud}</td>
                                                <td className="px-4 py-3 text-gray-700">{v.cliente?.appynom ?? "—"}</td>
                                                <td className="px-4 py-3 text-gray-600">{v.producto?.descripcion ?? "—"}</td>
                                                <td className="px-4 py-3 text-right text-gray-700">{fmt(v.monto)}</td>
                                                <td className="px-4 py-3 text-right text-gray-700">{fmt(v.totalapagar)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-green-500 rounded-full"
                                                                style={{ width: `${Math.min(v.porcentajepagado, 100)}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-gray-500">{v.porcentajepagado?.toFixed(0)}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${est.color}`}>
                                                        {est.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {v.contratos && v.contratos.length > 0 ? (
                                                        v.contratos[0].estado === 2 && v.contratos[0].url_pdf_firmado ? (
                                                            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700">
                                                                Firmado
                                                            </span>
                                                        ) : (
                                                            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700" title="Pendiente de firma por el cliente">
                                                                Pte. Firma
                                                            </span>
                                                        )
                                                    ) : (
                                                        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600" title="Aún no se ha generado el contrato digital">
                                                            Sin Generar
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 text-xs">
                                                    {v.fechalta ? new Date(v.fechalta).toLocaleDateString("es-AR") : "—"}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {v.contratos && v.contratos.length > 0 && v.contratos[0].estado === 2 && v.contratos[0].url_pdf_firmado ? (
                                                        <a
                                                            href={v.contratos[0].url_pdf_firmado}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center justify-center p-1.5 text-emerald-600 bg-emerald-50 rounded hover:bg-emerald-100 hover:text-emerald-800 transition-colors"
                                                            title="Descargar Contrato Firmado"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download">
                                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                                <polyline points="7 10 12 15 17 10" />
                                                                <line x1="12" x2="12" y1="15" y2="3" />
                                                            </svg>
                                                        </a>
                                                    ) : (
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    const detailedData = await solicitudesApi.getById(v.idsolicitud);
                                                                    setSelectedSolicitud(detailedData);
                                                                    setShowPreview(true);
                                                                } catch (e) {
                                                                    console.error("Error fetching detail for contract preview", e);
                                                                }
                                                            }}
                                                            className="inline-flex items-center justify-center p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 hover:text-blue-800 transition-colors"
                                                            title="Crear/Ver Contrato"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" /></svg>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-6">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                                >
                                    ← Anterior
                                </button>
                                <span className="text-sm text-gray-600">
                                    Página {page} de {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                                >
                                    Siguiente →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal de nueva solicitud */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Nueva Solicitud</h2>
                            <button
                                onClick={() => setShowForm(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6">
                            <SolicitudForm
                                onSuccess={async (data, action) => {
                                    setShowForm(false);
                                    setPage(1);
                                    fetchVentas();

                                    if (action === 'save_and_contract' && data) {
                                        const solId = data.idsolicitud || data.id;
                                        if (solId) {
                                            try {
                                                const detailedData = await solicitudesApi.getById(solId);
                                                setSelectedSolicitud(detailedData);
                                                setShowPreview(true);
                                            } catch (e) {
                                                console.error("Error fetching detail for contract preview", e);
                                            }
                                        }
                                    }
                                }}
                                onCancel={() => setShowForm(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Contract Preview */}
            {showPreview && selectedSolicitud && (
                <ContratoPreviewModal
                    isOpen={showPreview}
                    onClose={() => setShowPreview(false)}
                    solicitudData={selectedSolicitud}
                    onGenerate={handleGenerarContrato}
                    isLoading={contratoLoading}
                />
            )}

            {/* Modal para mostrar link del contrato generado */}
            {contratoLink && (
                <Modal
                    isOpen={true}
                    onClose={() => setContratoLink(null)}
                    title="Contrato Generado"
                    className="max-w-md"
                >
                    <div className="p-6">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-4">
                            <p className="text-sm text-green-800 font-medium mb-2">Contrato Pendiente de Firma. Link para el cliente:</p>
                            <input
                                type="text"
                                readOnly
                                value={contratoLink}
                                className="w-full p-2 text-sm border rounded mb-3 bg-white"
                            />
                            <div className="flex gap-2">
                                <button
                                    className="action-button flex-1"
                                    onClick={() => { navigator.clipboard.writeText(contratoLink); alert("Link copiado!"); }}
                                >
                                    Copiar Link
                                </button>
                                <a
                                    href={contratoLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="secondary-button flex-1 text-center"
                                >
                                    Abrir Modalidad
                                </a>
                            </div>
                        </div>
                        <div className="flex justify-end mt-4">
                            <button className="ghost-button" onClick={() => setContratoLink(null)}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </Layout>
    );
}

function KpiCard({
    label,
    value,
    small,
    color = "text-gray-900",
}: {
    label: string;
    value: string;
    small?: boolean;
    color?: string;
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">{label}</p>
            <p className={`font-semibold ${color} ${small ? "text-lg" : "text-2xl"}`}>{value}</p>
        </div>
    );
}
