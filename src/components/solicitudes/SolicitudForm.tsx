import { useState, useEffect } from "react";
import { useCreateSolicitud, useUpdateSolicitud, useSolicitud } from "../../hooks/useSolicitudes";
import { clientesApi, productosApi } from "../../api/endpoints";
import { SearchableSelect } from "../ui/SearchableSelect";

interface SolicitudFormProps {
    id?: number; // If present, edit mode
    onSuccess: (data?: any, action?: 'save' | 'save_and_contract') => void;
    onCancel: () => void;
}

export function SolicitudForm({ id, onSuccess, onCancel }: SolicitudFormProps) {
    const isEdit = !!id;
    const { data: solicitudData, isLoading: isLoadingSolicitud } = useSolicitud(id || 0);
    const isSigned = solicitudData && (solicitudData as any).contratos && (solicitudData as any).contratos.length > 0 && (solicitudData as any).contratos[0].estado === 2;
    const createMutation = useCreateSolicitud();
    const updateMutation = useUpdateSolicitud();

    const [productos, setProductos] = useState<any[]>([]);
    // selectedClienteOption holds the currently selected client for display in edit mode
    const [selectedClienteOption, setSelectedClienteOption] = useState<{ value: number; label: string } | null>(null);

    // Manual form state (to match existing style but cleaner)
    const [formData, setFormData] = useState({
        clienteId: "",
        vendedorId: "",
        productoId: "",
        cantidadCuotas: "",
        monto: "", // Precio unitario / base
        totalapagar: "", // Precio final
        observaciones: "",
        estado: 1, // 0=baja/anulada, 1=activa/pendiente, 2=pagada
    });

    const [error, setError] = useState<string | null>(null);
    const [submitAction, setSubmitAction] = useState<'save' | 'save_and_contract'>('save');

    useEffect(() => {
        // Load products only (clients are searched on demand)
        const loadDeps = async () => {
            try {
                const p = await productosApi.getAll();
                setProductos((p as any).data || p || []);
            } catch (err) {
                console.error("Error loading products", err);
            }
        };
        loadDeps();
    }, []);

    // Async client search function for SearchableSelect
    const handleClientSearch = async (term: string) => {
        try {
            const results: any[] = await clientesApi.search(term);
            return results.map((c: any) => ({ value: c.idcliente ?? c.id, label: c.appynom ?? c.nombre ?? "" }));
        } catch {
            return [];
        }
    };

    useEffect(() => {
        if (isEdit && solicitudData) {
            // Populate form
            const data = solicitudData;
            const raw = data as any; // Cast to access potential raw fields not in type
            const clienteId = String(data.clienteId || data.cliente?.id || raw.relacliente || "");
            setFormData({
                clienteId,
                vendedorId: String(raw.vendedorId || raw.vendedor?.id || raw.relavendedor || ""),
                productoId: String(data.productoId || data.producto?.id || raw.relaproducto || raw.idproducto || ""),
                cantidadCuotas: String(data.cantidadCuotas || raw.cantidadcuotas || ""),
                monto: String(data.importe || raw.monto || ""),
                totalapagar: String(data.totalPagado && data.totalPagado > 0 ? (data.importe * data.cantidadCuotas) : (raw.totalapagar || "")),
                observaciones: data.observaciones || raw.observacion || "",
                estado: raw.estado ?? ((data.estado === "Activa" || data.estado === "Pendiente") ? 1 : 0),
            });
            // Pre-load client name for display in the selector
            if (clienteId) {
                clientesApi.getById(Number(clienteId)).then((c: any) => {
                    if (c) setSelectedClienteOption({ value: c.idcliente ?? c.id, label: c.appynom ?? c.nombre ?? "" });
                }).catch(() => { });
            }
        }
    }, [isEdit, solicitudData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Basic validation — sin campo vendedor
        if (!formData.clienteId || !formData.productoId || !formData.totalapagar || !formData.cantidadCuotas) {
            setError("Todos los campos marcados con * son obligatorios");
            return;
        }

        // Numeric validation
        const monto = parseFloat(formData.monto);
        const total = parseFloat(formData.totalapagar);
        const cuotas = parseInt(formData.cantidadCuotas as string);

        if (isNaN(monto) || isNaN(total) || isNaN(cuotas)) {
            setError("Los valores numéricos deben ser válidos");
            return;
        }

        if (monto < 0 || total < 0 || cuotas < 0) {
            setError("Los valores numéricos no pueden ser negativos");
            return;
        }

        if (cuotas < 1) {
            setError("La cantidad de cuotas debe ser al menos 1");
            return;
        }

        // Consistency validation
        const minTotalEsperado = monto * cuotas;
        if (total < minTotalEsperado) {
            setError(`El Total a Pagar ($${total.toFixed(2)}) no puede ser menor que el Monto Base × Cantidad de Cuotas ($${minTotalEsperado.toFixed(2)})`);
            return;
        }

        // Warning if Total is significantly lower than expected (could indicate user error)
        const valorCuotaCalculado = total / cuotas;
        if (valorCuotaCalculado < monto * 0.95) {
            setError(`Inconsistencia: Con ${cuotas} cuotas de $${monto.toFixed(2)}, el total debería ser al menos $${minTotalEsperado.toFixed(2)}, pero ingresaste $${total.toFixed(2)}`);
            return;
        }

        const payload = {
            selectCliente: parseInt(formData.clienteId),
            selectVendedor: 0, // campo legacy, relausuario se toma del JWT
            idproducto: parseInt(formData.productoId),
            monto: monto,
            selectCuotas: cuotas,
            totalapagar: total,
            observacion: formData.observaciones,
            nroSolicitud: "", // generado automáticamente por el backend
            selectEstado: formData.estado,
        };

        try {
            let res;
            if (isEdit && id) {
                res = await updateMutation.mutateAsync({ id, data: payload });
            } else {
                res = await createMutation.mutateAsync(payload);
            }
            onSuccess(res, submitAction);
        } catch (err: any) {
            console.error("Update/Create error:", err);
            const msg = err.response?.data?.error || err.message || "Error al guardar la solicitud";
            setError(msg);
        }
    };

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    if (isEdit && isLoadingSolicitud) {
        return <div className="p-8 text-center text-slate-500">Cargando datos...</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cliente */}
                <div>
                    <SearchableSelect
                        label="Cliente *"
                        options={selectedClienteOption ? [selectedClienteOption] : []}
                        value={formData.clienteId}
                        onChange={(val) => setFormData({ ...formData, clienteId: String(val) })}
                        placeholder="Buscar cliente (nombre o DNI)..."
                        onSearch={handleClientSearch}
                        minSearchLength={2}
                    />
                </div>

                {/* Producto */}
                <div>
                    <label className="block text-sm font-semibold mb-1">Producto *</label>
                    <select
                        className="input-sleek w-full"
                        value={formData.productoId}
                        onChange={e => setFormData({ ...formData, productoId: e.target.value })}
                    >
                        <option value="">Seleccione...</option>
                        {productos.map(p => (
                            <option key={p.idproducto} value={p.idproducto}>{p.descripcion} (${p.precio})</option>
                        ))}
                    </select>
                </div>

                {/* Cantidad Cuotas */}
                <div>
                    <label className="block text-sm font-semibold mb-1">Cant. Cuotas *</label>
                    <input
                        type="number"
                        min="1"
                        className="input-sleek w-full"
                        value={formData.cantidadCuotas}
                        onChange={e => setFormData({ ...formData, cantidadCuotas: e.target.value })}
                        disabled={isEdit}
                        title={isEdit ? "No se puede modificar la cantidad de cuotas. Usa 'Agregar Cuotas' desde el detalle." : ""}
                    />
                </div>

                {/* Monto (Unitario/Base) */}
                <div>
                    <label className="block text-sm font-semibold mb-1">Monto Base *</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input-sleek w-full"
                        value={formData.monto}
                        onChange={e => setFormData({ ...formData, monto: e.target.value })}
                    />
                </div>

                {/* Total a Pagar */}
                <div>
                    <label className="block text-sm font-semibold mb-1">Total a Pagar *</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input-sleek w-full"
                        value={formData.totalapagar}
                        onChange={e => setFormData({ ...formData, totalapagar: e.target.value })}
                    />
                </div>

                {/* Estado (Solo edición) */}
                {isEdit && (
                    <div>
                        <label className="block text-sm font-semibold mb-1">Estado</label>
                        {formData.estado === 2 ? (
                            <div className="input-sleek w-full bg-green-50 text-green-700 flex items-center">
                                ✅ Pagada
                            </div>
                        ) : (
                            <select
                                className="input-sleek w-full"
                                value={formData.estado}
                                onChange={e => setFormData({ ...formData, estado: Number(e.target.value) })}
                            >
                                <option value={1}>Activa</option>
                                <option value={0}>Baja</option>
                            </select>
                        )}
                    </div>
                )}
            </div>

            {/* Observaciones */}
            <div>
                <label className="block text-sm font-semibold mb-1">Observaciones</label>
                <textarea
                    className="input-sleek w-full"
                    rows={3}
                    value={formData.observaciones}
                    onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                />
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 flex-wrap">
                <button
                    type="button"
                    onClick={onCancel}
                    className="ghost-button"
                    disabled={isSubmitting}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="ghost-button"
                    disabled={isSubmitting}
                    onClick={() => setSubmitAction('save')}
                >
                    Guardar Solicitud
                </button>
                {!isSigned && (
                    <button
                        type="submit"
                        className="action-button bg-emerald-600 hover:bg-emerald-700"
                        disabled={isSubmitting}
                        onClick={() => setSubmitAction('save_and_contract')}
                    >
                        {isSubmitting && submitAction === 'save_and_contract' ? "Procesando..." : "Guardar y Crear Contrato"}
                    </button>
                )}
            </div>
        </form>
    );
}
