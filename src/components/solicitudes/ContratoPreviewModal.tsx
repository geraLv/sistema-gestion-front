import { useState, useEffect, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Modal } from "../ui/Modal";

// Utility: convert a number to Spanish words
function numberToSpanishWords(n: number): string {
    if (n === 0) return "cero";
    const ones = ["", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
        "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte"];
    const tens = ["", "", "veinti", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
    const hundreds = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

    const convertGroup = (num: number): string => {
        if (num === 0) return "";
        if (num === 100) return "cien";
        if (num <= 20) return ones[num];
        if (num < 30) return "veinti" + ones[num - 20];
        if (num < 100) {
            const t = Math.floor(num / 10);
            const o = num % 10;
            return tens[t] + (o ? " y " + ones[o] : "");
        }
        const h = Math.floor(num / 100);
        const rest = num % 100;
        return hundreds[h] + (rest ? " " + convertGroup(rest) : "");
    };

    const abs = Math.abs(Math.floor(n));
    const intPart = Math.floor(abs);
    const decPart = Math.round((n - intPart) * 100);

    let result = "";
    if (intPart === 0) {
        result = "cero";
    } else if (intPart >= 1000000) {
        const millions = Math.floor(intPart / 1000000);
        const rest = intPart % 1000000;
        result = (millions === 1 ? "un millón" : convertGroup(millions) + " millones") + (rest ? " " + convertBelow(rest) : "");
    } else {
        result = convertBelow(intPart);
    }

    function convertBelow(num: number): string {
        if (num === 0) return "";
        if (num < 1000) return convertGroup(num);
        const thousands = Math.floor(num / 1000);
        const rest = num % 1000;
        const tStr = thousands === 1 ? "mil" : convertGroup(thousands) + " mil";
        return tStr + (rest ? " " + convertGroup(rest) : "");
    }

    if (decPart > 0) {
        result += " con " + convertGroup(decPart) + "/100";
    }

    return result.charAt(0).toUpperCase() + result.slice(1);
}

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
            const nroSolicitud = (
                solicitudData.nrosolicitud ??
                solicitudData.nroSolicitud ??
                ""
            ).toString();
            setFormData({
                clienteNombre: solicitudData.cliente?.appynom || solicitudData.appynom || "",
                clienteDni: solicitudData.cliente?.dni || solicitudData.dni || "",
                clienteDireccion: solicitudData.cliente?.direccion || "",
                clienteLocalidad: solicitudData.cliente?.localidad?.nombre || "",
                clienteTelefono: solicitudData.cliente?.telefono || "",
                productoNombre: solicitudData.producto?.descripcion || solicitudData.producto_descripcion || "",

                vehNuevo: "",
                vehUsado: "",
                nroOp: nroSolicitud,
                fechaDia: new Date().getDate().toString().padStart(2, '0'),
                fechaMes: (new Date().getMonth() + 1).toString().padStart(2, '0'),
                fechaAnio: new Date().getFullYear().toString().slice(2),
                prodCod: "",
                estadoCivil: "",
                fNac: (solicitudData.cliente?.fecha_nacimiento ? new Date(solicitudData.cliente.fecha_nacimiento).toLocaleDateString('es-AR', { timeZone: 'UTC' }) : ""),
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
                sumaNum: (() => {
                    const m = solicitudData.monto || 0;
                    const c = solicitudData.cantidadcuotas || 1;
                    return c > 0 ? (m / c).toFixed(2) : "0";
                })(),
                sumaLetras: (() => {
                    const m = solicitudData.monto || 0;
                    const c = solicitudData.cantidadcuotas || 1;
                    return c > 0 ? numberToSpanishWords(m / c) : "";
                })(),
                pagoPedidoNro: nroSolicitud,
                sonPesos: (() => {
                    const m = solicitudData.monto || 0;
                    const c = solicitudData.cantidadcuotas || 1;
                    return c > 0 ? (m / c).toFixed(2) : "0";
                })(),
                aclaracionProductor: "",
                firmaProductor: ""
            });
        }
    }, [solicitudData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };



    const sigCanvasRef = useRef<SignatureCanvas>(null);

    const handleClearCanvas = () => {
        sigCanvasRef.current?.clear();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.aclaracionProductor.trim()) {
            alert("Por favor, ingrese la Aclaración del Productor.");
            return;
        }

        if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
            alert("Por favor, estampe la Firma del Productor.");
            return;
        }

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
                    <p className="text-xs text-slate-500 mt-2 mb-2 italic">
                        Solicitud de pedido: Veh. Nuevo, Veh. Usado, Nº Óp, Fecha, Producto Solicitado, Cód.
                    </p>
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
                    <p className="text-xs text-slate-500 mt-2 mb-2 italic">
                        Cliente: Apellido y Nombre, Estado Civil, DNI – LE – LC, F. Nac, Hijos, Domicilio, Tel, Referencia, Cód. Postal, Localidad, Provincia.
                    </p>
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
                    <p className="text-xs text-slate-500 mt-2 mb-2 italic">
                        CONYUGUE: Apellido y Nombre, DNI, F. Nac, Domicilio, Tel.
                    </p>
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

                    <div className="bg-slate-100 p-3 rounded mt-6 text-xs text-slate-700 font-serif border-l-4 border-blue-400">
                        LOS DATOS CONSIGNADOS SON VERDADEROS DECLARANDO BAJO JURAMENTO Y EN FUNCION DE ELLOS SOLICITO MI PEDIDO DE ACUERDO A LOS TERMINOS DEL PRECONTRATO QUE DECLARO CONOCER Y ACEPTAR.
                    </div>

                    {/* SECCIÓN 4: OBSERVACIONES */}
                    <h3 className="text-md font-bold text-slate-800 border-b pb-1 mt-6">Observaciones</h3>
                    <div className="grid grid-cols-1 gap-2">
                        <input type="text" name="observaciones1" value={formData.observaciones1} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" placeholder="Línea 1..." />
                        <input type="text" name="observaciones2" value={formData.observaciones2} onChange={handleChange} className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" placeholder="Línea 2..." />
                    </div>

                    {/* SECCIÓN 5: RECIBO Y CONTRATO */}
                    <h3 className="text-md font-bold text-slate-800 border-b pb-1 mt-6">Recibo y Otros Datos</h3>
                    <p className="text-xs text-slate-500 mt-2 mb-2 italic">
                        RECIBO AUTORIZADO: En la ciudad de..., Recibí de... La suma de... En pago del pedido Nº... Cuyo importe es no reintegrable. SON $...
                    </p>
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

                    </div>

                    {/* CLAUSULAS DEL CONTRATO */}
                    <h3 className="text-md font-bold text-slate-800 border-b pb-1 mt-8">Condiciones Particulares del Contrato</h3>
                    <div className="bg-slate-50 p-4 border border-slate-200 rounded text-xs text-slate-700 space-y-3 mt-4 text-justify font-serif h-64 overflow-y-auto">
                        <p className="font-bold text-center mb-2">CONDICIONES PARTICULARES DEL CONTRATO</p>
                        <p>Entre Crédito Gestión en adelante el GESTOR, y el Sr. Cliente que al final acompaña sus datos personales firmando y ratificando las clausula aquí expresas, convienen el siguiente contrato de gestión de negocios, todo de acuerdo a lo siguiente:</p>
                        <p><strong>PRIMERA: DEFINICIONES Y TERMINOLOGIAS:</strong> los términos que se emplean en las siguientes condiciones generales tienen el significado y el alcance que se indica a continuación: BIEN TIPO: bien mueble de fabricación nacional o importado nuevo y/o usado, cuya individualización será efectuada por CREDITO GESTION por cuenta y orden del CLIENTE. PRECIO DE LISTA: precio de venta al público del bien tipo, determinado por la agencia o concesionaria que corresponda, VALOR BASICO MOVIL: Precio de venta del bien tipo, sujeto a variaciones del mismo. GASTOS ADMINISTRATIVOS: es la parte del diez por ciento (10%) que el cliente deberá cumplir al momento de gestionar crédito a su favor si corresponde.</p>
                        <p><strong>SEGUNDA:</strong> EL CLIENTE asu vez acepta por el presente contrato, la intervención del GESTOR CREDITOGESTION y/o personas físicas que este designe, a los fines de que en su nombre y representación individualice la unidad específica previamente al frente del presente contrato, que, a satisfacción del CLIENTE, este presente su consentimiento para posterior realización de la compra de la unidad mencionada a través de un crédito financiera si fuera necesario.</p>
                        <p><strong>CUARTA:</strong> CREDITO GESTION queda facultado a través de presente y con justificación de causa rechazar la solicitud del CLIENTE dentro de treinta días (30) de la fecha de pedido, debiendo en este único caso notificar en forma fehaciente al CLIENTE dicho rechazo y los motivos poniendo en esta única y excepcional circunstancia todos los fondos a su disposición sin que devenguen interés alguno, ni ningún tipo de indemnización por parte de CREDITO GESTION favor del CLIENTE, queda aclarado que los citados fondos no incluyen montos abonados en concepto de comisión.</p>
                        <p><strong>QUINTA:</strong> EL CLIENTE acepta abonar en concepto de pago por la gestión encomendada el diez por ciento (10%) del precio por adelantado. En dicho monto se incluye los gastos de transferencia para el caso de la unidad usada, patentamiento de la unidad y flete para unidades nuevas, a su vez deberá el CLIENTE completar al momento de retirar la unidad de un total del cincuenta por ciento (50%) del precio total, que será entregado ante la agencia o concesionaria que corresponda, mientras que el saldo restante del precio, es decir el sesenta por ciento (60%) será cubierto por el crédito transmitido por el GESTOR a nombre del CLIENTE siempre y cuando se cumpla con los requisitos ante la entidad financiera que corresponda. Los citados montos quedan sujetos a futuras variaciones originadas por hechos externos a la empresa, provenientes de situaciones de caso fortuito o fuerza mayor, devaluación de la moneda, inflación, etc. ajena a CREDITO GESTIÓN.</p>
                        <p><strong>SEXTA:</strong> EL CLIENTE que haya elegido la modalidad en cuotas del diez por ciento (10%) del precio total, se compromete a realizar dichos pagos en la sede central de la empresa CREDITO GESTION, dentro del 01 al 10 de casa mes en forma consecutiva y por mes adelantado. Si el décimo día fuera inhábil el plazo se extenderá hasta el día hábil posterior. En caso de atraso en el pago a término de cada cuota, generara un interés del diez por ciento (10%) del total de la cuota o cuotas atrasadas, lo que deberán ser abonados inmediatamente y conjuntamente por el CLIENTE al momento del pago de o de las cuotas atrasadas, no aceptando el GESTOR ni pagos a cuenta, ni parciales, siendo causal de recisión contractual y por exclusiva culpa y responsabilidad del CLIENTE por el incumplimiento.</p>
                        <p><strong>SEPTIMA: SANCIONES POR INCUMPLIMIENTO:</strong> quedara resuelto de pleno derecho el presente contrato sin interpelación Judicial y/o extrajudicial sin derecho o reclamo a devolución alguna del dinero abonado por todo concepto, cuando el CLIENTE dejara de abonar dos (2) cuotas consecutivas y/o tres (3) alternadas, considerándose que existe expresa renuncia a la gestión encomendada y al total de lo abonado hasta el momento.</p>
                        <p><strong>OCTAVA: CAMBIO DE MODELO O FABRICACION:</strong> EL CLIENTE podrá optar durante el transcurso del presente contrato, por un cambio en la unidad primeramente seleccionada, como así también CREDITO GESTION informara en caso de que eventualmente se dejase de fabricar el modelo elegido por el CLIENTE, Y SE LE OFREZCA SUSTITUIR POR UNA VARIANTE DEL MISMO O POR UN NUEVO MODELO, SE ESTABLECE QUE EN TALES CASOS SE PROCEDERA DE LA SIGUIENTE MANERA: a) En primer lugar y para determinar que se trata de un modelo del bien de una variante anterior, se atenderá a lo que así defina el fabricante del bien, de acuerdo a las normas legales vigentes en cada oportunidad, su precio deberá haber sufrido un aumento efectivo de más del quince por ciento (15%) al modelo anterior (tomándose el último precio del mismo). Si solo se trata de una variante del modelo, las respectivas obligaciones no sufrirán modificación alguna y se continuara entregando el bien de dicha variante. En cada caso, el importe del (10%) abonado en cuotas por el CLIENTE se reajustara de acuerdo a la variación del costo de la nueva unidad y/o modelo. Si se tratase de un cambio de modelo ofrecido deberá presentarse en el plazo de quince días de realizada la comunicación por CREDITO GESTION y optar por otro modelo o marca, siempre que sea igual o mayor valor que el primeramente señalado.</p>
                        <p><strong>NOVENA:</strong> Si el CLIENTE opta por elegir una unidad de menor valor que la pactada originalmente, CREDITO GESTION se compromete a reintegrar, si corresponde, únicamente la diferencia del diez por ciento (10%) pactado precedentemente como gastos administrativos y comisión, mientras que la diferencia del precio será prorrateada de las cuotas restantes por la unidad que otorga el crédito restante, es decir el sesenta por ciento (60%). Para el caso de que la comisión y gastos cobrados con anterioridad por CREDITO GESTION fuera pagado al contado o en un solo pago, se reintegrara la diferencia total del monto entregado, sin que este genere interés ni indemnización de ningún tipo, siendo a exclusivo cargo del CLIENTE al cambio efectuado calculándose toda la diferencia al momento en el cual se efectué la opción.</p>
                        <p><strong>DECIMA:</strong> Una vez concedido el crédito a través de la entidad que corresponda CREDITO GESTION culmina su intervención y es a cargo del CLIENTE el pago regular de las cuotas acordadas, no surgiendo responsabilidad alguna para el primero en cumplimiento y demás condiciones avaladas por EL CLIENTE al momento de la forma del mutuo crediticio, y será a cargo exclusivo del CLIENTE los gastos de emisión del crédito o prenda.</p>
                        <p><strong>DECIMA PRIMERA: RENUNCIA Y/O RESICION DEL CONTRATO:</strong> EL CLIENTE podrá prescindir de los servicios de CREDITO GESTION, solicitando el reintegro de lo abonado hasta el momento. EL CLIENTE podrá hacer uso de éste derecho, recién después de haber abonado la cuota número dieciocho (18), y ello podrá llevarlo a cabo, siempre y cuando se encuentre al día con los pagos de las cuotas y no haya tenido atrasos en ninguna de ellas, como tampoco debe hallarse inmerso en la condición establecida en el cláusula SEPTIMA del presente. La notificación de renuncia y/o resolución contractual, deberá realizarla EL CLIENTE en forma fehaciente a la empresa, (carta documento, acta notarial y/o la que haga sus veces), a su vez, CREDITO GESTIÓN dispondrá de un plazo de cuarenta y cinco días hábiles para pronunciarse sobre el mismo, vencido dicho plazo, pondrá a disposición del cliente – en caso de corresponder – lo abonado por el mismo hasta el momento, descontándose los montos en concepto de gastos administrativos y un porcentaje total del 45% de lo abonado a la fecha, correspondiente a perdida de chance, se pondrá los citados montos a disposición del cliente mediante la entrega de un cheque de pago diferido.</p>
                        <p><strong>DECIMA SEGUNDA:</strong> Para el caso de rechazo de crédito por la entidad otorgada, CRÉDITO GESTIÓN QUEDARÁ EXENTO de responsabilidad alguna, dándose por rescindido el presente convenio de común acuerdo sin interpelación judicial ni extrajudicial, ni reclamo alguno, tomando un sesenta por ciento (60%) de lo entregado hasta el momento como seña dentro de lo previsto y alcance del código civil y comercial.</p>
                        <p><strong>DECIMA CUARTA:</strong> El presente contrato se rige por las previsiones del art. 2288 y cctes. del C.C. y C.. El CLIENTE previo a firmar el presente acuerdo, declara haber leído, interpretando, estando en un todo de acuerdo, quedando obligado al cumplimiento de todas las obligaciones que surgen del contrato. Queda establecido que aquellas cuestiones o circunstancias que no se encuentren pactadas deberán ser dirimidas a través de un proceso judicial. Así mismo de existir conflictos y diferencias irreconciliables entre las partes contratantes, se comprometen en forma previa a cualquier acción judicial, a realizar una mediación. Prórroga de la jurisdicción, las partes se someten para dirimir cualquier conflicto, a los tribunales civiles y comerciales de la primera Circunscripción Judicial de la provincia de Formosa, renunciando a cualquier otro jurisdicción.</p>
                        <p>Se firman dos ejemplares de un mismo tenor entre contratantes.</p>
                        <p className="mt-4 mb-2 text-center text-sm font-bold bg-slate-200 p-2 rounded">
                            DECLARO HABER LEIDO, INTERPRETADO Y CONOCIDO TODOS LOS ALCANCES DEL PRESENTE CONTRATO.
                        </p>
                        <div className="flex justify-between items-end mt-4 px-4 text-xs">
                            <div className="flex flex-col items-center">
                                <div className="border-t border-slate-400 w-48 mb-1"></div>
                                <p>FIRMA Y ACLARACIÓN DEL CLIENTE</p>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="border-t border-slate-400 w-48 mb-1"></div>
                                <p>REP. EMPRESA</p>
                            </div>
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
