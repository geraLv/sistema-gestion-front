import { useState } from "react";
import { DollarSign, Upload, FileText, X, Trash } from "lucide-react";
import { Modal } from "../ui/Modal";
import { formatDateEs } from "../../lib/date";

interface CuotaPayMultipleModalProps {
    cuotas: any[];
    onClose: () => void;
    onConfirm: (ids: number[], files: File[]) => Promise<void>;
}

export function CuotaPayMultipleModal({ cuotas, onClose, onConfirm }: CuotaPayMultipleModalProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!cuotas || cuotas.length === 0) return null;

    const totalAmount = cuotas.reduce((sum, c) => sum + (c.importe || 0), 0);

    const formatDate = (dateStr?: string) => formatDateEs(dateStr);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        setFiles(prev => [...prev, ...selectedFiles]);
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleConfirm = async () => {
        setError(null);
        setLoading(true);
        try {
            const ids = cuotas.map(c => c.id || c.idcuota);
            await onConfirm(ids, files);
            onClose();
        } catch (err: any) {
            console.error("Payment error:", err);
            const msg = err.response?.data?.error || err.message || "Error al procesar los pagos";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} className="max-w-2xl" showCloseButton={false}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                        <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 leading-6">
                            Pago Múltiple de Cuotas
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Confirmá el pago de {cuotas.length} cuota{cuotas.length > 1 ? 's' : ''} y adjuntá comprobantes (opcional).
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

                {/* Summary */}
                <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-slate-700">Cuotas a pagar</span>
                        <span className="text-xs font-medium text-slate-500">{cuotas.length} cuota{cuotas.length > 1 ? 's' : ''}</span>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                        {cuotas.map((cuota, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm bg-white rounded-lg p-2 border border-slate-100">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs text-slate-500">#{cuota.nroCuota || cuota.nrocuota}</span>
                                    <span className="text-slate-600">Sol. {cuota.nroSolicitud || cuota.relasolicitud}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-slate-500">{formatDate(cuota.vencimiento)}</span>
                                    <span className="font-semibold text-slate-900">${cuota.importe}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900">Total a pagar</span>
                        <span className="text-lg font-bold text-slate-900">${totalAmount.toFixed(2)}</span>
                    </div>
                </div>

                {/* Upload Area */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-800">Comprobantes (PDF)</label>
                    <p className="text-xs text-slate-500 mb-2">Los archivos se asociarán a la primera cuota seleccionada.</p>

                    <div className="relative group">
                        <input
                            type="file"
                            accept="application/pdf"
                            multiple
                            className="hidden"
                            id="files-upload"
                            onChange={handleFileChange}
                        />

                        <label
                            htmlFor="files-upload"
                            className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-slate-400 transition-colors"
                        >
                            <Upload className="w-6 h-6 text-slate-400 mb-1 group-hover:text-slate-600" />
                            <span className="text-sm text-slate-600 font-medium">Click para subir comprobantes</span>
                            <span className="text-xs text-slate-400 mt-1">Múltiples archivos PDF permitidos</span>
                        </label>
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {files.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-slate-900 truncate max-w-[300px]">{file.name}</div>
                                            <div className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeFile(idx)}
                                        className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                    >
                                        <Trash className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
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
                    className="action-button min-w-[160px]"
                    onClick={handleConfirm}
                    disabled={loading}
                >
                    {loading ? "Procesando..." : `Confirmar Pago (${cuotas.length})`}
                </button>
            </div>
        </Modal>
    );
}
