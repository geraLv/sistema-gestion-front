import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Modal } from "../ui/Modal";

interface SolicitudAddCuotasModalProps {
    nroSolicitud: string | number;
    onClose: () => void;
    onConfirm: (cantidad: number) => Promise<void>;
}

export function SolicitudAddCuotasModal({
    nroSolicitud,
    onClose,
    onConfirm,
}: SolicitudAddCuotasModalProps) {
    const [cantidad, setCantidad] = useState<number | string>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const cant = Number(cantidad);

        if (!cant || cant <= 0) {
            setError("La cantidad debe ser mayor a 0");
            return;
        }
        if (cant > 100) {
            setError("La cantidad es demasiado alta");
            return;
        }

        setLoading(true);
        try {
            await onConfirm(cant);
            onClose();
        } catch (err: any) {
            setError(err.message || "Error al agregar cuotas");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} className="max-w-sm" showCloseButton={false}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                        <Plus className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 leading-6">
                            Agregar Cuotas
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Solicitud #{nroSolicitud}
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="mb-4">
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                        Cantidad de cuotas a agregar
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="100"
                        className="input-sleek w-full text-lg"
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                        autoFocus
                    />
                    <p className="mt-2 text-xs text-slate-500">
                        Las nuevas cuotas se generarán automáticamente como "Impagas" y se agregarán al final del plan actual.
                    </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                        type="button"
                        className="ghost-button"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="action-button"
                        disabled={loading}
                    >
                        {loading ? "Generando..." : "Confirmar"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
