import { useState, useEffect, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Modal } from "../ui/Modal";

interface ContratoPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    solicitudData: any;
    onGenerate: (datosContrato: any) => void;
    isLoading: boolean;
}

export function ContratoPreviewModal({
    isOpen,
    onClose,
    solicitudData,
    onGenerate,
    isLoading
}: ContratoPreviewModalProps) {
    const [formData, setFormData] = useState({
        clienteNombre: "",
        clienteDni: "",
        clienteDireccion: "",
        clienteLocalidad: "",
        clienteTelefono: "",
        productoNombre: "",
        monto: 0,
        cantidadCuotas: 0,
        totalAPagar: 0,
        vehNuevo: "",
        vehUsado: "",
        nroOp: "",
        fechaDia: "",
        fechaMes: "",
        fechaAnio: "",
        prodCod: "",
        estadoCivil: "",
        fNac: "",
        hijos: "",
        conyugeNombre: "",
        conyugeDni: "",
        conyugeFNac: "",
        conyugeDomicilio: "",
        conyugeTel: "",
        referencia: "",
        codPostal: "",
        provincia: "",
        observaciones1: "",
        observaciones2: "",
        ciudad: "",
        recibiDe: "",
        sumaNum: "",
        sumaLetras: "",
        pagoPedidoNro: "",
        sonPesos: "",
        aclaracionProductor: "",
        firmaProductor: ""
    });

    useEffect(() => {
        if (solicitudData) {
            setFormData({
                clienteNombre: solicitudData.cliente?.appynom || solicitudData.appynom || "",
                clienteDni: solicitudData.cliente?.dni || solicitudData.dni || "",
                clienteDireccion: solicitudData.cliente?.direccion || "",
                clienteLocalidad: solicitudData.cliente?.localidad?.nombre || "",
                clienteTelefono: solicitudData.cliente?.telefono || "",
                productoNombre: solicitudData.producto?.descripcion || solicitudData.producto_descripcion || "",
                monto: solicitudData.monto || 0,
                cantidadCuotas: solicitudData.cantidadcuotas || 0,
                totalAPagar: solicitudData.totalapagar || 0,
                vehNuevo: "",
                vehUsado: "",
                nroOp: solicitudData.nrosolicitud?.toString() || "",
                fechaDia: new Date().getDate().toString().padStart(2, '0'),
                fechaMes: (new Date().getMonth() + 1).toString().padStart(2, '0'),
                fechaAnio: new Date().getFullYear().toString().slice(2),
                prodCod: "",
                estadoCivil: "",
                fNac: "",
                hijos: "",
                conyugeNombre: "",
                conyugeDni: "",
                conyugeFNac: "",
                conyugeDomicilio: "",
                conyugeTel: "",
                referencia: "",
                codPostal: "",
                provincia: "",
                observaciones1: solicitudData.observacion || "",
                observaciones2: "",
                ciudad: solicitudData.cliente?.localidad?.nombre || "",
                recibiDe: solicitudData.cliente?.appynom || solicitudData.appynom || "",
                sumaNum: "",
                sumaLetras: "",
                pagoPedidoNro: solicitudData.nrosolicitud?.toString() || "",
                sonPesos: "",
                aclaracionProductor: "",
                firmaProductor: ""
            });
        }
    }, [solicitudData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: Number(value) }));
    };

    const sigCanvasRef = useRef<SignatureCanvas>(null);

    const handleClearCanvas = () => {
        sigCanvasRef.current?.clear();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let firmaUrl = "";
        if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
            firmaUrl = sigCanvasRef.current.getCanvas().toDataURL("image/png");
        }

        const dataToSubmit = { ...formData, firmaProductor: firmaUrl };
        onGenerate(dataToSubmit);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Previsualizar y Editar Contrato" className="max-w-3xl">
            <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="bg-blue-50 border border-blue-100 text-blue-800 text-sm p-3 rounded mb-4">
                        Modifique los datos a continuación si fuese necesario. Esta es la información exacta que se estampará en el PDF del contrato final a enviar al cliente.
                    </div>

                    {/* SECCIÓN 1: ENCABEZADO */}
                    <h3 className="text-md font-bold text-slate-800 border-b pb-1 mt-4">Encabezado de Solicitud</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Veh. Nuevo</label>
                            <input type="text" name="vehNuevo" value={formData.vehNuevo} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Veh. Usado</label>
                            <input type="text" name="vehUsado" value={formData.vehUsado} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Nº Óp</label>
                            <input type="text" name="nroOp" value={formData.nroOp} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div className="flex gap-2">
                            <div className="w-1/3">
                                <label className="block text-xs font-medium text-slate-700 mb-1">Fecha (Día)</label>
                                <input type="text" name="fechaDia" value={formData.fechaDia} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div className="w-1/3">
                                <label className="block text-xs font-medium text-slate-700 mb-1">Mes</label>
                                <input type="text" name="fechaMes" value={formData.fechaMes} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div className="w-1/3">
                                <label className="block text-xs font-medium text-slate-700 mb-1">Año</label>
                                <input type="text" name="fechaAnio" value={formData.fechaAnio} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-slate-700 mb-1">Producto Solicitado</label>
                            <input type="text" name="productoNombre" value={formData.productoNombre} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Cód. Producto</label>
                            <input type="text" name="prodCod" value={formData.prodCod} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                    </div>

                    {/* SECCIÓN 2: DATOS DEL SOLICITANTE */}
                    <h3 className="text-md font-bold text-slate-800 border-b pb-1 mt-6">Datos del Cliente</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-700 mb-1">Apellido y Nombre</label>
                            <input type="text" name="clienteNombre" value={formData.clienteNombre} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">DNI - LE - LC</label>
                            <input type="text" name="clienteDni" value={formData.clienteDni} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Estado Civil</label>
                            <input type="text" name="estadoCivil" value={formData.estadoCivil} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">F. Nac.</label>
                            <input type="text" name="fNac" value={formData.fNac} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Hijos</label>
                            <input type="text" name="hijos" value={formData.hijos} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-700 mb-1">Domicilio</label>
                            <input type="text" name="clienteDireccion" value={formData.clienteDireccion} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Teléfono</label>
                            <input type="text" name="clienteTelefono" value={formData.clienteTelefono} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Cód. Postal</label>
                            <input type="text" name="codPostal" value={formData.codPostal} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Localidad</label>
                            <input type="text" name="clienteLocalidad" value={formData.clienteLocalidad} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Provincia</label>
                            <input type="text" name="provincia" value={formData.provincia} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div className="md:col-span-3">
                            <label className="block text-xs font-medium text-slate-700 mb-1">Referencia</label>
                            <input type="text" name="referencia" value={formData.referencia} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                    </div>

                    {/* SECCIÓN 3: CONYUGE */}
                    <h3 className="text-md font-bold text-slate-800 border-b pb-1 mt-6">Cónyuge</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Apellido y Nombre</label>
                            <input type="text" name="conyugeNombre" value={formData.conyugeNombre} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">DNI</label>
                            <input type="text" name="conyugeDni" value={formData.conyugeDni} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">F. Nac.</label>
                            <input type="text" name="conyugeFNac" value={formData.conyugeFNac} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-slate-700 mb-1">Domicilio</label>
                            <input type="text" name="conyugeDomicilio" value={formData.conyugeDomicilio} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Teléfono</label>
                            <input type="text" name="conyugeTel" value={formData.conyugeTel} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                    </div>

                    {/* SECCIÓN 4: OBSERVACIONES */}
                    <h3 className="text-md font-bold text-slate-800 border-b pb-1 mt-6">Observaciones</h3>
                    <div className="grid grid-cols-1 gap-2">
                        <input type="text" name="observaciones1" value={formData.observaciones1} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" placeholder="Línea 1..." />
                        <input type="text" name="observaciones2" value={formData.observaciones2} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" placeholder="Línea 2..." />
                    </div>

                    {/* SECCIÓN 5: RECIBO Y CONTRATO */}
                    <h3 className="text-md font-bold text-slate-800 border-b pb-1 mt-6">Recibo y Otros Datos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">En la ciudad de</label>
                            <input type="text" name="ciudad" value={formData.ciudad} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Recibí de</label>
                            <input type="text" name="recibiDe" value={formData.recibiDe} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">En pago del pedido Nº</label>
                            <input type="text" name="pagoPedidoNro" value={formData.pagoPedidoNro} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div className="lg:col-span-2">
                            <label className="block text-xs font-medium text-slate-700 mb-1">La suma de (Letras)</label>
                            <input type="text" name="sumaLetras" value={formData.sumaLetras} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">La suma de (Números)</label>
                            <input type="text" name="sumaNum" value={formData.sumaNum} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">SON $</label>
                            <input type="text" name="sonPesos" value={formData.sonPesos} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Monto (Capital)</label>
                            <input
                                type="number"
                                name="monto"
                                value={formData.monto}
                                onChange={handleNumberChange}
                                className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Cantidad de Cuotas</label>
                            <input
                                type="number"
                                name="cantidadCuotas"
                                value={formData.cantidadCuotas}
                                onChange={handleNumberChange}
                                className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Total a Pagar (Financiado)</label>
                            <input
                                type="number"
                                name="totalAPagar"
                                value={formData.totalAPagar}
                                onChange={handleNumberChange}
                                className="w-full px-2 py-1 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* SECCIÓN 6: FIRMA PRODUCTOR */}
                    <h3 className="text-md font-bold text-slate-800 border-b pb-1 mt-6">Firma del Productor</h3>
                    <div className="grid grid-cols-1 gap-4 mt-2">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Aclaración Productor</label>
                            <input
                                type="text"
                                name="aclaracionProductor"
                                value={formData.aclaracionProductor}
                                onChange={handleChange}
                                className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Firma del Productor</label>
                            <div className="border border-slate-300 rounded-lg bg-white relative overflow-hidden" style={{ height: "150px" }}>
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
                                Generando PDF...
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
