import { useState } from "react";
import Layout from "../components/Layout";
import { ErrorState, LoadingState } from "../components/Status";
import { localidadesApi, reportesApi } from "../api/endpoints";
import { SearchableSelect } from "../components/ui/SearchableSelect";
import { ReciboSignModal } from "../components/solicitudes/ReciboSignModal";
import "./ImpresionesPage.css";

interface LocalidadOption {
  value: number;
  label: string;
}

type FirmaData = { firmaProductor: string; aclaracionProductor: string };

function buildMonthValue(value: string) {
  if (!value) return "";
  return value;
}

function toMonthInput(value: string) {
  if (!value) return "";
  return value;
}

export default function ImpresionesPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocalidadOption, setSelectedLocalidadOption] =
    useState<LocalidadOption | null>(null);

  const [nroSolicitud, setNroSolicitud] = useState("");
  const [mesRecibos, setMesRecibos] = useState("");
  const [localidadId, setLocalidadId] = useState("");
  const [mesLocalidad, setMesLocalidad] = useState("");
  const [sinFecha, setSinFecha] = useState(false);
  const [conFirma, setConFirma] = useState(false);

  const [estadoXlsx, setEstadoXlsx] = useState("impagas");
  const [mesXlsx, setMesXlsx] = useState("");
  const [modoXlsx, setModoXlsx] = useState("resumen");

  // Signature modal state
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);

  const handleLocalidadSearch = async (term: string) => {
    try {
      const data = await localidadesApi.search(term, 100);
      return (Array.isArray(data) ? data : []).map((l: any) => ({
        value: Number(l.idlocalidad),
        label: l.nombre || "Sin nombre",
      }));
    } catch {
      return [];
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

  // Helper: execute a receipt action, optionally with firma
  const executeWithFirma = (actionFn: (firma?: FirmaData) => Promise<void>) => {
    // Store the action so the modal can call it with firma data
    setPendingAction(() => async (firma?: FirmaData) => {
      await actionFn(firma);
    });
    setSignModalOpen(true);
  };

  const executeWithoutFirma = async (actionFn: (firma?: FirmaData) => Promise<void>) => {
    setError(null);
    setLoading(true);
    try {
      await actionFn(undefined);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 404) {
        setError("No se encontraron datos para generar el recibo.");
      } else {
        setError("No se pudo generar el reporte.");
      }
    } finally {
      setLoading(false);
    }
  };

  const executePrint = (actionFn: (firma?: FirmaData) => Promise<void>) => {
    if (conFirma) {
      executeWithFirma(actionFn);
      return;
    }
    executeWithoutFirma(actionFn);
  };

  const handleSignConfirm = async (firmaData: FirmaData) => {
    if (!pendingAction) return;
    setSignModalOpen(false);
    setError(null);
    setLoading(true);
    try {
      await (pendingAction as any)(firmaData);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 404) {
        setError("No se encontraron datos para generar el recibo.");
      } else {
        setError("No se pudo generar el reporte.");
      }
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  // --- Receipt action factories ---

  const reciboUltimaPagadaAction = async (firma?: FirmaData) => {
    if (!nroSolicitud || nroSolicitud.trim() === "") {
      setError("Debe ingresar un Nº de Solicitud válido.");
      return;
    }
    const blob = await reportesApi.reciboUltimaPagada(nroSolicitud, sinFecha, firma);
    openBlob(blob, `recibo-ultima-pagada-${nroSolicitud}.pdf`);
  };

  const recibosMesAction = async (firma?: FirmaData) => {
    const blob = await reportesApi.recibosMes(
      buildMonthValue(mesRecibos),
      localidadId ? Number(localidadId) : undefined,
      sinFecha,
      firma,
    );
    const mesLabel = mesRecibos || "actual";
    openBlob(blob, `recibos-${mesLabel}.pdf`);
  };

  const recibosMesPosteriorAction = async (firma?: FirmaData) => {
    const loc = localidadId ? Number(localidadId) : undefined;
    const blob = loc
      ? await reportesApi.recibosMesPosteriorPorLocalidad(loc, sinFecha, firma)
      : await reportesApi.recibosMesPosterior(sinFecha, firma);
    openBlob(blob, "recibos-mes-posterior.pdf");
  };

  const recibosPorLocalidadAction = async (firma?: FirmaData) => {
    const loc = Number(localidadId);
    if (!Number.isFinite(loc) || loc <= 0) {
      setError("Debe seleccionar una localidad.");
      return;
    }
    const blob = await reportesApi.recibosMesPorLocalidad(
      loc,
      buildMonthValue(mesLocalidad),
      sinFecha,
      firma,
    );
    const mesLabel = mesLocalidad || "actual";
    openBlob(blob, `recibos-${mesLabel}-loc-${loc}.pdf`);
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

  const PrintButton = ({
    label,
    actionFn,
    disabled,
  }: {
    label: string;
    actionFn: (firma?: FirmaData) => Promise<void>;
    disabled?: boolean;
  }) => (
    <button
      className="legacy-button primary"
      onClick={() => executePrint(actionFn)}
      disabled={disabled || loading}
    >
      {label}
    </button>
  );

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
            <h3>Último Recibo Pagado</h3>
            <p>Genera el recibo PDF de la última cuota pagada de una solicitud.</p>
            <div className="legacy-field">
              <label htmlFor="nroSolicitud">Nº Solicitud</label>
              <input
                id="nroSolicitud"
                type="text"
                value={nroSolicitud}
                onChange={(e) => setNroSolicitud(e.target.value)}
                placeholder="Ej: 12345"
              />
            </div>
            <div className="legacy-field">
              <label>
                <input
                  type="checkbox"
                  checked={sinFecha}
                  onChange={(e) => setSinFecha(e.target.checked)}
                />{" "}
                Sin fecha
              </label>
            </div>
            <div className="legacy-field">
              <label>
                <input
                  type="checkbox"
                  checked={conFirma}
                  onChange={(e) => setConFirma(e.target.checked)}
                />{" "}
                Con firma
              </label>
            </div>
            <div className="legacy-actions">
              <PrintButton
                label="Imprimir recibo"
                actionFn={reciboUltimaPagadaAction}
              />
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
              <SearchableSelect
                label="Localidad (opcional)"
                options={selectedLocalidadOption ? [selectedLocalidadOption] : []}
                value={localidadId}
                onChange={(val, option) => {
                  setLocalidadId(String(val));
                  if (option) {
                    setSelectedLocalidadOption({
                      value: Number(option.value),
                      label: option.label,
                    });
                  }
                }}
                placeholder="Seleccione una localidad"
                onSearch={handleLocalidadSearch}
                minSearchLength={2}
              />
            </div>
            <div className="legacy-field">
              <label>
                <input
                  type="checkbox"
                  checked={sinFecha}
                  onChange={(e) => setSinFecha(e.target.checked)}
                />{" "}
                Sin fecha
              </label>
            </div>
            <div className="legacy-field">
              <label>
                <input
                  type="checkbox"
                  checked={conFirma}
                  onChange={(e) => setConFirma(e.target.checked)}
                />{" "}
                Con firma
              </label>
            </div>
            <div className="legacy-actions">
              <PrintButton
                label="Imprimir recibos del mes"
                actionFn={recibosMesAction}
              />
              <PrintButton
                label="Recibos mes posterior"
                actionFn={recibosMesPosteriorAction}
              />
            </div>
            {loading && <LoadingState label="Generando..." />}
          </section>

          <section className="legacy-panel">
            <h3>Recibos por Localidad</h3>
            <p>Genera el PDF filtrado por localidad y mes.</p>
            <div className="legacy-field">
              <SearchableSelect
                label="Localidad"
                options={selectedLocalidadOption ? [selectedLocalidadOption] : []}
                value={localidadId}
                onChange={(val, option) => {
                  setLocalidadId(String(val));
                  if (option) {
                    setSelectedLocalidadOption({
                      value: Number(option.value),
                      label: option.label,
                    });
                  }
                }}
                placeholder="Seleccione una localidad"
                onSearch={handleLocalidadSearch}
                minSearchLength={2}
              />
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
            <div className="legacy-field">
              <label>
                <input
                  type="checkbox"
                  checked={sinFecha}
                  onChange={(e) => setSinFecha(e.target.checked)}
                />{" "}
                Sin fecha
              </label>
            </div>
            <div className="legacy-field">
              <label>
                <input
                  type="checkbox"
                  checked={conFirma}
                  onChange={(e) => setConFirma(e.target.checked)}
                />{" "}
                Con firma
              </label>
            </div>
            <div className="legacy-actions">
              <PrintButton
                label="Imprimir por localidad"
                actionFn={recibosPorLocalidadAction}
              />
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

      <ReciboSignModal
        isOpen={signModalOpen}
        onClose={() => { setSignModalOpen(false); setPendingAction(null); }}
        onConfirm={handleSignConfirm}
        isLoading={loading}
      />
    </Layout>
  );
}
