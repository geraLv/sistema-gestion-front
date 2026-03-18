import { useEffect, useState } from "react";
import { cuotasApi } from "../api/endpoints";
import useAuthStore from "../stores/authStore";
import Layout from "../components/Layout";

interface RegistroCobro {
    idcuota: number;
    nrocuota: number;
    importe: number;
    fecha: string;
    formapago: string;
    nroSolicitud: string;
    idsolicitud: number;
    clienteNombre: string;
    clienteDni: string;
}

const formapagoLabel: Record<string, string> = {
    "efectivo": "Efectivo",
    "transferencia": "Transferencia",
    "tarjeta": "Tarjeta",
    "cheque": "Cheque",
    "mercadopago": "Mercado Pago"
};

export default function MisRegistrosPage() {
    const { usuario } = useAuthStore();
    const [registros, setRegistros] = useState<RegistroCobro[]>([]);
    const [total, setTotal] = useState(0);
    const [globalRecaudado, setGlobalRecaudado] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [mesFilter, setMesFilter] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");

    const pageSize = 15;

    const fetchRegistros = async () => {
        setLoading(true);
        try {
            const result = await cuotasApi.getMisRegistros({ page, pageSize, mes: mesFilter, q: appliedSearch });
            setRegistros(result.items as RegistroCobro[]);
            setTotal(result.total);
            setGlobalRecaudado(result.totalRecaudado || 0);
        } catch (err) {
            console.error("Error al cargar mis registros:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegistros();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, mesFilter, appliedSearch]);

    const totalPages = Math.ceil(total / pageSize);

    const fmt = (n: number) =>
        new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0,
        }).format(n);

    // KPI: total recaudado en todos mis registros (de la página actual, o podríamos pedirlo global al form)
    // currently we only sum the visible ones unless we create a KPI endpoint, but for now we'll sum page or leave total
    const recaudadoPagina = registros.reduce((s, v) => s + (v.importe || 0), 0);

    return (
        <Layout>
            <div className="p-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Mis Registros de Cobranza</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Pagos registrados correspondientes a tus ventas, <span className="font-medium">{usuario?.nombre}</span>
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar por cliente, DNI o solicitud..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        setAppliedSearch(searchQuery);
                                        setPage(1);
                                    }
                                }}
                                className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 w-full sm:w-64"
                            />
                            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <label htmlFor="mesFiltroRegistros" className="text-sm font-medium text-slate-700 whitespace-nowrap sr-only sm:not-sr-only">
                            Mes:
                        </label>
                        <input
                            type="month"
                            id="mesFiltroRegistros"
                            value={mesFilter}
                            onChange={(e) => {
                                setMesFilter(e.target.value);
                                setPage(1);
                            }}
                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        {(mesFilter || appliedSearch) && (
                            <button
                                onClick={() => {
                                    setMesFilter("");
                                    setSearchQuery("");
                                    setAppliedSearch("");
                                    setPage(1);
                                }}
                                className="text-sm text-emerald-600 hover:text-emerald-800 font-medium whitespace-nowrap"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
                    <KpiCard label={`Total cobros ${mesFilter ? "(Mes)" : "(Histórico)"}`} value={String(total)} />
                    <KpiCard label="Recaudado (Total Filtro)" value={fmt(globalRecaudado)} color="text-emerald-700" small />
                    <KpiCard label="Recaudado (esta pág.)" value={fmt(recaudadoPagina)} color="text-slate-600" small />
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : registros.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <svg className="mx-auto w-12 h-12 mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm">No tenés registros de cobranza todavía.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
                            <table className="min-w-full text-sm">
                                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Cobro ID</th>
                                        <th className="px-4 py-3 text-left">Solicitud</th>
                                        <th className="px-4 py-3 text-left">Cliente</th>
                                        <th className="px-4 py-3 text-center">Cuota Nro</th>
                                        <th className="px-4 py-3 text-right">Importe Cobrado</th>
                                        <th className="px-4 py-3 text-center">F. de Pago</th>
                                        <th className="px-4 py-3 text-center">Fecha Pago</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {registros.map((r) => {
                                        return (
                                            <tr key={r.idcuota} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-slate-500">#{r.idcuota}</td>
                                                <td className="px-4 py-3 text-slate-900 font-medium">{r.nroSolicitud}</td>
                                                <td className="px-4 py-3 text-slate-700">
                                                    <div>{r.clienteNombre || "—"}</div>
                                                    {r.clienteDni && <div className="text-[11px] text-slate-400">DNI: {r.clienteDni}</div>}
                                                </td>
                                                <td className="px-4 py-3 text-center text-slate-600">{r.nrocuota}</td>
                                                <td className="px-4 py-3 text-right font-semibold text-emerald-700">{fmt(r.importe)}</td>
                                                <td className="px-4 py-3 text-center text-slate-600 capitalize">
                                                    {formapagoLabel[r.formapago?.toLowerCase()] || r.formapago || "—"}
                                                </td>
                                                <td className="px-4 py-3 text-center text-slate-500 text-xs">
                                                    {r.fecha ? new Date(r.fecha).toLocaleDateString("es-AR") : "—"}
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
                                    className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
                                >
                                    ← Anterior
                                </button>
                                <span className="text-sm text-slate-600">
                                    Página {page} de {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
                                >
                                    Siguiente →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
}

function KpiCard({
    label,
    value,
    small,
    color = "text-slate-900",
}: {
    label: string;
    value: string;
    small?: boolean;
    color?: string;
}) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 mb-1">{label}</p>
            <p className={`font-semibold ${color} ${small ? "text-lg" : "text-2xl"}`}>{value}</p>
        </div>
    );
}
