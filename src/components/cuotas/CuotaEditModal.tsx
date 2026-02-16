import { useState, useEffect } from "react";
import { Edit, X } from "lucide-react";
import { Modal } from "../ui/Modal";

interface CuotaEditModalProps {
    cuota: any;
    onClose: () => void;
    onSave: (id: number, importe: number) => Promise<void>;
}

export function CuotaEditModal({ cuota, onClose, onSave }: CuotaEditModalProps) {
    const [importe, setImporte] = useState<number | string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (cuota) {
            setImporte(cuota.importe);
        }
    }, [cuota]);

    const handleSubmit = async () => {
        setError(null);
        if (!importe || Number(importe) <= 0) {
            setError("El importe debe ser mayor a 0");
            return;
        }

        setLoading(true);
        try {
            await onSave(cuota.idcuota || cuota.id, Number(importe));
            onClose();
        } catch (err: any) {
            setError(err.message || "Error al actualizar la cuota");
        } finally {
            setLoading(false);
        }
    };

    if (!cuota) return null;

    return (
        <Modal isOpen={true} onClose={onClose} className="max-w-md" showCloseButton={false}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                        <Edit className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 leading-6">
                            Editar Cuota
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Actualizá el importe.
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                >
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

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs font-medium text-slate-500">Solicitud</div>
                        <div className="font-semibold text-slate-900">{cuota.nroSolicitud || cuota.relasolicitud}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs font-medium text-slate-500">Cuota</div>
                        <div className="font-semibold text-slate-900">#{cuota.nroCuota || cuota.nrocuota}</div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-800 mb-2">Importe</label>
                    <input
                        type="number"
                        step="0.01"
                        className="input-sleek w-full text-lg"
                        value={importe}
                        onChange={(e) => setImporte(e.target.value)}
                        autoFocus
                    />
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
                    className="action-button min-w-[100px]"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? "Guardando..." : "Guardar"}
                </button>
            </div>
        </Modal>
    );
}
