import { useState, useEffect } from "react";
// import { useForm } from "react-hook-form"; // Todo: Integrate in future steps if requested
import { useCreateSolicitud, useUpdateSolicitud, useSolicitud } from "../../hooks/useSolicitudes";
import { clientesApi, productosApi, vendedoresApi } from "../../api/endpoints";
import { SearchableSelect } from "../ui/SearchableSelect";

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
        estado: 1, // 1 Pendiente, 0 Anulada
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
            const data = solicitudData;
            const raw = data as any; // Cast to access potential raw fields not in type
            setFormData({
                clienteId: String(data.clienteId || data.cliente?.id || raw.relacliente || ""),
                vendedorId: String(raw.vendedorId || raw.vendedor?.id || raw.relavendedor || ""),
                productoId: String(data.productoId || data.producto?.id || raw.relaproducto || raw.idproducto || ""),
                cantidadCuotas: String(data.cantidadCuotas || raw.cantidadcuotas || ""),
                monto: String(data.importe || raw.monto || ""),
                totalapagar: String(data.totalPagado && data.totalPagado > 0 ? (data.importe * data.cantidadCuotas) : (raw.totalapagar || "")),
                observaciones: data.observaciones || raw.observacion || "",
                nroSolicitud: data.nroSolicitud || raw.nrosolicitud || "",
                estado: (data.estado === "Activa" || data.estado === "Pendiente" || raw.estado === 1) ? 1 : 0,
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

        // Numeric validation
        const monto = parseFloat(formData.monto);
        const total = parseFloat(formData.totalapagar);
        const cuotas = parseInt(formData.cantidadCuotas as string);

        if (monto < 0 || total < 0 || cuotas < 0) {
            setError("Los valores numéricos no pueden ser negativos");
            return;
        }

        const payload = {
            selectCliente: parseInt(formData.clienteId),
            selectVendedor: parseInt(formData.vendedorId),
            idproducto: parseInt(formData.productoId),
            monto: monto,
            selectCuotas: cuotas,
            totalapagar: total,
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

    const clienteOptions = clientes.map(c => ({ value: c.idcliente, label: c.appynom }));
    const vendedorOptions = vendedores.map(v => ({ value: v.idvendedor, label: v.apellidonombre }));

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
                        options={clienteOptions}
                        value={formData.clienteId}
                        onChange={(val) => setFormData({ ...formData, clienteId: String(val) })}
                        placeholder="Buscar cliente..."
                    />
                </div>

                {/* Vendedor */}
                <div>
                    <SearchableSelect
                        label="Vendedor *"
                        options={vendedorOptions}
                        value={formData.vendedorId}
                        onChange={(val) => setFormData({ ...formData, vendedorId: String(val) })}
                        placeholder="Buscar vendedor..."
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

                {/* Nro Solicitud */}
                <div>
                    <label className="block text-sm font-semibold mb-1">Nro Solicitud {isEdit && "*"}</label>
                    <input
                        type="text"
                        className="input-sleek w-full"
                        placeholder="Generado autom. si vacío"
                        value={formData.nroSolicitud}
                        onChange={e => setFormData({ ...formData, nroSolicitud: e.target.value })}
                        disabled={!isEdit && formData.nroSolicitud === ""}
                    />
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
                        <select
                            className="input-sleek w-full"
                            value={formData.estado}
                            onChange={e => setFormData({ ...formData, estado: Number(e.target.value) })}
                        >
                            <option value={1}>Pendiente</option>
                            <option value={0}>Anulada</option>
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
