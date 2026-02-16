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

interface DashboardData {
  totalClientes: number;
  totalSolicitudes: number;
  totalCuotas: number;
  cobradasHoy: number;
  vencidasHoy: number;
  vencidas30: number;
  solicitudesRecientes: Array<{
    id: number;
    nroSolicitud: string;
    clienteNombre: string;
    importe: number;
    estado: string;
  }>;
  charts?: {
    revenue: Array<{ month: string; total: number }>;
    efficiency: { expected: number; collected: number };
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    totalClientes: 0,
    totalSolicitudes: 0,
    totalCuotas: 0,
    cobradasHoy: 0,
    vencidasHoy: 0,
    vencidas30: 0,
    solicitudesRecientes: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        solicitudesRecientes: (summary?.recientes || []).map((s: any) => ({
          id: s.id,
          nroSolicitud: s.nroSolicitud,
          clienteNombre: s.clienteNombre || "Desconocido",
          importe: s.importe || 0,
          estado:
            s.estado === 0 ? "Impaga" : s.estado === 2 ? "Pagada" : "Pendiente",
        })),
        charts: summary?.charts,
      });
    } catch (err) {
      console.error("Error:", err);
      // setError("No se pudo cargar el dashboard. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pagada":
        return "bg-green-100 text-green-800";
      case "Impaga":
        return "bg-red-100 text-red-800";
      default:
        return "bg-amber-100 text-amber-800";
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
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                icon={DollarSign}
                colorClass="bg-green-50 text-green-600"
                trend="Actividad de hoy"
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
                  {/* Fallback if no chart data yet */}
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
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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

              {/* Efficiency & Lists */}
              <div className="space-y-6">
                {/* Collection Efficiency */}
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
                        ></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 bg-green-50 rounded-lg">
                          <div className="text-xs text-green-600 mb-1">Cobrado</div>
                          <div className="font-bold text-green-800">${data.charts.efficiency.collected.toLocaleString()}</div>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <div className="text-xs text-slate-500 mb-1">Esperado</div>
                          <div className="font-bold text-slate-700">${data.charts.efficiency.expected.toLocaleString()}</div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Shortcuts */}
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

            {/* Recent Solicitudes Styles Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800">Últimas Solicitudes</h2>
                <Link to="/solicitudes" className="text-sm text-purple-600 font-medium hover:underline">Ver todas</Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nro</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Importe</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.solicitudesRecientes.map((solicitud) => (
                      <tr key={solicitud.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          #{solicitud.nroSolicitud}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {solicitud.clienteNombre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          ${solicitud.importe.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(solicitud.estado).replace("bg-", "border-").replace("text-", "text-")} ${getStatusColor(solicitud.estado)}`}>
                            {solicitud.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.solicitudesRecientes.length === 0 && (
                  <div className="p-8 text-center text-slate-500">No hay actividad reciente</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
