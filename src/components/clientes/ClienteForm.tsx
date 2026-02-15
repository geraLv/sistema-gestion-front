import { useState, useEffect } from "react";
import { useCreateCliente, useUpdateCliente, useCliente } from "../../hooks/useClientes";
import { localidadesApi } from "../../api/endpoints";

interface ClienteFormProps {
    id?: number;
    onSuccess: () => void;
    onCancel: () => void;
}

export function ClienteForm({ id, onSuccess, onCancel }: ClienteFormProps) {
    const [formData, setFormData] = useState({
        nombre: "",
        nroDocumento: "",
        direccion: "",
        telefono: "",
        email: "",
        localidadId: "",
    });
    const [formError, setFormError] = useState("");
    const [localidades, setLocalidades] = useState<any[]>([]);

    const createMutation = useCreateCliente();
    const updateMutation = useUpdateCliente();

    // Fetch client data if id is provided
    const { data: clienteData, isLoading: isLoadingCliente } = useCliente(id || 0);

    useEffect(() => {
        loadLocalidades();
    }, []);

    useEffect(() => {
        if (clienteData && id) {
            setFormData({
                nombre: clienteData.appynom || "",
                nroDocumento: clienteData.dni || "",
                direccion: clienteData.direccion || "",
                telefono: clienteData.telefono || "",
                email: clienteData.email || "",
                localidadId: String(clienteData.relalocalidad || ""),
            });
        }
    }, [clienteData, id]);

    const loadLocalidades = async () => {
        try {
            const data = (await localidadesApi.getAll()) as any;
            setLocalidades(data || []);
        } catch (err) {
            console.error("Error cargando localidades:", err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");

        if (!formData.nombre || !formData.nroDocumento || !formData.localidadId) {
            setFormError("Nombre, documento y localidad son requeridos");
            return;
        }

        const payload = {
            appynom: formData.nombre,
            dni: formData.nroDocumento,
            direccion: formData.direccion,
            telefono: formData.telefono,
            email: formData.email,
            selectLocalidades: parseInt(formData.localidadId, 10),
        };

        try {
            if (id) {
                await updateMutation.mutateAsync({ id, data: payload });
            } else {
                await createMutation.mutateAsync(payload);
            }
            onSuccess();
        } catch (err: any) {
            const msg = err.response?.data?.error || "Error al guardar cliente";
            setFormError(msg);
        }
    };

    const isSubmitting = createMutation.isPending || updateMutation.isPending;

    if (id && isLoadingCliente) {
        return <div className="p-4 text-center">Cargando datos...</div>;
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
                <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                    {formError}
                </div>
            )}
            <div>
                <label className="block text-sm font-semibold mb-1">
                    Nombre *
                </label>
                <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) =>
                        setFormData({ ...formData, nombre: e.target.value })
                    }
                    className="w-full input-sleek"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-semibold mb-1">
                    Documento *
                </label>
                <input
                    type="text"
                    value={formData.nroDocumento}
                    onChange={(e) =>
                        setFormData({ ...formData, nroDocumento: e.target.value })
                    }
                    className="w-full input-sleek"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-semibold mb-1">
                    Localidad *
                </label>
                <select
                    value={formData.localidadId}
                    onChange={(e) =>
                        setFormData({ ...formData, localidadId: e.target.value })
                    }
                    className="w-full input-sleek"
                    required
                >
                    <option value="">Seleccionar localidad</option>
                    {localidades.map((loc: any) => (
                        <option key={loc.idlocalidad} value={loc.idlocalidad}>
                            {loc.nombre}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-semibold mb-1">
                    Dirección
                </label>
                <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) =>
                        setFormData({ ...formData, direccion: e.target.value })
                    }
                    className="w-full input-sleek"
                />
            </div>
            <div>
                <label className="block text-sm font-semibold mb-1">
                    Teléfono
                </label>
                <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) =>
                        setFormData({ ...formData, telefono: e.target.value })
                    }
                    className="w-full input-sleek"
                />
            </div>
            <div>
                <label className="block text-sm font-semibold mb-1">
                    Email
                </label>
                <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full input-sleek"
                />
            </div>
            <div className="flex gap-2 pt-4">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 action-button disabled:opacity-50"
                >
                    {isSubmitting ? "Guardando..." : "Guardar"}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 ghost-button"
                >
                    Cancelar
                </button>
            </div>
        </form>
    );
}
