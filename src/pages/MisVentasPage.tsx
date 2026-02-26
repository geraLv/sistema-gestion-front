import { useEffect, useState } from "react";
import { solicitudesApi } from "../api/endpoints";
import useAuthStore from "../stores/authStore";
import Layout from "../components/Layout";
import { SolicitudForm } from "../components/solicitudes/SolicitudForm";

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
                                        <th className="px-4 py-3 text-left">Fecha</th>
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
                                                <td className="px-4 py-3 text-gray-500 text-xs">
                                                    {v.fechalta ? new Date(v.fechalta).toLocaleDateString("es-AR") : "—"}
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
                                onSuccess={() => {
                                    setShowForm(false);
                                    setPage(1);
                                    fetchVentas();
                                }}
                                onCancel={() => setShowForm(false)}
                            />
                        </div>
                    </div>
                </div>
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
