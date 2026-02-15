import { useState, useEffect } from "react";
// import { useForm } from "react-hook-form"; // Todo: Integrate in future steps if requested
import { useCreateSolicitud, useUpdateSolicitud, useSolicitud } from "../../hooks/useSolicitudes";
import { clientesApi, productosApi, vendedoresApi } from "../../api/endpoints";

interface SolicitudFormProps {
    id?: number; // If present, edit mode
    onSuccess: () => void;
    onCancel: () => void;
}

export function SolicitudForm({ id, onSuccess, onCancel }: SolicitudFormProps) {
    const isEdit = !!id;
    const { data: solicitudData, isLoading: isLoadingSolicitud } = useSolicitud(id || 0);
    const createMutation = useCreateSolicitud();
    const updateMutation = useUpdateSolicitud();

    const [clientes, setClientes] = useState<any[]>([]);
    const [productos, setProductos] = useState<any[]>([]);
    const [vendedores, setVendedores] = useState<any[]>([]);

    // Manual form state (to match existing style but cleaner)
    const [formData, setFormData] = useState({
        clienteId: "",
        vendedorId: "",
        productoId: "",
        cantidadCuotas: "",
        monto: "", // Precio unitario / base
        totalapagar: "", // Precio final
        observaciones: "",
        nroSolicitud: "",
        estado: 1, // 1 Activa, 0 Baja
    });

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Load dependencies
        const loadDeps = async () => {
            try {
                const [c, p, v] = await Promise.all([
                    clientesApi.getAll(),
                    productosApi.getAll(),
                    vendedoresApi.getAll()
                ]);
                setClientes((c as any).data || c || []);
                setProductos((p as any).data || p || []);
                setVendedores((v as any).data || v || []);
            } catch (err) {
                console.error("Error loading dependencies", err);
            }
        };
        loadDeps();
    }, []);

    useEffect(() => {
        if (isEdit && solicitudData) {
            // Populate form
            const data = solicitudData.data || solicitudData; // Adjust based on API structure
            setFormData({
                clienteId: data.relacliente || "",
                vendedorId: data.relavendedor || "",
                productoId: data.relaproducto || data.idproducto || "",
                cantidadCuotas: data.cantidadcuotas || "",
                monto: data.monto || "",
                totalapagar: data.totalapagar || "",
                observaciones: data.observacion || "",
                nroSolicitud: data.nrosolicitud || "",
                estado: data.estado ?? 1,
            });
        }
    }, [isEdit, solicitudData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Basic validation
        if (!formData.clienteId || !formData.productoId || !formData.vendedorId || !formData.totalapagar || !formData.cantidadCuotas) {
            setError("Todos los campos marcados con * son obligatorios");
            return;
        }

        const payload = {
            selectCliente: parseInt(formData.clienteId),
            selectVendedor: parseInt(formData.vendedorId),
            idproducto: parseInt(formData.productoId),
            monto: parseFloat(formData.monto),
            selectCuotas: parseInt(formData.cantidadCuotas as string),
            totalapagar: parseFloat(formData.totalapagar),
            observacion: formData.observaciones,
            nroSolicitud: formData.nroSolicitud,
            selectEstado: formData.estado,
        };

        try {
            if (isEdit && id) {
                await updateMutation.mutateAsync({ id, data: payload });
            } else {
                await createMutation.mutateAsync(payload);
            }
            onSuccess();
        } catch (err: any) {
            setError(err.message || "Error al guardar la solicitud");
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
                    <label className="block text-sm font-semibold mb-1">Cliente *</label>
                    <select
                        className="input-sleek w-full"
                        value={formData.clienteId}
                        onChange={e => setFormData({ ...formData, clienteId: e.target.value })}
                    >
                        <option value="">Seleccione...</option>
                        {clientes.map(c => (
                            <option key={c.idcliente} value={c.idcliente}>{c.appynom}</option>
                        ))}
                    </select>
                </div>

                {/* Vendedor */}
                <div>
                    <label className="block text-sm font-semibold mb-1">Vendedor *</label>
                    <select
                        className="input-sleek w-full"
                        value={formData.vendedorId}
                        onChange={e => setFormData({ ...formData, vendedorId: e.target.value })}
                    >
                        <option value="">Seleccione...</option>
                        {vendedores.map(v => (
                            <option key={v.idvendedor} value={v.idvendedor}>{v.apellidonombre}</option>
                        ))}
                    </select>
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

                {/* Nro Solicitud */}
                <div>
                    <label className="block text-sm font-semibold mb-1">Nro Solicitud {isEdit && "*"}</label>
                    <input
                        type="text"
                        className="input-sleek w-full"
                        placeholder="Generado autom. si vacío"
                        value={formData.nroSolicitud}
                        onChange={e => setFormData({ ...formData, nroSolicitud: e.target.value })}
                        disabled={!isEdit && formData.nroSolicitud === ""} // Optional: disable on create if auto-generated
                    />
                </div>

                {/* Cantidad Cuotas */}
                <div>
                    <label className="block text-sm font-semibold mb-1">Cant. Cuotas *</label>
                    <input
                        type="number"
                        className="input-sleek w-full"
                        value={formData.cantidadCuotas}
                        onChange={e => setFormData({ ...formData, cantidadCuotas: e.target.value })}
                    />
                </div>

                {/* Monto (Unitario/Base) */}
                <div>
                    <label className="block text-sm font-semibold mb-1">Monto Base *</label>
                    <input
                        type="number"
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
                        className="input-sleek w-full"
                        value={formData.totalapagar}
                        onChange={e => setFormData({ ...formData, totalapagar: e.target.value })}
                    />
                </div>

                {/* Estado (Solo edición) */}
                {isEdit && (
                    <div>
                        <label className="block text-sm font-semibold mb-1">Estado</label>
                        <select
                            className="input-sleek w-full"
                            value={formData.estado}
                            onChange={e => setFormData({ ...formData, estado: Number(e.target.value) })}
                        >
                            <option value={1}>Activa</option>
                            <option value={0}>Baja / Inactiva</option>
                        </select>
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

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
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
                    className="action-button"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Guardando..." : "Guardar Solicitud"}
                </button>
            </div>
        </form>
    );
}
