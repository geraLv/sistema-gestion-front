import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { ErrorState, LoadingState } from "../components/Status";
import { dashboardApi } from "../api/endpoints";
import {
  Users,
  FileText,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Activity,
  ArrowUpRight,
  CheckCircle,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface SolicitudHoy {
  id: number;
  nroSolicitud: string;
  clienteNombre: string;
  clienteDni: string;
  productoDescripcion: string;
  vendedorNombre: string;
  monto: number;
  totalapagar: number;
  cantidadcuotas: number;
  estado: number;
  fechalta: string;
}

interface CuotaHoy {
  id: number;
  nrocuota: number;
  importe: number;
  fecha: string;
  nroSolicitud: string;
  clienteNombre: string;
}

interface DashboardData {
  totalClientes: number;
  totalSolicitudes: number;
  totalCuotas: number;
  cobradasHoy: number;
  vencidasHoy: number;
  vencidas30: number;
  montoCobradasHoy: number;
  solicitudesHoy: SolicitudHoy[];
  cuotasHoy: CuotaHoy[];
  charts?: {
    revenue: Array<{ month: string; total: number }>;
    efficiency: { expected: number; collected: number };
  };
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);

const estadoLabel: Record<number, { label: string; color: string }> = {
  0: { label: "Baja", color: "bg-red-100 text-red-700" },
  1: { label: "Activa", color: "bg-green-100 text-green-700" },
  2: { label: "Pagada", color: "bg-blue-100 text-blue-700" },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    totalClientes: 0,
    totalSolicitudes: 0,
    totalCuotas: 0,
    cobradasHoy: 0,
    vencidasHoy: 0,
    vencidas30: 0,
    montoCobradasHoy: 0,
    solicitudesHoy: [],
    cuotasHoy: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"solicitudes" | "cobros">("solicitudes");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const summary = await dashboardApi.getSummary();

      setData({
        totalClientes: summary?.totals?.clientes || 0,
        totalSolicitudes: summary?.totals?.solicitudes || 0,
        totalCuotas: summary?.totals?.cuotas || 0,
        cobradasHoy: summary?.kpis?.cobradasHoy || 0,
        vencidasHoy: summary?.kpis?.vencidasHoy || 0,
        vencidas30: summary?.kpis?.vencidas30 || 0,
        montoCobradasHoy: summary?.kpis?.montoCobradasHoy || 0,
        solicitudesHoy: summary?.solicitudesHoy || [],
        cuotasHoy: summary?.cuotasHoy || [],
        charts: summary?.charts,
      });
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    label,
    value,
    icon: Icon,
    colorClass,
    trend,
  }: {
    label: string;
    value: string | number;
    icon: any;
    colorClass: string;
    trend?: string;
  }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        {trend && <p className="text-xs text-green-600 mt-2 font-medium flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {trend}</p>}
      </div>
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto px-6 py-8 page-shell">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Resumen general del sistema</p>
        </div>

        {error && <ErrorState message={error} />}

        {!error && loading ? (
          <LoadingState />
        ) : (
          <div className="space-y-6">
            {/* Quick Stats Grid — 5 cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard
                label="Clientes Totales"
                value={data.totalClientes}
                icon={Users}
                colorClass="bg-blue-50 text-blue-600"
              />
              <StatCard
                label="Solicitudes"
                value={data.totalSolicitudes}
                icon={FileText}
                colorClass="bg-indigo-50 text-indigo-600"
              />
              <StatCard
                label="Cuotas Cobradas (Hoy)"
                value={data.cobradasHoy}
                icon={CheckCircle}
                colorClass="bg-green-50 text-green-600"
                trend="Actividad de hoy"
              />
              <StatCard
                label="Monto Cobrado (Hoy)"
                value={fmt(data.montoCobradasHoy)}
                icon={DollarSign}
                colorClass="bg-emerald-50 text-emerald-600"
                trend="Total recaudado hoy"
              />
              <StatCard
                label="Cuotas Vencidas (Hoy)"
                value={data.vencidasHoy}
                icon={AlertCircle}
                colorClass="bg-red-50 text-red-600"
              />
            </div>

            {/* Charts & Secondary Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Chart */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-500" />
                    Evolución de Ingresos
                  </h2>
                  <select className="text-sm border-slate-200 rounded-lg text-slate-500 bg-slate-50">
                    <option>Últimos 6 meses</option>
                  </select>
                </div>
                <div className="h-64">
                  {data.charts?.revenue ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.charts.revenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                          formatter={(value: number | undefined) => [`$${(value || 0).toLocaleString()}`, "Ingresos"] as [string, string]}
                        />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <Area type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">Sin datos de ingresos</div>
                  )}
                </div>
              </div>

              {/* Efficiency & Shortcut */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                  <h2 className="text-lg font-bold text-slate-800 mb-4">Eficiencia de Cobro (Mes)</h2>
                  {data.charts?.efficiency && (
                    <>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-500">Recaudado / Esperado</span>
                        <span className="font-bold text-slate-700">
                          {Math.round((data.charts.efficiency.collected / (data.charts.efficiency.expected || 1)) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden">
                        <div
                          className="bg-green-500 h-3 rounded-full"
                          style={{ width: `${Math.min(100, (data.charts.efficiency.collected / (data.charts.efficiency.expected || 1)) * 100)}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 bg-green-50 rounded-lg">
                          <div className="text-xs text-green-600 mb-1">Cobrado</div>
                          <div className="font-bold text-green-800 text-sm">{fmt(data.charts.efficiency.collected)}</div>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <div className="text-xs text-slate-500 mb-1">Esperado</div>
                          <div className="font-bold text-slate-700 text-sm">{fmt(data.charts.efficiency.expected)}</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                  <Link to="/solicitudes" className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg group transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 text-purple-600 p-2 rounded-lg">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-slate-700">Gestionar Solicitudes</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Actividad del Día — tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Header con tabs */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab("solicitudes")}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "solicitudes"
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    Solicitudes del Día
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${activeTab === "solicitudes" ? "bg-purple-100 text-purple-700" : "bg-slate-200 text-slate-500"
                      }`}>
                      {data.solicitudesHoy.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("cobros")}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "cobros"
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    Cobros del Día
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${activeTab === "cobros" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"
                      }`}>
                      {data.cuotasHoy.length}
                    </span>
                  </button>
                </div>
                <Link
                  to={activeTab === "solicitudes" ? "/solicitudes" : "/cuotas"}
                  className="text-sm text-purple-600 font-medium hover:underline"
                >
                  Ver todas
                </Link>
              </div>

              {/* Tab: Solicitudes del Día */}
              {activeTab === "solicitudes" && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nro</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Producto</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendedor</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Cuotas</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.solicitudesHoy.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-10 text-center text-slate-400 text-sm">
                            No se crearon solicitudes hoy
                          </td>
                        </tr>
                      ) : (
                        data.solicitudesHoy.map((s) => {
                          const est = estadoLabel[s.estado] ?? { label: "—", color: "bg-gray-100 text-gray-600" };
                          return (
                            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 text-sm font-medium text-slate-900">#{s.nroSolicitud}</td>
                              <td className="px-4 py-3 text-sm text-slate-700">
                                <div>{s.clienteNombre}</div>
                                {s.clienteDni && <div className="text-xs text-slate-400">DNI {s.clienteDni}</div>}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">{s.productoDescripcion || "—"}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{s.vendedorNombre || "—"}</td>
                              <td className="px-4 py-3 text-sm text-right text-slate-700 font-medium">{fmt(s.monto)}</td>
                              <td className="px-4 py-3 text-sm text-right text-slate-900 font-semibold">{fmt(s.totalapagar)}</td>
                              <td className="px-4 py-3 text-sm text-center text-slate-600">{s.cantidadcuotas}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${est.color}`}>
                                  {est.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {data.solicitudesHoy.length > 0 && (
                      <tfoot className="bg-slate-50/80 border-t border-slate-200">
                        <tr>
                          <td colSpan={4} className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Total del día</td>
                          <td className="px-4 py-2 text-right text-sm font-bold text-slate-700">
                            {fmt(data.solicitudesHoy.reduce((s, r) => s + r.monto, 0))}
                          </td>
                          <td className="px-4 py-2 text-right text-sm font-bold text-slate-900">
                            {fmt(data.solicitudesHoy.reduce((s, r) => s + r.totalapagar, 0))}
                          </td>
                          <td colSpan={2} />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}

              {/* Tab: Cobros del Día */}
              {activeTab === "cobros" && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Solicitud</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Cuota Nro</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Importe</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.cuotasHoy.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm">
                            No se registraron cobros hoy
                          </td>
                        </tr>
                      ) : (
                        data.cuotasHoy.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-slate-900">#{c.nroSolicitud}</td>
                            <td className="px-4 py-3 text-sm text-slate-700">{c.clienteNombre}</td>
                            <td className="px-4 py-3 text-sm text-center text-slate-600">{c.nrocuota}</td>
                            <td className="px-4 py-3 text-sm text-right font-semibold text-emerald-700">{fmt(c.importe)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {data.cuotasHoy.length > 0 && (
                      <tfoot className="bg-slate-50/80 border-t border-slate-200">
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Total cobrado hoy</td>
                          <td className="px-4 py-2 text-right text-sm font-bold text-emerald-700">
                            {fmt(data.montoCobradasHoy)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
