import { useState } from "react";
import Layout from "../components/Layout";
import { reportesApi, solicitudesApi } from "../api/endpoints";
import { ErrorState, LoadingState } from "../components/Status";
import "./MonitorPage.css";

type MonitorData = {
  idsolicitud?: number;
  nrosolicitud?: string;
  cliente?: string;
  dni?: string;
  telefono?: string;
  direccion?: string;
  localidad?: string;
  fechaAlta?: string;
  producto?: string;
  vendedor?: string;
  montoCuota?: number;
  totalPagar?: number;
  cuotas?: number;
  pagadas?: number;
  totalPagado?: number;
  observaciones?: string;
};

export default function MonitorPage() {
  const [nroSolicitud, setNroSolicitud] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MonitorData | null>(null);

  const handleBuscar = async () => {
    if (!nroSolicitud.trim()) {
      setError("Debe ingresar el número de solicitud.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const solicitud: any = await solicitudesApi.getByNro(nroSolicitud.trim());
      if (!solicitud) {
        setError("Solicitud no encontrada.");
        setData(null);
        return;
      }

      const cuotasResp: any = await solicitudesApi.getCuotas(
        solicitud.idsolicitud,
      );
      const resumen = cuotasResp?.resumen || {};

      setData({
        idsolicitud: solicitud.idsolicitud,
        nrosolicitud: solicitud.nrosolicitud,
        cliente: solicitud.cliente?.appynom || solicitud.appynom,
        dni: solicitud.cliente?.dni || solicitud.dni,
        telefono: solicitud.cliente?.telefono || solicitud.telefono,
        direccion: solicitud.cliente?.direccion || solicitud.direccion,
        localidad:
          solicitud.cliente?.localidad?.nombre ||
          solicitud.localidad_nombre ||
          "",
        fechaAlta: solicitud.fechalta || "",
        producto: solicitud.producto?.descripcion || solicitud.prdescripcion,
        vendedor: solicitud.usuario?.nombre || "",
        montoCuota: solicitud.monto || 0,
        totalPagar: solicitud.totalapagar || 0,
        cuotas: solicitud.cantidadcuotas || 0,
        pagadas: resumen.pagadas || 0,
        totalPagado: resumen.montoPagado || 0,
        observaciones: solicitud.observacion || "",
      });
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los datos.");
    } finally {
      setLoading(false);
    }
  };

  const handleImprimir = () => {
    if (!data?.nrosolicitud) {
      setError("No hay solicitud para imprimir.");
      return;
    }
    setError(null);
    reportesApi
      .monitorSolicitudPdf(data.nrosolicitud)
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      })
      .catch(() => {
        setError("No se pudo generar el PDF.");
      });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 page-shell monitor-shell">
        <div>
          <h1 className="monitor-title">MONITOR DE SOLICITUDES</h1>
          <div className="monitor-underline" />
        </div>

        <div className="panel pad">
          <p>
            Ingrese el <strong>número de solicitud</strong> para obtener todos
            los datos relacionados.
          </p>
          <div className="monitor-actions mt-4">
            <input
              className="input-sleek"
              placeholder="Nro solicitud"
              value={nroSolicitud}
              onChange={(e) => setNroSolicitud(e.target.value)}
            />
            <button className="action-button" onClick={handleBuscar}>
              {loading ? "Buscando..." : "Buscar"}
            </button>
          </div>
          {loading && <LoadingState label="Buscando..." />}
          {error && <ErrorState message={error} />}
        </div>

        <div className="monitor-card">
          <div className="monitor-grid">
            <div className="monitor-field" style={{ gridColumn: "span 2" }}>
              <label>SOLICITUD</label>
              <input readOnly value={data?.nrosolicitud || ""} />
            </div>
            <div className="monitor-field" style={{ gridColumn: "span 4" }}>
              <label>CLIENTE</label>
              <input readOnly value={data?.cliente || ""} />
            </div>
            <div className="monitor-field" style={{ gridColumn: "span 2" }}>
              <label>DNI</label>
              <input readOnly value={data?.dni || ""} />
            </div>
            <div className="monitor-field" style={{ gridColumn: "span 2" }}>
              <label>TEL</label>
              <input readOnly value={data?.telefono || ""} />
            </div>

            <div className="monitor-field" style={{ gridColumn: "span 8" }}>
              <label>DOMICILIO</label>
              <input readOnly value={data?.direccion || ""} />
            </div>
            <div className="monitor-field" style={{ gridColumn: "span 4" }}>
              <label>LOCALIDAD</label>
              <input readOnly value={data?.localidad || ""} />
            </div>

            <div className="monitor-field" style={{ gridColumn: "span 3" }}>
              <label>FECHA ALTA</label>
              <input readOnly value={data?.fechaAlta || ""} />
            </div>
            <div className="monitor-field" style={{ gridColumn: "span 3" }}>
              <label>PRODUCTO</label>
              <input readOnly value={data?.producto || ""} />
            </div>
            <div className="monitor-field" style={{ gridColumn: "span 6" }}>
              <label>VENDEDOR</label>
              <input readOnly value={data?.vendedor || ""} />
            </div>

            <div className="monitor-field" style={{ gridColumn: "span 2" }}>
              <label>N° CUOTAS</label>
              <input readOnly value={data?.cuotas || ""} />
            </div>
            <div className="monitor-field" style={{ gridColumn: "span 2" }}>
              <label>IMP. CUOTAS</label>
              <input
                readOnly
                value={
                  data?.montoCuota
                    ? `$${data.montoCuota.toLocaleString("es-AR")}`
                    : ""
                }
              />
            </div>
            <div className="monitor-field" style={{ gridColumn: "span 2" }}>
              <label>TOT. A PAGAR</label>
              <input
                readOnly
                value={
                  data?.totalPagar
                    ? `$${data.totalPagar.toLocaleString("es-AR")}`
                    : ""
                }
              />
            </div>
            <div className="monitor-field" style={{ gridColumn: "span 2" }}>
              <label>PAGADAS</label>
              <input readOnly value={data?.pagadas || ""} />
            </div>
            <div className="monitor-field" style={{ gridColumn: "span 2" }}>
              <label>LLEVA PAGADO</label>
              <input
                readOnly
                value={
                  data?.totalPagado
                    ? `$${data.totalPagado.toLocaleString("es-AR")}`
                    : ""
                }
              />
            </div>

            <div className="monitor-field" style={{ gridColumn: "span 12" }}>
              <label>OBSERVACIONES</label>
              <textarea readOnly value={data?.observaciones || ""} />
            </div>
          </div>
          <div className="monitor-actions mt-4">
            <button className="action-button" onClick={handleImprimir}>
              Imprimir estos datos
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
