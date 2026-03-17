import { useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Modal } from "../ui/Modal";

interface ReciboSignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (firmaData: { firmaProductor: string; aclaracionProductor: string }) => void;
    isLoading: boolean;
}

export function ReciboSignModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
}: ReciboSignModalProps) {
    const [aclaracion, setAclaracion] = useState("");
    const sigCanvasRef = useRef<SignatureCanvas>(null);

    const handleClearCanvas = () => {
        sigCanvasRef.current?.clear();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!aclaracion.trim()) {
            alert("Por favor, ingrese la Aclaración del Productor.");
            return;
        }

        if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
            alert("Por favor, estampe la Firma del Productor.");
            return;
        }

        const firmaUrl = sigCanvasRef.current.getCanvas().toDataURL("image/png");
        onConfirm({ firmaProductor: firmaUrl, aclaracionProductor: aclaracion });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Firma del Productor" className="max-w-lg">
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                    <div className="bg-blue-50 border border-blue-100 text-blue-800 text-sm p-3 rounded">
                        Firme y aclare su nombre para estampar en los recibos.
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                            Aclaración Productor
                        </label>
                        <input
                            type="text"
                            value={aclaracion}
                            onChange={(e) => setAclaracion(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Nombre y Apellido del productor"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                            Firma del Productor
                        </label>
                        <div
                            className="border border-slate-300 rounded-lg bg-white relative overflow-hidden"
                            style={{ height: "150px" }}
                        >
                            <SignatureCanvas
                                ref={sigCanvasRef}
                                penColor="blue"
                                canvasProps={{
                                    className: "sigCanvas w-full h-full cursor-crosshair",
                                }}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleClearCanvas}
                            className="mt-2 text-xs text-slate-500 hover:text-slate-700 underline"
                        >
                            Limpiar Firma
                        </button>
                    </div>
                </div>

                <div className="flex justify-end gap-3 p-4 border-t border-slate-100 bg-slate-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                        disabled={isLoading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                Generando...
                            </>
                        ) : (
                            "Confirmar y Generar PDF"
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
