import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { ErrorState, LoadingState } from "../components/Status";
import { localidadesApi, reportesApi } from "../api/endpoints";
import "./ImpresionesPage.css";

interface LocalidadOption {
  idlocalidad: number;
  nombre: string;
}

function buildMonthValue(value: string) {
  if (!value) return "";
  return value;
}

function toMonthInput(value: string) {
  if (!value) return "";
  return value;
}

export default function ImpresionesPage() {
  const [localidades, setLocalidades] = useState<LocalidadOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [idCuota, setIdCuota] = useState("");
  const [mesRecibos, setMesRecibos] = useState("");
  const [localidadId, setLocalidadId] = useState("");
  const [mesLocalidad, setMesLocalidad] = useState("");

  const [estadoXlsx, setEstadoXlsx] = useState("impagas");
  const [mesXlsx, setMesXlsx] = useState("");
  const [modoXlsx, setModoXlsx] = useState("resumen");

  useEffect(() => {
    loadLocalidades();
  }, []);

  const loadLocalidades = async () => {
    try {
      const data = await localidadesApi.getAll();
      const list = Array.isArray(data) ? data : (data as any)?.data || [];
      const mapped = list.map((l: any) => ({
        idlocalidad: l.idlocalidad,
        nombre: l.nombre || l.localidad || "Sin nombre",
      }));
      setLocalidades(mapped);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las localidades.");
    }
  };

  const openBlob = (blob: Blob, filename: string, inline = false) => {
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

  const handleReciboCuota = async () => {
    const id = Number(idCuota);
    if (!Number.isFinite(id) || id <= 0) {
      setError("Debe ingresar un ID de cuota válido.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const blob = await reportesApi.reciboCuota(id);
      openBlob(blob, `recibo-cuota-${id}.pdf`, true);
    } catch (err) {
      console.error(err);
      setError("No se pudo generar el recibo de cuota.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecibosMes = async () => {
    setError(null);
    setLoading(true);
    try {
      const blob = await reportesApi.recibosMes(
        buildMonthValue(mesRecibos),
        localidadId ? Number(localidadId) : undefined,
      );
      const mesLabel = mesRecibos || "actual";
      openBlob(blob, `recibos-${mesLabel}.pdf`, true);
    } catch (err) {
      console.error(err);
      setError("No se pudo generar el PDF del mes.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecibosMesPosterior = async () => {
    setError(null);
    setLoading(true);
    try {
      const loc = localidadId ? Number(localidadId) : undefined;
      const blob = loc
        ? await reportesApi.recibosMesPosteriorPorLocalidad(loc)
        : await reportesApi.recibosMesPosterior();
      openBlob(blob, "recibos-mes-posterior.pdf", true);
    } catch (err) {
      console.error(err);
      setError("No se pudo generar el PDF del mes posterior.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecibosPorLocalidad = async () => {
    const loc = Number(localidadId);
    if (!Number.isFinite(loc) || loc <= 0) {
      setError("Debe seleccionar una localidad.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const blob = await reportesApi.recibosMesPorLocalidad(
        loc,
        buildMonthValue(mesLocalidad),
      );
      const mesLabel = mesLocalidad || "actual";
      openBlob(blob, `recibos-${mesLabel}-loc-${loc}.pdf`, true);
    } catch (err) {
      console.error(err);
      setError("No se pudo generar el PDF por localidad.");
    } finally {
      setLoading(false);
    }
  };

  const handleXlsx = async () => {
    setError(null);
    setLoading(true);
    try {
      const blob = await reportesApi.solicitudesXlsx(
        estadoXlsx,
        buildMonthValue(mesXlsx),
        modoXlsx,
      );
      const mesLabel = mesXlsx || "actual";
      openBlob(
        blob,
        `solicitudes-${estadoXlsx}-${mesLabel}-${modoXlsx}.xlsx`,
        false,
      );
    } catch (err) {
      console.error(err);
      setError("No se pudo generar el XLSX.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="legacy-reportes">
        <div className="legacy-banner">
          <h2>Impresiones y Reportes</h2>
          <p>
            Generá recibos en PDF y exportaciones en Excel. La interfaz replica
            el estilo del sistema anterior para mantener continuidad visual.
          </p>
          <p className="legacy-help">
            Mes por defecto: <strong>actual</strong>. Mes posterior se calcula
            automáticamente.
          </p>
        </div>

        {error && <ErrorState message={error} />}

        <div className="legacy-grid">
          <section className="legacy-panel">
            <h3>Recibo de Cuota</h3>
            <p>Genera el recibo PDF de una cuota específica.</p>
            <div className="legacy-field">
              <label htmlFor="idCuota">ID Cuota</label>
              <input
                id="idCuota"
                type="number"
                value={idCuota}
                onChange={(e) => setIdCuota(e.target.value)}
                placeholder="Ej: 125"
              />
            </div>
            <div className="legacy-actions">
              <button
                className="legacy-button primary"
                onClick={handleReciboCuota}
                disabled={loading}
              >
                Imprimir recibo
              </button>
            </div>
            {loading && <LoadingState label="Generando..." />}
          </section>

          <section className="legacy-panel">
            <h3>Recibos del Mes</h3>
            <p>
              Genera el PDF de todos los recibos del mes. Podés filtrar por
              localidad.
            </p>
            <div className="legacy-field">
              <label htmlFor="mesRecibos">Mes</label>
              <input
                id="mesRecibos"
                type="month"
                value={toMonthInput(mesRecibos)}
                onChange={(e) => setMesRecibos(e.target.value)}
              />
            </div>
            <div className="legacy-field">
              <label htmlFor="localidadMes">Localidad (opcional)</label>
              <select
                id="localidadMes"
                value={localidadId}
                onChange={(e) => setLocalidadId(e.target.value)}
              >
                <option value="">Seleccione una localidad</option>
                {localidades.map((l) => (
                  <option key={l.idlocalidad} value={l.idlocalidad}>
                    {l.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="legacy-actions">
              <button
                className="legacy-button primary"
                onClick={handleRecibosMes}
                disabled={loading}
              >
                Imprimir recibos del mes
              </button>
              <button
                className="legacy-button"
                onClick={handleRecibosMesPosterior}
                disabled={loading}
              >
                Recibos mes posterior
              </button>
            </div>
            {loading && <LoadingState label="Generando..." />}
          </section>

          <section className="legacy-panel">
            <h3>Recibos por Localidad</h3>
            <p>Genera el PDF filtrado por localidad y mes.</p>
            <div className="legacy-field">
              <label htmlFor="localidadRecibo">Localidad</label>
              <select
                id="localidadRecibo"
                value={localidadId}
                onChange={(e) => setLocalidadId(e.target.value)}
              >
                <option value="">Seleccione una localidad</option>
                {localidades.map((l) => (
                  <option key={l.idlocalidad} value={l.idlocalidad}>
                    {l.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="legacy-field">
              <label htmlFor="mesLocalidad">Mes</label>
              <input
                id="mesLocalidad"
                type="month"
                value={toMonthInput(mesLocalidad)}
                onChange={(e) => setMesLocalidad(e.target.value)}
              />
            </div>
            <div className="legacy-actions">
              <button
                className="legacy-button primary"
                onClick={handleRecibosPorLocalidad}
                disabled={loading}
              >
                Imprimir por localidad
              </button>
            </div>
            {loading && <LoadingState label="Generando..." />}
          </section>

          <section className="legacy-panel">
            <h3>Exportar Solicitudes (XLSX)</h3>
            <p>Exporta solicitudes en formato Excel.</p>
            <div className="legacy-field">
              <label htmlFor="estadoXlsx">Estado</label>
              <select
                id="estadoXlsx"
                value={estadoXlsx}
                onChange={(e) => setEstadoXlsx(e.target.value)}
              >
                <option value="impagas">Impagas</option>
                <option value="pagas">Pagas</option>
                <option value="bajas">Bajas</option>
              </select>
            </div>
            <div className="legacy-field">
              <label htmlFor="mesXlsx">Mes</label>
              <input
                id="mesXlsx"
                type="month"
                value={toMonthInput(mesXlsx)}
                onChange={(e) => setMesXlsx(e.target.value)}
              />
            </div>
            <div className="legacy-field">
              <label htmlFor="modoXlsx">Modo</label>
              <select
                id="modoXlsx"
                value={modoXlsx}
                onChange={(e) => setModoXlsx(e.target.value)}
              >
                <option value="resumen">Resumen</option>
                <option value="detalle">Detalle</option>
              </select>
            </div>
            <div className="legacy-actions">
              <button
                className="legacy-button primary"
                onClick={handleXlsx}
                disabled={loading}
              >
                Descargar Excel
              </button>
            </div>
            {loading && <LoadingState label="Generando..." />}
          </section>
        </div>

        <div className="legacy-divider" />
        <p className="legacy-help">
          Consejo: si un reporte no existe para el mes seleccionado, el sistema
          devolverá un mensaje de error.
        </p>
      </div>
    </Layout>
  );
}
