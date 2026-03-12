import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import { contratosApi } from "../api/endpoints";

export default function FirmaContratoPage() {
    const { token } = useParams<{ token: string }>();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    const [data, setData] = useState<any>(null);
    const [aclaracionCliente, setAclaracionCliente] = useState("");
    const sigCanvas = useRef<SignatureCanvas>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!token) {
                setError("Token inválido.");
                setLoading(false);
                return;
            }
            try {
                const res: any = await contratosApi.getPublico(token);
                setData(res);
            } catch (err: any) {
                setError(
                    err.response?.data?.error ||
                    "Error al cargar el contrato o contrato ya firmado.",
                );
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    const clearSignature = () => {
        sigCanvas.current?.clear();
    };

    const confirmarFirma = async () => {
        if (!token) return;

        if (!aclaracionCliente.trim()) {
            alert("Por favor, ingrese su aclaración de firma.");
            return;
        }

        if (sigCanvas.current?.isEmpty()) {
            alert("Por favor, dibuje su firma antes de confirmar.");
            return;
        }

        setSubmitting(true);
        try {
            // Obtener imagen en base64
            const firmaUrl = sigCanvas.current
                ?.getCanvas()
                .toDataURL("image/png");

            if (!firmaUrl)
                throw new Error("No se pudo obtener la imagen de la firma");

            const response = await contratosApi.firmar(token, firmaUrl, aclaracionCliente);
            setSuccess(true);

            // Auto-descargar/abrir el PDF firmado si la URL existe en la respuesta
            if (response && response.url_pdf_firmado) {
                setDownloadUrl(response.url_pdf_firmado);
                window.open(response.url_pdf_firmado, "_blank");
            }

        } catch (err: any) {
            alert(
                err.response?.data?.error ||
                "Ocurrió un error al firmar el contrato. Intente nuevamente.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="text-slate-600">Cargando contrato...</div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-emerald-100 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8 text-emerald-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">
                        ¡Contrato Firmado!
                    </h2>
                    <p className="text-slate-600 mb-6">
                        Hemos guardado su firma exitosamente. El contrato firmado se descargará o abrirá en una nueva pestaña automáticamente.
                    </p>
                    {downloadUrl && (
                        <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" /></svg>
                            Descargar Contrato Firmado
                        </a>
                    )}
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-red-100 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Aviso</h2>
                    <p className="text-slate-600">{error}</p>
                </div>
            </div>
        );
    }

    const { contrato, cliente, producto } = data;

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Encabezado */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
                    <h1 className="text-2xl font-bold text-slate-800">
                        Firma de Contrato
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Por favor, revise los datos principales y dibuje su firma para
                        confirmar.
                    </p>
                </div>

                {/* Datos Principales */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold border-b border-slate-100 pb-2 mb-4">
                        Resumen de la Solicitud
                    </h2>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 text-sm">
                        <div>
                            <dt className="text-slate-500">Cliente</dt>
                            <dd className="font-medium text-slate-800">{cliente?.appynom}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">DNI</dt>
                            <dd className="font-medium text-slate-800">{cliente?.dni}</dd>
                        </div>
                        <div>
                            <dt className="text-slate-500">Producto</dt>
                            <dd className="font-medium text-slate-800">
                                {producto?.descripcion}
                            </dd>
                        </div>
                        {contrato.url_pdf_original && (
                            <div className="col-span-1 sm:col-span-2 mt-2 pt-4 border-t border-slate-100">
                                <a
                                    href={contrato.url_pdf_original}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-700 underline font-medium flex items-center gap-2"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <path d="M16 13H8" />
                                        <path d="M16 17H8" />
                                        <path d="M10 9H8" />
                                    </svg>
                                    Descargar o abrir Contrato PDF Completo
                                </a>
                            </div>
                        )}
                    </dl>
                </div>

                {/* Zona de Firma */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold mb-4">Complete los datos de firma</h2>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Aclaración de Firma (Nombre y Apellido)</label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ej. Juan Pérez"
                            value={aclaracionCliente}
                            onChange={(e) => setAclaracionCliente(e.target.value)}
                        />
                    </div>

                    <h3 className="text-md font-medium text-slate-700 mb-2">Dibuje su firma aquí</h3>
                    <div
                        className="border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 mb-4 overflow-hidden relative"
                        style={{ height: "250px" }}
                    >
                        <SignatureCanvas
                            ref={sigCanvas}
                            penColor="blue"
                            canvasProps={{
                                className: "sigCanvas w-full h-full cursor-crosshair",
                            }}
                            velocityFilterWeight={0.7}
                            minWidth={1.5}
                            maxWidth={3}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={clearSignature}
                            type="button"
                            className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors w-full sm:w-1/3"
                        >
                            Limpiar Firma
                        </button>
                        <button
                            onClick={confirmarFirma}
                            disabled={submitting}
                            type="button"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold w-full sm:w-2/3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? "Procesando..." : "Confirmar Firma y Guardar"}
                        </button>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-500 mt-4">
                    Al confirmar la firma, se generará y descargará automáticamente su contrato en formato PDF con su firma incluida.
                </p>

                <p className="text-center text-xs text-slate-400 mt-4">
                    Al firmar, usted acepta los términos y condiciones especificados en el
                    contrato. Se registrará la fecha, hora y su dirección IP (
                    {new Date().toLocaleDateString()}).
                </p>
            </div>
        </div>
    );
}
