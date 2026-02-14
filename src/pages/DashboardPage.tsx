import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { EmptyState, ErrorState, LoadingState } from "../components/Status";
import { dashboardApi } from "../api/endpoints";

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
      });
    } catch (err) {
      console.error("Error:", err);
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
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <Layout>
      <div className="container h-screen justify-between flex flex-col m-6 py-10 page-shell">
        {/* Hero / Banner */}
        <div className="page-hero h-3/6 m-10  overflow-hidden">
          <img
            src="public\pic11.jpg"
            alt="logo"
            className="absolute  h-95 w-auto"
          />
        </div>

        {/* Estadísticas rápidas (mantener) */}
        {error && <ErrorState message={error} />}

        {!error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
              <div className="panel pad">
                <p className="text-gray-600 text-sm mb-2">Total Clientes</p>
                <p className="text-3xl font-bold text-blue-800">
                  {loading ? "-" : data.totalClientes}
                </p>
              </div>
              <div className="panel pad">
                <p className="text-gray-600 text-sm mb-2">Total Solicitudes</p>
                <p className="text-3xl font-bold text-blue-800">
                  {loading ? "-" : data.totalSolicitudes}
                </p>
              </div>
              <div className="panel pad">
                <p className="text-gray-600 text-sm mb-2">Total Cuotas</p>
                <p className="text-3xl font-bold text-blue-800">
                  {loading ? "-" : data.totalCuotas}
                </p>
              </div>
              <div className="panel pad">
                <p className="text-gray-600 text-sm mb-2">Cobradas Hoy</p>
                <p className="text-3xl font-bold text-green-700">
                  {loading ? "-" : data.cobradasHoy}
                </p>
              </div>
              <div className="panel pad">
                <p className="text-gray-600 text-sm mb-2">Vencidas Hoy</p>
                <p className="text-3xl font-bold text-red-700">
                  {loading ? "-" : data.vencidasHoy}
                </p>
              </div>
              <div className="panel pad">
                <p className="text-gray-600 text-sm mb-2">Vencidas +30d</p>
                <p className="text-3xl font-bold text-red-900">
                  {loading ? "-" : data.vencidas30}
                </p>
              </div>
              <div className="panel pad">
                <p className="text-gray-600 text-sm mb-2">Links Rápidos</p>
                <div className="flex flex-col gap-2 text-sm">
                  <Link
                    to="/clientes"
                    className="text-blue-600 hover:underline"
                  >
                    Ver Clientes
                  </Link>
                  <Link
                    to="/solicitudes"
                    className="text-blue-600 hover:underline"
                  >
                    Ver Solicitudes
                  </Link>
                </div>
              </div>
            </div>

            <div className="panel pad max-h-80">
              <h2 className="text-xl font-bold mb-4">Últimas Solicitudes</h2>
              {loading ? (
                <LoadingState />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          Nro
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          Cliente
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          Importe
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.solicitudesRecientes.map((solicitud) => (
                        <tr
                          key={solicitud.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 text-sm font-semibold">
                            {solicitud.nroSolicitud}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {solicitud.clienteNombre}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            $
                            {solicitud.importe.toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(solicitud.estado)}`}
                            >
                              {solicitud.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.solicitudesRecientes.length === 0 && (
                    <EmptyState message="No hay solicitudes" />
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
