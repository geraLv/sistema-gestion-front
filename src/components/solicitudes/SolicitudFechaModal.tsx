import { useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { Modal } from "../ui/Modal";

interface SolicitudFechaModalProps {
    idsolicitud: number;
    nroSolicitud: string | number;
    fechaActual?: string; // YYYY-MM-DD or ISO
    onClose: () => void;
    onConfirm: (fechaInicio: string) => Promise<void>;
}

export function SolicitudFechaModal({
    nroSolicitud,
    fechaActual,
    onClose,
    onConfirm,
}: SolicitudFechaModalProps) {
    // Normalize fechaActual to YYYY-MM-DD for the input
    const defaultDate = fechaActual
        ? fechaActual.substring(0, 10)
        : new Date().toISOString().substring(0, 10);

    const [fecha, setFecha] = useState(defaultDate);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fecha) {
            setError("Debe seleccionar una fecha.");
            return;
        }
        setError(null);
        setLoading(true);
        try {
            await onConfirm(fecha);
            onClose();
        } catch (err: any) {
            setError(err.message || "Error al actualizar la fecha.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} className="max-w-sm" showCloseButton={false}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                        <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 leading-6">
                            Fecha de Inicio
                        </h2>
                        <p className="mt-0.5 text-sm text-slate-500">
                            Solicitud #{nroSolicitud}
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="mb-4">
                    <label className="block text-sm font-semibold text-slate-800 mb-2">
                        Fecha de inicio del plan
                    </label>
                    <input
                        type="date"
                        className="input-sleek w-full"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        autoFocus
                    />
                </div>

                {/* Warning note */}
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex gap-2">
                    <span className="text-amber-500 shrink-0 mt-0.5">⚠️</span>
                    <span>
                        Al modificar esta fecha se <strong>recalcularán automáticamente las fechas de vencimiento de todas las cuotas impagas</strong> de esta solicitud.
                        Las cuotas ya pagadas no se modifican.
                    </span>
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
                        {loading ? "Guardando..." : "Guardar y Recalcular"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
