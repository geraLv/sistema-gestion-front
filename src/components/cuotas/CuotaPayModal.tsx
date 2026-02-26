import { useState } from "react";
import { DollarSign, Upload, FileText, X, Trash } from "lucide-react";
import { Modal } from "../ui/Modal";
import { formatDateEs } from "../../lib/date";

interface CuotaPayModalProps {
    cuota: any;
    comprobantesPrevios?: any[];
    onClose: () => void;
    onConfirm: (id: number, file: File | null) => Promise<void>;
}

export function CuotaPayModal({ cuota, comprobantesPrevios = [], onClose, onConfirm }: CuotaPayModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!cuota) return null;

    const formatDate = (dateStr?: string) => formatDateEs(dateStr);

    const handleConfirm = async () => {
        setError(null);
        if (!file) {
            setError("Debe adjuntar un comprobante de pago (PDF) para continuar.");
            return;
        }
        setLoading(true);
        try {
            await onConfirm(cuota.idcuota || cuota.id, file);
            onClose();
        } catch (err: any) {
            console.error("Payment error:", err);
            const msg = err.response?.data?.error || err.message || "Error al procesar el pago";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} className="max-w-xl" showCloseButton={false}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                        <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 leading-6">
                            Pago de Cuota
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Confirmá el pago y adjuntá el comprobante <span className="text-red-500 font-semibold">(obligatorio)</span>.
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Body */}
            <div className="p-6">
                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs font-medium text-slate-500">Solicitud</div>
                        <div className="font-semibold text-slate-900">{cuota.nroSolicitud || cuota.relasolicitud || "-"}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs font-medium text-slate-500">Nro Cuota</div>
                        <div className="font-semibold text-slate-900">#{cuota.nroCuota || cuota.nrocuota}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs font-medium text-slate-500">Importe</div>
                        <div className="font-semibold text-slate-900">${cuota.importe}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs font-medium text-slate-500">Vencimiento</div>
                        <div className="font-semibold text-slate-900">{formatDate(cuota.vencimiento)}</div>
                    </div>
                </div>

                {/* Upload Area */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-800">Comprobante (PDF) <span className="text-red-500">*</span></label>
                    <div className="relative group">
                        <input
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            id="file-upload"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />

                        {!file ? (
                            <label
                                htmlFor="file-upload"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-slate-400 transition-colors"
                            >
                                <Upload className="w-8 h-8 text-slate-400 mb-2 group-hover:text-slate-600" />
                                <span className="text-sm text-slate-600 font-medium">Click para subir comprobante</span>
                                <span className="text-xs text-slate-400 mt-1">Formato PDF permitido</span>
                            </label>
                        ) : (
                            <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-900 truncate max-w-[200px]">{file.name}</div>
                                        <div className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setFile(null)}
                                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                >
                                    <Trash className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Previous Comprobantes */}
                {comprobantesPrevios && comprobantesPrevios.length > 0 && (
                    <div className="mt-6">
                        <div className="text-sm font-semibold text-slate-900 mb-2">Comprobantes Previos</div>
                        <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-xl">
                            <ul className="divide-y divide-slate-100">
                                {comprobantesPrevios.map((c) => (
                                    <li key={c.idcomprobante} className="px-3 py-2 flex items-center justify-between hover:bg-slate-50">
                                        <span className="text-sm text-slate-600 truncate">{c.archivo_nombre || "Archivo"}</span>
                                        <a href={c.archivo_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-blue-600 hover:underline">Ver</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 bg-slate-50/50">
                <button
                    className="ghost-button"
                    onClick={onClose}
                    disabled={loading}
                >
                    Cancelar
                </button>
                <button
                    className="action-button min-w-[140px]"
                    onClick={handleConfirm}
                    disabled={loading || !file}
                >
                    {loading ? "Procesando..." : "Confirmar Pago"}
                </button>
            </div>
        </Modal>
    );
}
